import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import Icon from "../../components/common/Icon";
import api from "../../services/api";

// ── Types ──────────────────────────────────────────────────────────────────
interface KPI {
  label: string;
  value: string;
  raw_value: number;
  change_pct: number;
  trend: string;
  icon: string;
  description: string;
}
interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  change_pct?: number;
}
interface Funnel {
  stages: FunnelStage[];
  abandonment_rate: number;
  conversion_rate: number;
  view_to_cart_rate: number;
}
interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}
interface Revenue {
  daily: RevenuePoint[];
  total: number;
  avg_order: number;
  prev_total: number;
}
interface TopProduct {
  product_id: number;
  name: string;
  category: string;
  image?: string;
  views: number;
  cart_adds: number;
  purchases: number;
  revenue: number;
  conv_rate: number;
}
interface Channel {
  name: string;
  percentage: number;
  icon: string;
  color: string;
  sessions: number;
}
interface HourlyBucket {
  hour: number;
  views: number;
  carts: number;
}
interface AIInsight {
  title: string;
  body: string;
  type: string;
  priority: string;
}
interface Dashboard {
  period_label: string;
  generated_at: string;
  kpis: KPI[];
  funnel: Funnel;
  revenue: Revenue;
  top_products: TopProduct[];
  channels: Channel[];
  hourly: HourlyBucket[];
  ai_insights: AIInsight[];
  total_sessions: number;
  unique_products_viewed: number;
  repeat_purchase_rate: number;
}

// ── Colour helpers ─────────────────────────────────────────────────────────
const TREND_UP = "#10B981";
const TREND_DOWN = "#EF4444";
const NEUTRAL = "#94A3B8";

const insightColors: Record<
  string,
  { bg: string; border: string; badge: string; badgeText: string }
> = {
  opportunity: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    badge: "#DBEAFE",
    badgeText: "#1D4ED8",
  },
  warning: {
    bg: "#FEF2F2",
    border: "#FECACA",
    badge: "#FEE2E2",
    badgeText: "#991B1B",
  },
  achievement: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    badge: "#DCFCE7",
    badgeText: "#166534",
  },
};

const priorityDot: Record<string, string> = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#6B7280",
};

// ── Sub-components ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 120,
            borderRadius: 12,
            background:
              "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />
      ))}
    </div>
  );
}

