import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import { URL } from 'url';

function getWithBody(urlStr: string, token: string, bodyObj: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const bodyData = JSON.stringify(bodyObj);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Content-Length': Buffer.byteLength(bodyData)
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(bodyData);
    req.end();
  });
}

async function _postHandler(request: Request) {
  try {
    const { mobile_no, brand_ambassador } = await request.json();

    if (!mobile_no || !brand_ambassador) {
      return NextResponse.json({ error: 'Mobile number and brand ambassador code are required' }, { status: 400 });
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

    // Step 2: Call validate_brand_ambassador API via Node HTTP GET with Body
    const erpUrl = `${baseUrl}/api/method/shoption_api.cart.cart.validate_brand_ambassador`;
    const token = `token ${userApiKey}:${userApiSecret}`;
    
    
    const validateData = await getWithBody(erpUrl, token, { brand_ambassador });
    
    
    return NextResponse.json(validateData);
  } catch (error: any) {
    
    return NextResponse.json({ error: 'Failed to validate brand ambassador', msg: error.message }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
