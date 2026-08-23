import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function _postHandler(request: Request) {
  try {
    const { mobile_no } = await request.json();
    if (!mobile_no) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    let sanitizedMobile = mobile_no.toString().replace(/\D/g, '');
    if (sanitizedMobile.length > 10) {
      sanitizedMobile = sanitizedMobile.slice(-10);
    }

    // If it's a dummy or guest mobile number (less than 10 digits), return a clean empty cart response
    if (sanitizedMobile.length < 10) {
      return NextResponse.json({
        message: {
          status: true,
          message: "Empty cart for guest user",
          data: []
        }
      });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    if (!baseUrl || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }
    // Step 1: Fetch user details for auth keys
    const userRes = await fetch(`${baseUrl}/api/method/shoption_api.erp_api.utility.get_user_details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
      body: JSON.stringify({ mobile_no: sanitizedMobile }),
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch user auth keys' }, { status: userRes.status });
    }

    const userData = await userRes.json();

    if (!userData.message?.status || !userData.message?.data?.key_details) {
      return NextResponse.json({ error: 'User auth keys not found' }, { status: 401 });
    }

    const userApiKey = userData.message.data.key_details.api_key;
    const userApiSecret = userData.message.data.key_details.api_secret;

    // Step 2: Fetch cart details
    const cartRes = await fetch(`${baseUrl}/api/method/shoption_api.gbru_shoption.gbru_cart.get_cart?page=1&page_size=20&t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${userApiKey}:${userApiSecret}`,
      },
      cache: 'no-store'
    });

    if (!cartRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: cartRes.status });
    }

    const cartData = await cartRes.json();
    return NextResponse.json(cartData);
  } catch (error: any) {

    return NextResponse.json({ error: 'Failed to fetch cart details', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
