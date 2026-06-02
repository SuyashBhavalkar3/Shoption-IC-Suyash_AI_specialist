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

  // Fetch ads from Meta Graph API to filter by active delivery
  const url = `https://graph.facebook.com/v23.0/${adAccountId}/ads?fields=id,name,status,effective_status,campaign{id,name,status,objective}&access_token=${token}&limit=500`;

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

      if (isAdActive) {
        const campaign = ad.campaign;
        if (campaign) {
          // 1. Ensure the campaign itself is active
          if (campaign.status !== "ACTIVE") {
            continue;
          }

          // 2. Ensure objective is lead generation (and not sales/conversions/landing page traffic)
          const objective = campaign.objective;
          const isLeadCampaign = objective === "OUTCOME_LEADS" || objective === "LEAD_GENERATION";
          if (!isLeadCampaign) {
            continue;
          }

          // 3. Exclude Auto Order campaigns by name filter as a safety fallback
          const nameLower = campaign.name.toLowerCase();
          if (nameLower.includes("auto_order") || nameLower.includes("auto order")) {
            continue;
          }

          if (!activeCampaignsMap.has(campaign.id)) {
            activeCampaignsMap.set(campaign.id, {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status || "ACTIVE",
              ads: []
            });
          }
          activeCampaignsMap.get(campaign.id).ads.push({
            id: ad.id,
            name: ad.name,
            status: ad.status,
            effectiveStatus: ad.effective_status
          });
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