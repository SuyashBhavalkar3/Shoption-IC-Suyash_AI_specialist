import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const { mobile_no, item, quantity, payment_type, full_payment_amount, full_payment_discount, COD_value, COD_Display, COD_discount } = await request.json();

    if (!mobile_no || !item || quantity === undefined) {
      return NextResponse.json({ error: 'Mobile number, item, and quantity are required' }, { status: 400 });
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

    // Step 2: Post to update_cart_item API
    const updateRes = await fetch(`${baseUrl}/api/method/shoption_api.cart.cart.update_cart_item`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${userApiKey}:${userApiSecret}`,
      },
      body: JSON.stringify({
        item,
        quantity,
        payment_type,
        full_payment_amount: full_payment_amount || 0.0,
        full_payment_discount: full_payment_discount || 0.0,
        COD_value: COD_value || 0.0,
        COD_Display: COD_Display || 0.0,
        COD_discount: COD_discount || 0.0
      }),
    });

    
    if (!updateRes.ok) {
      const errText = await updateRes.text();
      
      return NextResponse.json({ error: 'Failed to update cart item quantity', details: errText }, { status: updateRes.status });
    }

    const updateData = await updateRes.json();
    
    return NextResponse.json(updateData);
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Failed to update cart item quantity', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
