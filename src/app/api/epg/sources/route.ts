// POST /api/epg/sources — Add an EPG source
import { NextResponse } from "next/server";
import { epgStore } from "@/lib/epg-store";

export async function POST(request: Request) {
  try {
    const { name, url } = await request.json();
    if (!name || !url) {
      return NextResponse.json({ error: "name and url required" }, { status: 400 });
    }
    const source = epgStore.addSource(name, url);
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
