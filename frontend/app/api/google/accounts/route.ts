import { NextResponse } from "next/server";

// Helper: exchange refresh token for access token
async function getAccessToken() {
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

  return resp.json() as Promise<{ access_token: string }>;
}

export async function GET() {
  try {
    const { access_token } = await getAccessToken();

    const res = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to fetch accounts" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

