import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Icon from "../../components/common/Icon";
import api from "../../services/api";
import { Order } from "../../types";

export default function TrackOrder() {
  const location = useLocation();
  const [orderIdInput, setOrderIdInput] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const steps = ["Pending", "Processing", "Shipped", "Delivered"];

  const fetchOrder = async (id: string) => {
    const formattedId = id.startsWith("LX-") ? id : `LX-${id}`;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/orders/${formattedId}`);
      setOrder(response.data);
    } catch (err) {
      setError("Order not found. Please check the ID and try again.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const state = location.state as { orderId?: string };
    if (state?.orderId) {
      setOrderIdInput(state.orderId);
      fetchOrder(state.orderId);
    }
  }, [location.state]);

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    return steps.indexOf(order.status);
  };

  return (
    <div className="page-container" style={{ background: "var(--cream)" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          padding: "4rem 1.5rem",
          maxWidth: 800,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <section style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.5rem",
              marginBottom: "1rem",
            }}
          >
            Track Your Order
          </h1>
          <p style={{ color: "var(--stone)" }}>
            Enter your order number to see live status updates.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "2rem",
              justifyContent: "center",
            }}
          >
            <input
              className="lux-input"
              style={{ maxWidth: 300 }}
              placeholder="e.g. LX-3221"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={() => fetchOrder(orderIdInput)}
              disabled={loading}
            >
              {loading ? "Searching..." : "Track"}
            </button>
          </div>
          {error && (
            <p style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>
              {error}
            </p>
          )}
        </section>

        {order && (
          <div className="anim-fade-in">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4rem",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  left: "5%",
                  right: "5%",
                  height: "2px",
                  background: "var(--cream-muted)",
                  zIndex: 0,
                }}
              />
              {steps.map((step, idx) => {
                const isCompleted = idx <= getCurrentStepIndex();
                return (
                  <div
                    key={step}
                    style={{ zIndex: 1, textAlign: "center", flex: 1 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        margin: "0 auto 0.5rem",
                        background: isCompleted
                          ? "var(--charcoal)"
                          : "var(--cream-deep)",
                        color: isCompleted ? "white" : "var(--stone)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid white",
                      }}
                    >
                      {isCompleted ? <Icon name="check" size={16} /> : idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: isCompleted ? "var(--charcoal)" : "var(--stone)",
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: "2rem",
                border: "1px solid var(--cream-muted)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2rem",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--stone)",
                      textTransform: "uppercase",
                    }}
                  >
                    Current Status
                  </h3>
                  <p style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                    {order.status}
                  </p>
                </div>
                {order.tracking_number && (
                  <div style={{ textAlign: "right" }}>
                    <h3
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--stone)",
                        textTransform: "uppercase",
                      }}
                    >
                      Carrier: {order.carrier}
                    </h3>
                    <p style={{ fontSize: "1rem", fontWeight: 500 }}>
                      #{order.tracking_number}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
