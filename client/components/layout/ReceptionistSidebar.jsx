'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import useSWR from 'swr';

const CheckInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H12.5A1.5 1.5 0 0 0 14 12.5V3.5A1.5 1.5 0 0 0 12.5 2H10"/>
    <path d="M5.5 8.5l1.8 1.8 3.2-3.6"/>
    <path d="M6 2h4v2.5H6z" rx="0.5"/>
  </svg>
);

const VisitsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/>
    <path d="M1.5 6.5h13M5 1.5v2M11 1.5v2"/>
    <path d="M4.5 9.5h2M7.5 9.5h2M10.5 9.5h1M4.5 12h2M7.5 12h2"/>
  </svg>
);

const MembersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="5" r="2.5"/>
    <path d="M1 13.5c0-2.21 2.239-4 5-4s5 1.79 5 4"/>
    <path d="M11 2.5a2.5 2.5 0 0 1 0 5M14.5 13c0-1.93-1.567-3.5-3.5-3.5"/>
  </svg>
);

const PaymentsNavIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/>
    <path d="M1.5 7h13M4.5 10.5h3"/>
  </svg>
);
const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6"/>
    <path d="M10.5 11l3.5-3.5L10.5 4M14 7.5H6.5"/>
  </svg>
);

const LookupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

const navItems = [
  { label: 'Check In',       href: '/receptionist/checkin',  Icon: CheckInIcon      },
  { label: "Today's Visits", href: '/receptionist/visits',   Icon: VisitsIcon       },
  { label: 'Members',        href: '/receptionist/members',  Icon: MembersIcon      },
  { label: 'Payments',       href: '/receptionist/payments', Icon: PaymentsNavIcon, badge: true },
  { label: 'Lookup & Reports', href: '/receptionist/lookup', Icon: LookupIcon       },
];

export default function ReceptionistSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const { data: countData } = useSWR('/receptionist/pt-requests/count', { refreshInterval: 60000 });
  const pendingCount = countData?.pending ?? 0;

  const handleLogout   = () => { logout(); router.push('/'); };
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
              width: 38, height: 38, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
              color: '#1b1b19',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13, flexShrink: 0,
            }}>
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--accent-text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Receptionist
              </p>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '0 8px', marginBottom: 8 }}>
            Front Desk
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(({ label, href, Icon, badge }) => {
              const active = pathname === href || pathname.startsWith(href);
              const showBadge = badge && pendingCount > 0;
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
                  <span style={{ flex: 1 }}>{label}</span>
                  {showBadge && (
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      background: '#e53935', color: '#fff',
                      fontSize: 10, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px',
                    }}>
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
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
