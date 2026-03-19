import { Link } from 'react-router-dom';
import Icon from '../common/Icon';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--stone)', paddingTop: '5rem', paddingBottom: '2.5rem', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Icon name="diamond" size={28} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>LuxeMarket</span>
            </div>
            <p style={{ color: 'var(--slate-muted)', maxWidth: 340, lineHeight: 1.7, fontSize: '0.9rem' }}>
              The definitive source for high-end Japandi interior design. We believe in quality over quantity, and beauty in simplicity.
            </p>
          </div>
          <div>
            <h5 style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>Explore</h5>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Our Story', 'Collections', 'Sustainability', 'Craftsmanship'].map(item => (
                <li key={item}><Link to="#" style={{ fontSize: '0.875rem', color: 'var(--slate-muted)', transition: 'color 0.2s' }}>{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>Support</h5>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Shipping & Returns', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map(item => (
                <li key={item}><Link to="#" style={{ fontSize: '0.875rem', color: 'var(--slate-muted)', transition: 'color 0.2s' }}>{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--stone)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--slate-muted)', fontWeight: 700 }}>© 2024 LuxeMarket. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Designed for Harmony', 'Curated for Luxury'].map(t => (
              <span key={t} style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--slate-muted)', fontWeight: 700 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
