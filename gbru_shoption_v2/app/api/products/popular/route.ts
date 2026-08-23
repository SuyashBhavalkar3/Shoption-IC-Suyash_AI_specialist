import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function _postHandler(request: Request) {
  try {
    const { category, subcategory, brand, mobile_no } = await request.json();

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const systemApiKey = process.env.API_KEY;
    const systemApiSecret = process.env.API_SECRET;

    if (!baseUrl || !systemApiKey || !systemApiSecret) {
      
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    const payload = {
      category: category || null,
      subcategory: subcategory || null,
      brand: brand || "175",
      page: 1,
      page_size: 2,
      mobile_no: mobile_no || null
    };

    const response = await fetch(`${baseUrl}/api/method/shoption_api.erp_api.utility.get_popular_items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': systemApiKey,
        'X-API-SECRET': systemApiSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch popular items' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Failed to fetch popular items', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
