// GET /api/auth/me
import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: Request) {
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

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      language: user.language,
      region: user.region,
      timezone: user.timezone,
      aiThreshold: user.aiThreshold,
      aiAutoApply: user.aiAutoApply,
    },
  });
}
