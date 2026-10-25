import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        position: 'relative',
      }}
    >

      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, var(--glow-1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, var(--glow-2) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      <Link
        href="/"
        style={{
          textDecoration: 'none',
          marginBottom: 40,
          position: 'relative',
          zIndex: 1,
          display: 'inline-block',
        }}
      >
        <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', letterSpacing: '-0.5px' }}>
          APEX<span style={{ color: 'var(--accent-text)' }}>FITNESS</span>
        </span>
      </Link>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {children}
      </div>
    </div>
  );
}
