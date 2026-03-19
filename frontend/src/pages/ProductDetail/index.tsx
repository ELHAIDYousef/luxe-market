import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../components/common/Toast";
import { PRODUCTS } from "../Storefront";
import Icon from "../../components/common/Icon";
import { useAnalytics } from "../../hooks/useAnalytics";
import api from "../../services/api";
import type { Product } from "../../types";

// Gallery images used when product has only 1 image
const GALLERY_EXTRA = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDWC3FyeU5hO55Ze0gsiXB6_Z0UZVDYvTfisDD7uoVUPggnQ6-umNsltGHA3Sq6bvmF-U9JE5iEc8-0em8aofcRofvYhzynERuazmOB9-CapM46Rgzm5i3NipUI6wTExbgNURpJ7eRClM3PF7IJmXjLxU-2Ix0uVrEZiaJDj1TGvtZ0QJbXjRm9Ll_x16QgdiRQj_fivFkqm2UjxyeAlvtlEIy-mr1ZnXbi_qNBfsbTuX7Dl1yMYVERvgJjLBxlQGF1EYC-efvQDuY",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA9KN6Q7xuVQYHI4-2uPR0KDyq5l5tuNG5y1-Yg_K9Ga0HZl0coGSmOTtA-Z7L4d5QECu8Hj51L7w1tAg6bpotfUJs0jhiPvL-qaU3qQN9yrDVKH8vugGoV1rXUbuvR_xSI7wPB1aTFWh4CviUIB_8LbXNJDOYJw5KMS1avM6hFpO2Gx1S1oG-Uk4goaNcl3bm2sM_NsjkTMIWcAcMe4WdYFB3ILl-9i2YYSXyYy_NDhkhD9NCyo_gTV-XQV7Z6PzO5HSfx5_y6CU8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBcmy8epbwlZD3WGLjZJuUTspjCRxFt2O4jzsiGJVLlrIahe8bXX9dEZF2vEVdrU6TC2vl_S-eaCBt25SdAPgzaoJf8ehHPe_hZJSnJnL5bJ7KYXQSO2PZJ-x1eLR6pScun65jqVaec1bNSFkJx0tgRw31GwlUV4TkJvtIv_i4MWBkso42vW1-2GgJ2zXUwzaeWubxfXUsGg2EZKSnJJMOFvVoilp7i0whWXcqSMS4HIec3wUtjqeX_muSEQ93wNk1AAJw3N40tBSo",
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { show: toast } = useToast();
  const { trackView, trackCartAdd } = useAnalytics();
  const [activeImg, setActiveImg] = useState(0);

  // Product loaded from API, with static fallback
  const [product, setProduct] = useState<Product>(
    PRODUCTS.find((p) => p.id === Number(id)) ?? PRODUCTS[0],
  );
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const [loading, setLoading] = useState(true);

  const fetchProduct = useCallback(async (productId: number) => {
    setLoading(true);
    try {
      const [pRes, allRes] = await Promise.all([
        api.get(`/products/${productId}`),
        api.get("/products/?limit=100"),
      ]);
      setProduct(pRes.data);
      if (allRes.data?.length > 0) setAllProducts(allRes.data);
    } catch {
      // Use static fallback already set
    } finally {
      setLoading(false);
    }
  }, []);

  // Build gallery: use only the product's images, up to 4
  const gallery = product.images?.slice(0, 4) || [];

  // Track VIEW event + scroll to top when product ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveImg(0);
    const pid = Number(id);
    fetchProduct(pid);
    trackView(pid); // ← AIDA: Interest stage
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Related: same category first, then others
  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(
      allProducts.filter(
        (p) => p.id !== product.id && p.category !== product.category,
      ),
    )
    .slice(0, 4);

  const handleAddToCart = () => {
    const added = addItem(product, 1);
    if (!added) {
      navigate(`/login?next=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }
    trackCartAdd(product.id);
    toast(`${product.name} added to cart`, "success", "shopping_cart");
  };

  return (
    <div className="page-container">
      <Navbar />
      <main>
        {/* Breadcrumbs */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "1rem 1.5rem",
            display: "flex",
            gap: "0.4rem",
            alignItems: "center",
            fontSize: "0.78rem",
            color: "var(--slate-muted)",
          }}
        >
          <Link to="/" style={{ color: "var(--slate-muted)" }}>
            Home
          </Link>
          <Icon name="chevron_right" size={13} />
          <Link
            to={`/?cat=${product.category}`}
            style={{ color: "var(--slate-muted)" }}
          >
            {product.category}
          </Link>
          <Icon name="chevron_right" size={13} />
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>
            {product.name}
          </span>
        </div>

        {/* Main grid */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "1rem 1.5rem 4rem",
            display: "grid",
            gridTemplateColumns: "7fr 5fr",
            gap: "4rem",
          }}
        >
          {/* Gallery */}
          <div
            className="anim-fade-in"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              style={{
                aspectRatio: "4/5",
                background: "var(--cream-deep)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <img
                src={gallery[activeImg]}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "opacity 0.3s ease",
                }}
                key={gallery[activeImg]}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "0.75rem",
              }}
            >
              {gallery.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: `2px solid ${i === activeImg ? "var(--ink)" : "transparent"}`,
                    opacity: i === activeImg ? 1 : 0.6,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div
            className="anim-fade-in anim-delay-1"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {/* Name + price */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--slate-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {product.category}
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem,4vw,2.75rem)",
                  fontWeight: 500,
                  lineHeight: 1.1,
                  marginBottom: "0.75rem",
                  color: "var(--ink)",
                }}
              >
                {product.name}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.75rem",
                  fontWeight: 300,
                  color: "var(--slate-muted)",
                  fontStyle: "italic",
                }}
              >
                ${product.price.toLocaleString()}.00
              </p>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "1.75rem" }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.05rem",
                  fontStyle: "italic",
                  color: "var(--slate-muted)",
                  lineHeight: 1.75,
                }}
              >
                {product.description ||
                  "A carefully crafted piece embodying the harmony of Japanese minimalism and Scandinavian functionality. Built for a lifetime of quiet beauty."}
              </p>
            </div>

            {/* Stock indicator */}
            <div
              style={{
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  background:
                    product.stock > 5
                      ? "#059669"
                      : product.stock > 0
                        ? "#D97706"
                        : "#DC2626",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--slate-muted)",
                  fontWeight: 500,
                }}
              >
                {product.stock > 5
                  ? "In Stock"
                  : product.stock > 0
                    ? `Only ${product.stock} left`
                    : "Out of Stock"}
              </span>
            </div>

            {/* CTA */}
            <div
              style={{
                marginTop: "auto",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--cream-muted)",
              }}
            >
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                style={{
                  width: "100%",
                  background: product.stock === 0 ? "#ccc" : "var(--ink)",
                  color: "#fff",
                  padding: "1.35rem",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  cursor: product.stock === 0 ? "not-allowed" : "pointer",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  boxShadow: "var(--shadow-lg)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseOver={(e) => {
                  if (product.stock > 0)
                    e.currentTarget.style.transform = "scale(1.015)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Icon name="add_shopping_cart" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "var(--slate-muted)",
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <Icon name="local_shipping" size={15} />
                Free white-glove delivery in 4–6 weeks
              </p>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {/* <section
          style={{
            background: "#fff",
            borderTop: "1px solid var(--cream-muted)",
            borderBottom: "1px solid var(--cream-muted)",
            padding: "4rem 1.5rem",
          }}
        >
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 400,
                textAlign: "center",
                marginBottom: "2.5rem",
              }}
            >
              Product Details
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "4rem",
                rowGap: "1.25rem",
              }}
            >
              {[
                ["Category", product.category],
                ["Price", `$${product.price.toLocaleString()}.00`],
                ["Stock", `${product.stock} units available`],
                ["Material", "Solid FSC-Certified Oak"],
                ["Dimensions", '28"W × 32"D × 30"H'],
                ["Assembly", "Fully Assembled"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--cream-muted)",
                    paddingBottom: "0.6rem",
                  }}
                >
                  <span
                    style={{
                      color: "var(--slate-muted)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "var(--ink)",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* You May Also Like */}
        <section
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "4rem 1.5rem 5rem",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "3rem",
              fontWeight: 600,
              textAlign: "center",
              marginBottom: "2.5rem",
            }}
          >
            You May Also Like
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "1.5rem",
            }}
          >
            {related.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                className="product-img-wrap"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    aspectRatio: "4/5",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "var(--cream-deep)",
                  }}
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s var(--ease-japandi)",
                    }}
                  />
                </div>
                <h4
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--ink)",
                  }}
                >
                  {p.name}
                </h4>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--slate-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {p.category}
                </p>
                <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  ${p.price.toLocaleString()}.00
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
