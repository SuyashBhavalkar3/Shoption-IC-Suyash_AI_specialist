import crypto from "crypto";

/**
 * Normalizes phone number (adds 91 prefix for 10 digit Indian numbers)
 */
export function normalizePhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * SHA-256 Hashing helper required by Meta for PII compliance
 */
export function sha256Hash(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Retrieves logged-in user phone from localStorage if available
 */
export function getLoggedInUserPhone(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const rawUser = localStorage.getItem("user") || localStorage.getItem("gbru_user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      return normalizePhone(user?.phone || user?.mobile || user?.phone_number);
    }
    const directPhone = localStorage.getItem("user_phone") || localStorage.getItem("phone");
    if (directPhone) {
      return normalizePhone(directPhone);
    }
  } catch (e) {}
  return undefined;
}

interface TrackMetaEventOptions {
  eventName: string;
  customData?: Record<string, any>;
  userData?: {
    phone?: string;
    email?: string;
  };
}

const recentEvents = new Map<string, number>();

/**
 * Universal Meta Event Tracker (Fires Browser Pixel + Server CAPI)
 */
export function trackMetaEvent(
  eventName: string,
  customData?: Record<string, any>,
  userData?: { phone?: string; email?: string }
) {
  if (typeof window === "undefined") return;

  // Deduplicate identical events fired within a 2000ms window (e.g. React StrictMode double mounts)
  const now = Date.now();
  const eventSignature = `${eventName}_${JSON.stringify(customData || {})}`;
  const lastFired = recentEvents.get(eventSignature);

  if (lastFired && now - lastFired < 2000) {
    return;
  }
  recentEvents.set(eventSignature, now);

  const eventId = `evt_${now}_${Math.random().toString(36).substr(2, 6)}`;
  
  // Extract and normalize phone
  const rawPhone = userData?.phone || getLoggedInUserPhone();
  const normalizedPhone = normalizePhone(rawPhone);
  const hashedPhone = sha256Hash(normalizedPhone);
  const hashedEmail = sha256Hash(userData?.email);

  // List of Meta Standard Event Names
  const STANDARD_EVENTS = new Set([
    "AddPaymentInfo",
    "AddToCart",
    "AddToWishlist",
    "CompleteRegistration",
    "Contact",
    "CustomizeProduct",
    "Donate",
    "FindLocation",
    "InitiateCheckout",
    "Lead",
    "PageView",
    "Purchase",
    "Schedule",
    "Search",
    "StartTrial",
    "SubmitApplication",
    "Subscribe",
    "ViewContent",
  ]);

  // 1. Fire Browser Pixel (if loaded)
  if ((window as any).fbq) {
    try {
      if (hashedPhone || hashedEmail) {
        (window as any).fbq("setUserProperties", {
          ...(hashedPhone ? { ph: hashedPhone } : {}),
          ...(hashedEmail ? { em: hashedEmail } : {}),
        });
      }
      if (STANDARD_EVENTS.has(eventName)) {
        (window as any).fbq("track", eventName, customData, { eventID: eventId });
      } else {
        (window as any).fbq("trackCustom", eventName, customData, { eventID: eventId });
      }
    } catch (e) {
      console.error("Meta Pixel Tracking Error:", e);
    }
  }

  // 2. Fire Server CAPI Endpoint
  fetch("/api/meta-capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId,
      customData,
      userData: {
        phone: normalizedPhone, // Server hashes it
        email: userData?.email,
      },
    }),
  }).catch((err) => console.error("Meta CAPI Fetch Error:", err));
}
