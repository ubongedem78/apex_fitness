'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PaymentReportPrint() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const type = sp.get('type') || 'all';
    const period = sp.get('period') || 'day';
    const date = sp.get('date') || '';
    api.get(`/receptionist/payment-report?type=${type}&period=${period}&date=${encodeURIComponent(date)}`)
      .then(({ data }) => setReport(data))
      .catch((e) => setError(e.response?.data?.message || 'Could not load the report. Make sure you are signed in as staff.'))
      .finally(() => setLoading(false));
  }, []);

  const typeLabel = { all: 'All Payments', membership: 'Membership', pt: 'Personal Training', locker: 'Locker' };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1b1b19', padding: '32px 20px' }}>
      <style>{`
        @media print { .no-print { display: none !important; } }
        @page { margin: 14mm; }
        body { background: #ffffff !important; }
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <button onClick={() => window.print()}
            style={{ background: '#215235', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Print / Save as PDF
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#666' }}>Loading report…</p>
        ) : error ? (
          <p style={{ color: '#b00' }}>{error}</p>
        ) : report && (
          <>

            <div style={{ borderBottom: '2px solid #1b1b19', paddingBottom: 16, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }}>
                APEX<span style={{ color: '#b85e2a' }}>FITNESS</span>
              </p>
              <h1 style={{ margin: '10px 0 2px', fontSize: 26, fontWeight: 800 }}>Payment Report</h1>
              <p style={{ margin: 0, fontSize: 14, color: '#555' }}>
                {typeLabel[report.type] || 'Payments'} · {report.periodLabel}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                Generated {new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Total Collected</p>
                <p style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 900, color: '#215235' }}>{formatCurrency(report.total || 0)}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Transactions</p>
                <p style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 900 }}>{report.count || 0}</p>
              </div>
              {report.byType && Object.entries(report.byType).map(([k, v]) => (
                <div key={k}>
                  <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>{k}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700 }}>{formatCurrency(v)}</p>
                </div>
              ))}
            </div>

            {report.items && report.items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #1b1b19', textAlign: 'left' }}>
                    <th style={{ padding: '8px 6px' }}>Date</th>
                    <th style={{ padding: '8px 6px' }}>Reference</th>
                    <th style={{ padding: '8px 6px' }}>Member</th>
                    <th style={{ padding: '8px 6px' }}>Type</th>
                    <th style={{ padding: '8px 6px' }}>Description</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e4e0d8' }}>
                      <td style={{ padding: '7px 6px', whiteSpace: 'nowrap' }}>{fmtDate(it.date)}</td>
                      <td style={{ padding: '7px 6px', fontFamily: 'monospace', fontSize: 11 }}>{it.reference || '-'}</td>
                      <td style={{ padding: '7px 6px' }}>{it.member}</td>
                      <td style={{ padding: '7px 6px' }}>{it.type}</td>
                      <td style={{ padding: '7px 6px', color: '#555' }}>{it.description}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{formatCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #1b1b19' }}>
                    <td colSpan={5} style={{ padding: '10px 6px', fontWeight: 800, textAlign: 'right' }}>Total</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 900, fontSize: 14 }}>{formatCurrency(report.total || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p style={{ color: '#888', fontSize: 14 }}>No payments recorded for this period.</p>
            )}

            <p style={{ marginTop: 28, fontSize: 11, color: '#aaa', textAlign: 'center' }}>
              Apex Fitness &amp; Wellness · This report was generated from the Apex Fitness platform.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
