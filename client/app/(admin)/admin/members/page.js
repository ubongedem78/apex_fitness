'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatDate, getInitials, debounce } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import ActivateSubscriptionModal from '@/components/ActivateSubscriptionModal';

function AssignPTModal({ member, onClose, onSuccess }) {
  const toast = useToast();
  const [trainers,  setTrainers]  = useState([]);
  const [current,   setCurrent]   = useState(null);
  const [selected,  setSelected]  = useState('');
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [removing,  setRemoving]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [trainerRes, assignRes] = await Promise.all([
          api.get('/trainers?limit=100'),
          api.get('/receptionist/pt-assignments'),
        ]);
        setTrainers(trainerRes.data?.data ?? []);
        const all = assignRes.data?.assignments ?? [];
        const memberId = member.id || member._id;
        setCurrent(all.find((a) => a.userId === memberId) || null);
      } catch (e) {
        toast.error('Failed to load PT data');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const trainerName = (t) => {
    if (!t) return 'Unknown';
    const u = t.User || t.user;
    return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
  };

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post('/receptionist/pt-assign', {
        userId:    member.id || member._id,
        trainerId: selected,
        notes:     notes.trim() || undefined,
      });
      toast.success('Personal trainer assigned.');
      onSuccess();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Assignment failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await api.delete(`/receptionist/pt-assign/${member.id || member._id}`);
      toast.success('Trainer removed.');
      onSuccess();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Removal failed.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Assign Personal Trainer - ${member.firstName} ${member.lastName}`}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ width: 28, height: 28, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {current && (
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Current Trainer</p>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{trainerName(current.Trainer)}</p>
              </div>
              <Button variant="ghost" size="sm" loading={removing} onClick={handleRemove} style={{ color: '#ff6666', borderColor: 'rgba(255,50,50,0.25)' }}>
                Remove
              </Button>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 6 }}>
              {current ? 'Change to' : 'Select Trainer'}
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ width: '100%', padding: '11px 13px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 10, color: selected ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 14, outline: 'none', marginBottom: 10 }}
            >
              <option value="">Select a trainer...</option>
              {trainers.map((t) => (
                <option key={t.id || t._id} value={t.id || t._id}>
                  {trainerName(t)}{t.specialties?.length ? ` - ${t.specialties.slice(0, 2).join(', ')}` : ''}
                </option>
              ))}
            </select>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 6 }}>
              Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fitness goals, schedule preferences..."
              rows={3}
              style={{ width: '100%', padding: '11px 13px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--text)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="accent" loading={saving} disabled={!selected} onClick={handleAssign}>
              {current ? 'Reassign' : 'Assign Trainer'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}


function MemberDetailPanel({ member, plans, onClose, onStatusChange }) {
  const toast                   = useToast();
  const [loading,       setLoading]       = useState(false);
  const [showActivate,  setShowActivate]  = useState(false);
  const [showPTAssign,  setShowPTAssign]  = useState(false);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await api.put(`/admin/members/${member.id || member._id}/${action}`);
      toast.success(`Member ${action}d`);
      onStatusChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSub = member.Subscriptions?.[0]?.status === 'active' ||
                       member.subscription?.status === 'active';

  const sub = member.Subscriptions?.[0] || member.subscription;
  const subCancelled = !!sub?.cancelledAt;
  const locker = member.locker;
  const accessTone = { active: '#16a34a', expiring: '#d97706', cancelled: '#dc2626', expired: '#dc2626', none: 'var(--muted)' };

  return (
    <>
      <Modal isOpen={!!member} onClose={onClose} title="Member Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
            <div style={{
              width: 'clamp(120px, 42vw, 150px)', height: 'clamp(120px, 42vw, 150px)', borderRadius: 18,
              background: member.avatarUrl ? 'transparent' : 'var(--accent)', color: 'var(--accent-fg)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 46, fontWeight: 900, flexShrink: 0, border: '1px solid var(--border)',
            }}>
              {member.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(member.firstName, member.lastName)}
            </div>
            <div>
              <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: 18 }}>
                {member.firstName} {member.lastName}
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{member.email}</p>
              {member.phone && (
                <p style={{ color: 'var(--muted)', fontSize: 12 }}>{member.phone}</p>
              )}
            </div>
            <Badge status={member.status || 'active'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Joined',       formatDate(member.createdAt)],
              ['Plan',         member.Subscriptions?.[0]?.plan?.name || member.subscription?.plan?.name || 'No Plan'],
              ['Sub Status',   member.Subscriptions?.[0]?.status || member.subscription?.status || '-'],
              ['Renews',       member.Subscriptions?.[0]?.endDate ? formatDate(member.Subscriptions[0].endDate) : (member.subscription?.endDate ? formatDate(member.subscription.endDate) : '-')],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>{k}</p>
                <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{v}</p>
              </div>
            ))}
          </div>

          {subCancelled && (
            <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
                Membership cancelled{sub?.endDate ? ` - access until ${formatDate(sub.endDate)}` : ''}. Will not renew.
              </p>
            </div>
          )}

          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>🔒 Locker</p>
            {locker ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: accessTone[locker.accessStatus] || 'var(--text)', textTransform: 'capitalize' }}>{locker.accessStatus}</span>
                  {locker.cancelled && locker.canAccess && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 20, padding: '1px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cancelled</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{locker.accessMessage}</p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>No locker rental</p>
            )}
          </div>

          {member.recentBookings?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700,
                letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                Recent Bookings
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {member.recentBookings.slice(0, 3).map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 12,
                    color: 'var(--text-secondary)', padding: '6px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span>{b.class?.name || 'Class'}</span>
                    <span>{formatDate(b.class?.date || b.date)}</span>
                    <Badge status={b.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8,
            flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button
              variant="accent"
              onClick={() => setShowActivate(true)}
              title="Manually activate a subscription (cash/POS/transfer)"
            >
              ✓ Activate Sub
            </Button>
            <Button variant="ghost" onClick={() => setShowPTAssign(true)}>
              🏋️ Assign PT
            </Button>
            {member.isActive === false ? (
              <Button variant="ghost" loading={loading} onClick={() => handleAction('reactivate')}>
                Reactivate
              </Button>
            ) : (
              <Button variant="danger" loading={loading} onClick={() => handleAction('suspend')}>
                Suspend
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {showActivate && (
        <ActivateSubscriptionModal
          member={member}
          plans={plans}
          onClose={() => setShowActivate(false)}
          onSuccess={() => { setShowActivate(false); onStatusChange(); }}
        />
      )}
      {showPTAssign && (
        <AssignPTModal
          member={member}
          onClose={() => setShowPTAssign(false)}
          onSuccess={() => { setShowPTAssign(false); }}
        />
      )}
    </>
  );
}

export default function AdminMembersPage() {
  const toast       = useToast();
  const [members,   setMembers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages] = useState(1);
  const [selected,  setSelected]  = useState(null);
  const [plans,     setPlans]     = useState([]);
  const [filters,   setFilters]   = useState({ search: '', status: '', plan: '' });

  useEffect(() => { fetchPlans(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMembers(); }, [filters, page]);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/memberships/plans');
      setPlans(data.data?.plans || data.plans || []);
    } catch {}
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.plan)   params.set('planId', filters.plan);
      const { data } = await api.get(`/admin/members?${params}`);
      setMembers(data.members || data.data?.members || data || []);
      setTotalPages(data.totalPages || data.data?.totalPages || 1);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((val) => {
      setFilters(p => ({ ...p, search: val }));
      setPage(1);
    }, 400),
    []
  );

  const handleViewMember = async (member) => {
    try {
      const { data } = await api.get(`/admin/members/${member.id || member._id}`);
      const payload = data.data || data;
      setSelected(payload.user
        ? { ...payload.user, recentBookings: payload.recentBookings, recentPayments: payload.recentPayments, locker: payload.locker }
        : payload);
    } catch {
      setSelected(member);
    }
  };

  const selectStyle = {
    padding: '12px 14px', background: 'var(--surface2)',
    border: '1px solid var(--border-strong)', borderRadius: 12,
    color: 'var(--text)', fontSize: 14, cursor: 'pointer', outline: 'none',
  };

  return (
    <div style={{ maxWidth: 1200, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800,
          letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)',
          letterSpacing: '-2px', textTransform: 'uppercase' }}>Members</h1>
      </div>

      <div className="apex-classes-filters" style={{
        background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
        padding: '16px 20px', marginBottom: 20,
        display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end',
      }}>
        <Input
          placeholder="Search by name or email…"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
        <select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          style={{ ...selectStyle, color: filters.status ? 'var(--text)' : 'var(--text-tertiary)' }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={filters.plan}
          onChange={(e) => { setFilters(p => ({ ...p, plan: e.target.value })); setPage(1); }}
          style={{ ...selectStyle, color: filters.plan ? 'var(--text)' : 'var(--text-tertiary)' }}
        >
          <option value="">All Plans</option>
          {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>

        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 130px', gap: 16,
          padding: '13px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--row-stripe)', minWidth: 700,
        }}>
          {['Member', 'Email', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid var(--accent-border)',
              borderTopColor: 'var(--accent)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : members.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '50px 0', fontSize: 14 }}>
            No members found
          </p>
        ) : (
          members.map((m, i) => (
            <div key={m.id || m._id} style={{
              display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 130px', gap: 16,
              padding: '14px 24px',
              borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center', cursor: 'pointer',
              background: i % 2 === 1 ? 'var(--row-stripe)' : 'transparent',
              transition: 'background 0.15s', minWidth: 700,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--row-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 1 ? 'var(--row-stripe)' : 'transparent'; }}
              onClick={() => handleViewMember(m)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--accent)', color: 'var(--accent-fg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 900, flexShrink: 0,
                }}>
                  {getInitials(m.firstName, m.lastName)}
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
                  {m.firstName} {m.lastName}
                </span>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{m.email}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {m.Subscriptions?.[0]?.MembershipPlan?.name || m.subscription?.plan?.name || '-'}
              </span>
              <Badge status={m.status || (m.isActive === false ? 'suspended' : 'active')} />
              <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{formatDate(m.createdAt)}</span>
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => handleViewMember(m)}>View</Button>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
          <span style={{ padding: '8px 16px', color: 'var(--muted)', fontSize: 13 }}>
            Page {page} of {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}

      {selected && (
        <MemberDetailPanel
          member={selected}
          plans={plans}
          onClose={() => setSelected(null)}
          onStatusChange={() => { setSelected(null); fetchMembers(); }}
        />
      )}
    </div>
  );
}
