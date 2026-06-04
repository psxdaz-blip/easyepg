// GET /api/playlists/mine
import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { mockMasterChannels } from "@/lib/mock-data";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = store.getUserIdFromSession(auth);
  if (!userId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const playlists = store.getUserPlaylists(userId);

  const result = playlists.map((p) => ({
    ...p,
    channels: mockMasterChannels.filter((c) => p.channelIds.includes(c.id)),
  }));

  return NextResponse.json({ playlists: result });
}
