import { NextResponse } from "next/server";

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return url.replace(/\/$/, "");
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ detail: "Authorization header missing" }, { status: 401 });
  }

  try {
    const apiBaseUrl = getApiBaseUrl();

    // Fetch complete reports directly from the python backend
    const reportRes = await fetch(`${apiBaseUrl}/calls/reports`, {
      headers: { authorization: authHeader },
    });

    if (!reportRes.ok) {
      return NextResponse.json(
        { detail: "Failed to fetch reports from backend" },
        { status: reportRes.status }
      );
    }

    const report = await reportRes.json();
    return NextResponse.json(report);
  } catch (err) {
    console.error("Error in NextJS reports API route:", err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
