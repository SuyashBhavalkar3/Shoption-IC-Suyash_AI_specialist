import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = process.env.META_USER_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !adAccountId) {
    return NextResponse.json(
      { error: "Meta credentials not configured in .env.local" },
      { status: 500 }
    );
  }

  // Fetch ads from Meta Graph API to filter by active delivery and learning stage
  const url = `https://graph.facebook.com/v23.0/${adAccountId}/ads?fields=id,name,status,effective_status,adset{id,name,status,effective_status,learning_stage_info},campaign{id,name,status}&access_token=${token}&limit=500`;

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const errData = await res.json();
      return NextResponse.json(
        { error: errData.error?.message || "Failed to fetch ads from Meta API" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const ads = data.data || [];
    const activeCampaignsMap = new Map<string, any>();

    for (const ad of ads) {
      const isAdActive = ad.effective_status === "ACTIVE";
      const isLearning = ad.adset?.learning_stage_info?.status === "LEARNING";

      if (isAdActive && !isLearning) {
        const campaign = ad.campaign;
        if (campaign) {
          if (!activeCampaignsMap.has(campaign.id)) {
            activeCampaignsMap.set(campaign.id, {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status || "ACTIVE",
              adName: ad.name
            });
          }
        }
      }
    }

    const campaignsList = Array.from(activeCampaignsMap.values());
    return NextResponse.json({ data: campaignsList });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
