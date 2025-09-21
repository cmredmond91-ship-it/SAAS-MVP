import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Server-side Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ only use service role on server
);

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    // Step 1: Send invite
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Step 2: Update role in profiles
    if (data?.user?.id) {
      await supabaseAdmin.from("profiles").update({ role }).eq("id", data.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
