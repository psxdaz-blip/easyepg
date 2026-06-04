// POST /api/auth/send-magic-link
import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { code } = store.createAuthCode(email);

    // In production: send via Resend / Courier
    // await resend.emails.send({ ... });
    console.log(`[Magic Link] Code for ${email}: ${code}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
