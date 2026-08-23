import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const { mobile_no, order_id, from_date, to_date, page_size, page } = await request.json();

    if (!mobile_no) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    let sanitizedMobile = mobile_no.toString().replace(/\D/g, '');
    if (sanitizedMobile.length > 10) {
      sanitizedMobile = sanitizedMobile.slice(-10);
    }

    // Return empty order list for guest or dummy user (mobile < 10 digits)
    if (sanitizedMobile.length < 10) {
      return NextResponse.json({
        message: {
          status: true,
          message: "Empty orders list for guest user",
          data: {
            data: [],
            total: 0
          }
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
      return NextResponse.json({ error: 'Failed to retrieve user key details', details: userDetailsData }, { status: 400 });
    }

    const userApiKey = userDetailsData.message.data.key_details.api_key;
    const userApiSecret = userDetailsData.message.data.key_details.api_secret;

    // Step 2: Fetch orders using the user's keys
    const params = new URLSearchParams({
      order_id: order_id ?? "",
      from_date: from_date || "2026-04-01",
      to_date: to_date || "2028-05-31",
      page_size: String(page_size || 200),
      page: String(page || 1),
    });

    const url = `${baseUrl}/api/method/shoption_api.cart.cart.get_order_from_list?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${userApiKey}:${userApiSecret}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || data?.message || "Failed to fetch orders", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Failed to fetch orders', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
