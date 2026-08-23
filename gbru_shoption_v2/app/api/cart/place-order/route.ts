import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const { mobile_no, items, coupon_code, payment_type, transaction_amount, email } = await request.json();

    if (!mobile_no || !items) {
      return NextResponse.json({ error: 'Mobile number and items are required' }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    if (!baseUrl || !apiKey || !apiSecret) {

      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    // Step 1: Fetch user details for auth keys & customer info
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
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: userRes.status });
    }

    const userData = await userRes.json();
    if (!userData.message?.status || !userData.message?.data?.key_details) {
      return NextResponse.json({ error: 'User details not found' }, { status: 401 });
    }

    const userApiKey = userData.message.data.key_details.api_key;
    const userApiSecret = userData.message.data.key_details.api_secret;
    const authorizationHeader = `token ${userApiKey}:${userApiSecret}`;

    // Step 2: Call ERP place_order
    const placeOrderRes = await fetch(`${baseUrl}/api/method/shoption_api.cart.cart.place_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorizationHeader,
      },
      body: JSON.stringify({
        items,
        delivery_date: null,
        warehouse: null,
        transporter: null,
        coupon_code: coupon_code || null,
        payment_type: payment_type,
        transaction_amount: transaction_amount,
        source: 'Web App'
      }),
    });

    if (!placeOrderRes.ok) {
      const errText = await placeOrderRes.text();

      return NextResponse.json({ error: 'Failed to place order in ERP', details: errText }, { status: placeOrderRes.status });
    }

    const orderData = await placeOrderRes.json();
    if (!orderData.message?.status || !orderData.message?.data) {
      return NextResponse.json({ error: 'ERP rejected order placement', message: orderData.message?.message || '' }, { status: 400 });
    }

    const salesOrder = orderData.message.data.sales_order;
    const actualTransactionAmount = orderData.message.data.transaction_amount || transaction_amount;

    // Step 3: Format customer details for payment token
    const customerName = userData.message.data.Customer_name || userData.message.data.customer_name || 'Customer';
    const customerEmail = userData.message.data.user_id || userData.message.data.email_id || email || 'utkarsh.rathore@shoption.in';

    let customerPhone = userData.message.data.mobile_no || mobile_no || '';
    if (customerPhone.startsWith("+91")) {
      customerPhone = customerPhone.replace("+91", "");
    }
    customerPhone = customerPhone.trim().replace(/\D/g, "");

    const userId = userData.message.data.shoption_customer_id || userData.message.data.username || '';

    // Step 4: Detect website base URL
    const host = request.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    let websiteBaseUrl = `${protocol}://${host}`;
    if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
      websiteBaseUrl = 'https://gbru.shoption.in';
    }

    // Step 5: Build base64-encoded payment token
    const callbackUrl = `${websiteBaseUrl}/place-order`;
    const qs = [
      `ProductInfo=Shoption Order`,
      `FirstName=${customerName}`,
      `Email=${customerEmail}`,
      `Amount=${actualTransactionAmount.toFixed(2)}`,
      `Phone=${customerPhone}`,
      `UserId=${userId}`,
      `Order_id=${salesOrder}`,
      `Call_Back_URL=${callbackUrl}`,
    ].join("&");

    const token = Buffer.from(qs).toString('base64');

    return NextResponse.json({
      status: true,
      message: 'Order placed successfully',
      sales_order: salesOrder,
      token: token,
      paymentMode: payment_type === 'Full Payment' ? 'full' : 'booking',
      actionUrl: process.env.PAYMENT_GATEWAY_URL
    });
  } catch (error: any) {

    return NextResponse.json({ error: 'Internal server error', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
