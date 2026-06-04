// POST /api/auth/verify
import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const user = store.verifyAuthCode(email, code);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 401 }
      );
    }

    const token = store.createSession(user.id);

    return NextResponse.json({
      token,
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
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
