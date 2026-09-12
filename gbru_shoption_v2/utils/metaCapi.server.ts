import crypto from "crypto";

/**
 * Server-side helper to send Meta Conversions API (CAPI) events.
 * This runs on the Next.js server, bypassing browser adblockers.
 */

interface UserData {
  email?: string;
  phone?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

interface MetaCapiParams {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  userData?: UserData;
  customData?: Record<string, any>;
}

export async function sendMetaCapiEvent({
  eventName,
  eventId,
  eventSourceUrl,
  userData,
  customData,
}: MetaCapiParams) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !token) {
    // If token is missing, log silently and skip execution
    return;
  }

  const normalizedPhone = userData?.phone ? userData.phone.replace(/\D/g, "") : undefined;
  const formattedPhone = normalizedPhone ? (normalizedPhone.length === 10 ? `91${normalizedPhone}` : normalizedPhone) : undefined;
  
  const hashedPhone = formattedPhone
    ? crypto.createHash("sha256").update(formattedPhone.trim().toLowerCase()).digest("hex")
    : undefined;

  const hashedEmail = userData?.email
    ? crypto.createHash("sha256").update(userData.email.trim().toLowerCase()).digest("hex")
    : undefined;

  try {
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId, // Used for deduplication with browser Pixel
          event_source_url: eventSourceUrl,
          action_source: "website",
          user_data: {
            client_ip_address: userData?.clientIpAddress,
            client_user_agent: userData?.clientUserAgent,
            ...(hashedPhone ? { ph: [hashedPhone] } : {}),
            ...(hashedEmail ? { em: [hashedEmail] } : {}),
          },
          custom_data: customData,
          ...(customData?.test_event_code ? { test_event_code: customData.test_event_code } : {}),
        },
      ],
      ...(customData?.test_event_code ? { test_event_code: customData.test_event_code } : {}),
    };

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Meta CAPI API Error:", errorText);
    }
  } catch (err) {
    console.error("Meta CAPI Request Exception:", err);
  }
}
