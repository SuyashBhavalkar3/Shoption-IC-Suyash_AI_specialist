import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const { tracking_id } = await request.json();
    if (!tracking_id) {
      return NextResponse.json({ error: 'Tracking ID is required' }, { status: 400 });
    }

    const INDIA_POST_BASE_URL = process.env.INDIA_POST_BASE_URL;
    // Step 1: Login to get Access Token
    const loginRes = await fetch(`${INDIA_POST_BASE_URL}/access/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "1000057366",
        password: "Dop@1234"
      })
    });

    if (!loginRes.ok) {
      return NextResponse.json({ error: 'Failed to authenticate with Indian Post' }, { status: 502 });
    }

    const loginData = await loginRes.json();
    const token = loginData?.data?.access_token;
    if (!token) {
      return NextResponse.json({ error: 'No access token returned' }, { status: 502 });
    }

    // Step 2: Query Tracking Bulk endpoint
    const trackingRes = await fetch(`${INDIA_POST_BASE_URL}/tracking/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bulk: [tracking_id]
      })
    });

    if (!trackingRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch tracking data from Indian Post' }, { status: 502 });
    }

    const trackingData = await trackingRes.json();
    return NextResponse.json(trackingData);
  } catch (err: any) {
    
    return NextResponse.json({ error: 'Tracking lookup failed', message: err.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
