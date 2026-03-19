import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { useAuth } from "../../context/AuthContext"; // Integrated Auth
import { useToast } from "../../components/common/Toast";
import Icon from "../../components/common/Icon";
import api from "../../services/api";
import type { Product } from "../../types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  selected_finish?: string;
  product?: Product;
}

interface Order {
  id: string;
  customer_id: number;
  status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_zip?: string;
  customer_name?: string;
  customer_email?: string;
  customer_avatar?: string;
}

const STATUS_BADGE: Record<string, string> = {
  Pending: "badge badge-pending",
  Processing: "badge badge-pending",
  Shipped: "badge badge-shipped",
  Delivered: "badge badge-delivered",
  Cancelled: "badge badge-cancelled",
};

// ── Product Form Component ────────────────────────────────────────────────────
interface PFormData {
  name: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  images: string[];
}
interface PFormProps {
  initial?: Product;
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
  saving: boolean;
}

function ImageSlot({
  index,
  url,
  onUpload,
  onRemove,
}: {
  index: number;
  url: string;
  onUpload: (index: number, url: string) => void;
  onRemove: (index: number) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputId = `img-upload-${index}`;

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const backendBase = (
        import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"
      ).replace("/api/v1", "");
      onUpload(index, `${backendBase}${res.data.url}`);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => onUpload(index, ev.target?.result as string);
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {url ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingBottom: "100%",
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--admin-border)",
          }}
        >
          <img
            src={url}
            alt={`Image ${index + 1}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <button
            onClick={() => onRemove(index)}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 22,
              height: 22,
              borderRadius: 9999,
              background: "rgba(220,38,38,0.9)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
          {index === 0 && (
            <span
              style={{
                position: "absolute",
                bottom: 4,
                left: 4,
                fontSize: "0.6rem",
                fontWeight: 700,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                padding: "0.1rem 0.4rem",
                borderRadius: 4,
              }}
            >
              MAIN
            </span>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            width: "100%",
            paddingBottom: "100%",
            position: "relative",
            borderRadius: 8,
            border: "1.5px dashed var(--admin-border)",
            background: uploading ? "rgba(43,140,238,0.05)" : "#F8FAFC",
            cursor: uploading ? "wait" : "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
            }}
          >
            {uploading ? (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 9999,
                  border: "2px solid var(--admin-border)",
                  borderTopColor: "var(--admin-primary)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <Icon
                name="cloud_upload"
                size={22}
                color={index === 0 ? "var(--admin-primary)" : "#CBD5E1"}
              />
            )}
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--admin-muted)",
                textAlign: "center",
              }}
            >
              {uploading
                ? "Uploading…"
                : index === 0
                  ? "Main photo"
                  : `Photo ${index + 1}`}
            </span>
          </div>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      )}
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel, saving }: PFormProps) {
  const [form, setForm] = useState<PFormData>({
    name: initial?.name ?? "",
    category: initial?.category ?? "",
    description: initial?.description ?? "",
    price: initial?.price?.toString() ?? "",
    stock: initial?.stock?.toString() ?? "",
    images: [...(initial?.images ?? []), "", "", "", ""].slice(0, 4),
  });
  const f =
    (k: keyof Omit<PFormData, "images">) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  const handleUpload = (index: number, url: string) =>
    setForm((p) => {
      const imgs = [...p.images];
      imgs[index] = url;
      return { ...p, images: imgs };
    });
  const handleRemove = (index: number) =>
    setForm((p) => {
      const imgs = [...p.images];
      imgs[index] = "";
      return { ...p, images: imgs };
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <div style={{ gridColumn: "span 2" }}>
          <label className="lux-label">Product Name *</label>
          <input className="lux-input" value={form.name} onChange={f("name")} />
        </div>
        <div>
          <label className="lux-label">Category *</label>
          <select
            className="lux-input"
            value={form.category}
            onChange={f("category")}
          >
            <option value="">Select category…</option>
            {["Furniture", "Lighting", "Decor", "Textiles", "Accessories"].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="lux-label">Price ($) *</label>
          <input
            className="lux-input"
            type="number"
            value={form.price}
            onChange={f("price")}
          />
        </div>
        <div>
          <label className="lux-label">Stock Units *</label>
          <input
            className="lux-input"
            type="number"
            value={form.stock}
            onChange={f("stock")}
          />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label className="lux-label">Description</label>
          <textarea
            className="lux-input"
            value={form.description}
            onChange={f("description")}
            rows={3}
          />
        </div>
      </div>
      <div>
        <label className="lux-label">
          Product Images{" "}
          <span
            style={{
              fontWeight: 400,
              color: "var(--admin-muted)",
              marginLeft: "0.4rem",
            }}
          >
            (up to 4)
          </span>
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          {form.images.map((url, i) => (
            <ImageSlot
              key={i}
              index={i}
              url={url}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
        <button
          onClick={onCancel}
          className="btn-admin-ghost"
          style={{ flex: 1, justifyContent: "center" }}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onSave({
              name: form.name,
              category: form.category,
              description: form.description,
              price: parseFloat(form.price) || 0,
              stock: parseInt(form.stock) || 0,
              images: form.images.filter(Boolean),
            })
          }
          className="btn-admin-primary"
          style={{
            flex: 1,
            justifyContent: "center",
            opacity: saving ? 0.7 : 1,
          }}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Product"}
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
type Tab = "overview" | "orders" | "products" | "settings";

export default function AdminDashboard() {
  const { user: authUser } = useAuth(); // Access real user
  const { show: toast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // ── Functional Settings State ─────────────────────────────────────────────
  const [username, setUsername] = useState(authUser?.name || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Keep local username in sync with auth state
  useEffect(() => {
    if (authUser?.name) setUsername(authUser.name);
  }, [authUser]);

  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled") // Exclude canceled orders
    .reduce((s, o) => s + o.total, 0);
  const activeOrders = orders.filter((o) =>
    ["Pending", "Processing"].includes(o.status),
  ).length;
  const pendingShip = orders.filter((o) => o.status === "Shipped").length;

  const STATS = [
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "payments",
    },
    {
      label: "Active Orders",
      value: String(activeOrders),
      icon: "shopping_cart",
    },
    {
      label: "Pending Shipments",
      value: String(pendingShip),
      icon: "local_shipping",
    },
  ];

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get("/orders/?limit=100");
      const enriched: Order[] = await Promise.all(
        res.data.map(async (o: Order) => {
          try {
            const u = await api.get(`/users/${o.customer_id}`);
            return {
              ...o,
              customer_name: u.data.name,
              customer_email: u.data.email,
              customer_avatar: u.data.avatar_url,
            };
          } catch {
            return { ...o, customer_name: `Customer #${o.customer_id}` };
          }
        }),
      );
      setOrders(enriched);
    } catch {
      toast("Failed to load orders", "error");
    } finally {
      setLoadingOrders(false);
    }
  }, [toast]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get("/products/?limit=100");
      setProducts(res.data);
    } catch {
      toast("Failed to load products", "error");
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  const handleOrderStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
      if (selectedOrder?.id === id)
        setSelectedOrder({ ...selectedOrder, status });
      toast(`Order ${id} → ${status}`, "success");
    } catch {
      toast("Failed to update status", "error");
    }
  };

  const handleSaveProduct = async (data: Partial<Product>) => {
    setSavingProduct(true);
    try {
      if (editProduct) {
        const res = await api.patch(`/products/${editProduct.id}`, data);
        setProducts((prev) =>
          prev.map((p) => (p.id === editProduct.id ? res.data : p)),
        );
        toast("Product updated", "success");
      } else {
        const res = await api.post("/products/", data);
        setProducts((prev) => [...prev, res.data]);
        toast("Product added", "success");
      }
      setShowProductModal(false);
      setEditProduct(null);
    } catch {
      toast("Failed to save product", "error");
    } finally {
      setSavingProduct(false);
    }
  };

  // ── Settings Handlers ────────────────────────────────────────────────────
  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      await api.patch("/users/me", { name: username });
      toast("Username updated successfully", "success");
    } catch {
      toast("Failed to update profile", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRequestCode = async () => {
    setIsRequestingCode(true);
    try {
      await api.post("/users/me/request-password-reset");
      toast("Verification code sent to your email", "success");
    } catch {
      toast("Failed to send code", "error");
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!verificationCode || !newPassword) {
      toast("Please enter code and new password", "error");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.patch("/users/me/update-password", {
        code: verificationCode,
        new_password: newPassword,
      });
      toast("Password successfully updated", "success");
      setVerificationCode("");
      setNewPassword("");
    } catch {
      toast("Invalid code or update failed", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      (o.customer_name ?? "")
        .toLowerCase()
        .includes(orderSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()),
  );
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()),
  );
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="admin-layout">
      <AdminSidebar activeTab={tab} onTabChange={setTab} />
      <div className="admin-main">
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "rgba(246,247,248,0.9)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid var(--admin-border)",
            padding: "0.875rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            {
              {
                overview: "Dashboard Overview",
                orders: "Orders",
                products: "Products",
                settings: "Settings",
              }[tab]
            }
          </h1>
          {tab === "products" && (
            <button
              className="btn-admin-primary"
              onClick={() => {
                setEditProduct(null);
                setShowProductModal(true);
              }}
            >
              <Icon name="add" size={16} />
              Add Product
            </button>
          )}
        </header>

        {/* ══ OVERVIEW & ORDERS ══ */}
        {(tab === "overview" || tab === "orders") && (
          <div style={{ padding: "2rem" }}>
            {tab === "overview" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: "1.25rem",
                  marginBottom: "2rem",
                }}
              >
                {STATS.map((s, i) => (
                  <div
                    key={s.label}
                    className={`stat-card anim-fade-in anim-delay-${i + 1}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {/* Change: Add className="stat-label" */}
                      <p className="stat-label">{s.label}</p>
                      <Icon
                        name={s.icon}
                        size={20}
                        color="rgba(43,140,238,0.3)"
                      />
                    </div>
                    {/* Change: Add className="stat-value" and remove the direct font weight/size from the tag */}
                    <h3 className="stat-value" style={{ fontSize: "2rem" }}>
                      {loadingOrders ? "—" : s.value}
                    </h3>
                  </div>
                ))}
              </div>
            )}

            <div className="card-section anim-fade-in anim-delay-2">
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid var(--admin-border)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div className="admin-search">
                  <Icon name="search" size={18} color="var(--admin-muted)" />
                  <input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search orders…"
                  />
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        "Order ID",
                        "Customer",
                        "Date",
                        "Total",
                        "Status",
                        "Action",
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{ textAlign: i === 5 ? "right" : "left" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === "overview"
                      ? orders.slice(0, 4)
                      : filteredOrders
                    ).map((o) => (
                      <tr key={o.id}>
                        <td
                          onClick={() => setSelectedOrder(o)}
                          style={{
                            fontWeight: 600,
                            color: "var(--admin-primary)",
                            fontFamily: "monospace",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          {o.id}
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              navigate(`/admin/users/${o.customer_id}`)
                            }
                            style={{
                              fontWeight: 600,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--admin-primary)",
                              textDecoration: "underline",
                              textDecorationStyle: "dotted",
                            }}
                          >
                            {o.customer_name ?? `#${o.customer_id}`}
                          </button>
                        </td>
                        <td style={{ color: "var(--admin-muted)" }}>
                          {fmtDate(o.created_at)}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          ${o.total.toFixed(2)}
                        </td>
                        <td>
                          <span className={STATUS_BADGE[o.status] ?? "badge"}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <select
                            value={o.status}
                            onChange={(e) =>
                              handleOrderStatus(o.id, e.target.value)
                            }
                            style={{
                              fontSize: "0.78rem",
                              border: "1px solid var(--admin-border)",
                              borderRadius: 6,
                              padding: "0.3rem 0.5rem",
                              cursor: "pointer",
                            }}
                          >
                            {[
                              "Pending",
                              "Processing",
                              "Shipped",
                              "Delivered",
                              "Cancelled",
                            ].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRODUCTS ══ */}
        {tab === "products" && (
          <div style={{ padding: "2rem" }}>
            <div className="card-section">
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid var(--admin-border)",
                }}
              >
                <div className="admin-search">
                  <Icon name="search" size={18} color="var(--admin-muted)" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products…"
                  />
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {["Product", "Category", "Price", "Stock", "Actions"].map(
                        (h, i) => (
                          <th
                            key={h}
                            style={{ textAlign: i === 4 ? "right" : "left" }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            {p.images?.[0] ? (
                              <img
                                src={p.images[0]}
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  objectFit: "cover",
                                }}
                                alt=""
                              />
                            ) : (
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  background: "var(--cream-deep)",
                                }}
                              >
                                <Icon name="image" size={20} color="#CBD5E1" />
                              </div>
                            )}
                            <div>
                              <p
                                style={{ fontWeight: 600, fontSize: "0.87rem" }}
                              >
                                {p.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              background: "rgba(43,140,238,0.08)",
                              color: "var(--admin-primary)",
                              padding: "0.2rem 0.6rem",
                              borderRadius: 9999,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                            }}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          ${p.price.toLocaleString()}
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: p.stock < 5 ? "#DC2626" : "#059669",
                            }}
                          >
                            {p.stock} units
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.25rem",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              className="btn-icon primary"
                              onClick={() => {
                                setEditProduct(p);
                                setShowProductModal(true);
                              }}
                            >
                              <Icon name="edit" size={17} />
                            </button>
                            <button
                              className="btn-icon danger"
                              onClick={() => setDeleteConfirm(p.id)}
                            >
                              <Icon name="delete" size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab === "settings" && (
          <div style={{ padding: "2rem" }}>
            <div
              style={{
                maxWidth: 680,
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Profile Section */}
              <div className="card-section">
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid var(--admin-border)",
                  }}
                >
                  <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                    Admin Profile
                  </h2>
                </div>
                <div
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <label className="lux-label">Username</label>
                    <input
                      className="lux-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="lux-label">
                      Email Address (Read-only)
                    </label>
                    <input
                      className="lux-input"
                      type="email"
                      value={authUser?.email || ""}
                      disabled
                      style={{
                        background: "var(--cream-deep)",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <button
                    className="btn-admin-primary"
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
                  </button>
                </div>
              </div>

              {/* Security Section */}
              <div className="card-section">
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid var(--admin-border)",
                  }}
                >
                  <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                    Security & Password
                  </h2>
                </div>
                <div
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--admin-muted)",
                    }}
                  >
                    To change password, verify your identity via code sent to **
                    {authUser?.email}**.
                  </p>
                  <button
                    className="btn-admin-ghost"
                    style={{ width: "fit-content" }}
                    onClick={handleRequestCode}
                    disabled={isRequestingCode}
                  >
                    <Icon name="mail" size={16} />{" "}
                    {isRequestingCode ? "Sending..." : "Send Code"}
                  </button>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <label className="lux-label">Verification Code</label>
                      <input
                        className="lux-input"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="lux-label">New Password</label>
                      <input
                        className="lux-input"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="btn-admin-primary"
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? "Saving..." : "Save New Password"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 700 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid var(--admin-border)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>
                  Order Details
                </h3>
                <p style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                  {selectedOrder.id}
                </p>
              </div>
              <button
                className="btn-icon"
                onClick={() => setSelectedOrder(null)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div
              style={{ padding: "2rem", maxHeight: "70vh", overflowY: "auto" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2rem",
                  marginBottom: "2.5rem",
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: "var(--admin-muted)",
                      marginBottom: "1rem",
                    }}
                  >
                    Customer
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    {selectedOrder.customer_avatar ? (
                      <img
                        src={selectedOrder.customer_avatar}
                        style={{ width: 40, height: 40, borderRadius: 9999 }}
                        alt=""
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 9999,
                          background: "#E2E8F0",
                        }}
                      />
                    )}
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                        {selectedOrder.customer_name}
                      </p>
                      <p style={{ fontSize: "0.8rem" }}>
                        {selectedOrder.customer_email}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: "var(--admin-muted)",
                      marginBottom: "1rem",
                    }}
                  >
                    Shipping To
                  </h4>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    {selectedOrder.shipping_first_name}{" "}
                    {selectedOrder.shipping_last_name}
                  </p>
                  <p style={{ fontSize: "0.875rem" }}>
                    {selectedOrder.shipping_address},{" "}
                    {selectedOrder.shipping_city} {selectedOrder.shipping_zip}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "1rem",
                      background: "var(--cream-deep)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          background: "#fff",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            alt=""
                          />
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                          {item.product?.name}
                        </p>
                        <p style={{ fontSize: "0.75rem" }}>
                          {item.selected_finish} • Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontWeight: 700 }}>
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: "2rem",
                  borderTop: "2px solid var(--admin-border)",
                  paddingTop: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleOrderStatus(selectedOrder.id, e.target.value)
                  }
                  style={{ padding: "0.4rem 0.8rem", borderRadius: 8 }}
                >
                  {[
                    "Pending",
                    "Processing",
                    "Shipped",
                    "Delivered",
                    "Cancelled",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: "var(--admin-primary)",
                    }}
                  >
                    ${selectedOrder.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowProductModal(false);
            setEditProduct(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--admin-border)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                {editProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                className="btn-icon"
                onClick={() => {
                  setShowProductModal(false);
                  setEditProduct(null);
                }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <ProductForm
                initial={editProduct || undefined}
                onSave={handleSaveProduct}
                onCancel={() => {
                  setShowProductModal(false);
                  setEditProduct(null);
                }}
                saving={savingProduct}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
