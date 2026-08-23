import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    let mobile_no = "";
    let page_size = 50;
    let page = 1;

    try {
      const body = await request.json();
      mobile_no = body.mobile_no || "";
      page_size = body.page_size || 50;
      page = body.page || 1;
    } catch (e) {
      
    }

    // Extract and clean mobile number from payload
    const sanitizeMobileNumber = (mobile: string): string => {
      if (!mobile) return "";
      const part = mobile.includes("@") ? mobile.split("@")[0] : mobile;
      const digits = part.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
      }
      return digits;
    };

    mobile_no = sanitizeMobileNumber(mobile_no);

    if (!mobile_no) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    if (!baseUrl || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing ERP API configuration' }, { status: 500 });
    }

    // Step 1: Fetch user keys
    const userDetailsRes = await fetch(`${baseUrl}/api/method/shoption_api.erp_api.utility.get_user_details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
      body: JSON.stringify({ mobile_no }),
    });

    const userDetailsData = await userDetailsRes.json();
    if (!userDetailsData?.message?.status || !userDetailsData?.message?.data?.key_details) {
      return NextResponse.json({ error: 'Failed to retrieve user key details' }, { status: 400 });
    }

    const userApiKey = userDetailsData.message.data.key_details.api_key;
    const userApiSecret = userDetailsData.message.data.key_details.api_secret;

    // Step 2: Fetch complaint list using user's keys
    const response = await fetch(`${baseUrl}/api/method/shoption_api.cart.cart.complaint_list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `token ${userApiKey}:${userApiSecret}`,
      },
      body: JSON.stringify({
        page_size: page_size || 50,
        page: page || 1
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    
    return NextResponse.json({ error: 'An error occurred while fetching complaints' }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
