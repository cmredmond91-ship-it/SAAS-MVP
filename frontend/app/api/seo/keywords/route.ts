import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ service role key, keep server-only
);

// ✅ GET → Fetch all keywords for logged-in user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("seo_keywords")
      .select("*")
      .eq("user_id", userId)
      .order("last_updated", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ keywords: data });
  } catch (err: any) {
    console.error("GET /api/seo/keywords error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ POST → Insert a new keyword
export async function POST(req: Request) {
  try {
    const { userId, project, term, target_url } = await req.json();

    if (!userId || !project || !term) {
      return NextResponse.json(
        { error: "userId, project, and term are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("seo_keywords")
      .insert([
        {
          user_id: userId,
          project,
          term,
          target_url: target_url || null,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ keyword: data[0] });
  } catch (err: any) {
    console.error("POST /api/seo/keywords error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
