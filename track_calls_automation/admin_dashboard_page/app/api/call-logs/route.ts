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

  const urlObj = new URL(request.url);
  const searchParams = urlObj.searchParams.toString();

  try {
    const apiBaseUrl = getApiBaseUrl();

    // Fetch call logs directly from backend
    const res = await fetch(`${apiBaseUrl}/calls/?${searchParams}`, {
      headers: { authorization: authHeader },
    });

    if (!res.ok) {
      return NextResponse.json(
        { detail: "Failed to fetch call logs from backend" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in NextJS call-logs API route:", err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