function KPIGrid({ kpis }: { kpis: KPI[] }) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
      }}
    >
      {kpis.map((k, i) => {
        const isUp = k.trend === "up";
        const isDown = k.trend === "down";
        const changeColor = isUp ? TREND_UP : isDown ? TREND_DOWN : NEUTRAL;
        const changePrefix = k.change_pct > 0 ? "+" : "";
        return (
          <div
            key={k.label}
            className={`stat-card anim-fade-in anim-delay-${(i % 4) + 1}`}
            style={{ position: "relative", cursor: "default" }}
            onMouseEnter={() => setTooltip(k.label)}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Tooltip */}
            {tooltip === k.label && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1E293B",
                  color: "#fff",
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  fontSize: "0.72rem",
                  lineHeight: 1.5,
                  whiteSpace: "nowrap",
                  zIndex: 100,
                  pointerEvents: "none",
                  maxWidth: 240,
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                }}
              >
                {k.description}
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              {/* Added stat-label class here */}
              <p className="stat-label">{k.label}</p>
              <div style={{ opacity: 0.3 }}>
                <Icon name={k.icon} size={20} color="var(--admin-primary)" />
              </div>
            </div>
            {/* Added stat-value class here and removed direct weight/letterspacing */}
            <h3
              className="stat-value"
              style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}
            >
              {k.value}
            </h3>
            {k.change_pct !== 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: changeColor,
                }}
              >
                <Icon
                  name={isUp ? "trending_up" : "trending_up"}
                  size={13}
                  style={{ transform: isDown ? "scaleY(-1)" : undefined }}
                />
                {changePrefix}
                {k.change_pct.toFixed(1)}% vs prev period
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FunnelChart({ funnel }: { funnel: Funnel }) {
  const maxCount = funnel.stages[0]?.count || 1;
  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 700,
            }}
          >
            AIDA Conversion Funnel
          </h3>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--admin-muted)",
              marginTop: "0.2rem",
            }}
          >
            Awareness → Interest → Desire → Action
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            fontSize: "0.68rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: "#2b8cee",
              }}
            />
            <span style={{ color: "var(--admin-muted)" }}>Stage Volume</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: "#ff00e5",
              }}
            />
            <span style={{ color: "var(--admin-muted)" }}>Converted</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {funnel.stages.map((stage, i) => {
          const width = (stage.count / maxCount) * 100;
          const dropOff =
            i > 0
              ? Math.round((1 - stage.count / funnel.stages[i - 1].count) * 100)
              : null;
          return (
            <div key={stage.stage}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.4rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: `${stage.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color: stage.color,
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--admin-text)",
                    }}
                  >
                    {stage.label}
                  </span>
                  {dropOff !== null && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: "#FEF2F2",
                        color: "#EF4444",
                        padding: "0.1rem 0.5rem",
                        borderRadius: 9999,
                        fontWeight: 700,
                      }}
                    >
                      −{dropOff}% drop-off
                    </span>
                  )}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  {stage.change_pct !== undefined && stage.change_pct !== 0 && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: stage.change_pct >= 0 ? TREND_UP : TREND_DOWN,
                      }}
                    >
                      {stage.change_pct >= 0 ? "+" : ""}
                      {stage.change_pct.toFixed(1)}%
                    </span>
                  )}
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "0.925rem",
                        fontWeight: 800,
                        color: "var(--admin-text)",
                      }}
                    >
                      {stage.count.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--admin-muted)",
                        marginLeft: "0.35rem",
                      }}
                    >
                      ({stage.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  height: 36,
                  background: "#F1F5F9",
                  borderRadius: 6,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${width}%`,
                    background: stage.color,
                    borderRadius: 6,
                    transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                    minWidth: width > 0 ? 4 : 0,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary pills */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginTop: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        {[
          {
            label: "Conversion Rate",
            value: `${funnel.conversion_rate.toFixed(1)}%`,
            ok: funnel.conversion_rate >= 2,
          },
          {
            label: "Cart Abandonment",
            value: `${funnel.abandonment_rate.toFixed(1)}%`,
            ok: funnel.abandonment_rate <= 65,
          },
          {
            label: "View → Cart",
            value: `${funnel.view_to_cart_rate.toFixed(1)}%`,
            ok: funnel.view_to_cart_rate >= 20,
          },
        ].map((pill) => (
          <div
            key={pill.label}
            style={{
              padding: "0.4rem 0.9rem",
              background: pill.ok ? "#F0FDF4" : "#FEF2F2",
              border: `1px solid ${pill.ok ? "#BBF7D0" : "#FECACA"}`,
              borderRadius: 9999,
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--admin-muted)",
              }}
            >
              {pill.label}
            </span>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                color: pill.ok ? "#166534" : "#991B1B",
              }}
            >
              {pill.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueChart({ revenue }: { revenue: Revenue }) {
  if (!revenue?.daily?.length) return null;

  const maxRev = Math.max(...revenue.daily.map((d) => d.revenue), 1);
  const changePct =
    revenue.prev_total > 0
      ? (
          ((revenue.total - revenue.prev_total) / revenue.prev_total) *
          100
        ).toFixed(1)
      : "0";
  const isUp = Number(changePct) >= 0;

  // Show last 30 data points
  const points = revenue.daily.slice(-30);

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 700,
            }}
          >
            Revenue Over Time
          </h3>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--admin-muted)",
              marginTop: "0.2rem",
            }}
          >
            Daily revenue — last 30 days
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--admin-text)",
            }}
          >
            $
            {revenue.total.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: isUp ? TREND_UP : TREND_DOWN,
            }}
          >
            {isUp ? "+" : ""}
            {changePct}% vs prev period
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 100,
          paddingBottom: 4,
        }}
      >
        {points.map((pt, i) => {
          const h =
            maxRev > 0
              ? Math.max((pt.revenue / maxRev) * 100, pt.revenue > 0 ? 4 : 0)
              : 0;
          return (
            <div
              key={i}
              title={`${pt.date}: $${pt.revenue.toFixed(0)}`}
              style={{
                flex: 1,
                height: `${h}%`,
                background: pt.revenue > 0 ? "var(--admin-primary)" : "#E2E8F0",
                borderRadius: "3px 3px 0 0",
                minHeight: pt.revenue > 0 ? 4 : 2,
                opacity: 0.85,
                cursor: "default",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
            />
          );
        })}
      </div>
      {/* X-axis labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.5rem",
        }}
      >
        {[0, 7, 14, 21, 29].map((idx) => (
          <span
            key={idx}
            style={{ fontSize: "0.6rem", color: "var(--admin-muted)" }}
          >
            {points[idx]?.date?.slice(5) ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function TopProductsTable({ products }: { products: TopProduct[] }) {
  if (!products.length) return null;
  return (
    <div className="card-section">
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--admin-border)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.15rem",
            fontWeight: 700,
          }}
        >
          Top Products by Revenue
        </h3>
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--admin-muted)",
            marginTop: "0.2rem",
          }}
        >
          Ranked by revenue — current period
        </p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {[
                "Product",
                "Category",
                "Views",
                "Cart Adds",
                "Purchases",
                "Conv. Rate",
                "Revenue",
              ].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i >= 2 ? "right" : "left",
                    paddingLeft: i === 0 ? "1.5rem" : "1rem",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={p.product_id}>
                <td style={{ paddingLeft: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background:
                          idx < 3 ? "var(--admin-primary)" : "#F1F5F9",
                        color: idx < 3 ? "#fff" : "var(--admin-muted)",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 6,
                          objectFit: "cover",
                          border: "1px solid var(--admin-border)",
                        }}
                      />
                    )}
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {p.name}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: 9999,
                      background: "#F1F5F9",
                      color: "var(--admin-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {p.category}
                  </span>
                </td>
                <td style={{ textAlign: "right", fontSize: "0.875rem" }}>
                  {p.views.toLocaleString()}
                </td>
                <td style={{ textAlign: "right", fontSize: "0.875rem" }}>
                  {p.cart_adds.toLocaleString()}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {p.purchases.toLocaleString()}
                </td>
                <td style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color:
                        p.conv_rate >= 2
                          ? TREND_UP
                          : p.conv_rate >= 1
                            ? "#F59E0B"
                            : TREND_DOWN,
                    }}
                  >
                    {p.conv_rate.toFixed(1)}%
                  </span>
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: "0.925rem",
                  }}
                >
                  $
                  {p.revenue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HourlyHeatmap({ hourly }: { hourly: HourlyBucket[] }) {
  const maxViews = Math.max(...hourly.map((h) => h.views), 1);
  const peakHour = hourly.reduce(
    (max, h) => (h.views > max.views ? h : max),
    hourly[0],
  );
  const fmt = (h: number) =>
    h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;

  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 700,
            }}
          >
            Peak Shopping Hours
          </h3>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--admin-muted)",
              marginTop: "0.2rem",
            }}
          >
            When your customers are most active
          </p>
        </div>
        {peakHour && (
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--admin-muted)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Peak hour
            </p>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--admin-primary)",
              }}
            >
              {fmt(peakHour.hour)}
            </p>
          </div>
        )}
      </div>
      <div
        style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 72 }}
      >
        {hourly.map((h) => {
          const pct = (h.views / maxViews) * 100;
          const isNight = h.hour < 7 || h.hour >= 22;
          return (
            <div
              key={h.hour}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
              title={`${fmt(h.hour)}: ${h.views} views, ${h.carts} cart adds`}
            >
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(pct, h.views > 0 ? 4 : 1)}%`,
                  background: isNight
                    ? "#E2E8F0"
                    : `rgba(43,140,238,${0.15 + (pct / 100) * 0.85})`,
                  borderRadius: "3px 3px 0 0",
                  transition: "height 0.8s ease",
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.4rem",
        }}
      >
        {[0, 6, 12, 18, 23].map((h) => (
          <span
            key={h}
            style={{ fontSize: "0.6rem", color: "var(--admin-muted)" }}
          >
            {fmt(h)}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChannelsPanel({ channels }: { channels: Channel[] }) {
  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.15rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
        }}
      >
        Traffic Channels
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {channels.map((ch) => (
          <div key={ch.name}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.45rem",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${ch.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: ch.color,
                }}
              >
                <Icon name={ch.icon} size={16} />
              </div>
              <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600 }}>
                {ch.name}
              </span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.925rem", fontWeight: 800 }}>
                  {ch.percentage}%
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--admin-muted)",
                    display: "block",
                  }}
                >
                  {ch.sessions.toLocaleString()} sessions
                </span>
              </div>
            </div>
            <div
              style={{
                height: 6,
                background: "#F1F5F9",
                borderRadius: 9999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${ch.percentage}%`,
                  background: ch.color,
                  borderRadius: 9999,
                  transition: "width 1s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightsPanel({ insights }: { insights: AIInsight[] }) {
  if (!insights.length) return null;
  return (
    <div className="card" style={{ padding: "1.75rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="analytics" size={18} color="#fff" />
        </div>
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontWeight: 700,
            }}
          >
            AI-Generated Insights
          </h3>
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--admin-muted)",
              marginTop: "0.1rem",
            }}
          >
            Powered by Claude — based on your live KPI data
          </p>
        </div>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
      >
        {insights.map((insight, i) => {
          const c = insightColors[insight.type] ?? insightColors.opportunity;
          return (
            <div
              key={i}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                padding: "1rem 1.1rem",
                display: "flex",
                gap: "0.875rem",
              }}
            >
              <div
                style={{
                  width: 6,
                  borderRadius: 9999,
                  background: priorityDot[insight.priority] ?? "#6B7280",
                  flexShrink: 0,
                  alignSelf: "stretch",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.3rem",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: "#1E293B",
                    }}
                  >
                    {insight.title}
                  </p>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      padding: "0.1rem 0.45rem",
                      borderRadius: 9999,
                      background: c.badge,
                      color: c.badgeText,
                    }}
                  >
                    {insight.type}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  {insight.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function MarketingAnalytics() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/analytics/dashboard?days=${d}`);
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDays(Number(e.target.value));
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activeTab="overview" onTabChange={() => {}} />
      <div className="admin-main">
        {/* Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "rgba(246,247,248,0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid var(--admin-border)",
            padding: "0.875rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="analytics" size={18} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--admin-text)",
                }}
              >
                Marketing Analytics
              </h1>
              {data && (
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--admin-muted)",
                    marginTop: "0.05rem",
                  }}
                >
                  {data.period_label} · Updated{" "}
                  {new Date(data.generated_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            <select
              value={days}
              onChange={handleDaysChange}
              style={{
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--admin-border)",
                background: "#fff",
                fontSize: "0.825rem",
                padding: "0 0.75rem",
                fontFamily: "var(--font-body)",
                color: "var(--admin-text)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={365}>Last Year</option>
            </select>
            <button className="btn-admin-ghost" onClick={() => load(days)}>
              <Icon name="download" size={15} />
              Refresh
            </button>
          </div>
        </header>

        {/* Body */}
        <div
          style={{
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Error */}
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <Icon name="warning" size={20} color="#EF4444" />
              <p style={{ fontSize: "0.875rem", color: "#991B1B" }}>{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && !data && <LoadingSkeleton />}

          {data && !loading && (
            <>
              {/* Summary strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: "1rem",
                }}
              >
                {[
                  {
                    label: "Total Sessions",
                    value: data.total_sessions.toLocaleString(),
                    icon: "group",
                  },
                  {
                    label: "Products Browsed",
                    value: data.unique_products_viewed.toLocaleString(),
                    icon: "search",
                  },
                  {
                    label: "Repeat Purchase Rate",
                    value: `${data.repeat_purchase_rate.toFixed(1)}%`,
                    icon: "verified_user",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="stat-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem 1.25rem",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(43,140,238,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        name={s.icon}
                        size={20}
                        color="var(--admin-primary)"
                      />
                    </div>
                    <div>
                      {/* Added stat-label class here */}
                      <p
                        className="stat-label"
                        style={{ letterSpacing: "0.08em" }}
                      >
                        {s.label}
                      </p>
                      {/* Added stat-value class here and removed redundant letterspacing */}
                      <p className="stat-value" style={{ fontSize: "1.35rem" }}>
                        {s.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* KPI grid — all 12 metrics */}
              <KPIGrid kpis={data.kpis} />

              {/* Funnel + Revenue */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                }}
              >
                <FunnelChart funnel={data.funnel} />
                <RevenueChart revenue={data.revenue} />
              </div>

              {/* AI Insights */}
              <AIInsightsPanel insights={data.ai_insights} />

              {/* Top Products */}
              <TopProductsTable products={data.top_products} />

              {/* Channels + Hourly heatmap */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                }}
              >
                <ChannelsPanel channels={data.channels} />
                <HourlyHeatmap hourly={data.hourly} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
