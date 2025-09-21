import { NextResponse } from "next/server";

// ✅ GET → fetch keyword rankings
export async function GET(req: Request) {
  try {
    // 🔹 Replace later with real fetch (Google Search Console, SEMRush, etc.)
    const demoRankings = [
      { term: "hvac software", position: 5 },
      { term: "plumbing crm", position: 12 },
      { term: "electrician seo", position: 8 },
    ];

    return NextResponse.json({ rankings: demoRankings });
  } catch (err: any) {
    console.error("GET /api/seo/rankings error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
