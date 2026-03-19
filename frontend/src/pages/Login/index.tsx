import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // ?next= param — where to redirect after successful login
  const next = new URLSearchParams(location.search).get('next') ?? null;

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError('');
    setLoading(true);
    const role = await login(email, password);
    setLoading(false);
    if (role) {
      if (next) { navigate(next, { replace: true }); return; }
      const adminRoles = ['super_admin', 'admin', 'editor'];
      if (adminRoles.includes(role)) navigate('/admin');
      else navigate('/');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '1.5rem 5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stone)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase', fontStyle: 'italic' }}>LuxeMarket</span>
        </Link>
        <span style={{ fontSize: '0.875rem', color: 'var(--slate-muted)' }}>
          New here?{' '}
          <Link to="/signup" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 }}>Create an account</Link>
        </span>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div className="anim-scale-in" style={{ width: '100%', maxWidth: 440, background: '#fff', padding: '3rem', borderRadius: 12, boxShadow: 'var(--shadow-md)', border: '1px solid var(--stone)' }}>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h2>
            <p style={{ color: 'var(--slate-muted)', fontSize: '0.875rem' }}>Please enter your details to sign in to your account.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="lux-label">Email Address</label>
              <input
                className="lux-input"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={handleKey}
                placeholder="your@email.com"
                type="email"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="lux-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="lux-input"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={handleKey}
                  placeholder="••••••••"
                  type={showPass ? 'text' : 'password'}
                  style={{ paddingRight: '3rem' }}
                  autoComplete="current-password"
                />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Icon name={showPass ? 'visibility_off' : 'visibility'} size={20} />
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <a href="#" style={{ fontSize: '0.75rem', color: 'var(--slate-muted)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Forgot Password?</a>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
                <Icon name="warning" size={16} color="#EF4444" />
                <p style={{ fontSize: '0.82rem', color: '#991B1B', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '1rem', borderRadius: 8, letterSpacing: '0.15em', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>

        </div>
      </main>

      {/* Footer Decoration */}
      <footer style={{ padding: '2rem', display: 'flex', justifyContent: 'center', opacity: 0.3, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: '3rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 300 }}>
          {['Quality', 'Craft', 'Minimalism'].map(t => <span key={t}>{t}</span>)}
        </div>
      </footer>
    </div>
  );
}
