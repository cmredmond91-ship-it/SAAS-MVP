import { NextResponse } from "next/server";

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Missing accountId" },
        { status: 400 }
      );
    }

    const { access_token } = await getAccessToken();

    const res = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to fetch locations" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
