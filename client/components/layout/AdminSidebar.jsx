'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Members',   href: '/admin/members',   icon: '👥' },
  { label: 'Classes',   href: '/admin/classes',   icon: '🗓️' },
  { label: 'Trainers',  href: '/admin/trainers',  icon: '🏋️' },
  { label: 'Plans',     href: '/admin/plans',     icon: '💳', adminOnly: true },
  { label: 'PT Plans',  href: '/admin/pt-plans',  icon: '💪', adminOnly: true },
  { label: 'Team',      href: '/admin/team',      icon: '🧑‍💼', adminOnly: true },
  { label: 'Payments',  href: '/admin/payments',  icon: '💰' },
  { label: 'Lookup & Reports', href: '/admin/lookup', icon: '🔎' },
  { label: 'Reports',   href: '/admin/reports',   icon: '📈' },
  { label: 'Audit Log', href: '/admin/audit',     icon: '🧾', adminOnly: true },
  { label: 'Settings',  href: '/admin/settings',  icon: '⚙️', adminOnly: true },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); router.push('/'); };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>

      <div
        className={`apex-sidebar-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
      />

      <aside className={`apex-sidebar${isOpen ? ' open' : ''}`}>

        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8, flexShrink: 0 }}>
          <Link
            href="/"
            onClick={handleNavClick}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.5px' }}>
              APEX<span style={{ color: 'var(--accent-text)' }}>FITNESS</span>
            </span>
          </Link>
        </div>

        {user && (
          <div
            style={{
              margin: '8px 12px 16px',
              padding: '14px',
              background: 'var(--accent-dim)',
              borderRadius: 14,
              border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', gap: 12,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
                color: '#1b1b19',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 13, flexShrink: 0,
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--accent-text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {user.role}
              </p>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '0 8px', marginBottom: 8 }}>
            {user?.role === 'manager' ? 'Manager Panel' : 'Admin Panel'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.filter((item) => user?.role === 'admin' || !item.adminOnly).map((item) => {
              const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 12,
                    textDecoration: 'none',
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'var(--accent-fg)' : 'var(--muted)',
                    fontWeight: active ? 700 : 500,
                    fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; } }}
                >
                  <span style={{ fontSize: 17 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div style={{ padding: '16px 12px 0', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 12,
              background: 'rgba(255,50,50,0.06)',
              border: '1px solid rgba(255,50,50,0.15)',
              color: '#ff6666',
              fontWeight: 600, fontSize: 14,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,50,50,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,50,50,0.06)'; }}
          >
            <span style={{ fontSize: 17 }}>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
