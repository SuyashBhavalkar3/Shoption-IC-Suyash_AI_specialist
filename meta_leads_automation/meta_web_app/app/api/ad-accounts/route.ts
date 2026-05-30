import { NextResponse } from "next/server";

export async function GET() {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const pageId = process.env.META_PAGE_ID;

  if (!adAccountId || !pageId) {
    return NextResponse.json(
      { error: "Configuration missing in .env.local (META_AD_ACCOUNT_ID and META_PAGE_ID)" },
      { status: 500 }
    );
  }

  // Return a list of available ad accounts
  return NextResponse.json({
    data: [
      {
        id: adAccountId,
        name: "GBRU Ads",
        pageId: pageId,
      }
    ]
  });
}
