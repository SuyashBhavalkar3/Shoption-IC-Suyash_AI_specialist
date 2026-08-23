import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from "next/server";

async function _getHandler(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id") || "";

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
    const payload = {
      page: 1,
      page_size: 100, // Fetch all subcategories
      category: categoryId,
    };

    const response = await fetch(
      `${apiBaseUrl}/api/method/shoption_api.gbru_shoption.item_api.get_gbru_subcategories`,
      {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "X-API-SECRET": apiSecret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch subcategories: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching subcategories." },
      { status: 500 }
    );
  }
}

export const GET = withEncryption(_getHandler);
