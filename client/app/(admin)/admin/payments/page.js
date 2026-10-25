'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate, debounce } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';

const STATUS_OPTIONS = ['', 'success', 'failed', 'pending', 'refunded'];

function RefundModal({ payment, onClose, onRefunded }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRefund = async () => {
    setLoading(true);
    try {
      await api.post(`/admin/payments/${payment._id}/refund`, { reason });
      toast.success('Payment marked as refunded');
      onRefunded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Mark as Refunded">
      <div style={{ marginBottom: 20 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>Payment</p>
          <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15 }}>{formatCurrency(payment.amount)}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{payment.user?.firstName} {payment.user?.lastName}</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'monospace', marginTop: 4 }}>{payment.paystackReference}</p>
        </div>
        <Input
          label="Refund Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Customer requested cancellation"
        />
      </div>
      <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={loading} onClick={handleRefund}>Mark as Refunded</Button>
      </div>
    </Modal>
  );
}

function DetailModal({ payment, onClose, onRefund }) {
  if (!payment) return null;
  return (
    <Modal isOpen={true} onClose={onClose} title="Payment Details">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Date', formatDate(payment.createdAt)],
            ['Amount', formatCurrency(payment.amount)],
            ['Status', null],
            ['Type', payment.type || '-'],
          ].map(([label, value]) => (
            <div key={label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{label}</p>
              {label === 'Status'
                ? <Badge status={payment.status} />
                : <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>{value}</p>
              }
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Member</p>
          <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>{payment.user?.firstName} {payment.user?.lastName}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{payment.user?.email}</p>
        </div>

        {payment.description && (
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Description</p>
            <p style={{ color: 'var(--text)', fontSize: 14 }}>{payment.description}</p>
          </div>
        )}

        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Paystack Reference</p>
          <p style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: 13 }}>{payment.paystackReference || '-'}</p>
        </div>

        {payment.Subscription?.plan && (
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Plan</p>
            <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14 }}>{payment.Subscription.plan.name}</p>
          </div>
        )}

        <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {payment.status === 'success' && (
            <Button variant="danger" onClick={() => onRefund(payment)}>Mark as Refunded</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPaymentsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const canSeeRevenue = user?.role === 'admin';
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' });
  const [sortOrder, setSortOrder] = useState('desc');
  const [detailModal, setDetailModal] = useState(null);
  const [refundModal, setRefundModal] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, sort: `createdAt:${sortOrder}` });
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.from)   params.set('from', filters.from);
      if (filters.to)     params.set('to', filters.to);
      const { data } = await api.get(`/admin/payments?${params}`);
      const list = Array.isArray(data) ? data : (data.payments || data.rows || []);
      setPayments(list);
      setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
      setTotal(data.total || data.pagination?.total || list.length);
    } catch { setPayments([]); } finally { setLoading(false); }
  }, [page, filters, sortOrder]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((val) => {
      setFilters((prev) => ({ ...prev, search: val }));
      setPage(1);
    }, 400),
    []
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({ limit: 10000 });
      if (filters.status) params.set('status', filters.status);
      if (filters.from)   params.set('from', filters.from);
      if (filters.to)     params.set('to', filters.to);
      const { data } = await api.get(`/admin/payments?${params}`);
      const rows = Array.isArray(data) ? data : (data.payments || []);
      const header = 'Date,Member,Email,Description,Amount,Status,Reference';
      const lines = rows.map((p) =>
        [
          formatDate(p.createdAt),
          `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim(),
          p.user?.email || '',
          `"${p.description || ''}"`,
          p.amount,
          p.status,
          p.paystackReference || '',
        ].join(',')
      );
      const csv = [header, ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `apex-payments-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div style={{ maxWidth: 1200, animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        @media (max-width: 640px) {
          .apex-pay-filters { grid-template-columns: 1fr 1fr !important; }
          .apex-pay-filters > :first-child { grid-column: 1 / -1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Finance</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.8px', margin: 0 }}>Payment History</h1>
        </div>
        <Button variant="accent" size="sm" onClick={handleExportCSV}>↓ Export CSV</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Records', value: total, icon: '📋' },
          ...(canSeeRevenue ? [{ label: 'Page Revenue', value: formatCurrency(totalRevenue), icon: '💰' }] : []),
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px' }}>
            <p style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-0.5px' }}>{s.value}</p>
            <p style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="apex-pay-filters" style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 12, alignItems: 'end' }}>
        <Input placeholder="Search reference or description..." onChange={(e) => debouncedSearch(e.target.value)} />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: filters.status ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 14, outline: 'none', cursor: 'pointer' }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => handleFilterChange('from', e.target.value)}
          placeholder="From"
          style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: filters.from ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 14, outline: 'none', colorScheme: 'dark' }}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => handleFilterChange('to', e.target.value)}
          placeholder="To"
          style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: filters.to ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 14, outline: 'none', colorScheme: 'dark' }}
        />
        <select
          value={sortOrder}
          onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
          style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none', cursor: 'pointer' }}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.8fr 1.2fr 1fr 1fr 1.8fr 90px', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--row-hover)', minWidth: 780 }}>
            {['Date', 'Member', 'Description', 'Amount', 'Status', 'Reference', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          ) : payments.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>💳</p>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No payments found.</p>
            </div>
          ) : (
            payments.map((payment, i) => (
              <div
                key={payment._id || i}
                style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.8fr 1.2fr 1fr 1fr 1.8fr 90px', gap: 14, padding: '14px 20px', borderBottom: i < payments.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background 0.15s', minWidth: 780 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--row-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(payment.createdAt)}</span>
                <div>
                  <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{payment.user?.firstName} {payment.user?.lastName}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 11 }}>{payment.user?.email}</p>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{payment.description || '-'}</span>
                <span style={{ color: payment.status === 'refunded' ? 'var(--muted)' : 'var(--accent-text)', fontWeight: 800, fontSize: 14, textDecoration: payment.status === 'refunded' ? 'line-through' : 'none' }}>
                  {formatCurrency(payment.amount || 0)}
                </span>
                <Badge status={payment.status || 'pending'} />
                <span style={{ color: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {payment.paystackReference || '-'}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setDetailModal(payment)}>View</Button>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
          <span style={{ padding: '8px 16px', color: 'var(--muted)', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
        </div>
      )}

      {detailModal && (
        <DetailModal
          payment={detailModal}
          onClose={() => setDetailModal(null)}
          onRefund={(p) => { setDetailModal(null); setRefundModal(p); }}
        />
      )}

      {refundModal && (
        <RefundModal
          payment={refundModal}
          onClose={() => setRefundModal(null)}
          onRefunded={fetchPayments}
        />
      )}
    </div>
  );
}
