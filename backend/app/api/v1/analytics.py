"""
Analytics API endpoints.

POST /analytics/events      — log a funnel event (public, no auth required)
GET  /analytics/dashboard   — full dashboard with all KPIs (super_admin only)
GET  /analytics/funnel      — AIDA funnel only (admin+)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_admin, get_current_super_admin
from app.schemas.analytics import (
    AnalyticsEventCreate,
    AnalyticsEventOut,
    AnalyticsDashboardOut,
    FunnelOut,
)
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/events", response_model=AnalyticsEventOut)
def log_event(payload: AnalyticsEventCreate, db: Session = Depends(get_db)):
    """
    Log a funnel event.
    Called by the frontend on product page views, cart adds, and purchases.
    No authentication required — anonymous users tracked by session_id.
    """
    return analytics_service.log_event(db, payload)


@router.get(
    "/funnel",
    response_model=FunnelOut,
    dependencies=[Depends(get_current_admin)],
)
def get_funnel(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """AIDA funnel breakdown. Available to all admin roles."""
    return analytics_service.get_funnel(db, days=days)


@router.get(
    "/dashboard",
    response_model=AnalyticsDashboardOut,
    dependencies=[Depends(get_current_super_admin)],
)
def get_dashboard(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    Full marketing analytics dashboard.
    Includes all KPIs, AIDA funnel, revenue time-series, top products,
    hourly heatmap, and AI-generated insights.
    Super Admin only.
    """
    return analytics_service.get_dashboard(db, days=days)
