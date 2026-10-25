'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { SWRConfig } from 'swr';
import api from '@/lib/api';

const swrFetcher = (url) => api.get(url).then(res => res.data);

const PAGE_TITLES = {
  '/dashboard':        'Dashboard',
  '/classes':          'My Classes',
  '/bookings':         'My Bookings',
  '/membership':       'Membership',
  '/locker':           'Personal Locker',
  '/personal-trainer': 'Personal Trainer',
  '/payments':         'Payments',
  '/profile':          'Profile',
};

export default function MemberLayout({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.push('/login'); return; }

    if (user?.role) {
      if (['admin', 'manager', 'staff'].includes(user.role)) {
        router.replace('/admin/dashboard');
        return;
      }
      if (user.role === 'receptionist') {
        router.replace('/receptionist/checkin');
        return;
      }
    }

    if (user?.role === 'member' && !user?.cardLast4) {
      router.replace('/register');
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? 'My Fitness';

  return (
    <SWRConfig value={{
      fetcher: swrFetcher,
      revalidateOnFocus: false,

      dedupingInterval: 30000,

      shouldRetryOnError: false,
      onError: (error) => {

        if (
          error?.response?.status === 401 &&
          process.env.NEXT_PUBLIC_DEV_PREVIEW !== 'true' &&
          typeof window !== 'undefined'
        ) {
          localStorage.removeItem('apex_access_token');
          localStorage.removeItem('apex_refresh_token');
          localStorage.removeItem('apex_user');
          window.location.href = '/login';
        }
      },
    }}>
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <MemberSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          <div className="apex-mobile-topbar">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 6, borderRadius: 8, color: 'var(--text)',
                display: 'flex', flexDirection: 'column', gap: 5,
              }}
            >
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{pageTitle}</span>
          </div>

          <main className="apex-dashboard-main" style={{ flex: 1, padding: '40px', overflowY: 'auto', minWidth: 0 }}>
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
    </SWRConfig>
  );
}
