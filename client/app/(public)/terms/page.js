import { MEMBERSHIP_TERMS, TERMS_LAST_UPDATED } from '@/lib/terms';
import TermsSections from '@/components/TermsSections';

export const metadata = {
  title: 'Membership Terms & Conditions - Apex Fitness',
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 20px 80px' }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
        Apex Fitness &amp; Wellness
      </p>
      <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)', margin: '0 0 6px' }}>
        Membership Terms &amp; Conditions
      </h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 36px' }}>
        Last updated: {TERMS_LAST_UPDATED}
      </p>

      <TermsSections terms={MEMBERSHIP_TERMS} />

      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        These terms constitute the full membership agreement between you and Apex Fitness &amp; Wellness. By subscribing, you confirm you have read, understood, and agree to all of the above.
      </p>
    </div>
  );
}
