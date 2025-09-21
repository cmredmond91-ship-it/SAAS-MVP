import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ⚠️ Use service role for inserts (keep server-only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ POST → Add a new content idea
export async function POST(req: Request) {
  try {
    const { userId, project, idea, notes } = await req.json();

    if (!userId || !project || !idea) {
      return NextResponse.json(
        { error: "userId, project, and idea are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("seo_content_ideas")
      .insert([
        {
          user_id: userId,
          project,
          idea,
          notes: notes || null,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ contentIdea: data[0] }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/seo/content-ideas error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ GET → Fetch all content ideas for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("seo_content_ideas")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ contentIdeas: data });
  } catch (err: any) {
    console.error("GET /api/seo/content-ideas error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
