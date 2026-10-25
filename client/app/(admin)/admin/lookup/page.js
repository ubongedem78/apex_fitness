'use client';
import PaymentTools from '@/components/PaymentTools';

export default function AdminLookupPage() {
  return (
    <div style={{ maxWidth: 820, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Payments</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Lookup &amp; Reports</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
          Look up any payment by reference, or generate a printable payment report.
        </p>
      </div>
      <PaymentTools lookupUrl="/admin/payments/lookup" />
    </div>
  );
}
