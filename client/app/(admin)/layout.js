'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { ToastProvider } from '@/components/ui/Toast';

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/members':   'Members',
  '/admin/classes':   'Classes',
  '/admin/trainers':  'Trainers',
  '/admin/plans':     'Plans',
  '/admin/pt-plans':  'PT Plans',
  '/admin/team':      'Team',
  '/admin/payments':  'Payments',
  '/admin/reports':   'Reports',
  '/admin/settings':  'Settings',
};

export default function AdminLayout({ children }) {
  const { isAuthenticated, isStaff, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) router.push('/login');
      else if (!isStaff) router.push('/dashboard');
    }
  }, [loading, isAuthenticated, isStaff, router]);

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

  if (!isAuthenticated || !isStaff) return null;

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? 'Admin';

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
  );
}
