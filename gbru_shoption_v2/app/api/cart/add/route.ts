import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const { items, mobile_no, api_key, api_secret } = await request.json();

    if (!items || (!mobile_no && (!api_key || !api_secret))) {
      return NextResponse.json({ error: 'Items, and either mobile_no or API keys are required' }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const systemApiKey = process.env.API_KEY;
    const systemApiSecret = process.env.API_SECRET;

    if (!baseUrl || !systemApiKey || !systemApiSecret) {
      
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    let userApiKey = api_key;
    let userApiSecret = api_secret;

    // Fetch user details server-side if keys are not provided directly
    if (!userApiKey || !userApiSecret) {
      let sanitizedMobile = mobile_no;
      if (typeof mobile_no === 'string') {
        if (mobile_no.includes('@')) {
          sanitizedMobile = mobile_no.split('@')[0];
        }
        sanitizedMobile = sanitizedMobile.replace(/\D/g, '');
      }

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

      if (!userDetailsData?.message?.status || !userDetailsData?.message?.data) {
        
        return NextResponse.json({ error: 'Failed to retrieve user data', details: userDetailsData, attempted_mobile_no: mobile_no }, { status: 400 });
      }

      const dataObj = userDetailsData.message.data;
      userApiKey = dataObj.key_details?.api_key || dataObj.api_key;
      userApiSecret = dataObj.key_details?.api_secret || dataObj.api_secret;

      if (!userApiKey || !userApiSecret) {
        
        return NextResponse.json({ error: 'Failed to retrieve user keys', details: dataObj }, { status: 400 });
      }
    }

    // Fetch add to cart using the user's keys
    const response = await fetch(`${baseUrl}/api/method/shoption_api.cart.cart.add_cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${userApiKey}:${userApiSecret}`,
      },
      body: JSON.stringify({ items }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { rawText: text, error: "Failed to parse JSON from Frappe" };
    }

    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Failed to add to cart', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
