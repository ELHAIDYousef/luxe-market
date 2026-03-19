"""
Analytics schemas.

The dashboard response is the richest payload in the system.
Every field is computed from real data in analytics_events + orders.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── Event ingestion ───────────────────────────────────────────────────────────

class AnalyticsEventCreate(BaseModel):
    event_type: str          # VIEW | ADD_TO_CART | PURCHASE
    product_id: int
    session_id: str
    user_id:    Optional[int] = None


class AnalyticsEventOut(AnalyticsEventCreate):
    id:         int
    created_at: datetime
    model_config = {"from_attributes": True}


# ── AIDA Funnel ───────────────────────────────────────────────────────────────

class FunnelStage(BaseModel):
    stage:      str
    label:      str
    count:      int
    percentage: float
    color:      str
    change_pct: Optional[float] = None   # vs previous period


class FunnelOut(BaseModel):
    stages:           list[FunnelStage]
    abandonment_rate: float   # (ADD_TO_CART - PURCHASE) / ADD_TO_CART × 100
    conversion_rate:  float   # PURCHASE / VIEW × 100
    view_to_cart_rate: float  # ADD_TO_CART / VIEW × 100


# ── KPI Cards ─────────────────────────────────────────────────────────────────

class KPICard(BaseModel):
    label:        str
    value:        str          # formatted string e.g. "$12,430"
    raw_value:    float        # numeric for charts
    change_pct:   float        # % change vs previous period
    trend:        str          # "up" | "down" | "neutral"
    icon:         str          # icon name
    description:  str          # tooltip / explanation


# ── Revenue ───────────────────────────────────────────────────────────────────

class RevenuePoint(BaseModel):
    date:    str
    revenue: float
    orders:  int


class RevenueOut(BaseModel):
    daily:       list[RevenuePoint]   # last 30 days
    total:       float
    avg_order:   float
    prev_total:  float                # same period before (for % change)


# ── Products ──────────────────────────────────────────────────────────────────

class TopProduct(BaseModel):
    product_id:   int
    name:         str
    category:     str
    image:        Optional[str]
    views:        int
    cart_adds:    int
    purchases:    int
    revenue:      float
    conv_rate:    float   # purchases / views × 100


# ── Channels ──────────────────────────────────────────────────────────────────

class ChannelData(BaseModel):
    name:       str
    percentage: int
    icon:       str
    color:      str
    sessions:   int


# ── Cohort / Retention ────────────────────────────────────────────────────────

class CohortRow(BaseModel):
    cohort:       str          # e.g. "Week 1"
    total_users:  int
    week_1:       Optional[float] = None
    week_2:       Optional[float] = None
    week_3:       Optional[float] = None
    week_4:       Optional[float] = None


# ── Hourly activity ───────────────────────────────────────────────────────────

class HourlyBucket(BaseModel):
    hour:    int    # 0–23
    views:   int
    carts:   int


# ── AI Insight ────────────────────────────────────────────────────────────────

class AIInsight(BaseModel):
    title:       str
    body:        str
    type:        str   # "opportunity" | "warning" | "achievement"
    priority:    str   # "high" | "medium" | "low"


# ── Full dashboard ────────────────────────────────────────────────────────────

class AnalyticsDashboardOut(BaseModel):
    # Period info
    period_label:   str
    generated_at:   datetime

    # KPI cards (15 metrics)
    kpis:           list[KPICard]

    # AIDA funnel
    funnel:         FunnelOut

    # Revenue time-series
    revenue:        RevenueOut

    # Top 8 products by revenue
    top_products:   list[TopProduct]

    # Traffic channels (mock — no UTM tracking yet)
    channels:       list[ChannelData]

    # Activity heatmap
    hourly:         list[HourlyBucket]

    # AI-generated insights (3–5 items)
    ai_insights:    list[AIInsight]

    # Summary numbers for quick stats
    total_sessions:     int
    unique_products_viewed: int
    repeat_purchase_rate:   float
