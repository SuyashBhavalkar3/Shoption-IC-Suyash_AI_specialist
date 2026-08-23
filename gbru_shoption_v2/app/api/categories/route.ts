import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from "next/server";

async function _getHandler() {
  const apiBaseUrl = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_SECRET;

  if (!apiBaseUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "API credentials are not configured in environment variables." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/method/shoption_api.gbru_shoption.item_api.get_gbru_categories`,
      {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "X-API-SECRET": apiSecret,
          "Content-Type": "application/json",
        },
        cache: "no-store", // Ensure dynamic fetching
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from ERP API: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching categories." },
      { status: 500 }
    );
  }
}

export const GET = withEncryption(_getHandler);
