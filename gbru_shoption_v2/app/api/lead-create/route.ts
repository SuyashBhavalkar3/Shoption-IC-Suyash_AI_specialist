import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';
import { createB2CLead } from '@/lib/lead';

async function _postHandler(request: Request) {
  try {
    const { mobile_no, name } = await request.json();

    const baseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    const payload = {
      mobile_no,
      name,
      role: "Farmer"
    };

    const response = await fetch(`${baseUrl}/api/method/shoption_api.otp.api.lead_create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid response from server' }, { status: 500 });
    }

    // Trigger B2C lead creation (which registers the campaign_name) if registration/lead succeeded
    if (response.ok && data?.message?.status) {
      try {
        await createB2CLead(name, mobile_no);
      } catch (leadErr: any) {}
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
