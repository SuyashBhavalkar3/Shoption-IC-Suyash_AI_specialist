import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    const apiKey = process.env.SYSTEM_API_KEY || process.env.API_KEY;
    const apiSecret = process.env.SYSTEM_API_SECRET || process.env.API_SECRET;

    if (!baseUrl || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const response = await fetch(`${baseUrl}/api/method/shoption_api.erp_api.utility.get_shoption_setting`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `token ${apiKey}:${apiSecret}`,
      },
      next: { revalidate: 3600 }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch shoption setting' }, { status: response.status });
    }

    return NextResponse.json({
      whatsapp_bot_link: data.message?.data?.whatsapp_bot_link,
      whatapp_bot_enabled: data.message?.data?.whatapp_bot_enabled ?? 1
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
