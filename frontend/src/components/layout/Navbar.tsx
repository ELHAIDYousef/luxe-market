import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';

export default function Navbar() {
  const { items } = useCart();
  const { isAuthenticated, isAdmin, isSuperAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Sync search input with URL ?q= param when on storefront
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') ?? '';
    setSearch(q);
  }, [location.search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = () => {
    const q = search.trim();
    if (q) navigate(`/?q=${encodeURIComponent(q)}`);
    else   navigate('/');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLogout = () => { logout(); setShowDropdown(false); navigate('/'); };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(250,249,246,0.94)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--cream-muted)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

        {/* ── Left: Logo + Nav ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexShrink: 0 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="diamond" size={26} color="var(--ink)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              LuxeMarket
            </span>
          </Link>
          <nav style={{ display: 'flex', gap: '1.75rem' }} className="hidden md:flex">
            {[['/', 'Home'], ['/?cat=Furniture', 'Furniture'], ['/?cat=Decor', 'Decor'], ['/?cat=Lighting', 'Lighting']].map(([path, label]) => (
              <Link key={label} to={path} style={{
                fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--slate-muted)',
                transition: 'color 0.2s',
                paddingBottom: '2px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--slate-muted)')}
              >{label}</Link>
            ))}
          </nav>
        </div>

        {/* ── Centre: Search bar ── */}
        <div style={{ flex: 1, maxWidth: 480, display: 'flex', alignItems: 'center', gap: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', flex: 1,
            background: 'var(--cream-deep)',
            border: '1.5px solid var(--cream-muted)',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '0 0.875rem',
            transition: 'border-color 0.2s',
          }}
          onFocus={() => {}} >
            <Icon name="search" size={17} color="var(--slate-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products…"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '0.83rem', padding: '0.55rem 0.6rem', width: '100%',
                fontFamily: 'var(--font-body)', color: 'var(--ink)',
              }}
            />
            {search && (
              <button onClick={() => { setSearch(''); navigate('/'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-muted)', display: 'flex', padding: '0 0.25rem', flexShrink: 0 }}>
                <Icon name="close" size={15} />
              </button>
            )}
          </div>
          <button onClick={handleSearch} style={{
            background: 'var(--charcoal)', color: '#fff',
            border: 'none', borderRadius: '0 8px 8px 0',
            padding: '0.55rem 1rem',
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
            height: '100%', display: 'flex', alignItems: 'center',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--charcoal-mid)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--charcoal)')}
          >Search</button>
        </div>

        {/* ── Right: Cart + Avatar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>

          {/* Cart — requires login */}
          <button
            onClick={() => isAuthenticated ? navigate('/cart') : navigate('/login?next=/cart')}
            style={{ position: 'relative', padding: '0.45rem', display: 'flex', borderRadius: 9999, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="shopping_cart" size={22} color="var(--ink)" />
            {totalItems > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0, width: 18, height: 18,
                background: 'var(--ink)', color: '#fff', borderRadius: 9999,
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}>{totalItems}</span>
            )}
          </button>

          {/* User dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(v => !v)}
              style={{
                width: 36, height: 36, borderRadius: 9999,
                border: showDropdown ? '2px solid var(--ink)' : '2px solid var(--cream-muted)',
                background: 'var(--cream-deep)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s', padding: 0,
              }}
            >
              <Icon name="person" size={20} color="var(--slate-muted)" />
            </button>

            {showDropdown && (
              <div className="nav-dropdown">
                {isAuthenticated ? (
                  <>
                    <div style={{ padding: '0.75rem 0.85rem 0.5rem', borderBottom: '1px solid var(--cream-muted)', marginBottom: '0.25rem' }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>{user?.name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--slate-muted)', marginTop: '0.1rem' }}>{user?.email}</p>
                      {isSuperAdmin && (
                        <span style={{ display: 'inline-block', marginTop: '0.35rem', background: '#f3e8ff', color: '#7c3aed', padding: '0.15rem 0.6rem', borderRadius: 9999, fontSize: '0.65rem', fontWeight: 700 }}>
                          ⭐ Super Admin
                        </span>
                      )}
                    </div>
                    <Link to="/profile" onClick={() => setShowDropdown(false)}>
                      <div className="nav-dropdown-item">
                        <Icon name="person" size={17} />
                        My Profile
                      </div>
                    </Link>
                    <Link to="/track-order" onClick={() => setShowDropdown(false)}>
                      <div className="nav-dropdown-item">
                        <Icon name="local_shipping" size={17} />
                        Track Order
                      </div>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setShowDropdown(false)}>
                        <div className="nav-dropdown-item">
                          <Icon name="admin_panel_settings" size={17} />
                          Admin Panel
                        </div>
                      </Link>
                    )}
                    <div className="nav-dropdown-divider" />
                    <button className="nav-dropdown-item danger" onClick={handleLogout}>
                      <Icon name="logout" size={17} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setShowDropdown(false)}>
                    <div className="nav-dropdown-item">
                      <Icon name="login" size={17} />
                      Sign In
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
