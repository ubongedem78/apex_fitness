'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '60px 40px 32px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36, height: 36,
                  background: 'var(--accent)', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14, color: 'var(--accent-fg)',
                }}
              >
                AF
              </div>
              <span style={{ fontWeight: 900, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                APEX <span style={{ color: 'var(--accent-text)' }}>FITNESS</span>
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
              Nigeria&apos;s premium gym network. Forging champions across Lagos, Abuja, and beyond.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {['IG', 'TW', 'FB', 'YT'].map((s) => (
                <div
                  key={s}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--border)', border: '1px solid var(--border-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: 'var(--muted)', cursor: 'pointer',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: 16 }}>
              Company
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['About Us', 'Careers', 'Press', 'Blog'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: 16 }}>
              Membership
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Plans & Pricing', 'Classes', 'Trainers', 'Locations'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: 16 }}>
              Support
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 24, borderTop: '1px solid var(--border)',
          }}
        >
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            © 2026 Apex Fitness Nigeria Ltd. All rights reserved.
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            Made with <span style={{ color: 'var(--accent-text)' }}>♥</span> in Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}
