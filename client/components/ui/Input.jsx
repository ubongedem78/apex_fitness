'use client';
import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, ...rest }, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--surface2)',
          border: error ? '1px solid rgba(255,68,68,0.6)' : '1px solid var(--border-strong)',
          borderRadius: 12,
          color: 'var(--text)',
          fontSize: 15,
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? 'rgba(255,68,68,0.8)' : 'var(--accent)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'rgba(255,68,68,0.6)' : 'var(--border-strong)';
        }}
        {...rest}
      />
      {error && (
        <span style={{ fontSize: 12, color: '#ff4444', marginTop: 2 }}>{error}</span>
      )}
    </div>
  );
});

export default Input;
