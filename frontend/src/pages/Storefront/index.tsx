import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../components/common/Toast";
import type { Product } from "../../types";
import Icon from "../../components/common/Icon";
import { useAnalytics } from "../../hooks/useAnalytics";
import api from "../../services/api";

// Products are loaded from the API — no static fallback needed
export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Minimalist Oak Chair",
    category: "Furniture",
    description:
      "A carefully crafted piece embodying the harmony of Japanese minimalism and Scandinavian functionality. Built for a lifetime of quiet beauty.",
    price: 450,
    stock: 10,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDWC3FyeU5hO55Ze0gsiXB6_Z0UZVDYvTfisDD7uoVUPggnQ6-umNsltGHA3Sq6bvmF-U9JE5iEc8-0em8aofcRofvYhzynERuazmOB9-CapM46Rgzm5i3NipUI6wTExbgNURpJ7eRClM3PF7IJmXjLxU-2Ix0uVrEZiaJDj1TGvtZ0QJbXjRm9Ll_x16QgdiRQj_fivFkqm2UjxyeAlvtlEIy-mr1ZnXbi_qNBfsbTuX7Dl1yMYVERvgJjLBxlQGF1EYC-efvQDuY",
    ],
  },
  {
    id: 2,
    name: "Scandinavian Dining Table",
    category: "Furniture",
    description:
      "Elegant and functional dining table perfect for modern homes.",
    price: 1200,
    stock: 5,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9KN6Q7xuVQYHI4-2uPR0KDyq5l5tuNG5y1-Yg_K9Ga0HZl0coGSmOTtA-Z7L4d5QECu8Hj51L7w1tAg6bpotfUJs0jhiPvL-qaU3qQN9yrDVKH8vugGoV1rXUbuvR_xSI7wPB1aTFWh4CviUIB_8LbXNJDOYJw5KMS1avM6hFpO2Gx1S1oG-Uk4goaNcl3bm2sM_NsjkTMIWcAcMe4WdYFB3ILl-9i2YYSXyYy_NDhkhD9NCyo_gTV-XQV7Z6PzO5HSfx5_y6CU8",
    ],
  },
  {
    id: 3,
    name: "Japandi Floor Lamp",
    category: "Lighting",
    description:
      "Sleek floor lamp combining Japandi aesthetics for ambient lighting.",
    price: 300,
    stock: 8,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBcmy8epbwlZD3WGLjZJuUTspjCRxFt2O4jzsiGJVLlrIahe8bXX9dEZF2vEVdrU6TC2vl_S-eaCBt25SdAPgzaoJf8ehHPe_hZJSnJnL5bJ7KYXQSO2PZJ-x1eLR6pScun65jqVaec1bNSFkJx0tgRw31GwlUV4TkJvtIv_i4MWBkso42vW1-2GgJ2zXUwzaeWubxfXUsGg2EZKSnJJMOFvVoilp7i0whWXcqSMS4HIec3wUtjqeX_muSEQ93wNk1AAJw3N40tBSo",
    ],
  },
];

