import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../components/common/Toast";
import Icon from "../../components/common/Icon";
import { useAnalytics } from "../../hooks/useAnalytics";
import api from "../../services/api";

export default function Checkout() {
  const navigate = useNavigate();
  const { show: toast } = useToast();
  const { items, subtotal, tax, clearCart } = useCart();
  const { trackPurchase } = useAnalytics();

  const [delivery, setDelivery] = useState<"standard" | "whiteglove">(
    "standard",
  );
  const [payMethod, setPayMethod] = useState<"card" | "pay">("card");

  // Shipping form state
  const [shipping, setShipping] = useState({
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    zip_code: "",
  });

  // Payment form state
  const [cardInfo, setCardInfo] = useState({
    number: "",
    expiry: "",
    cvv: "",
  });

  const shippingCost = delivery === "whiteglove" ? 150 : 0;
  const total = subtotal + tax + shippingCost;

  // Generic handlers for state updates
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    // Basic Validation
    const isShippingValid = Object.values(shipping).every(
      (val) => val.trim() !== "",
    );
    if (!isShippingValid) {
      toast("Please complete all shipping information", "error");
      return;
    }

    try {
      const payload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          selected_finish: item.selectedFinish,
        })),
        shipping,
        delivery_method: delivery,
        payment_method: payMethod,
        // In a real app, you'd send a payment token here, not raw card data
      };

      const response = await api.post("/orders", payload);
      const order = response.data;

      // Fire PURCHASE events
      items.forEach((item) => trackPurchase(item.product.id));

      clearCart();
      toast("Order placed successfully!", "success");

      navigate("/order-confirmation", {
        state: {
          orderId: order.id,
          total: order.total,
        },
      });
    } catch (error: any) {
      console.error("Failed to place order:", error);
      toast(
        error?.response?.data?.detail ??
          "Failed to place order. Please try again.",
        "error",
      );
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <main
        style={{ maxWidth: 1280, margin: "0 auto", padding: "3rem 1.5rem" }}
      >
        {/* Breadcrumb omitted for brevity */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "7fr 5fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "3rem" }}
            className="anim-fade-in"
          >
            {/* Shipping Information */}
            <section>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: "1.5rem",
                }}
              >
                Shipping Information
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                {[
                  ["First Name", "first_name", "col-span-1"],
                  ["Last Name", "last_name", "col-span-1"],
                  ["Address", "address", "col-span-2"],
                  ["City", "city", "col-span-1"],
                  ["Zip Code", "zip_code", "col-span-1"],
                ].map(([label, key, span]) => (
                  <div
                    key={key}
                    style={{
                      gridColumn: span === "col-span-2" ? "span 2" : "span 1",
                    }}
                  >
                    <label className="lux-label">{label}</label>
                    <input
                      name={key}
                      value={(shipping as any)[key]}
                      onChange={handleShippingChange}
                      className="lux-input"
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Delivery Method */}
            <section>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: "1.5rem",
                }}
              >
                Delivery Method
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {[
                  {
                    id: "standard",
                    label: "Standard Delivery",
                    desc: "5–7 business days",
                    price: "Free",
                  },
                  {
                    id: "whiteglove",
                    label: "White Glove Delivery",
                    desc: "Assembly & room placement",
                    price: "$150.00",
                    icon: "wash",
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1.25rem",
                      background: "#fff",
                      border: `1px solid ${delivery === opt.id ? "var(--ink)" : "var(--stone)"}`,
                      borderRadius: 12,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <input
                        type="radio"
                        checked={delivery === opt.id}
                        onChange={() => setDelivery(opt.id as any)}
                        style={{
                          accentColor: "var(--ink)",
                          width: 18,
                          height: 18,
                        }}
                      />
                      <div>
                        <p style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                          {opt.label}
                        </p>
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--slate-muted)",
                            fontStyle: "italic",
                          }}
                        >
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {opt.price}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: "1.5rem",
                }}
              >
                Payment Method
              </h2>
              <div
                style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}
              >
                {[
                  { id: "card", label: "Credit Card", icon: "credit_card" },
                  { id: "pay", label: "Apple Pay", icon: "payment" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPayMethod(opt.id as any)}
                    style={{
                      flex: 1,
                      padding: "1rem 1.5rem",
                      border: `1px solid ${payMethod === opt.id ? "var(--ink)" : "var(--stone)"}`,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      fontWeight: 500,
                      background:
                        payMethod === opt.id ? "var(--cream-dark)" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name={opt.icon} size={20} /> {opt.label}
                  </button>
                ))}
              </div>

              {payMethod === "card" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label className="lux-label">Card Number</label>
                    <input
                      name="number"
                      value={cardInfo.number}
                      onChange={handleCardChange}
                      className="lux-input"
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <label className="lux-label">Expiration (MM/YY)</label>
                      <input
                        name="expiry"
                        value={cardInfo.expiry}
                        onChange={handleCardChange}
                        className="lux-input"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="lux-label">CVV</label>
                      <input
                        name="cvv"
                        value={cardInfo.cvv}
                        onChange={handleCardChange}
                        className="lux-input"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Footer Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--stone)",
                paddingTop: "2rem",
              }}
            >
              <button
                onClick={() => navigate("/cart")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 500,
                  opacity: 0.6,
                }}
              >
                <Icon name="arrow_back" size={18} /> Return to cart
              </button>
              <button
                onClick={handlePlaceOrder}
                className="btn-primary"
                style={{
                  borderRadius: 9999,
                  padding: "1.25rem 2.5rem",
                  fontSize: "0.75rem",
                }}
              >
                Place Order
              </button>
            </div>
          </div>

          {/* Order Summary Strip */}
          <div className="anim-fade-in anim-delay-1">
            <div
              style={{
                background: "rgba(249,247,242,0.8)",
                backdropFilter: "blur(8px)",
                borderRadius: 24,
                padding: "2rem",
                border: "1px solid rgba(229,225,216,0.6)",
                position: "sticky",
                top: 100,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.4rem",
                  fontWeight: 600,
                  marginBottom: "2rem",
                }}
              >
                Order Summary
              </h2>
              {/* Order items loop omitted for brevity */}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  borderTop: "1px solid var(--stone)",
                  paddingTop: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "var(--slate-muted)",
                  }}
                >
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "var(--slate-muted)",
                  }}
                >
                  <span>Shipping</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                    {shippingCost === 0
                      ? "Free"
                      : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "var(--slate-muted)",
                  }}
                >
                  <span>Tax (Estimated)</span>
                  <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                    ${tax.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--stone)",
                    paddingTop: "1.25rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    Total
                  </span>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
