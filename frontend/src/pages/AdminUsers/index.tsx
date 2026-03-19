import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Icon from '../../components/common/Icon';
import api from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StoreUser {
  id: number; name: string; email: string; role: string;
  avatar_url?: string; status: string;
  member_since?: string; last_login?: string; admin_note?: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: '#D1FAE5', color: '#065F46', label: 'Active'    },
  suspended: { bg: '#FEF3C7', color: '#92400E', label: 'Suspended' },
  blocked:   { bg: '#FEE2E2', color: '#991B1B', label: 'Blocked'   },
  inactive:  { bg: '#F1F5F9', color: '#64748B', label: 'Inactive'  },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── User Detail Panel ─────────────────────────────────────────────────────────
function UserDetailPanel({ user, onClose, onUpdate }: {
  user: StoreUser; onClose: () => void; onUpdate: (u: StoreUser) => void;
}) {
  const { show: toast } = useToast();
  const { user: currentUser } = useAuth();
  const [note, setNote]       = useState(user.admin_note ?? '');
  const [saving, setSaving]   = useState(false);
  const ss = STATUS_STYLE[user.status] ?? STATUS_STYLE.inactive;

  const setStatus = async (status: string) => {
    setSaving(true);
    try {
      const res = await api.patch(`/users/${user.id}`, { status });
      onUpdate(res.data);
      toast(`${user.name} ${status === 'active' ? 'reactivated' : status}`, status === 'active' ? 'success' : status === 'blocked' ? 'error' : 'info');
    } catch (e: any) { toast(e?.response?.data?.detail ?? 'Failed to update status', 'error'); }
    finally { setSaving(false); }
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/users/${user.id}`, { admin_note: note });
      onUpdate(res.data);
      toast('Note saved', 'success');
    } catch { toast('Failed to save note', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/users/${user.id}`);
      toast(`${user.name} deleted`, 'error');
      onClose();
      onUpdate({ ...user, status: 'deleted' });
    } catch (e: any) { toast(e?.response?.data?.detail ?? 'Failed to delete user', 'error'); }
    finally { setSaving(false); }
  };

  const isSelf = user.id === currentUser?.id;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(26,26,26,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:540, boxShadow:'0 24px 64px rgba(0,0,0,0.18)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ padding:'1.5rem', borderBottom:'1px solid var(--admin-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontSize:'1.05rem', fontWeight:700 }}>User Profile</h3>
          <button className="btn-icon" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {/* Avatar + info */}
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.name} style={{ width:60, height:60, borderRadius:9999, objectFit:'cover', border:'2px solid var(--admin-border)' }} />
              : <div style={{ width:60, height:60, borderRadius:9999, background:'#E2E8F0', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="person" size={28} color="#94A3B8" /></div>}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <p style={{ fontWeight:700, fontSize:'1rem' }}>{user.name}</p>
                {isSelf && <span style={{ fontSize:'0.65rem', background:'#F0FDF4', color:'#059669', padding:'0.1rem 0.4rem', borderRadius:9999, fontWeight:700 }}>You</span>}
              </div>
              <p style={{ fontSize:'0.82rem', color:'var(--admin-muted)' }}>{user.email}</p>
              <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.4rem' }}>
                <span style={{ display:'inline-block', padding:'0.15rem 0.65rem', borderRadius:9999, fontSize:'0.68rem', fontWeight:700, background:ss.bg, color:ss.color }}>{ss.label}</span>
                <span style={{ display:'inline-block', padding:'0.15rem 0.65rem', borderRadius:9999, fontSize:'0.68rem', fontWeight:700, background:'#EDE9FE', color:'#5B21B6' }}>{user.role.replace('_',' ')}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.75rem' }}>
            {[
              { label: 'Member Since', value: fmtDate(user.member_since) },
              { label: 'Last Login',   value: fmtDate(user.last_login) },
            ].map(s => (
              <div key={s.label} style={{ background:'#F8FAFC', border:'1px solid var(--admin-border)', borderRadius:8, padding:'0.875rem', textAlign:'center' }}>
                <p style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--admin-muted)', marginBottom:'0.3rem' }}>{s.label}</p>
                <p style={{ fontWeight:700, fontSize:'0.925rem' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Admin note */}
          <div>
            <label className="lux-label">Internal Note (admin only)</label>
            <textarea className="lux-input" value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Add a private note about this user…" style={{ resize:'vertical' }} />
            <button className="btn-admin-ghost" style={{ marginTop:'0.5rem', fontSize:'0.78rem' }} onClick={saveNote} disabled={saving}>
              <Icon name="save" size={15} />Save Note
            </button>
          </div>

          {/* Actions */}
          {!isSelf && (
            <div style={{ borderTop:'1px solid var(--admin-border)', paddingTop:'1.25rem' }}>
              <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--admin-muted)', marginBottom:'0.75rem' }}>Account Actions</p>
              <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
                {user.status !== 'active' && (
                  <button className="btn-admin-ghost" style={{ color:'#059669', borderColor:'#059669' }} onClick={() => setStatus('active')} disabled={saving}>
                    <Icon name="check_circle" size={15} />Reactivate
                  </button>
                )}
                {user.status !== 'suspended' && (
                  <button className="btn-admin-ghost" style={{ color:'#D97706', borderColor:'#D97706' }} onClick={() => setStatus('suspended')} disabled={saving}>
                    <Icon name="pause_circle" size={15} />Suspend
                  </button>
                )}
                {user.status !== 'blocked' && (
                  <button className="btn-admin-ghost" style={{ color:'#DC2626', borderColor:'#DC2626' }} onClick={() => setStatus('blocked')} disabled={saving}>
                    <Icon name="block" size={15} />Block
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Danger zone */}
          {!isSelf && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div>
                <p style={{ fontWeight:700, fontSize:'0.85rem', color:'#991B1B' }}>Delete Account</p>
                <p style={{ fontSize:'0.75rem', color:'#B91C1C', marginTop:'0.15rem' }}>Permanently removes all user data. Cannot be undone.</p>
              </div>
              <button onClick={handleDelete} disabled={saving}
                style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.5rem 0.9rem', background:'#DC2626', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font-body)', fontWeight:600, fontSize:'0.8rem', cursor:'pointer', whiteSpace:'nowrap', opacity:saving?0.7:1 }}>
                <Icon name="delete_forever" size={16} color="#fff" />Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const { show: toast } = useToast();
  const [users, setUsers]             = useState<StoreUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<StoreUser | null>(null);
  const [panelClosed,  setPanelClosed]  = useState(false);
  const { userId } = useParams<{ userId?: string }>();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/?limit=100&role=customer');
      setUsers(res.data);
    } catch { toast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Auto-open panel if deep-linked
  const autoUser = (!panelClosed && userId) ? users.find(u => u.id === Number(userId)) : undefined;
  const panelUser = selectedUser ?? (autoUser || null);

  const openPanel  = (u: StoreUser) => { setPanelClosed(false); setSelectedUser(u); };
  const closePanel = () => { setSelectedUser(null); setPanelClosed(true); };

  const updateUser = (updated: StoreUser, openPanelAfter = true) => {
    if (updated.status === 'deleted') {
      setUsers(prev => prev.filter(u => u.id !== updated.id));
    } else {
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      if (openPanelAfter) setSelectedUser(updated);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:       users.length,
    active:    users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    blocked:   users.filter(u => u.status === 'blocked').length,
  };

  const STATS = [
    { label:'Total Users',    value:counts.all,       icon:'group',        color:'var(--admin-primary)' },
    { label:'Active',         value:counts.active,    icon:'check_circle', color:'#059669' },
    { label:'Suspended',      value:counts.suspended, icon:'pause_circle', color:'#D97706' },
    { label:'Blocked',        value:counts.blocked,   icon:'block',        color:'#DC2626' },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar activeTab="overview" onTabChange={() => {}} />
      <div className="admin-main">
        <header style={{ position:'sticky', top:0, zIndex:30, background:'rgba(246,247,248,0.9)', backdropFilter:'blur(8px)', borderBottom:'1px solid var(--admin-border)', padding:'0.875rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontSize:'1.15rem', fontWeight:700 }}>User Management</h1>
            <p style={{ fontSize:'0.78rem', color:'var(--admin-muted)', marginTop:'0.1rem' }}>Manage customer accounts — block, suspend, or remove access</p>
          </div>
          <button className="btn-admin-ghost" onClick={fetchUsers}>
            <Icon name="download" size={16} />Refresh
          </button>
        </header>

        <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.1rem' }}>
            {STATS.map((s, i) => (
              <div key={s.label} className={`stat-card anim-fade-in anim-delay-${i+1}`} style={{ cursor:'pointer' }}
                onClick={() => setStatusFilter((['all','active','suspended','blocked'] as const)[i])}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                  <p style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--admin-muted)' }}>{s.label}</p>
                  <Icon name={s.icon} size={18} color={s.color} style={{ opacity:0.5 }} />
                </div>
                <p style={{ fontSize:'1.75rem', fontWeight:800, color:s.color }}>
                  {loading ? '—' : s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
            <div className="admin-search" style={{ flex:1, maxWidth:380 }}>
              <Icon name="search" size={18} color="var(--admin-muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" />
            </div>
            <div style={{ display:'flex', gap:'0.4rem' }}>
              {(['all','active','suspended','blocked'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding:'0.4rem 0.85rem', borderRadius:9999, fontSize:'0.75rem', fontWeight:600, border:'1.5px solid var(--admin-border)', cursor:'pointer', transition:'all 0.2s', fontFamily:'var(--font-body)',
                    background: statusFilter===s ? 'var(--admin-primary)' : '#fff',
                    color: statusFilter===s ? '#fff' : 'var(--admin-muted)',
                    borderColor: statusFilter===s ? 'var(--admin-primary)' : 'var(--admin-border)' }}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            <p style={{ fontSize:'0.78rem', color:'var(--admin-muted)', marginLeft:'auto' }}>{filtered.length} users</p>
          </div>

          {/* Table */}
          <div className="card-section anim-fade-in anim-delay-2">
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>{['User','Email','Status','Joined','Last Login','Actions'].map((h,i) => <th key={h} style={{textAlign:i===5?'right':'left'}}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading
                    ? <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--admin-muted)' }}>Loading users…</td></tr>
                    : filtered.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--admin-muted)' }}>No users found</td></tr>
                      : filtered.map(u => {
                          const ss = STATUS_STYLE[u.status] ?? STATUS_STYLE.inactive;
                          return (
                            <tr key={u.id}>
                              <td>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.7rem' }}>
                                  {u.avatar_url
                                    ? <img src={u.avatar_url} alt={u.name} style={{ width:36, height:36, borderRadius:9999, objectFit:'cover', flexShrink:0, border:'1px solid var(--admin-border)' }} />
                                    : <div style={{ width:36, height:36, borderRadius:9999, background:'#E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="person" size={18} color="#94A3B8" /></div>}
                                  <button onClick={() => openPanel(u)}
                                    style={{ fontWeight:600, fontSize:'0.875rem', background:'none', border:'none', cursor:'pointer', color:'var(--admin-primary)', textDecoration:'underline', textDecorationStyle:'dotted', fontFamily:'var(--font-body)', textAlign:'left' }}>
                                    {u.name}
                                  </button>
                                </div>
                              </td>
                              <td style={{ color:'var(--admin-muted)', fontSize:'0.82rem' }}>{u.email}</td>
                              <td><span style={{ padding:'0.2rem 0.6rem', borderRadius:9999, fontSize:'0.7rem', fontWeight:700, background:ss.bg, color:ss.color }}>{ss.label}</span></td>
                              <td style={{ color:'var(--admin-muted)', fontSize:'0.82rem' }}>{fmtDate(u.member_since)}</td>
                              <td style={{ color:'var(--admin-muted)', fontSize:'0.82rem' }}>{fmtDate(u.last_login)}</td>
                              <td style={{ textAlign:'right' }}>
                                <div style={{ display:'flex', gap:'0.25rem', justifyContent:'flex-end' }}>
                                  <button className="btn-icon primary" title="View profile" onClick={() => openPanel(u)}>
                                    <Icon name="manage_accounts" size={17} />
                                  </button>
                                  {u.status === 'active' && (
                                    <button className="btn-icon" title="Suspend user" style={{ color:'#D97706' }}
                                      onClick={async (e) => { e.stopPropagation(); try { const r = await api.patch(`/users/${u.id}`,{status:'suspended'}); updateUser(r.data, false); toast(`${u.name} suspended`,'info'); } catch { toast('Failed','error'); } }}>
                                      <Icon name="pause_circle" size={17} />
                                    </button>
                                  )}
                                  {u.status !== 'active' && (
                                    <button className="btn-icon" title="Reactivate user" style={{ color:'#059669' }}
                                      onClick={async (e) => { e.stopPropagation(); try { const r = await api.patch(`/users/${u.id}`,{status:'active'}); updateUser(r.data, false); toast(`${u.name} reactivated`,'success'); } catch { toast('Failed','error'); } }}>
                                      <Icon name="check_circle" size={17} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                  }
                </tbody>
              </table>
            </div>
            <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--admin-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:'0.78rem', color:'var(--admin-muted)' }}>Showing {filtered.length} of {users.length} users</p>
            </div>
          </div>
        </div>
      </div>

      {panelUser && panelUser.status !== 'deleted' && (
        <UserDetailPanel user={panelUser} onClose={closePanel} onUpdate={updateUser} />
      )}
    </div>
  );
}
