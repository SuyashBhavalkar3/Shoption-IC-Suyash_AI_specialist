import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler() {
  try {
    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const systemApiKey = process.env.API_KEY;
    const systemApiSecret = process.env.API_SECRET;

    if (!baseUrl || !systemApiKey || !systemApiSecret) {
      
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    const response = await fetch(`${baseUrl}/api/method/shoption_api.gbru_shoption.item_api.get_gbru_featured_products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': systemApiKey,
        'X-API-SECRET': systemApiSecret,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch featured products' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Failed to fetch featured products', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
