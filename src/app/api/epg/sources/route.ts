// POST /api/epg/sources — Add an EPG source, parse it in background
import { NextResponse } from "next/server";
import { epgStore } from "@/lib/epg-store";
import { parseXmltvUrl } from "@/lib/xmltv-parser";

export async function POST(request: Request) {
  try {
    const { name, url } = await request.json();
    if (!name || !url) {
      return NextResponse.json({ error: "name and url required" }, { status: 400 });
    }

    const source = epgStore.addSource(name, url);

    // Parse in background — status will update when done
    parseXmltvUrl(source.id, url)
      .then((result) => {
        const s = epgStore.getSource(source.id);
        if (s) {
          s.status = "loaded";
          s.channelCount = result.channels.length;
          s.entryCount = result.entryCount;
        }
      })
      .catch((err) => {
        const s = epgStore.getSource(source.id);
        if (s) {
          s.status = "error";
          s.errorMessage = (err as Error).message;
        }
      });

    return NextResponse.json({ source });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  const sources = epgStore.getSources().map((s) => ({
    ...s,
    channels: epgStore.getChannels(s.id),
  }));
  return NextResponse.json({ sources });
}
