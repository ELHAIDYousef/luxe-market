import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../../components/common/Icon";
import api from "../../services/api";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Added 'code' to the form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    code: "",
    password: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // States to manage the verification flow
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const f =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setError("");
    };

  // Logic to request the 6-digit code from the backend
  const handleRequestCode = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }

    setSendingCode(true);
    setError("");
    try {
      await api.post("/auth/request-registration-code", { email });
      setCodeSent(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Failed to send verification code.",
      );
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!form.code.trim()) {
      setError("Verification code is required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Register account including the verification code
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        verification_code: form.code.trim(), // Matches the updated backend schema
      });

      // Auto-login after registration
      const role = await login(form.email.trim().toLowerCase(), form.password);
      if (role) navigate("/");
      else setError("Account created. Please sign in.");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Registration failed. Please check your code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!codeSent) handleRequestCode();
      else handleSubmit();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "1.5rem 5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--stone)",
        }}
      >
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
              fill="currentColor"
            />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              fontStyle: "italic",
            }}
          >
            LuxeMarket
          </span>
        </Link>
        <span style={{ fontSize: "0.875rem", color: "var(--slate-muted)" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--ink)",
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            Sign in
          </Link>
        </span>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1rem",
        }}
      >
        <div
          className="anim-scale-in"
          style={{
            width: "100%",
            maxWidth: 460,
            background: "#fff",
            padding: "3rem",
            borderRadius: 12,
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--stone)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Create Account
            </h2>
            <p style={{ color: "var(--slate-muted)", fontSize: "0.875rem" }}>
              Join LuxeMarket to start shopping premium Japandi pieces.
            </p>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Name */}
            <div>
              <label className="lux-label">Full Name</label>
              <input
                className="lux-input"
                value={form.name}
                onChange={f("name")}
                onKeyDown={handleKey}
                placeholder="e.g. Jane Smith"
                autoComplete="name"
              />
            </div>

            {/* Email + Send Code */}
            <div>
              <label className="lux-label">Email Address</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="lux-input"
                  type="email"
                  value={form.email}
                  onChange={f("email")}
                  onKeyDown={handleKey}
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={codeSent}
                />
                <button
                  onClick={handleRequestCode}
                  disabled={sendingCode || codeSent}
                  className="btn-admin-ghost"
                  style={{
                    whiteSpace: "nowrap",
                    minWidth: "100px",
                    opacity: sendingCode || codeSent ? 0.6 : 1,
                  }}
                >
                  {sendingCode ? "..." : codeSent ? "Sent" : "Send Code"}
                </button>
              </div>
            </div>

            {/* Verification Code - Visible only after sending */}
            {codeSent && (
              <div className="anim-fade-in">
                <label className="lux-label">Verification Code</label>
                <input
                  className="lux-input"
                  value={form.code}
                  onChange={f("code")}
                  onKeyDown={handleKey}
                  placeholder="6-digit code from your email"
                  maxLength={6}
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="lux-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="lux-input"
                  value={form.password}
                  onChange={f("password")}
                  onKeyDown={handleKey}
                  placeholder="Min 6 characters"
                  type={showPass ? "text" : "password"}
                  style={{ paddingRight: "3rem" }}
                  autoComplete="new-password"
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--slate-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Icon
                    name={showPass ? "visibility_off" : "visibility"}
                    size={20}
                  />
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="lux-label">Confirm Password</label>
              <input
                className="lux-input"
                value={form.confirm}
                onChange={f("confirm")}
                onKeyDown={handleKey}
                placeholder="Repeat your password"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                }}
              >
                <Icon name="warning" size={16} color="#EF4444" />
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "#991B1B",
                    fontWeight: 500,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !codeSent}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "1rem",
                borderRadius: 8,
                letterSpacing: "0.15em",
                opacity: loading || !codeSent ? 0.7 : 1,
                marginTop: "0.25rem",
              }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.78rem",
                color: "var(--slate-muted)",
                lineHeight: 1.6,
              }}
            >
              By creating an account, you agree to our{" "}
              <a
                href="#"
                style={{
                  color: "var(--ink)",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                style={{
                  color: "var(--ink)",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
