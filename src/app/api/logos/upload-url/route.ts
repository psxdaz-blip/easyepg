// POST /api/logos/upload-url
import { NextResponse } from "next/server";
import { store } from "@/lib/store";

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

    const { channelId, filename } = await request.json();
    if (!channelId || !filename) {
      return NextResponse.json(
        { error: "channelId and filename required" },
        { status: 400 }
      );
    }

    const key = `logos/${userId}/${channelId}_${Date.now()}_${filename}`;

    // In production: generate R2 presigned POST URL
    return NextResponse.json({
      uploadUrl: `https://api.easyepg.tv/api/v1/logos/direct-upload`,
      uploadFields: { key, channelId },
      cdnUrl: `https://cdn.easyepg.tv/logos/${key}`,
      expiresIn: 300,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
