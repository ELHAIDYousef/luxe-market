import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";
import Icon from "../../components/common/Icon";
import api from "../../services/api";
import type { Order } from "../../types";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();

  const orderData = location.state as {
    orderId?: string;
    total?: number;
  } | null;
  const orderId = orderData?.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      api
        .get(`/orders/${orderId}`)
        .then((res) => setOrder(res.data))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // Clear cart immediately on successful landing
    clearCart();
  }, [orderId, clearCart]);

  const total = order?.total ?? orderData?.total ?? 0;

  const handleDownloadReceipt = async () => {
    const element = document.getElementById("receipt-content");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FAF9F6",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LuxeMarket-Receipt-${orderId || "Order"}.pdf`);
    } catch (error) {
      console.error("Receipt generation failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ background: "var(--cream)" }}>
        <Navbar />
        <main
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
            Finalizing your experience...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ background: "var(--cream)" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "4rem 1.5rem",
        }}
      >
        <div
          id="receipt-content"
          style={{
            maxWidth: 850,
            width: "100%",
            padding: "40px",
            background: "var(--cream)",
          }}
        >
          {/* Hero Header */}
          <div
            style={{ textAlign: "center", marginBottom: "4rem" }}
            className="anim-fade-in"
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "var(--ink)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.5rem",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <Icon name="check" size={40} color="#fff" />
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 300,
                color: "var(--ink)",
                marginBottom: "0.5rem",
              }}
            >
              Your order is confirmed
            </h1>
            <p
              style={{
                color: "var(--slate-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              Order Reference: {orderId || "Pending"}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2.5rem",
              alignItems: "start",
            }}
            className="anim-fade-in anim-delay-1"
          >
            {/* Left: Summary */}
            <div
              style={{
                background: "#fff",
                borderRadius: "24px",
                padding: "2.5rem",
                border: "1px solid rgba(229,225,216,0.6)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  marginBottom: "2rem",
                  color: "var(--ink)",
                }}
              >
                Order Summary
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {(order?.items || []).map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        background: "var(--cream-deep)",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0]}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {item.product?.name}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--slate-muted)",
                        }}
                      >
                        Qty: {item.quantity} •{" "}
                        {item.selected_finish || "Standard"}
                      </p>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      ${((item.unit_price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "2.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid var(--cream-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    color: "var(--slate-muted)",
                  }}
                >
                  <span>Shipping</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                    {order?.delivery_method === "whiteglove"
                      ? "$150.00"
                      : "Free"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Total Paid
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "1.75rem",
                      color: "var(--ink)",
                    }}
                  >
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Logistics */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Shipping Address */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "2rem",
                  border: "1px solid rgba(229,225,216,0.6)",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--slate-muted)",
                    marginBottom: "1.25rem",
                  }}
                >
                  Shipping To
                </h3>
                {order ? (
                  <div
                    style={{
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      color: "var(--ink)",
                    }}
                  >
                    <p style={{ fontWeight: 600 }}>
                      {order.shipping_first_name} {order.shipping_last_name}
                    </p>
                    <p>{order.shipping_address}</p>
                    <p>
                      {order.shipping_city}, {order.shipping_zip}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontStyle: "italic", fontSize: "0.85rem" }}>
                    Details available in your confirmation email.
                  </p>
                )}
              </div>

              {/* Delivery Estimate */}
              <div
                style={{
                  background: "var(--cream-deep)",
                  borderRadius: "24px",
                  padding: "2rem",
                  border: "1px solid rgba(20,75,184,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                  }}
                >
                  <Icon
                    name="local_shipping"
                    size={20}
                    color="var(--accent-navy)"
                  />
                  <h3
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      color: "var(--accent-navy)",
                    }}
                  >
                    Delivery Details
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {order?.estimated_delivery || "Calculating estimate..."}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--slate-muted)" }}>
                  Method:{" "}
                  {order?.delivery_method === "whiteglove"
                    ? "White Glove Placement"
                    : "Standard Delivery"}
                </p>
              </div>

              {/* Tracking CTA */}
              <Link to="/track-order" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "var(--ink)",
                    color: "#fff",
                    padding: "1.25rem 1.5rem",
                    borderRadius: "16px",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <Icon name="map" size={20} />
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      Track Order Status
                    </span>
                  </div>
                  <Icon name="chevron_right" size={18} />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{ display: "flex", gap: "1rem", marginTop: "4rem" }}
          className="anim-fade-in anim-delay-2"
        >
          <button
            onClick={() => navigate("/")}
            className="btn-outline"
            style={{ borderRadius: 9999, padding: "1rem 2rem" }}
          >
            Continue Shopping
          </button>
          <button
            onClick={handleDownloadReceipt}
            className="btn-primary"
            style={{
              borderRadius: 9999,
              padding: "1rem 2rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Icon name="download" size={18} /> Download Receipt
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
