// POST /api/domains/request
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

    const { domain, playlistId } = await request.json();
    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    const verificationToken = `easyepg-verify=${Math.random().toString(36).substring(2, 14)}`;

    return NextResponse.json({
      id: `dv_${Date.now()}`,
      domain,
      cnameInstruction: `CNAME ${domain} → custom.easyepg.tv.`,
      verificationToken,
      txtRecordInstruction: `_easyepg-verify.${domain}  TXT  "${verificationToken}"`,
      status: "pending",
      autoVerify: true,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
