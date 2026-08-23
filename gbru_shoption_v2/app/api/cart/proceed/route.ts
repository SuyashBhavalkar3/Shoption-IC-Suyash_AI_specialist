import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const { mobile_no, items, delivery_date, warehouse, transporter, coupon_code } = await request.json();

    if (!mobile_no || !items) {
      return NextResponse.json({ error: 'Mobile number and items are required' }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    if (!baseUrl || !apiKey || !apiSecret) {
      
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    // Step 1: Fetch user details for auth keys
    let sanitizedMobile = mobile_no;
    if (typeof mobile_no === 'string') {
      if (mobile_no.includes('@')) {
        sanitizedMobile = mobile_no.split('@')[0];
      }
      sanitizedMobile = sanitizedMobile.replace(/\D/g, '');
    }

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

    // Step 2: Post to proceed API
    const proceedRes = await fetch(`${baseUrl}/api/method/shoption_api.cart.cart.proceed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${userApiKey}:${userApiSecret}`,
      },
      body: JSON.stringify({
        items,
        delivery_date: delivery_date || null,
        warehouse: warehouse || null,
        transporter: transporter || null,
        coupon_code: coupon_code || null
      }),
    });

    
    if (!proceedRes.ok) {
      const errText = await proceedRes.text();
      
      return NextResponse.json({ error: 'Failed to proceed with order details', details: errText }, { status: proceedRes.status });
    }

    const proceedData = await proceedRes.json();
    
    return NextResponse.json(proceedData);
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Failed to proceed with order details', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
