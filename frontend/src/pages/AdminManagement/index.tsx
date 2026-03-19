import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Icon from '../../components/common/Icon';
import api from '../../services/api';

interface AdminUser { id: number; name: string; email: string; role: string; status: string; member_since?: string; last_login?: string; avatar_url?: string; }

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: '#f3e8ff', color: '#7c3aed' },
  admin:       { bg: '#dbeafe', color: '#1d4ed8' },
  editor:      { bg: '#dbeafe', color: '#1d4ed8' },
  viewer:      { bg: '#f1f5f9', color: '#475569' },
};
const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', editor: 'Editor', viewer: 'Viewer',
};

function fmtDate(iso?: string) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminManagement() {
  const { user: currentUser } = useAuth();
  const { show: toast } = useToast();
  const [admins, setAdmins]         = useState<AdminUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [savingAdd, setSavingAdd]   = useState(false);
  const [newForm, setNewForm]       = useState({ name:'', email:'', password:'', role:'editor' });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all users, then filter to non-customer roles on client side
      const res = await api.get('/users/?limit=100');
      setAdmins(res.data.filter((u: AdminUser) => u.role !== 'customer'));
    } catch { toast('Failed to load admins', 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleChangeRole = async (id: number, role: string) => {
    try {
      const res = await api.patch(`/users/${id}`, { role });
      setAdmins(prev => prev.map(a => a.id === id ? res.data : a));
      toast('Role updated', 'success');
    } catch (e: any) { toast(e?.response?.data?.detail ?? 'Failed', 'error'); }
  };

  const handleToggleStatus = async (id: number, current: string) => {
    const next = current === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.patch(`/users/${id}`, { status: next });
      setAdmins(prev => prev.map(a => a.id === id ? res.data : a));
      toast('Status updated', 'success');
    } catch { toast('Failed', 'error'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      setAdmins(prev => prev.filter(a => a.id !== id));
      setDeleteTarget(null);
      toast('Admin removed', 'info');
    } catch (e: any) { toast(e?.response?.data?.detail ?? 'Failed', 'error'); }
  };

  const handleAddAdmin = async () => {
    if (!newForm.name || !newForm.email || !newForm.password) { toast('All fields are required', 'error'); return; }
    setSavingAdd(true);
    try {
      // Register via auth endpoint
      const res = await api.post('/auth/register', { name: newForm.name, email: newForm.email, password: newForm.password, role: newForm.role });
      // Then update role since register forces customer
      const updated = await api.patch(`/users/${res.data.user.id}`, { role: newForm.role });
      setAdmins(prev => [...prev, updated.data]);
      setShowAddModal(false);
      setNewForm({ name:'', email:'', password:'', role:'editor' });
      toast(`${newForm.name} added as ${ROLE_LABEL[newForm.role]}`, 'success');
    } catch (e: any) { toast(e?.response?.data?.detail ?? 'Failed to add admin', 'error'); }
    finally { setSavingAdd(false); }
  };

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  );

  const STATS = [
    { label:'Total Admins',   value: admins.length,                                   icon:'group',        color:'var(--admin-primary)' },
    { label:'Active Now',     value: admins.filter(a=>a.status==='active').length,     icon:'check_circle', color:'#059669' },
    { label:'Super Admins',   value: admins.filter(a=>a.role==='super_admin').length,  icon:'star',         color:'#7C3AED' },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar activeTab="overview" onTabChange={() => {}} />
      <div className="admin-main">
        <header style={{ position:'sticky', top:0, zIndex:30, background:'rgba(246,247,248,0.9)', backdropFilter:'blur(8px)', borderBottom:'1px solid var(--admin-border)', padding:'0.875rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:'1.15rem', fontWeight:700 }}>Admin Management</h1>
            <p style={{ fontSize:'0.78rem', color:'var(--admin-muted)', marginTop:'0.1rem' }}>Super Admins only — manage roles, access, and team members</p>
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <Link to="/admin/analytics"><button className="btn-admin-ghost"><Icon name="analytics" size={16} />Analytics</button></Link>
            <button className="btn-admin-primary" onClick={() => setShowAddModal(true)}>
              <Icon name="person_add" size={16} />Add Admin
            </button>
          </div>
        </header>

        <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' }}>
            {STATS.map((s, i) => (
              <div key={s.label} className={`stat-card anim-fade-in anim-delay-${i+1}`}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                  <p style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--admin-muted)' }}>{s.label}</p>
                  <Icon name={s.icon} size={18} color={s.color} style={{ opacity:0.5 }} />
                </div>
                <p style={{ fontSize:'2rem', fontWeight:800, color:s.color }}>{loading ? '—' : s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
            <div className="admin-search" style={{ width:360 }}>
              <Icon name="search" size={18} color="var(--admin-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or role…" />
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button className="btn-admin-ghost"><Icon name="filter_list" size={15} />Filter</button>
              <button className="btn-admin-ghost"><Icon name="download" size={15} />Export</button>
            </div>
          </div>

          {/* Table */}
          <div className="card-section anim-fade-in anim-delay-2">
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>{['Admin Name','Email','Role','Last Login','Status','Actions'].map((h,i)=><th key={h} style={{textAlign:i===5?'right':'left'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading
                    ? <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--admin-muted)' }}>Loading…</td></tr>
                    : filtered.map(admin => {
                        const rb = ROLE_BADGE[admin.role] ?? ROLE_BADGE.viewer;
                        const isSelf = admin.id === currentUser?.id;
                        return (
                          <tr key={admin.id}>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                                {admin.avatar_url
                                  ? <img src={admin.avatar_url} alt={admin.name} style={{ width:38, height:38, borderRadius:9999, objectFit:'cover', border:'1px solid var(--admin-border)' }} />
                                  : <div style={{ width:38, height:38, borderRadius:9999, background:'#E2E8F0', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="person" size={18} color="#94A3B8" /></div>}
                                <div>
                                  <p style={{ fontWeight:600, fontSize:'0.875rem' }}>
                                    {admin.name}
                                    {isSelf && <span style={{ marginLeft:'0.5rem', fontSize:'0.65rem', background:'#F0FDF4', color:'#059669', padding:'0.1rem 0.4rem', borderRadius:9999, fontWeight:700 }}>You</span>}
                                  </p>
                                  <p style={{ fontSize:'0.7rem', color:'var(--admin-muted)' }}>
                                    {admin.member_since ? `Since ${new Date(admin.member_since).toLocaleDateString('en-US',{month:'short',year:'numeric'})}` : '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td style={{ color:'var(--admin-muted)', fontSize:'0.82rem' }}>{admin.email}</td>
                            <td>
                              {!isSelf
                                ? <select value={admin.role} onChange={e => handleChangeRole(admin.id, e.target.value)}
                                    style={{ fontSize:'0.72rem', fontWeight:700, background:rb.bg, color:rb.color, border:'none', borderRadius:9999, padding:'0.25rem 0.6rem', cursor:'pointer', fontFamily:'var(--font-body)', outline:'none' }}>
                                    <option value="super_admin">Super Admin</option>
                                    <option value="editor">Editor</option>
                                  </select>
                                : <span style={{ padding:'0.25rem 0.6rem', borderRadius:9999, fontSize:'0.72rem', fontWeight:700, background:rb.bg, color:rb.color }}>{ROLE_LABEL[admin.role]}</span>
                              }
                            </td>
                            <td style={{ color:'var(--admin-muted)', fontSize:'0.82rem' }}>{fmtDate(admin.last_login)}</td>
                            <td>
                              {!isSelf
                                ? <button onClick={() => handleToggleStatus(admin.id, admin.status)}
                                    style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.78rem', fontWeight:600, background:'none', border:'none', cursor:'pointer', color: admin.status==='active' ? '#059669' : '#64748B', fontFamily:'var(--font-body)' }}>
                                    <span style={{ width:7, height:7, borderRadius:9999, background: admin.status==='active' ? '#059669' : '#CBD5E1', flexShrink:0 }} />
                                    {admin.status==='active' ? 'Active' : 'Inactive'}
                                  </button>
                                : <span style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.78rem', color:'#059669', fontWeight:600 }}>
                                    <span style={{ width:7, height:7, borderRadius:9999, background:'#059669' }} />Active
                                  </span>
                              }
                            </td>
                            <td style={{ textAlign:'right' }}>
                              {!isSelf && (
                                <button className="btn-icon danger" title="Remove admin" onClick={() => setDeleteTarget(admin.id)}>
                                  <Icon name="person_remove" size={17} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
            <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--admin-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:'0.78rem', color:'var(--admin-muted)' }}>Showing {filtered.length} of {admins.length} admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget&&!savingAdd) setShowAddModal(false); }}>
          <div className="modal-content" style={{ maxWidth:460 }}>
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--admin-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontSize:'1.05rem', fontWeight:700 }}>Add New Admin</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)} disabled={savingAdd}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div><label className="lux-label">Full Name</label><input className="lux-input" value={newForm.name} onChange={e => setNewForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Jane Smith" /></div>
              <div><label className="lux-label">Email Address</label><input className="lux-input" type="email" value={newForm.email} onChange={e => setNewForm(f=>({...f,email:e.target.value}))} placeholder="jane@luxemarket.com" /></div>
              <div><label className="lux-label">Temporary Password</label><input className="lux-input" type="password" value={newForm.password} onChange={e => setNewForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters" /></div>
              <div>
                <label className="lux-label">Role</label>
                <select className="lux-input" value={newForm.role} onChange={e => setNewForm(f=>({...f,role:e.target.value}))}>
                  <option value="super_admin">Super Admin — Full access</option>
                  <option value="editor">Editor — Products & orders</option>
                </select>
              </div>
              <div style={{ background:'#F8FAFC', border:'1px solid var(--admin-border)', borderRadius:8, padding:'0.875rem 1rem', fontSize:'0.78rem', color:'var(--admin-muted)' }}>
                <strong style={{ color:'var(--admin-text)' }}>{newForm.role === 'super_admin' ? '⭐ Super Admin:' : newForm.role === 'editor' ? '✏️ Editor:' : '👁️ Viewer:'}</strong>{' '}
                {newForm.role === 'super_admin' ? 'Full access including admin management and analytics.' : newForm.role === 'editor' ? 'Can manage products and orders.' : 'Read-only access to dashboard.'}
              </div>
              <div style={{ display:'flex', gap:'0.75rem', paddingTop:'0.5rem' }}>
                <button className="btn-admin-ghost" style={{flex:1,justifyContent:'center'}} onClick={() => setShowAddModal(false)} disabled={savingAdd}>Cancel</button>
                <button className="btn-admin-primary" style={{flex:1,justifyContent:'center',opacity:savingAdd?0.7:1}} onClick={handleAddAdmin} disabled={savingAdd}>
                  <Icon name="person_add" size={16} />{savingAdd ? 'Adding…' : 'Add Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget !== null && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) setDeleteTarget(null); }}>
          <div className="modal-content" style={{ maxWidth:400 }}>
            <div style={{ padding:'2rem', textAlign:'center' }}>
              <Icon name="person_remove" size={48} color="#DC2626" />
              <h3 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'0.5rem', marginTop:'1rem', color:'var(--admin-text)' }}>Remove Admin?</h3>
              <p style={{ fontSize:'0.875rem', color:'var(--admin-muted)', marginBottom:'1.5rem' }}>This will revoke their access immediately.</p>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button className="btn-admin-ghost" style={{flex:1,justifyContent:'center'}} onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', padding:'0.575rem 1rem', background:'#DC2626', color:'#fff', border:'none', borderRadius:'var(--radius-md)', fontFamily:'var(--font-body)', fontSize:'0.82rem', fontWeight:600, cursor:'pointer' }}
                  onClick={() => handleDelete(deleteTarget)}>
                  <Icon name="person_remove" size={16} />Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
