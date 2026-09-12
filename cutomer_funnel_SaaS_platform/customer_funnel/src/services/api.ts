import type {
  AnalyticsOverview,
  EventListResponse,
  FunnelResponse,
  Project,
  ModularFunnelsResponse,
} from "../types";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "";

export const API_KEY =
  import.meta.env.VITE_ANALYTICS_API_KEY ??
  import.meta.env.VITE_API_KEY ??
  "pk_live_bcd39b8924457c7be39983e0117dd57f";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method ?? "GET";

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  console.log("JWT Token:", token);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  const text = await response.text();

  console.log("API Response:", {
    url,
    method,
    status: response.status,
    statusText: response.statusText,
    body: text,
  });

  if (!response.ok) {
    throw new Error(
      `API Error: ${response.status} ${response.statusText} - ${text}`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (parseError) {
    throw new Error(
      `Failed to parse JSON response from ${url}: ${parseError}`
    );
  }
}

export async function getProjects(): Promise<Project[]> {
  return request<Project[]>("/api/projects");
}

export async function getOverview(
  projectId: number,
  days: number = 30
): Promise<AnalyticsOverview> {
  return request<AnalyticsOverview>(
 `/api/analytics/overview?project_id=${projectId}&days=${days}`
  );
}

export async function getFunnel(
  projectId: number,
  days: number = 30
): Promise<FunnelResponse> {
  return request<FunnelResponse>(
    `/api/analytics/funnel?project_id=${projectId}&days=${days}`
  );
}

export async function getModularFunnels(
  projectId: number
): Promise<ModularFunnelsResponse> {
  return request<ModularFunnelsResponse>(
    `/api/analytics/modular-funnels?project_id=${projectId}`
  );
}

export async function getEvents(params: {
  projectId: number;
  days?: number;
  page?: number;
  pageSize?: number;
  eventName?: string;
}): Promise<EventListResponse> {
  const search = new URLSearchParams();

  search.set("project_id", String(params.projectId));
  search.set("days", String(params.days ?? 30));
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 10));

  if (params.eventName) {
    search.set("event_name", params.eventName);
  }

  return request<EventListResponse>(
    `/api/events?${search.toString()}`
  );
}

export async function trackEvent(payload: {
  user_id?: string | null;
  anonymous_id?: string | null;
  event_name: string;
  properties?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") {
    throw new Error("trackEvent can only run in the browser");
  }

  if (!API_KEY) {
    throw new Error(
      "Missing analytics API key. Set VITE_ANALYTICS_API_KEY or VITE_API_KEY."
    );
  }

  const storedAnonymousId =
    window.localStorage.getItem("analytics_anonymous_id");

  const anonymousId =
    payload.anonymous_id ??
    storedAnonymousId ??
    `anon-${crypto.randomUUID()}`;

  if (!storedAnonymousId) {
    window.localStorage.setItem(
      "analytics_anonymous_id",
      anonymousId
    );
  }

  const eventName = payload.event_name.trim();

  const payloadWithKey = {
    api_key: API_KEY,
    user_id: payload.user_id ?? null,
    anonymous_id: anonymousId,
    event_name: eventName,
    properties: payload.properties ?? {},
  };

  try {
    const url = `${API_BASE_URL}/api/events/track`;

    console.log("Track event request:", {
      url,
      payload: payloadWithKey,
      apiKey: API_KEY,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadWithKey),
    });

    if (!response.ok) {
      throw new Error(
        `Tracking failed with status ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Tracking event failed:", error);
    throw error;
  }
}