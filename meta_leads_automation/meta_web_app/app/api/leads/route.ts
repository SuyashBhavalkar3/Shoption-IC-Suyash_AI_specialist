import { NextRequest, NextResponse } from "next/server";

// Recursive function to search for lead_gen_form_id in creative object
function findLeadGenFormId(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (obj.lead_gen_form_id) return obj.lead_gen_form_id.toString();
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === "object") {
      const found = findLeadGenFormId(val);
      if (found) return found;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const userToken = process.env.META_USER_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!userToken || !pageId) {
    return NextResponse.json(
      { error: "Meta credentials not configured in .env.local" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");
  const campaignName = searchParams.get("campaignName") || "";

  if (!campaignId) {
    return NextResponse.json(
      { error: "Missing required parameter: campaignId" },
      { status: 400 }
    );
  }

  try {
    // 1. Dynamically generate Page Access Token
    const pageTokenUrl = `https://graph.facebook.com/v23.0/${pageId}?fields=access_token&access_token=${userToken}`;
    const pageTokenRes = await fetch(pageTokenUrl);
    if (!pageTokenRes.ok) {
      const errData = await pageTokenRes.json();
      return NextResponse.json(
        { error: `Failed to fetch Page Access Token: ${errData.error?.message}` },
        { status: pageTokenRes.status }
      );
    }
    const pageTokenData = await pageTokenRes.json();
    const pageToken = pageTokenData.access_token;

    if (!pageToken) {
      return NextResponse.json(
        { error: "Could not retrieve access_token for Page from Meta API" },
        { status: 500 }
      );
    }

    // 2. Fetch ads of the campaign to locate associated lead forms
    const adsUrl = `https://graph.facebook.com/v23.0/${campaignId}/ads?fields=id,name,creative{id,object_story_spec}&access_token=${userToken}&limit=100`;
    const adsRes = await fetch(adsUrl);
    if (!adsRes.ok) {
      const errData = await adsRes.json();
      return NextResponse.json(
        { error: `Failed to fetch ads for campaign: ${errData.error?.message}` },
        { status: adsRes.status }
      );
    }
    const adsData = await adsRes.json();
    const ads = adsData.data || [];

    // Extract form IDs
    const formIds = new Set<string>();
    ads.forEach((ad: any) => {
      const formId = findLeadGenFormId(ad.creative);
      if (formId) {
        formIds.add(formId);
      }
    });

    // Fallback for development if no forms are found and campaign is the verified drone campaign
    if (formIds.size === 0 && campaignName.toLowerCase().includes("drone")) {
      formIds.add("1639791034812999");
    }

    if (formIds.size === 0) {
      return NextResponse.json({ data: [] });
    }

    // 3. Retrieve leads from all associated lead forms
    let allLeads: any[] = [];
    for (const formId of Array.from(formIds)) {
      let url = `https://graph.facebook.com/v23.0/${formId}/leads?fields=id,created_time,field_data,ad_id,ad_name,form_id&access_token=${pageToken}&limit=250`;
      let hasNext = true;
      let pagesFetched = 0;

      while (hasNext && pagesFetched < 4) {
        const res = await fetch(url, {
          headers: {
            "Accept": "application/json",
          },
        });

        if (!res.ok) {
          // If one form fails, log it and continue to others
          console.error(`Failed to fetch leads for form ${formId}`);
          break;
        }

        const data = await res.json();
        if (data.data) {
          allLeads = [...allLeads, ...data.data];
        }

        if (data.paging?.next && data.data && data.data.length > 0) {
          url = data.paging.next;
          pagesFetched++;
        } else {
          hasNext = false;
        }
      }
    }

    return NextResponse.json({ data: allLeads });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
