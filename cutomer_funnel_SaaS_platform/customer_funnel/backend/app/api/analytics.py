from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.auth_user import AuthUser

from app.schemas.analytics import (
    AnalyticsOverview,
    FunnelResponse,
    ModularFunnelsResponse,
)

from app.services.funnel_service import FunnelService

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"]
)


@router.get("/funnel", response_model=FunnelResponse)
def get_funnel(
    project_id: int,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FunnelResponse:
    service = FunnelService(db)
    return FunnelResponse(
        **service.get_funnel_counts(project_id=project_id)
    )


@router.get("/overview", response_model=AnalyticsOverview)
def get_overview(
    project_id: int,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsOverview:
    service = FunnelService(db)
    return AnalyticsOverview(
        **service.get_overview(project_id=project_id)
    )


@router.get("/modular-funnels", response_model=ModularFunnelsResponse)
def get_modular_funnels(
    project_id: int,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ModularFunnelsResponse:
    service = FunnelService(db)
    return ModularFunnelsResponse(
        **service.get_modular_funnels(project_id=project_id)
    )