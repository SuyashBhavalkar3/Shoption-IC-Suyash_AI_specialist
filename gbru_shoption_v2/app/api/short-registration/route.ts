import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';
import { createB2CLead } from '@/lib/lead';

async function _postHandler(request: Request) {
  try {
    const { mobile_no, name } = await request.json();

    if (!mobile_no || !name) {
      return NextResponse.json({ error: 'Mobile number and name are required' }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    if (!baseUrl || !apiKey || !apiSecret) {
      
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    const response = await fetch(`${baseUrl}/api/method/shoption_api.gbru_shoption.registration_api.short_farmer_registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
      body: JSON.stringify({ mobile_no, name }),
    });

    const data = await response.json();

    // Trigger B2C lead creation if registration succeeded
    if (data?.message?.status) {
      try {
        await createB2CLead(name, mobile_no);
      } catch (leadErr: any) {}
    }

    return NextResponse.json(data);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to complete short registration' }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
