import { LOCKER_TERMS, TERMS_LAST_UPDATED } from '@/lib/terms';

export const metadata = {
  title: 'Locker Rental Terms & Conditions - Apex Fitness',
};

export default function LockerTermsPage() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 20px 80px' }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
        Apex Vault
      </p>
      <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text)', margin: '0 0 6px' }}>
        Locker Rental Terms &amp; Conditions
      </h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 32px' }}>
        Last updated: {TERMS_LAST_UPDATED}
      </p>

      {LOCKER_TERMS.map(({ title, body }) => (
        <section key={title} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-text)', letterSpacing: 0.3, margin: '0 0 6px' }}>
            {title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.8, margin: 0 }}>
            {body}
          </p>
        </section>
      ))}

      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        These locker rental terms are separate from, and in addition to, the Apex Fitness Membership Terms &amp; Conditions. By subscribing to a locker, you confirm you have read, understood, and agree to all of the above.
      </p>
    </div>
  );
}
