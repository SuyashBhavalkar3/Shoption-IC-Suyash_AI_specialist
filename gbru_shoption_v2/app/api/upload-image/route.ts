import { withEncryption } from "@/utils/withEncryption";
import { NextResponse } from 'next/server';

async function _postHandler(request: Request) {
  try {
    const clientFormData = await request.formData();
    const file = clientFormData.get("file") as File;
    const mobile_no = clientFormData.get("mobile_no") as string;

    if (!file || !mobile_no) {
      return NextResponse.json({ error: 'Missing file or mobile_no' }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const apiKey = process.env.API_KEY;
    const apiSecret = process.env.API_SECRET;

    if (!baseUrl || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Internal server error: Missing credentials' }, { status: 500 });
    }

    const serverFormData = new FormData();
    serverFormData.append("mobile_no", mobile_no);

    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });
    serverFormData.append("file", fileBlob, file.name);

    const response = await fetch(`${baseUrl}/api/method/shoption_api.erp_api.utility.upload_image`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
      body: serverFormData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

export const POST = withEncryption(_postHandler);
