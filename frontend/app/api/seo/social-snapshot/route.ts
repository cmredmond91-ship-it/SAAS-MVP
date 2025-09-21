import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ server-only key
);

// ✅ GET → fetch social snapshot for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("seo_social")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ social: data });
  } catch (err: any) {
    console.error("GET /api/seo/social error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ POST → insert/update snapshot for a platform
export async function POST(req: Request) {
  try {
    const { userId, platform, post_count, engagement } = await req.json();

    if (!userId || !platform) {
      return NextResponse.json(
        { error: "userId and platform are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("seo_social")
      .upsert(
        {
          user_id: userId,
          platform,
          post_count: post_count ?? 0,
          engagement: engagement ?? {},
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" } // ensure one row per user/platform
      )
      .select();

    if (error) throw error;

    return NextResponse.json({ social: data[0] });
  } catch (err: any) {
    console.error("POST /api/seo/social error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

