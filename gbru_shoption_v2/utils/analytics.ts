/**
 * GBRU Centralized Event Analytics Utility
 * Handles anonymous ID tracking, user profile resolution, and API dispatch
 * Configured via environment variables (NEXT_PUBLIC_ANALYTICS_* / VITE_ANALYTICS_*)
 */

export interface AnalyticsContext {
  user?: Record<string, unknown> | null;
  userDetails?: Record<string, unknown> | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  user_id?: string;
  anonymous_id?: string;
  [key: string]: unknown;
}

export interface AnalyticsPayload {
  api_key: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  user_id?: string;
  anonymous_id: string;
  event_name: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

const ANALYTICS_CONFIG = {
  apiKey:
    process.env.NEXT_PUBLIC_ANALYTICS_API_KEY ||
    process.env.VITE_ANALYTICS_API_KEY ||
    'pk_live_bcd39b8924457c7be39983e0117dd57f',
  trackUrl:
    process.env.NEXT_PUBLIC_ANALYTICS_TRACK_URL ||
    process.env.VITE_ANALYTICS_TRACK_URL ||
    'https://shoption-usereng-api-hjdqfpfthqc2cxgd.centralindia-01.azurewebsites.net/api/events/track',
};

const PAGE_VIEW_KEYS = new Set<string>();

/**
 * Retrieve or generate a persistent anonymous ID for non-logged-in visitors
 */
export const getAnonymousId = (): string => {
  try {
    if (typeof window === 'undefined') return '';
    const storageKey = 'gbru_anonymous_id';
    const existingId = localStorage.getItem(storageKey);

    if (existingId) return existingId;

    const newId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(storageKey, newId);
    return newId;
  } catch (error) {
    console.error('Analytics anonymous id error:', error);
    return '';
  }
};

/**
 * Safely parse stored user object from localStorage
 */
export const getStoredUser = (): Record<string, unknown> | null => {
  try {
    if (typeof window === 'undefined') return null;
    const savedUser =
      localStorage.getItem('gbru_user') || localStorage.getItem('user');
    return savedUser ? (JSON.parse(savedUser) as Record<string, unknown>) : null;
  } catch (error) {
    console.error('Analytics user parse error:', error);
    return null;
  }
};

/**
 * Build resolved customer metadata from session / context
 */
export const buildCustomerFields = (context: AnalyticsContext = {}) => {
  const storedUser = getStoredUser();
  const user = (context.user || storedUser || {}) as Record<string, unknown>;
  const userDetails = (context.userDetails || {}) as Record<string, unknown>;

  let storedMobile = '';
  try {
    if (typeof window !== 'undefined') {
      storedMobile = localStorage.getItem('mobile_no') || '';
    }
  } catch {
    // ignore
  }

  const customer_name =
    (context.customer_name as string) ||
    (userDetails.Customer_name as string) ||
    (userDetails.customer_name as string) ||
    (userDetails.name as string) ||
    (user.Customer_name as string) ||
    (user.customer_name as string) ||
    (user.name as string) ||
    '';

  const customer_email =
    (context.customer_email as string) ||
    (userDetails.email_id as string) ||
    (userDetails.email as string) ||
    (user.email_id as string) ||
    (user.email as string) ||
    '';

  const customer_phone =
    (context.customer_phone as string) ||
    (userDetails.mobile_no as string) ||
    (userDetails.phone as string) ||
    (user.mobile_no as string) ||
    (user.phone as string) ||
    storedMobile ||
    '';

  const user_id =
    (context.user_id as string) ||
    (userDetails.user_id as string) ||
    (userDetails.customer_id as string) ||
    (user.user_id as string) ||
    (user.customer_id as string) ||
    (user.name as string) ||
    customer_phone ||
    '';

  const anonymous_id =
    (context.anonymous_id as string) ||
    getAnonymousId();

  return {
    customer_name,
    customer_email,
    customer_phone,
    user_id,
    anonymous_id,
  };
};

/**
 * Construct the normalized analytics payload
 */
export const buildAnalyticsPayload = (
  eventName: string,
  properties: Record<string, unknown> = {},
  context: AnalyticsContext = {}
): AnalyticsPayload => {
  const customerFields = buildCustomerFields(context);

  const enhancedProperties: Record<string, unknown> = {
    ...properties,
  };

  if (customerFields.customer_name) {
    enhancedProperties.customer_name = customerFields.customer_name;
  }
  if (customerFields.customer_phone) {
    enhancedProperties.customer_phone = customerFields.customer_phone;
  }
  if (customerFields.customer_email) {
    enhancedProperties.customer_email = customerFields.customer_email;
  }
  if (customerFields.user_id) {
    enhancedProperties.user_id = customerFields.user_id;
  }

  return {
    api_key: ANALYTICS_CONFIG.apiKey,
    ...customerFields,
    event_name: eventName,
    properties: enhancedProperties,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Dispatch an analytics event to the backend tracking service.
 * Completely safe and non-blocking — errors are caught and will never break application logic.
 */
export const trackEvent = (
  eventName: string,
  properties: Record<string, unknown> = {},
  context: AnalyticsContext = {}
): AnalyticsPayload | null => {
  try {
    if (typeof window === 'undefined') return null;

    const payload = buildAnalyticsPayload(eventName, properties, context);

    // Development / Debug logging
    console.log(`[ANALYTICS EVENT: ${eventName}]`, payload);

    fetch(ANALYTICS_CONFIG.trackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((error) => {
      // Swallowed silently so tracking failures never impact UI
      console.warn('Analytics tracking dispatch warning:', error?.message || error);
    });

    // Also dispatch to Google Tag if present
    trackGtagEvent(eventName, properties);

    return payload;
  } catch (error) {
    console.warn('Analytics tracking error:', error);
    return null;
  }
};

/**
 * Track page view or key action once to prevent duplicate triggers on rapid component re-renders
 */
export const trackPageEventOnce = (
  eventName: string,
  key: string,
  properties: Record<string, unknown> = {},
  context: AnalyticsContext = {}
): AnalyticsPayload | null => {
  try {
    const pageKey = `${eventName}:${key}`;

    if (PAGE_VIEW_KEYS.has(pageKey)) {
      return null;
    }

    PAGE_VIEW_KEYS.add(pageKey);
    return trackEvent(eventName, properties, context);
  } catch (error) {
    console.warn('Analytics page tracking error:', error);
    return null;
  }
};

/**
 * Safe helper to forward custom events to Google Tag Manager / gtag.js if available
 */
export const trackGtagEvent = (
  eventName: string,
  parameters: Record<string, unknown> = {}
) => {
  try {
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
      };
      if (typeof win.gtag === 'function') {
        win.gtag('event', eventName, parameters);
      }
    }
  } catch {
    // ignore
  }
};

/**
 * Helper to get unique history length key for router transitions
 */
export const getAnalyticsHistoryKey = (): string | number => {
  try {
    if (typeof window !== 'undefined') {
      return window.history.length;
    }
    return 'ssr';
  } catch {
    return 'unknown';
  }
};