export default function Storefront() {
  const { addItem } = useCart();
  const { show: showToast } = useToast();
  const { trackCartAdd } = useAnalytics();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Products state — loads from API, falls back to static array ────────────
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get("/products/?limit=100");
      if (res.data?.length > 0) setProducts(res.data);
    } catch {
      // Backend unreachable — static fallback already in state, silently continue
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── URL-driven search + category filters ──────────────────────────────────
  const params = new URLSearchParams(location.search);
  const urlQuery = params.get("q")?.toLowerCase() ?? "";
  const urlCat = params.get("cat") ?? "";
  const [activeCategory, setActiveCategory] = useState(urlCat || "All");

  useEffect(() => {
    setActiveCategory(urlCat || "All");
  }, [urlCat]);

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat === "All")
      navigate(urlQuery ? `/?q=${encodeURIComponent(urlQuery)}` : "/");
    else
      navigate(
        urlQuery
          ? `/?cat=${cat}&q=${encodeURIComponent(urlQuery)}`
          : `/?cat=${cat}`,
      );
  };

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchQuery =
      !urlQuery ||
      p.name.toLowerCase().includes(urlQuery) ||
      p.category.toLowerCase().includes(urlQuery);
    return matchCat && matchQuery;
  });

  const handleAddToCart = (product: Product) => {
    const added = addItem(product);
    if (!added) {
      // Not logged in — redirect to login with return URL
      navigate(`/login?next=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }
    trackCartAdd(product.id);
    showToast(`${product.name} added to cart`, "success", "shopping_cart");
  };

  // ── Skeleton loader ────────────────────────────────────────────────────────
  const SkeletonCard = () => (
    <div
      style={{ borderRadius: 12, overflow: "hidden", background: "#F8FAFC" }}
    >
      <div
        style={{
          height: 240,
          background:
            "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            height: 18,
            background: "#E2E8F0",
            borderRadius: 4,
            marginBottom: "0.5rem",
            width: "70%",
          }}
        />
        <div
          style={{
            height: 14,
            background: "#E2E8F0",
            borderRadius: 4,
            width: "40%",
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* ── Hero ── */}
        <section
          style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 1.5rem" }}
        >
          <div
            className="animate-fade-in"
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 16,
              background: "var(--cream-deep)",
              display: "flex",
              flexWrap: "wrap",
              minHeight: 420,
            }}
          >
            <div
              style={{
                flex: "1 1 360px",
                padding: "clamp(2.5rem,5vw,5rem)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                zIndex: 1,
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--slate-muted)",
                }}
              >
                Summer 2024
              </span>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  lineHeight: 0.95,
                  color: "var(--charcoal)",
                  fontSize: "clamp(3rem,6vw,5.5rem)",
                  fontWeight: 300,
                }}
              >
                New
                <br />
                Arrivals
              </h1>
              <p
                style={{
                  fontSize: "1rem",
                  maxWidth: "28rem",
                  lineHeight: 1.75,
                  color: "var(--charcoal-soft)",
                }}
              >
                Experience the harmony of Japandi design — minimalist aesthetics
                meet functional craftsmanship.
              </p>
              <div style={{ paddingTop: "0.5rem" }}>
                <button
                  className="btn-primary"
                  style={{
                    borderRadius: 9999,
                    padding: "1rem 2rem",
                    fontSize: "0.75rem",
                    letterSpacing: "0.2em",
                  }}
                  onClick={() =>
                    document
                      .getElementById("products-grid")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Shop the Collection
                </button>
              </div>
            </div>
            <div
              style={{
                flex: "1 1 300px",
                minHeight: 280,
                backgroundImage:
                  "url(https://lh3.googleusercontent.com/aida-public/AB6AXuCGP2N9aslFP9gzTMbCwCLoW9jdnM-pdIAvP-DqMKXN48qbKCIbKTG45nSR4AHRVdjIa7iMmhk7EsR_kTzqS9L_34iZMcsZQfEaK5nyL_q31T07G_YDXvtWAjfev0A0zbLHSXAGwTbEd7US3w3h8X4QhdFGp7yGko5LNubcsRPb4rcs8A4UrZwet9LtiuoK0al5SYhUxYhCX_CjraG-DyBIVPf5vkQxX1DOHnm1V6-IW2Fhj-VwPUHe4JR4lj6uGHPfmUholmOIlrg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </section>

        {/* ── Products section ── */}
        <section
          id="products-grid"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "1rem 1.5rem 4rem",
          }}
        >
          {/* Category filter + search result heading */}
          {urlQuery ? (
            <div
              style={{
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2rem",
                    fontWeight: 600,
                  }}
                >
                  Results for <em>"{urlQuery}"</em>
                </h2>
                <p
                  style={{
                    color: "var(--slate-muted)",
                    fontSize: "0.875rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {filtered.length} product{filtered.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="btn-outline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  borderRadius: 9999,
                }}
              >
                <Icon name="close" size={16} />
                Clear Search
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                marginBottom: "2rem",
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: 9999,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.2s",
                    border: "none",
                    background:
                      activeCategory === cat
                        ? "var(--ink)"
                        : "rgba(229,225,216,0.4)",
                    color: activeCategory === cat ? "#fff" : "var(--ink)",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loadingProducts ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
              <Icon
                name="manage_search"
                size={56}
                color="var(--stone)"
                style={{ display: "block", margin: "0 auto 1rem" }}
              />
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.75rem",
                  fontWeight: 400,
                  marginBottom: "0.75rem",
                }}
              >
                No products found
              </h3>
              <p
                style={{ color: "var(--slate-muted)", marginBottom: "1.5rem" }}
              >
                Try a different search or browse all categories
              </p>
              <button
                onClick={() => navigate("/")}
                className="btn-outline"
                style={{ borderRadius: 9999 }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {filtered.map((product, i) => (
                <div
                  key={product.id}
                  className={`anim-fade-in anim-delay-${(i % 4) + 1}`}
                  onMouseEnter={() => setHoveredId(product.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fff",
                    border: "1px solid var(--cream-muted)",
                    transition: "box-shadow 0.3s, transform 0.3s",
                    cursor: "pointer",
                    boxShadow:
                      hoveredId === product.id
                        ? "var(--shadow-lg)"
                        : "var(--shadow-sm)",
                    transform:
                      hoveredId === product.id ? "translateY(-4px)" : "none",
                  }}
                >
                  {/* Image */}
                  <div
                    className="product-img-wrap"
                    style={{
                      position: "relative",
                      height: 240,
                      overflow: "hidden",
                      background: "var(--cream-deep)",
                    }}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.5s",
                        transform:
                          hoveredId === product.id ? "scale(1.05)" : "scale(1)",
                      }}
                    />
                    {product.stock < 5 && product.stock > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "0.75rem",
                          left: "0.75rem",
                          background: "#FEF3C7",
                          color: "#92400E",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.6rem",
                          borderRadius: 9999,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Only {product.stock} left
                      </span>
                    )}
                    {product.stock === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "0.75rem",
                          left: "0.75rem",
                          background: "#FEE2E2",
                          color: "#991B1B",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.6rem",
                          borderRadius: 9999,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Sold Out
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "1.25rem" }}>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        color: "var(--slate-muted)",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {product.category}
                    </p>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.25rem",
                        fontWeight: 500,
                        marginBottom: "0.5rem",
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--slate-muted)",
                        lineHeight: 1.6,
                        marginBottom: "1rem",
                      }}
                    >
                      {product.description}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.375rem",
                          fontWeight: 600,
                        }}
                      >
                        ${product.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="btn-outline"
                        style={{
                          borderRadius: 9999,
                          padding: "0.5rem 1rem",
                          fontSize: "0.72rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          opacity: product.stock === 0 ? 0.4 : 1,
                          cursor:
                            product.stock === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        <Icon name="add_shopping_cart" size={14} />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
