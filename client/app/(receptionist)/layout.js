'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import ReceptionistSidebar from '@/components/layout/ReceptionistSidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { SWRConfig } from 'swr';
import api from '@/lib/api';

const PAGE_TITLES = {
  '/receptionist/checkin':  'Check In',
  '/receptionist/visits':   "Today's Visits",
  '/receptionist/members':  'Members',
  '/receptionist/payments': 'Payments',
};

export default function ReceptionistLayout({ children }) {
  const { isAuthenticated, isStaff, isReceptionist, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) router.push('/login');
      else if (!isStaff && !isReceptionist) router.push('/dashboard');
    }
  }, [loading, isAuthenticated, isStaff, isReceptionist, router]);

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

  if (!isAuthenticated || (!isStaff && !isReceptionist)) return null;

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? 'Front Desk';

  return (
    <SWRConfig value={{ fetcher: (url) => api.get(url).then((r) => r.data), revalidateOnFocus: false, shouldRetryOnError: false }}>
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <ReceptionistSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
