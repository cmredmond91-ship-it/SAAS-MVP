// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = data.users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || "user",
  }));

  return NextResponse.json(users);
}
