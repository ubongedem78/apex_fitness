'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import useSWR from 'swr';

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function paymentLabel(tx) {
  if (tx.description) return tx.description;
  if (tx.Subscription?.plan?.name) {
    return `${tx.Subscription.plan.name} - ${tx.Subscription.plan.billingCycle}`;
  }
  if (tx.type === 'one_time') return 'One-time payment';
  return 'Payment';
}

function StatusPill({ status }) {
  const colors = {
    success:  { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e',  dot: '#22c55e'  },
    failed:   { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444',  dot: '#ef4444'  },
    refunded: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b',  dot: '#f59e0b'  },
    pending:  { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', dot: '#94a3b8'  },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, background: c.bg }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: 'capitalize' }}>{status}</span>
    </span>
  );
}

export default function ReceptionistPaymentsPage() {
  const toast = useToast();
  const [confirming, setConfirming] = useState(null);

  const [payments, setPayments]     = useState([]);
  const [txLoading, setTxLoading]   = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [statusFilter, setStatus]   = useState('');
  const [fromDate, setFrom]         = useState('');
  const [toDate, setTo]             = useState('');
  const [search, setSearch]         = useState('');

  const fetchPayments = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      if (fromDate)     params.set('from', fromDate);
      if (toDate)       params.set('to', toDate);
      if (search)       params.set('search', search);
      const { data } = await api.get(`/receptionist/payments?${params}`);

      const list = Array.isArray(data) ? data : (data?.data || []);
      setPayments(list);
      setTotalPages(data?.pagination?.totalPages || 1);
      setTotal(data?.pagination?.total || list.length);
    } catch {
      setPayments([]);
    } finally {
      setTxLoading(false);
    }
  }, [page, statusFilter, fromDate, toDate, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const { data: ptData, isValidating: ptLoading, mutate: mutatePT } = useSWR('/receptionist/pt-requests');
  const ptRequests = ptData?.ptRequests || [];
  const pendingPTs = ptRequests.filter((r) => r.status === 'pending');

  const handleConfirm = async (id) => {
    setConfirming(id);
    try {
      await api.put(`/receptionist/pt-requests/${id}/confirm`);
      toast.success('Payment confirmed');
      mutatePT();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm payment');
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div style={{ maxWidth: 1040, animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        @media (max-width: 680px) {
          .apex-pay-hdr   { display: none !important; }
          .apex-pay-row   { grid-template-columns: 1fr !important; gap: 3px !important; padding: 14px 16px !important; }
          .apex-pt-hdr    { display: none !important; }
          .apex-pt-row    { grid-template-columns: 1fr !important; gap: 3px !important; padding: 14px 16px !important; }
          .apex-filter-row{ flex-direction: column !important; }
        }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Receptionist</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Payments</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>All transactions on the platform, plus offline PT payment requests.</p>
      </div>

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', margin: 0 }}>PT Payment Requests</h2>
          {pendingPTs.length > 0 && (
            <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: '#e53935', color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
              {pendingPTs.length}
            </span>
          )}
        </div>

        {ptLoading && !ptData ? (
          <div style={{ padding: '30px 0', textAlign: 'center' }}>
            <div style={{ width: 22, height: 22, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : ptRequests.length === 0 ? (
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No PT requests yet.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div className="apex-pt-hdr" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {['Member', 'Package', 'Amount', 'Status', 'Requested', 'Action'].map((h) => (
                <p key={h} style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', margin: 0 }}>{h}</p>
              ))}
            </div>
            {[...ptRequests].sort((a, b) => {
              const o = { pending: 0, paid: 1, assigned: 2, cancelled: 3 };
              return (o[a.status] ?? 9) - (o[b.status] ?? 9);
            }).map((req, i, arr) => {
              const u = req.User || req.user || {};
              const name = u.firstName ? `${u.firstName} ${u.lastName}` : 'Unknown';
              const num  = u.memberNumber ? String(100000 + u.memberNumber) : '-';
              return (
                <div key={req.id} className="apex-pt-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '16px 24px', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: req.status === 'pending' ? 'rgba(249,169,123,0.03)' : 'transparent' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, marginBottom: 1 }}>{name}</p>
                    <p style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'monospace', letterSpacing: 1 }}>#{num}</p>
                    {req.reference && <p style={{ color: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'monospace', marginTop: 1 }}>{req.reference}</p>}
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{(req.sessions || req.plan?.sessions) ? `${req.sessions || req.plan?.sessions} sessions` : req.durationMonths ? `${req.durationMonths} mo${req.durationMonths !== 1 ? 's' : ''}` : '-'}</p>
                  <p style={{ color: 'var(--accent-text)', fontSize: 13, fontWeight: 700 }}>{formatCurrency(parseFloat(req.totalAmount))}</p>
                  <div><Badge status={req.status} /></div>
                  <p style={{ color: 'var(--muted)', fontSize: 12 }}>{formatDateShort(req.createdAt)}</p>
                  <div>
                    {req.status === 'pending' ? (
                      <Button variant="accent" size="sm" loading={confirming === req.id} onClick={() => handleConfirm(req.id)}>
                        Confirm
                      </Button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'capitalize' }}>
                        {req.status === 'paid' ? 'Confirmed' : req.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', margin: 0 }}>
              Transaction History
              {total > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>({total} records)</span>}
            </h2>
          </div>
        </div>

        <div className="apex-filter-row" style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={handleFilterChange(setSearch)}
            placeholder="Search by reference or description..."
            style={{ flex: 1, minWidth: 180, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 13, outline: 'none' }}
          />
          <select value={statusFilter} onChange={handleFilterChange(setStatus)} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: statusFilter ? 'var(--text)' : 'var(--muted)', fontSize: 13, outline: 'none' }}>
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <input type="date" value={fromDate} onChange={handleFilterChange(setFrom)} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: fromDate ? 'var(--text)' : 'var(--muted)', fontSize: 13, outline: 'none' }} />
          <input type="date" value={toDate} onChange={handleFilterChange(setTo)} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: toDate ? 'var(--text)' : 'var(--muted)', fontSize: 13, outline: 'none' }} />
        </div>

        {txLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : payments.length === 0 ? (
          <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>💳</p>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              {search || statusFilter || fromDate || toDate ? 'No transactions match your filters.' : 'No transactions recorded yet.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div className="apex-pay-hdr" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr', gap: 12, padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                {['Member', 'For', 'Amount', 'Status', 'Date'].map((h) => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', margin: 0 }}>{h}</p>
                ))}
              </div>

              {payments.map((tx, i) => {
                const u    = tx.User || tx.user || {};
                const name = u.firstName ? `${u.firstName} ${u.lastName}` : 'Unknown';
                const num  = u.memberNumber ? String(100000 + u.memberNumber) : null;
                return (
                  <div key={tx.id} className="apex-pay-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr', gap: 12, padding: '16px 24px', alignItems: 'center', borderBottom: i < payments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, marginBottom: 1 }}>{name}</p>
                      {num && <p style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'monospace', letterSpacing: 1 }}>#{num}</p>}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.4 }}>{paymentLabel(tx)}</p>
                    <p style={{ color: 'var(--accent-text)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {formatCurrency(parseFloat(tx.amount))}
                    </p>
                    <StatusPill status={tx.status} />
                    <p style={{ color: 'var(--muted)', fontSize: 12 }}>{formatDateShort(tx.createdAt)}</p>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
                  ← Prev
                </button>
                <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 80, textAlign: 'center' }}>
                  Page {page} of {totalPages}
                </span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
