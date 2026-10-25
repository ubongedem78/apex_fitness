'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDate, formatCurrency, formatTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

function StatCard({ icon, label, value, sub, loading }) {
  return (
    <div
      style={{
        background: 'var(--surface)', borderRadius: 20,
        border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)',
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
      {loading ? (
        <div style={{ height: 36, background: 'var(--surface2)', borderRadius: 8, marginBottom: 8 }} />
      ) : (
        <p style={{ fontSize: 34, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-1.5px', marginBottom: 4 }}>
          {value}
        </p>
      )}
      <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
        {label}
      </p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.revenue || 0), 1);
  const chartH = 120;

  return (
    <svg width="100%" height={chartH + 40} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(((d.revenue || 0) / max) * chartH, 2);
        const barW = 32;
        const x = i * (barW + 16) + barW / 2;
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect x={i * (barW + 16)} y={y} width={barW} height={barH} rx={6} fill="var(--accent)" fillOpacity={0.85} />
            <text x={x} y={chartH + 16} textAnchor="middle" fill="var(--muted)" fontSize={11} fontWeight={600}>
              {d.month}
            </text>
            <text x={x} y={y - 6} textAnchor="middle" fill="var(--text-secondary)" fontSize={10}>
              {d.revenue >= 1000000 ? `₦${(d.revenue / 1000000).toFixed(1)}M` : d.revenue >= 1000 ? `₦${(d.revenue / 1000).toFixed(0)}k` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const canSeeRevenue = user?.role === 'admin';
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOverview(); }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/reports/overview');
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  const stats          = overview?.stats          || {};
  const recentMembers  = overview?.recentMembers  || [];
  const todaysClasses  = overview?.todaysClasses  || [];
  const revenueByMonth = overview?.revenueByMonth || [];

  return (
    <div style={{ maxWidth: 1200, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          Overview
        </p>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>
          Dashboard
        </h1>
      </div>

      <div className="apex-grid-4" style={{ gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="Total Members"    value={loading ? '-' : (stats.totalMembers ?? 0).toLocaleString()} loading={loading} />
        {canSeeRevenue && (
          <StatCard icon="💰" label="Monthly Revenue"  value={loading ? '-' : formatCurrency(stats.monthlyRevenue || 0)}  loading={loading} />
        )}
        <StatCard icon="✅" label="Active Subs"      value={loading ? '-' : (stats.activeSubscriptions ?? 0).toLocaleString()} loading={loading} />
        <StatCard icon="🗓" label="Classes This Week" value={loading ? '-' : (stats.classesThisWeek ?? 0).toLocaleString()}  loading={loading} />
      </div>

      <div className="apex-admin-main-row" style={{ display: 'grid', gridTemplateColumns: canSeeRevenue ? '1.4fr 1fr' : '1fr', gap: 20, marginBottom: 20 }}>

        {canSeeRevenue && (
          <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.3px' }}>
              Revenue - Last 6 Months
            </h2>
            {loading ? (
              <div style={{ height: 140, background: 'var(--surface2)', borderRadius: 12 }} />
            ) : revenueByMonth.length > 0 ? (
              <RevenueChart data={revenueByMonth} />
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>No revenue data available</p>
            )}
          </div>
        )}

        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.3px' }}>
            Today&apos;s Classes
          </h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 48, background: 'var(--surface2)', borderRadius: 10 }} />)}
            </div>
          ) : todaysClasses.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>No classes today</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todaysClasses.slice(0, 5).map((cls, i) => (
                <div
                  key={cls._id || i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cls.name}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {formatTime(cls.startTime)} • {cls.location?.name}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 700 }}>
                      {cls.enrolledCount || 0}/{cls.capacity}
                    </p>
                    <Badge status={cls.status || 'scheduled'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Recent Sign-ups
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr',
              padding: '12px 24px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface2)', minWidth: 520,
            }}
          >
            {['Member', 'Email', 'Plan', 'Joined'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                {h}
              </span>
            ))}
          </div>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3].map((i) => <div key={i} style={{ height: 44, background: 'var(--surface2)', borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : recentMembers.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No members yet</p>
          ) : (
            recentMembers.map((m, i) => (
              <div
                key={m._id || i}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr',
                  padding: '14px 24px',
                  borderBottom: i < recentMembers.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                  minWidth: 520,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
                  {m.firstName} {m.lastName}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>{m.email}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {m.subscription?.plan?.name || 'No Plan'}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{formatDate(m.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
