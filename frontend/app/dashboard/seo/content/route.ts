import { NextResponse } from "next/server";

// ✅ GET → fetch content ideas
export async function GET(req: Request) {
  try {
    // 🔹 Replace later with AI/LLM call or stored ideas
    const ideas = [
      "10 SEO Tips for HVAC Contractors",
      "Why Plumbers Should Invest in Local SEO",
      "Electrician Website Optimization Checklist",
    ];

    return NextResponse.json({ ideas });
  } catch (err: any) {
    console.error("GET /api/seo/content error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
