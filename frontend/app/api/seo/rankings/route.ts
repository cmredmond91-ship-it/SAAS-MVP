import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // simulate rankings
    const rankings = [
      { keyword: "plumber near me", position: 3 },
      { keyword: "emergency hvac repair", position: 8 },
      { keyword: "electrician in newport beach", position: 12 },
    ];

    return NextResponse.json({ rankings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
