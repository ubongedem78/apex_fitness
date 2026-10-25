'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>
  </svg>
);
const ClassesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/>
    <path d="M1.5 6.5h13M5 1.5v2M11 1.5v2"/>
    <path d="M4.5 9.5h2M7.5 9.5h2M4.5 12h2M7.5 12h2M10.5 9.5h1.5"/>
  </svg>
);
const BookingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3.5h12M2 8h12M2 12.5h8"/>
    <circle cx="13" cy="12.5" r="2" fill="currentColor" stroke="none" opacity=".35"/>
    <path d="M12 12.5l.8.8 1.7-1.6"/>
  </svg>
);
const MembershipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/>
    <path d="M1.5 7h13M4.5 10.5h3"/>
  </svg>
);
const PaymentsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 2.5h10a1 1 0 0 1 1 1v9l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V3.5a1 1 0 0 1 1-1z"/>
    <path d="M5.5 6.5h5M5.5 9h3.5"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="5.5" r="2.5"/>
    <path d="M2.5 14c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5"/>
  </svg>
);
const LockerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="12" height="13" rx="1.5"/>
    <path d="M6 8.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/>
    <path d="M8 6.5v-2"/>
  </svg>
);
const TrainerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="4.5" r="2"/>
    <path d="M4 14c0-2.21 1.79-4 4-4s4 1.79 4 4"/>
    <path d="M2 9l2-2 2 2M10 9l2-2 2 2"/>
  </svg>
);
const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6"/>
    <path d="M10.5 11l3.5-3.5L10.5 4M14 7.5H6.5"/>
  </svg>
);

const navItems = [
  { label: 'Dashboard',        href: '/dashboard',        Icon: DashboardIcon  },
  { label: 'My Classes',       href: '/classes',          Icon: ClassesIcon    },
  { label: 'My Bookings',      href: '/bookings',         Icon: BookingsIcon   },
  { label: 'Membership',       href: '/membership',       Icon: MembershipIcon },
  { label: 'Locker',           href: '/locker',           Icon: LockerIcon     },
  { label: 'Personal Trainer', href: '/personal-trainer', Icon: TrainerIcon    },
  { label: 'Payments',         href: '/payments',         Icon: PaymentsIcon   },
  { label: 'Profile',          href: '/profile',          Icon: ProfileIcon    },
];

export default function MemberSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const handleLogout  = () => { logout(); router.push('/'); };
  const handleNavClick = () => { if (onClose) onClose(); };

  return (
    <>

      <div
        className={`apex-sidebar-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
      />

      <aside className={`apex-sidebar${isOpen ? ' open' : ''}`}>

        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8, flexShrink: 0 }}>
          <Link href="/" onClick={handleNavClick} style={{ textDecoration: 'none' }}>
            <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.5px' }}>
              APEX<span style={{ color: 'var(--accent-text)' }}>FITNESS</span>
            </span>
          </Link>
        </div>

        {user && (
          <div style={{
            margin: '8px 12px 16px',
            padding: '14px',
            background: 'var(--accent-dim)',
            borderRadius: 14,
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
              background: user.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
              color: '#1b1b19',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13, flexShrink: 0,
            }}>
              {user.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(user.firstName, user.lastName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--accent-text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {user.role === 'member' ? 'Member' : user.role}
              </p>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '0 8px', marginBottom: 8 }}>
            Menu
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(({ label, href, Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={handleNavClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11,
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
                  <Icon />
                  {label}
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
              display: 'flex', alignItems: 'center', gap: 11,
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
            <SignOutIcon />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
