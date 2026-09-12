from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.event import _format_datetime_for_json


class FunnelResponse(BaseModel):
    login: int
    product_view: int
    add_to_cart: int
    checkout_started: int
    purchase: int


class RecentEvent(BaseModel):
    model_config = ConfigDict(
        json_encoders={datetime: _format_datetime_for_json}
    )

    id: int
    user_id: str | None
    anonymous_id: str | None
    event_name: str
    created_at: datetime
    properties: dict = {}


class AnalyticsOverview(BaseModel):
    model_config = ConfigDict(
        json_encoders={datetime: _format_datetime_for_json}
    )

    total_events: int
    unique_users: int
    purchases: int
    funnel: dict[str, int]
    recent_events: list[RecentEvent] = []


class ModularFunnelStage(BaseModel):
    event_name: str
    count: int
    unique_users: int


class ModularFunnelKPIs(BaseModel):
    total_events: int
    unique_users: int
    conversion_rate: float
    lost_users: int


class ModularFunnelData(BaseModel):
    name: str
    stages: list[ModularFunnelStage]
    kpis: ModularFunnelKPIs


class ModularFunnelsResponse(BaseModel):
    authentication: ModularFunnelData
    discovery: ModularFunnelData
    cart: ModularFunnelData
    checkout: ModularFunnelData
    orders: ModularFunnelData