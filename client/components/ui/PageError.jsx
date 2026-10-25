'use client';
import Button from './Button';

export default function PageError({ onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: 300, gap: 14, textAlign: 'center',
    }}>
      <span style={{ fontSize: 36 }}>⚠️</span>
      <div>
        <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
          Something went wrong
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Couldn&apos;t load your data. Check your connection and try again.
        </p>
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
