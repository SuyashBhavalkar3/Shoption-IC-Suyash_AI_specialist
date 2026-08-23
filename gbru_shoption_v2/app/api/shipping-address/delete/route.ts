import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _deleteHandler(request: Request) {
  try {
    const body = await request.json();
    const { mobile_no, api_key, api_secret, name } = body;

    if (!mobile_no && (!api_key || !api_secret)) {
      return NextResponse.json({ error: 'Either mobile_no or API keys are required' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'address name is required' }, { status: 400 });
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
      const userDetailsRes = await fetch(`${baseUrl}/api/method/shoption_api.erp_api.utility.get_user_details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': systemApiKey,
          'X-API-SECRET': systemApiSecret,
        },
        body: JSON.stringify({ mobile_no }),
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

    // Delete shipping address using the user's keys
    // Assuming DELETE method for Frappe, fallback to POST if needed
    const response = await fetch(`${baseUrl}/api/method/shoption_api.cart.cart.delete_customer_shipping_address`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${userApiKey}:${userApiSecret}`,
      },
      body: JSON.stringify({ name })
    });

    // Handle Frappe's potential requirement for POST instead of DELETE if it throws 405 Method Not Allowed
    let finalResponse = response;
    if (response.status === 405 || response.status === 403) {
        const fallbackResponse = await fetch(`${baseUrl}/api/method/shoption_api.cart.cart.delete_customer_shipping_address`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `token ${userApiKey}:${userApiSecret}`,
            },
            body: JSON.stringify({ name })
        });
        
        // Only use fallback if it actually succeeded, otherwise stick with original for better error logging
        if (fallbackResponse.ok) {
            finalResponse = fallbackResponse;
        }
    }

    const responseText = await finalResponse.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      
      return NextResponse.json({ error: 'Invalid response from server' }, { status: 500 });
    }

    return NextResponse.json(data, { status: finalResponse.status });
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export const DELETE = withEncryption(_deleteHandler);
