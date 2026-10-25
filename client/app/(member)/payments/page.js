'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { formatDate, formatCurrency } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageError from '@/components/ui/PageError';

export default function PaymentsPage() {
  const [page,      setPage]      = useState(1);
  const [sortOrder, setSortOrder] = useState('desc');

  const params = new URLSearchParams({ page, limit: 15, sort: `createdAt:${sortOrder}` });
  const { data, isValidating: isLoading, error, mutate } = useSWR(`/payments?${params}`);

  const payments   = data?.payments || data || [];
  const totalPages = data?.totalPages || 1;

  if (error && !data) return <PageError onRetry={mutate} />;

  return (
    <div style={{ maxWidth: 1000, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <p className="apex-member-label">Billing</p>
        <h1 className="apex-member-h1">Payment History</h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <select
          value={sortOrder}
          onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
          style={{
            padding: '9px 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 13,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr',
            padding: '14px 24px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--row-hover)',
            minWidth: 560,
          }}
        >
          {['Date', 'Description', 'Amount', 'Status', 'Reference'].map((h) => (
            <span
              key={h}
              style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}
            >
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>💳</p>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>No payment history found.</p>
          </div>
        ) : (
          payments.map((payment, i) => (
            <div
              key={payment._id || i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr',
                padding: '16px 24px',
                borderBottom: i < payments.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
                minWidth: 560,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--row-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {formatDate(payment.createdAt || payment.date)}
              </span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>
                {payment.description || payment.type || 'Subscription Payment'}
              </span>
              <span
                style={{
                  color: payment.status === 'refunded' ? 'var(--muted)' : 'var(--accent)',
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: payment.status === 'refunded' ? 'line-through' : 'none',
                }}
              >
                {formatCurrency(payment.amount || 0)}
              </span>
              <div style={{ display: 'flex' }}>
                <Badge status={payment.status || 'success'} />
              </div>
              <span
                style={{
                  color: 'var(--text-tertiary)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {payment.paystackReference || '-'}
              </span>
            </div>
          ))
        )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </Button>
          <span style={{ padding: '8px 16px', color: 'var(--muted)', fontSize: 13 }}>
            Page {page} of {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
