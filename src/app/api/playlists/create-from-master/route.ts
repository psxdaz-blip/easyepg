// POST /api/playlists/create-from-master
import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { mockMasterChannels } from "@/lib/mock-data";

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = store.getUserIdFromSession(auth);
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = store.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const mode: string = body.mode || "all";

    // Filter channels based on mode
    let channelIds: string[];
    if (mode === "smart") {
      // Smart: pick channels matching user's region and language
      channelIds = mockMasterChannels
        .filter((c) => c.language === user.language)
        .slice(0, 12)
        .map((c) => c.id);
    } else if (mode === "category" && body.categories?.length) {
      channelIds = mockMasterChannels
        .filter((c) => body.categories.includes(c.group))
        .map((c) => c.id);
    } else {
      // "all" — copy all
      channelIds = mockMasterChannels.map((c) => c.id);
    }

    const existing = store.getUserPlaylists(userId);
    let playlist = existing[0];

    if (!playlist) {
      playlist = store.createPlaylist(userId, body.name || "My Playlist");
    }

    store.updatePlaylistChannels(playlist.id, channelIds);

    return NextResponse.json({
      mode,
      copied: channelIds.length,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        slug: playlist.slug,
        channelCount: channelIds.length,
        url: `https://${playlist.slug}.easyepg.tv/playlist.m3u`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
