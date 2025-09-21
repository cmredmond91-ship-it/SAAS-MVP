import { NextResponse } from "next/server";

// Helper: Exchange refresh token for access token
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

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return resp.json() as Promise<{ access_token: string }>;
}

// GET handler
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");   // e.g. "1234567890"
    const locationId = searchParams.get("locationId"); // e.g. "9876543210"

    if (!accountId || !locationId) {
      return NextResponse.json(
        { error: "Missing accountId or locationId" },
        { status: 400 }
      );
    }

    const { access_token } = await getAccessToken();

    // Build request body
    const body = {
      locationNames: [`accounts/${accountId}/locations/${locationId}`],
      basicRequest: {
        metricRequests: [
          { metric: "ALL" } // You can request specific metrics if needed
        ],
        timeRange: {
          startTime: "2024-01-01T00:00:00Z",
          endTime: "2024-12-31T23:59:59Z"
        }
      }
    };

    const res = await fetch(
      "https://businessprofileperformance.googleapis.com/v1/locations:fetchMultiDailyMetricsTimeSeries",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Performance API request failed" },
        { status: res.status }
      );
    }

    return NextResponse.json({ insights: data });
  } catch (err: any) {
    console.error("Google API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
