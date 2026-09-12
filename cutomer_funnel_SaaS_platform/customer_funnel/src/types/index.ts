export interface EventItem {
  id: number;
  user_id: string | null;
  anonymous_id: string | null;
  event_name: string;
  properties: Record<string, unknown>;
  created_at: string;
  event_count?: number;
  last_activity?: string;
}

export interface EventListResponse {
  data: EventItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface FunnelResponse {
  login: number;
  product_view: number;
  add_to_cart: number;
  checkout_started: number;
  purchase: number;
}

export interface AnalyticsOverview {
  total_events: number;
  unique_users: number;
  purchases: number;
  funnel: FunnelResponse;
  recent_events: Array<{
    id: number;
    user_id: string | null;
    anonymous_id: string | null;
    event_name: string;
    created_at: string;
    properties?: Record<string, any>;
  }>;
}

export interface Project {
  id: number;
  name: string;
  api_key: string;
  created_at: string;
}

export interface ModularFunnelStage {
  event_name: string;
  count: number;
  unique_users: number;
}

export interface ModularFunnelKPIs {
  total_events: number;
  unique_users: number;
  conversion_rate: number;
  lost_users: number;
}

export interface ModularFunnelData {
  name: string;
  stages: ModularFunnelStage[];
  kpis: ModularFunnelKPIs;
}

export interface ModularFunnelsResponse {
  authentication: ModularFunnelData;
  discovery: ModularFunnelData;
  cart: ModularFunnelData;
  checkout: ModularFunnelData;
  orders: ModularFunnelData;
}

