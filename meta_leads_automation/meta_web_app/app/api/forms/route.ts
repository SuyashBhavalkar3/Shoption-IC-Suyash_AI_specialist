import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const customToken = request.headers.get("x-access-token");
  const envToken = process.env.PAGE_ACCESS_TOKEN;
  const token = customToken || envToken;

  if (!token) {
    return NextResponse.json(
      { error: "Access token is missing. Please configure it in .env.local or enter it in the dashboard settings." },
      { status: 400 }
    );
  }

  const pageId = "112518168556497";
  const url = `https://graph.facebook.com/v23.0/${pageId}/leadgen_forms?access_token=${token}&limit=100`;

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const errData = await res.json();
      return NextResponse.json(
        { error: errData.error?.message || "Failed to fetch forms from Meta API" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
