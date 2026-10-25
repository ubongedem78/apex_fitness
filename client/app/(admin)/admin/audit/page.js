'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 50;

const roleColor = {
  admin: '#f9a97b', manager: '#6fcf97', staff: '#8ab4f8', receptionist: '#c9a7f0', member: 'var(--muted)',
};

function fmt(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAuditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/admin/dashboard');
  }, [user, router]);

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [query, setQuery] = useState({ action: '', dateFrom: '', dateTo: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (query.action) params.set('action', query.action);
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);

    api.get(`/admin/audit?${params}`)
      .then(({ data }) => { if (!cancelled) setLogs(Array.isArray(data) ? data : (data?.data ?? [])); })
      .catch((err) => { if (!cancelled) { setLogs([]); setError(err.response?.data?.message || 'Could not load the audit log'); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, query]);

  const applyFilters = () => { setPage(1); setQuery({ action: search.trim(), dateFrom, dateTo }); };
  const hasNext = logs.length === PAGE_SIZE;

  return (
    <div style={{ maxWidth: 1100, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Audit Log</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Every staff and admin action - who did what, and when. Newest first.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Filter by action (e.g. confirm, members, refund)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          style={{ flex: 1, minWidth: 220, background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 13 }}
        />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '9px 12px', color: dateFrom ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 13 }} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '9px 12px', color: dateTo ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 13 }} />
        <button onClick={applyFilters}
          style={{ background: 'var(--accent)', color: '#1b1b19', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          Apply
        </button>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 2fr 1fr 1fr', gap: 12, padding: '12px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          {['When', 'Who', 'Action', 'Resource', 'IP'].map((h) => (
            <p key={h} style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', margin: 0 }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#e07070', fontSize: 14 }}>{error}</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No activity recorded for this filter.</div>
        ) : (
          logs.map((log, i) => {
            const u = log.User;
            const who = u ? `${u.firstName} ${u.lastName}` : 'System';
            return (
              <div key={log.id || i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 2fr 1fr 1fr', gap: 12, padding: '13px 24px', alignItems: 'center', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <p style={{ color: 'var(--muted)', fontSize: 12, margin: 0 }}>{fmt(log.createdAt)}</p>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{who}</p>
                  {u?.role && <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: roleColor[u.role] || 'var(--muted)' }}>{u.role}</span>}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'monospace', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.action}>{log.action}</p>
                <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>{log.resource || '-'}</p>
                <p style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'monospace', margin: 0 }}>{log.ipAddress || '-'}</p>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
        <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>
          ← Prev
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Page {page}</span>
        <button disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)}
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: !hasNext ? 'not-allowed' : 'pointer', opacity: !hasNext ? 0.4 : 1 }}>
          Next →
        </button>
      </div>
    </div>
  );
}
