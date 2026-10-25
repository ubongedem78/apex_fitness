'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const KIND_LABEL = { membership: 'Membership', locker: 'Locker', pt: 'Personal Training' };
const KIND_COLOR = { membership: '#6fcf97', locker: '#8ab4f8', pt: '#f9a97b' };

function fmt(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Row({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function PaymentTools({ lookupUrl }) {
  const [ref, setRef] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [rtype, setRtype] = useState('all');
  const [rperiod, setRperiod] = useState('day');
  const [rdate, setRdate] = useState(() => new Date().toISOString().split('T')[0]);

  const doLookup = async () => {
    if (!ref.trim()) return;
    setLoading(true); setError(''); setResults(null);
    try {
      const { data } = await api.get(`${lookupUrl}?ref=${encodeURIComponent(ref.trim())}`);
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const openReport = () => {
    const params = new URLSearchParams({ type: rtype, period: rperiod, date: rdate });
    window.open(`/print/payment-report?${params}`, '_blank', 'noopener');
  };

  const inputStyle = { background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>

      <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '24px 28px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Find a Payment</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Enter a reference (membership, locker, or PT - e.g. <span style={{ fontFamily: 'monospace' }}>APEX-…</span> or <span style={{ fontFamily: 'monospace' }}>APEX-PT-…</span>) to see its full details.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            placeholder="Payment reference…"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doLookup()}
            style={{ ...inputStyle, flex: 1, minWidth: 220, fontFamily: 'monospace' }}
          />
          <button onClick={doLookup} disabled={loading || !ref.trim()}
            style={{ background: 'var(--accent)', color: '#1b1b19', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: loading || !ref.trim() ? 'not-allowed' : 'pointer', opacity: loading || !ref.trim() ? 0.5 : 1 }}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {error && <p style={{ color: '#e07070', fontSize: 13, marginTop: 14 }}>{error}</p>}

        {results && results.length === 0 && !error && (
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>No payment found for that reference.</p>
        )}

        {results && results.map((r, i) => (
          <div key={i} style={{ marginTop: 16, background: 'var(--surface2)', borderRadius: 14, padding: '18px 20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: KIND_COLOR[r.kind] || 'var(--accent-text)' }}>{KIND_LABEL[r.kind] || r.kind}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent-text)' }}>{formatCurrency(parseFloat(r.amount))}</span>
            </div>
            <Row label="Reference" value={<span style={{ fontFamily: 'monospace' }}>{r.reference}</span>} />
            <Row label="Member" value={r.member ? `${r.member.name}${r.member.memberNumber ? ` · #${r.member.memberNumber}` : ''}` : '-'} />
            <Row label="Status" value={<span style={{ textTransform: 'capitalize' }}>{r.status}</span>} />
            <Row label="Plan" value={r.plan ? r.plan.name : (r.planName || null)} />
            <Row label="Sessions" value={r.sessions ? `${r.sessions} sessions` : null} />
            <Row label="Description" value={r.description} />
            <Row label="Date" value={fmt(r.createdAt)} />
            <Row label="Transaction ID" value={r.transactionId} />
            {r.kind === 'pt' && <Row label="Confirmed" value={r.confirmedAt ? `${fmt(r.confirmedAt)}${r.confirmedBy ? ` by ${r.confirmedBy}` : ''}` : 'Not yet confirmed'} />}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '24px 28px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Generate Payment Report</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Opens a print-ready report - use your browser&apos;s Print → <strong>Save as PDF</strong>.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={rtype} onChange={(e) => setRtype(e.target.value)} style={inputStyle}>
            <option value="all">All payments</option>
            <option value="membership">Membership</option>
            <option value="pt">Personal Training</option>
            <option value="locker">Locker</option>
          </select>
          <select value={rperiod} onChange={(e) => setRperiod(e.target.value)} style={inputStyle}>
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <input type="date" value={rdate} onChange={(e) => setRdate(e.target.value)} style={inputStyle} />
          <button onClick={openReport}
            style={{ background: 'var(--accent)', color: '#1b1b19', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            Open Report
          </button>
        </div>
      </div>
    </div>
  );
}
