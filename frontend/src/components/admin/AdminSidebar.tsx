import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../common/Icon";

type Tab = "overview" | "orders" | "products" | "settings";

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
}

const NAV: { label: string; icon: string; tab: Tab }[] = [
  { label: "Dashboard Overview", icon: "dashboard", tab: "overview" },
  { label: "Orders", icon: "shopping_cart", tab: "orders" },
  { label: "Products", icon: "inventory_2", tab: "products" },
  { label: "Settings", icon: "settings", tab: "settings" },
];

export default function AdminSidebar({ activeTab, onTabChange }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isSuperAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // New logic: Handle switching tabs or navigating back to dashboard
  const handleTabClick = (tab: Tab) => {
    if (location.pathname !== "/admin") {
      // If we are on /admin/users, etc., go back to dashboard with the tab in URL
      navigate(`/admin?tab=${tab}`);
    } else {
      // If we are already on the dashboard, just change the state
      onTabChange(tab);
    }
  };

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          borderBottom: "1px solid var(--admin-border)",
        }}
      >
        <div
          style={{
            background: "var(--admin-primary)",
            width: 34,
            height: 34,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="diamond" size={18} color="#fff" />
        </div>
        <div>
          <p
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--admin-text)",
              lineHeight: 1.2,
            }}
          >
            LuxeMarket
          </p>
          <p style={{ fontSize: "0.68rem", color: "var(--admin-muted)" }}>
            Admin Panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "0.75rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.15rem",
        }}
      >
        {NAV.map((item) => (
          <button
            key={item.tab}
            onClick={() => handleTabClick(item.tab)}
            className={`sidebar-nav-item${activeTab === item.tab ? " active" : ""}`}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </button>
        ))}

        {/* Extra links */}
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--admin-border)",
          }}
        >
          <Link
            to="/admin/users"
            className={`sidebar-nav-item${location.pathname === "/admin/users" ? " active" : ""}`}
          >
            <Icon name="manage_accounts" size={20} />
            User Management
          </Link>

          {isSuperAdmin && (
            <>
              <Link
                to="/admin/management"
                className={`sidebar-nav-item${location.pathname === "/admin/management" ? " active" : ""}`}
              >
                <Icon name="group" size={20} />
                Admin Management
              </Link>
              <Link
                to="/admin/analytics"
                className={`sidebar-nav-item${location.pathname === "/admin/analytics" ? " active" : ""}`}
              >
                <Icon name="analytics" size={20} />
                Marketing Analytics
              </Link>
            </>
          )}

          <Link
            to="/"
            className="sidebar-nav-item"
            style={{ color: "var(--admin-muted)", marginTop: "auto" }}
          >
            <Icon name="storefront" size={20} />
            Back to Store
          </Link>
        </div>
      </nav>

      {/* User + logout */}
      <div
        style={{
          padding: "0.875rem",
          borderTop: "1px solid var(--admin-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: 8,
            background: "#F8FAFC",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9999,
              background: "var(--admin-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="person" size={18} color="var(--admin-muted)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--admin-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.name ?? "Admin"}
            </p>
            <p
              style={{
                fontSize: "0.7rem",
                color: isSuperAdmin ? "#7C3AED" : "var(--admin-muted)",
                fontWeight: isSuperAdmin ? 600 : 400,
              }}
            >
              {isSuperAdmin
                ? "⭐ Super Admin"
                : user?.role === "editor"
                  ? "Editor"
                  : "Admin"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item"
          style={{
            width: "100%",
            color: "#DC2626",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Icon name="logout" size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
