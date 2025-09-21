import { NextResponse } from "next/server";

export async function GET() {
  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
      grant_type: "refresh_token",
    });

    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: data.error || "Failed to get token" }, { status: resp.status });
    }

    return NextResponse.json({
      message: "OAuth working ✅",
      access_token_preview: data.access_token?.slice(0, 10) + "...",
      expires_in: data.expires_in,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
