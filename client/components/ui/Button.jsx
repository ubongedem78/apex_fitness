'use client';
import Spinner from './Spinner';

const variants = {
  accent: {
    background: 'var(--accent)',
    color: 'var(--accent-fg)',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border-strong)',
  },
  dark: {
    background: 'var(--bg)',
    color: 'var(--accent-text)',
    border: '1px solid var(--accent-border)',
  },
  danger: {
    background: 'rgba(255,50,50,0.1)',
    color: '#ff4444',
    border: '1px solid rgba(255,50,50,0.3)',
  },
};

const sizes = {
  sm: { padding: '7px 16px', fontSize: 13, fontWeight: 700 },
  md: { padding: '11px 24px', fontSize: 14, fontWeight: 700 },
  lg: { padding: '15px 32px', fontSize: 16, fontWeight: 800 },
};

export default function Button({
  variant = 'accent',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  style: extraStyle,
  ...rest
}) {
  const v = variants[variant] || variants.accent;
  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 100,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'opacity 0.2s, transform 0.1s',
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap',
        ...v,
        ...s,
        ...extraStyle,
      }}
      onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={(e) => { if (!isDisabled) e.currentTarget.style.opacity = '1'; }}
      onMouseDown={(e) => { if (!isDisabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
