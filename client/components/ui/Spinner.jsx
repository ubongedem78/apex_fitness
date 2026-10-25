'use client';

const sizes = {
  sm: 16,
  md: 24,
  lg: 36,
};

export default function Spinner({ size = 'md' }) {
  const px = sizes[size] || sizes.md;
  return (
    <div
      style={{
        width: px,
        height: px,
        border: `2px solid var(--accent-border)`,
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}
