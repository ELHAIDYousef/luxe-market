import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useCart } from '../../context/CartContext';
import Icon from '../../components/common/Icon';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQty, subtotal, total, tax } = useCart();

  return (
    <div className="page-container">
      <Navbar />
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4rem', alignItems: 'start' }}>

          {/* Items */}
          <div className="anim-fade-in">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 300, letterSpacing: '-0.03em', marginBottom: '2.5rem' }}>Your Cart</h1>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate-muted)' }}>
                <Icon name="shopping_cart" size={64} />
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Your cart is empty</p>
                <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>Continue Shopping</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {items.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--stone)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div style={{ width: 128, height: 128, borderRadius: 8, overflow: 'hidden', background: 'var(--cream-dark)', flexShrink: 0 }}>
                        <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                        <div>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 500 }}>{item.product.name}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--slate-muted)', marginTop: '0.25rem' }}>{item.selectedFinish}</p>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: 600 }}>${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: 128 }}>
                      <button onClick={() => removeItem(item.product.id)} style={{ color: 'var(--slate-muted)', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                        <Icon name="close" size={20} />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(229,225,216,0.4)', borderRadius: 8, padding: '0.5rem' }}>
                        <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ width: 32, height: 32, borderRadius: 9999, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>−</button>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, width: 16, textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ width: 32, height: 32, borderRadius: 9999, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-muted)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}>
                  <Icon name="arrow_back" size={18} />
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="anim-fade-in anim-delay-1" style={{ background: 'rgba(229,225,216,0.25)', border: '1px solid var(--stone)', borderRadius: 12, padding: '2rem', position: 'sticky', top: 100 }}>
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2rem' }}>Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-muted)', fontSize: '0.9rem' }}>Subtotal</span>
                <span style={{ fontWeight: 500 }}>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ color: 'var(--slate-muted)', fontSize: '0.9rem' }}>Shipping</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-navy)', fontWeight: 500, marginTop: '0.25rem' }}>White-glove delivery</span>
                </div>
                <span style={{ fontWeight: 500 }}>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--stone)', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>${subtotal.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => navigate('/checkout')} className="btn-primary" style={{ width: '100%', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Proceed to Checkout
                <Icon name="lock" size={18} />
              </button>
              <p style={{ fontSize: '0.65rem', textAlign: 'center', color: 'var(--slate-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure checkout powered by Stripe</p>
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--stone)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--slate-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              <Icon name="local_shipping" size={18} />
              Standard delivery arrives in 3–5 business days.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
