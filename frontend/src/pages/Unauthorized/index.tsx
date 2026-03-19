import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Icon from '../../components/common/Icon';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 9999, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Icon name="block" size={40} color="#EF4444" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, marginBottom: '1rem', color: 'var(--charcoal)' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--slate-muted)', fontSize: '1.1rem', maxWidth: 420, lineHeight: 1.7, marginBottom: '2rem' }}>
          You don't have permission to view this page. Please log in with an account that has the required access level.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-primary" style={{ borderRadius: 9999, padding: '0.875rem 2rem' }}
            onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn-outline" style={{ borderRadius: 9999, padding: '0.875rem 2rem' }}
            onClick={() => navigate('/')}>
            Back to Store
          </button>
        </div>
      </main>
    </div>
  );
}
