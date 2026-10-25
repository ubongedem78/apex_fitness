'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const dashboardPath = user?.role && ['admin', 'manager', 'staff'].includes(user.role)
    ? '/admin/dashboard'
    : '/dashboard';

  const NAV_LINKS = [
    { label: 'Home',      href: '/' },
    { label: 'Classes',   href: '/classes' },
    { label: 'Trainers',  href: '/trainers' },
    { label: 'Locations', href: '/locations' },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const linkStyle = (href) => ({
    padding: '8px 16px', borderRadius: 100,
    color: pathname === href ? 'var(--accent-text)' : 'var(--muted)',
    fontWeight: pathname === href ? 700 : 600,
    textDecoration: 'none', fontSize: 14,
    transition: 'color 0.2s, background 0.2s',
    borderBottom: pathname === href ? '2px solid var(--accent-text)' : '2px solid transparent',
    paddingBottom: pathname === href ? 6 : 8,
  });

  const mobileLinkStyle = (href) => ({
    display: 'block',
    padding: '14px 0',
    borderBottom: '1px solid var(--border)',
    color: pathname === href ? 'var(--accent-text)' : 'var(--text)',
    fontWeight: pathname === href ? 700 : 500,
    textDecoration: 'none',
    fontSize: 17,
  });

  return (
    <>
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 48px', height: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          transition: 'background 0.25s ease',
        }}
      >

        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            APEX<span style={{ color: 'var(--accent-text)' }}>FITNESS</span>
          </span>
        </Link>

        <ul
          style={{
            display: 'flex', gap: 4, listStyle: 'none', padding: 0, margin: 0, alignItems: 'center',
          }}
          className="apex-nav-desktop"
        >
          {NAV_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                style={linkStyle(item.href)}
                onMouseEnter={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.background = 'var(--surface2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.color = 'var(--muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="apex-nav-desktop">
          {isAuthenticated && user ? (
            <>
              <Link
                href={dashboardPath}
                style={{
                  padding: '9px 20px', borderRadius: 100,
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  color: 'var(--accent-text)', textDecoration: 'none',
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.3px',
                }}
              >
                Dashboard
              </Link>
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
                  color: '#1b1b19',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 13, letterSpacing: '-0.5px',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                {getInitials(user.firstName, user.lastName)}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  padding: '9px 22px', borderRadius: 100,
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text)', textDecoration: 'none',
                  fontSize: 14, fontWeight: 600, transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                style={{
                  padding: '9px 22px', borderRadius: 100,
                  background: 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
                  color: '#1b1b19', textDecoration: 'none',
                  fontSize: 14, fontWeight: 800, letterSpacing: '0.3px',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="apex-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={{
            display: 'none',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: 8, color: 'var(--text)',
            flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span
            style={{
              display: 'block', width: 22, height: 2,
              background: 'var(--text)', borderRadius: 2,
              transition: 'transform 0.25s ease, opacity 0.25s ease',
              transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
            }}
          />
          <span
            style={{
              display: 'block', width: 22, height: 2,
              background: 'var(--text)', borderRadius: 2,
              transition: 'opacity 0.25s ease',
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: 'block', width: 22, height: 2,
              background: 'var(--text)', borderRadius: 2,
              transition: 'transform 0.25s ease, opacity 0.25s ease',
              transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
            }}
          />
        </button>
      </nav>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 98,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
          }}
        />
      )}

      <div
        ref={menuRef}
        className="apex-mobile-menu"
        style={{
          position: 'fixed', top: 72, left: 0, right: 0, zIndex: 99,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: menuOpen ? '24px 24px 32px' : '0 24px',
          maxHeight: menuOpen ? '100vh' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, padding 0.3s ease',
        }}
      >
        <nav>
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} style={mobileLinkStyle(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isAuthenticated && user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
                    color: '#1b1b19',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 14, flexShrink: 0,
                  }}
                >
                  {getInitials(user.firstName, user.lastName)}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{user.email}</p>
                </div>
              </div>
              <Link
                href={dashboardPath}
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '13px 0', borderRadius: 100,
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  color: 'var(--accent-text)', textDecoration: 'none',
                  fontSize: 14, fontWeight: 700,
                }}
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '13px 0', borderRadius: 100,
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text)', textDecoration: 'none',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                style={{
                  display: 'block', textAlign: 'center',
                  padding: '13px 0', borderRadius: 100,
                  background: 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
                  color: '#1b1b19', textDecoration: 'none',
                  fontSize: 14, fontWeight: 800,
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .apex-nav-desktop { display: none !important; }
          .apex-hamburger { display: flex !important; }
          nav[style] { padding: 0 20px !important; }
        }
      `}</style>
    </>
  );
}
