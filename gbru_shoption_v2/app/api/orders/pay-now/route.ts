import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const { mobile_no, order_id, amount, email } = await request.json();

    if (!mobile_no || !order_id || !amount) {
      return NextResponse.json({ error: 'Mobile number, Order ID, and amount are required' }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const systemApiKey = process.env.API_KEY;
    const systemApiSecret = process.env.API_SECRET;

    if (!baseUrl || !systemApiKey || !systemApiSecret) {

      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    // Fetch user details server-side to get user metadata securely
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
      return NextResponse.json({ error: 'Failed to retrieve user details' }, { status: 400 });
    }

    const userData = userDetailsData.message.data;
    const customerName = userData.Customer_name || userData.customer_name || 'Customer';
    const customerEmail = userData.user_id || userData.email_id || email || 'utkarsh.rathore@shoption.in';

    let customerPhone = userData.mobile_no || mobile_no || '';
    if (customerPhone.startsWith("+91")) {
      customerPhone = customerPhone.replace("+91", "");
    }
    customerPhone = customerPhone.trim().replace(/\D/g, "");

    const userId = userData.shoption_customer_id || userData.username || '';

    // Detect base URL
    const host = request.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    let websiteBaseUrl = `${protocol}://${host}`;
    if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
      websiteBaseUrl = 'https://gbru.shoption.in';
    }

    const callbackUrl = `${websiteBaseUrl}/place-order`;
    const qs = [
      `ProductInfo=Shoption Order`,
      `FirstName=${customerName}`,
      `Email=${customerEmail}`,
      `Amount=${Number(amount).toFixed(2)}`,
      `Phone=${customerPhone}`,
      `UserId=${userId}`,
      `Order_id=${order_id}`,
      `Call_Back_URL=${callbackUrl}`,
    ].join("&");

    const token = Buffer.from(qs).toString('base64');

    return NextResponse.json({
      status: true,
      token: token,
      actionUrl: process.env.PAYMENT_GATEWAY_URL
    });
  } catch (error: any) {

    return NextResponse.json({ error: 'Failed to generate payment token', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
