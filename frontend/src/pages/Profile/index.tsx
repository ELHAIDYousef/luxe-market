import React from "react";
import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/common/Toast";
import Icon from "../../components/common/Icon";
import api from "../../services/api";

export default function Profile() {
  const { user, logout, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { show: toast } = useToast();

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    verificationCode: "", // New field for the reset code
  });

  const [saving, setSaving] = useState(false);
  const [resetMode, setResetMode] = useState<"standard" | "code">("standard"); // Toggle for reset method
  const [sendingCode, setSendingCode] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      toast("Name cannot be empty", "error");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/users/me", { name: form.name, email: form.email });
      await refreshUser();
      toast("Profile updated successfully", "success");
    } catch (err: any) {
      toast(err?.response?.data?.detail ?? "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestResetCode = async () => {
    setSendingCode(true);
    try {
      await api.post("/users/me/request-password-reset"); // Calls the backend email service
      toast("Verification code sent to your email", "info");
    } catch (err: any) {
      toast("Failed to send code", "error");
    } finally {
      setSendingCode(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (form.newPassword.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }

    setSaving(true);
    try {
      if (resetMode === "standard") {
        // Standard change requiring current password
        await api.post("/auth/password", {
          current_password: form.currentPassword,
          new_password: form.newPassword,
        });
      } else {
        // Reset using verification code
        await api.patch("/users/me/update-password", {
          code: form.verificationCode,
          new_password: form.newPassword,
        });
      }

      setForm((f) => ({
        ...f,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        verificationCode: "",
      }));
      setResetMode("standard");
      toast("Password updated successfully", "success");
    } catch (err: any) {
      toast(
        err?.response?.data?.detail ?? "Failed to update password",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast("Signed out", "info");
  };

  const ROW = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.4rem",
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />
      <main
        style={{
          flex: 1,
          maxWidth: 760,
          margin: "0 auto",
          width: "100%",
          padding: "3rem 1.5rem",
        }}
      >
        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              color: "var(--charcoal)",
            }}
          >
            My Profile
          </h1>
          <p style={{ color: "var(--slate-muted)", marginTop: "0.5rem" }}>
            Manage your account information and security settings.
          </p>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Avatar + role */}
          <div
            className="animate-fade-up delay-100"
            style={{
              background: "#fff",
              border: "1px solid var(--cream-muted)",
              borderRadius: 12,
              padding: "1.75rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 9999,
                background: "var(--cream-deep)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "2px solid var(--cream-muted)",
              }}
            >
              <Icon name="person" size={36} color="var(--slate-muted)" />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "var(--charcoal)",
                }}
              >
                {user?.name}
              </p>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--slate-muted)",
                  marginTop: "0.2rem",
                }}
              >
                {user?.email}
              </p>
              <span
                style={{
                  display: "inline-flex",
                  marginTop: "0.5rem",
                  background:
                    user?.role === "super_admin"
                      ? "rgba(139,92,246,0.1)"
                      : "rgba(43,140,238,0.1)",
                  color:
                    user?.role === "super_admin"
                      ? "#7C3AED"
                      : "var(--accent-navy)",
                  padding: "0.2rem 0.75rem",
                  borderRadius: 9999,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                {user?.role === "super_admin"
                  ? "Super Admin"
                  : user?.role === "admin"
                    ? "Admin"
                    : "Customer"}
              </span>
            </div>
          </div>

          {/* Edit profile */}
          <div
            className="animate-fade-up delay-200"
            style={{
              background: "#fff",
              border: "1px solid var(--cream-muted)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.1rem 1.5rem",
                borderBottom: "1px solid var(--cream-muted)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--charcoal)",
                }}
              >
                Account Information
              </h2>
            </div>
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div style={ROW}>
                  <label className="label-japandi">Full Name</label>
                  <input
                    className="input-japandi"
                    value={form.name}
                    onChange={f("name")}
                  />
                </div>
                <div style={ROW}>
                  <label className="label-japandi">Email Address</label>
                  <input
                    className="input-japandi"
                    type="email"
                    value={form.email}
                    onChange={f("email")}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{ padding: "0.75rem 2rem" }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div
            className="animate-fade-up delay-300"
            style={{
              background: "#fff",
              border: "1px solid var(--cream-muted)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1.1rem 1.5rem",
                borderBottom: "1px solid var(--cream-muted)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--charcoal)",
                }}
              >
                Security
              </h2>
              <button
                onClick={() =>
                  setResetMode(resetMode === "standard" ? "code" : "standard")
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-navy)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {resetMode === "standard"
                  ? "I forgot my current password"
                  : "Use current password instead"}
              </button>
            </div>

            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              {resetMode === "standard" ? (
                <div style={ROW}>
                  <label className="label-japandi">Current Password</label>
                  <input
                    className="input-japandi"
                    type="password"
                    value={form.currentPassword}
                    onChange={f("currentPassword")}
                    placeholder="••••••••"
                  />
                </div>
              ) : (
                <div style={ROW}>
                  <label className="label-japandi">
                    Email Verification Code
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      className="input-japandi"
                      style={{ flex: 1 }}
                      value={form.verificationCode}
                      onChange={f("verificationCode")}
                      placeholder="6-digit code"
                    />
                    <button
                      className="btn-admin-ghost"
                      onClick={handleRequestResetCode}
                      disabled={sendingCode}
                      style={{ padding: "0 1rem", fontSize: "0.75rem" }}
                    >
                      {sendingCode ? "Sending..." : "Get Code"}
                    </button>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div style={ROW}>
                  <label className="label-japandi">New Password</label>
                  <input
                    className="input-japandi"
                    type="password"
                    value={form.newPassword}
                    onChange={f("newPassword")}
                    placeholder="••••••••"
                  />
                </div>
                <div style={ROW}>
                  <label className="label-japandi">Confirm Password</label>
                  <input
                    className="input-japandi"
                    type="password"
                    value={form.confirmPassword}
                    onChange={f("confirmPassword")}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn-primary"
                  onClick={handleUpdatePassword}
                  disabled={saving}
                  style={{ padding: "0.75rem 2rem" }}
                >
                  {saving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div
            className="animate-fade-up delay-400"
            style={{
              background: "#fff",
              border: "1px solid #FEE2E2",
              borderRadius: 12,
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#991B1B",
                }}
              >
                Sign out of your account
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--slate-muted)",
                  marginTop: "0.2rem",
                }}
              >
                You will be redirected to the home page.
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.25rem",
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
                borderRadius: 8,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              <Icon name="logout" size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
