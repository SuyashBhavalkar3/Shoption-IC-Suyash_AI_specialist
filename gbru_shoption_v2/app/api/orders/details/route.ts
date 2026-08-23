import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const { mobile_no, order_id } = await request.json();

    if (!mobile_no || !order_id) {
      return NextResponse.json({ error: 'Mobile number and Order ID are required' }, { status: 400 });
    }

    let sanitizedMobile = mobile_no.toString().replace(/\D/g, '');
    if (sanitizedMobile.length > 10) {
      sanitizedMobile = sanitizedMobile.slice(-10);
    }

    // Return empty order details for guest or dummy user (mobile < 10 digits)
    if (sanitizedMobile.length < 10) {
      return NextResponse.json({
        message: {
          status: true,
          message: "Empty details for guest user",
          data: {}
        }
      });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const systemApiKey = process.env.API_KEY;
    const systemApiSecret = process.env.API_SECRET;

    if (!baseUrl || !systemApiKey || !systemApiSecret) {
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    // Step 1: Fetch user details server-side to get user's API keys securely
    const userDetailsRes = await fetch(`${baseUrl}/api/method/shoption_api.erp_api.utility.get_user_details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': systemApiKey,
        'X-API-SECRET': systemApiSecret,
      },
      body: JSON.stringify({ mobile_no: sanitizedMobile }),
    });

    const userDetailsData = await userDetailsRes.json();
    
    if (!userDetailsData?.message?.status || !userDetailsData?.message?.data?.key_details) {
      return NextResponse.json({ error: 'Failed to retrieve user key details' }, { status: 400 });
    }

    const userApiKey = userDetailsData.message.data.key_details.api_key;
    const userApiSecret = userDetailsData.message.data.key_details.api_secret;

    // Step 2: Fetch order details using the user's keys
    const response = await fetch(`${baseUrl}/api/method/shoption_api.cart.cart.get_order_details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${userApiKey}:${userApiSecret}`,
      },
      body: JSON.stringify({ order_id }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Failed to fetch order details', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
