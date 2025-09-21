import { NextResponse } from "next/server";

const GOOGLE_API_URL = "https://mybusinessbusinessinformation.googleapis.com/v1";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId"); // Your GBP account ID
    const locationId = searchParams.get("locationId"); // A specific store/location

    if (!accountId || !locationId) {
      return NextResponse.json({ error: "Missing accountId or locationId" }, { status: 400 });
    }

    // Example: Fetch insights (search views, calls, directions, etc.)
    const res = await fetch(
      `${GOOGLE_API_URL}/accounts/${accountId}/locations/${locationId}:fetchInsights`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GOOGLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationNames: [`accounts/${accountId}/locations/${locationId}`],
          basicRequest: {
            metricRequests: [
              { metric: "ALL" } // You can specify CALL_CLICKS, MAP_VIEWS, SEARCH_VIEWS, etc.
            ],
            timeRange: {
              startTime: "2024-01-01T00:00:00Z",
              endTime: "2024-12-31T23:59:59Z",
            },
          },
        }),
      }
    );

    const data = await res.json();

    return NextResponse.json({ insights: data });
  } catch (err: any) {
    console.error("Google API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
