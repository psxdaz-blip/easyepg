// PUT /api/onboarding/preferences
import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function PUT(request: Request) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = store.getUserIdFromSession(auth);
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const user = store.updateUserPreferences(userId, {
      language: body.language,
      region: body.region,
      aiThreshold: body.aiThreshold,
      aiAutoApply: body.aiAutoApply,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
