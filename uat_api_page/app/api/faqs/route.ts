import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiUrl = process.env.API_BASE_URL;
  const apiKey = process.env.SERVER_KEY;
  const apiSecret = process.env.SERVER_SECRET;

  if (!apiUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Missing required API environment variables." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
        "X-API-SECRET": apiSecret,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch FAQs from upstream API.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
