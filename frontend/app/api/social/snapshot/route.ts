import { NextResponse } from "next/server";

// ✅ GET → fetch social metrics
export async function GET(req: Request) {
  try {
    // 🔹 Replace later with real fetch (Facebook, IG, Google Reviews APIs)
    const snapshot = {
      facebook: 230,
      instagram: 540,
      google: 120,
    };

    return NextResponse.json({ snapshot });
  } catch (err: any) {
    console.error("GET /api/social/snapshot error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
