// lib/xmltv-parser.ts — Fetches + parses a gzipped XMLTV URL
// Works with URLs like https://github.com/.../epg2.xml.gz

import { gunzipSync } from "zlib";
import { epgStore, type EpgChannel, type EpgEntry } from "./epg-store";

/**
 * Fetch and parse an XMLTV file from a URL (supports .gz).
 * Returns parsed channels and a count of entries stored.
 */
export async function parseXmltvUrl(
  sourceId: string,
  url: string,
  maxProgrammes: number = 5000
): Promise<{ channels: EpgChannel[]; entryCount: number }> {
  const response = await fetch(url, {
    headers: { "Accept-Encoding": "gzip" },
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const raw = new Uint8Array(buffer);

  // Decompress if gzipped
  let text: string;
  if (raw[0] === 0x1f && raw[1] === 0x8b) {
    text = gunzipSync(Buffer.from(raw)).toString("utf-8");
  } else {
    text = new TextDecoder().decode(raw);
  }

  // Parse channels
  const channels: EpgChannel[] = [];
  const chRegex = /<channel\s+id="([^"]*)"[^>]*>([\s\S]*?)<\/channel>/g;
  let chMatch;
  while ((chMatch = chRegex.exec(text)) !== null) {
    const chId = chMatch[1];
    const inner = chMatch[2];
    const nameMatch = inner.match(/<display-name>([^<]*)<\/display-name>/);
    const iconMatch = inner.match(/<icon\s+src="([^"]*)"/);
    if (nameMatch) {
      channels.push({
        sourceId,
        tvgId: chId,
        displayName: nameMatch[1],
        icon: iconMatch?.[1] || "",
      });
    }
  }

  // Parse programmes (limited)
  const entries: EpgEntry[] = [];
  let progIdx = 0;
  let found = 0;

  while (found < maxProgrammes) {
    const progStart = text.indexOf("<programme ", progIdx);
    if (progStart === -1) break;

    const progEnd = text.indexOf("</programme>", progStart);
    if (progEnd === -1) break;

    const block = text.substring(progStart, progEnd + 12);
    progIdx = progEnd + 12;

    const chIdMatch = block.match(/channel="([^"]*)"/);
    const startMatch = block.match(/start="([^"]*)"/);
    const stopMatch = block.match(/stop="([^"]*)"/);
    const titleMatch = block.match(/<title>([^<]*)<\/title>/);
    const descMatch = block.match(/<desc>([^<]*)<\/desc>/);
    const catMatch = block.match(/<category>([^<]*)<\/category>/);

    if (chIdMatch && titleMatch) {
      entries.push({
        tvgId: chIdMatch[1],
        start: formatXmltvDate(startMatch?.[1] || ""),
        stop: formatXmltvDate(stopMatch?.[1] || ""),
        title: titleMatch[1],
        description: descMatch?.[1] || "",
        category: catMatch?.[1] || "",
      });
      found++;
    }
  }

  // Store in the EPG store
  epgStore.setChannels(sourceId, channels);
  epgStore.setEntries(sourceId, entries);

  return {
    channels,
    entryCount: entries.length,
  };
}

/** Convert XMLTV date format (20260604000000 +0000) to ISO */
function formatXmltvDate(raw: string): string {
  if (!raw) return "";
  // Strip timezone suffix, parse YYYYMMDDHHMMSS
  const cleaned = raw.split(" ")[0];
  if (cleaned.length < 14) return raw;
  const y = cleaned.substring(0, 4);
  const m = cleaned.substring(4, 6);
  const d = cleaned.substring(6, 8);
  const hh = cleaned.substring(8, 10);
  const mm = cleaned.substring(10, 12);
  const ss = cleaned.substring(12, 14);
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
}
