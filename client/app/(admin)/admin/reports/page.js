'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

function BarChart({ data, valueKey, labelKey, maxWidth = 300 }) {
  if (!data || data.length === 0) return <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No data</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  const chartH = 140;
  const barW = Math.min(40, Math.floor((maxWidth - data.length * 8) / data.length));

  return (
    <svg width="100%" height={chartH + 40} viewBox={`0 0 ${data.length * (barW + 10)} ${chartH + 40}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(((d[valueKey] || 0) / max) * chartH, 2);
        const x = i * (barW + 10);
        const y = chartH - barH;
        const midX = x + barW / 2;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill="var(--accent)" fillOpacity={0.8} />
            <text x={midX} y={chartH + 16} textAnchor="middle" fill="#666" fontSize={10} fontWeight={600}>{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data, valueKey, labelKey }) {
  if (!data || data.length === 0) return <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No data</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  const w = 400;
  const h = 120;
  const padL = 10;
  const padR = 10;
  const padT = 10;
  const padB = 24;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const points = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * plotW;
    const y = padT + (1 - (d[valueKey] || 0) / max) * plotH;
    return `${x},${y}`;
  });

  const areaPoints = [
    `${padL},${padT + plotH}`,
    ...points,
    `${padL + plotW},${padT + plotH}`,
  ].join(' ');

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#lineGrad)" />
      <polyline points={points.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = padL + (i / (data.length - 1)) * plotW;
        const y = padT + (1 - (d[valueKey] || 0) / max) * plotH;
        return <circle key={i} cx={x} cy={y} r={3} fill="var(--accent)" />;
      })}
      {data.map((d, i) => {
        const x = padL + (i / (data.length - 1)) * plotW;
        return <text key={i} x={x} y={h - 4} textAnchor="middle" fill="#666" fontSize={9}>{d[labelKey]}</text>;
      })}
    </svg>
  );
}

function HorizontalBar({ data, valueKey, labelKey }) {
  if (!data || data.length === 0) return <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No data</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{d[labelKey]}</span>
            <span style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 700 }}>{d[valueKey]}</span>
          </div>
          <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
            <div
              style={{
                height: '100%',
                width: `${((d[valueKey] || 0) / max) * 100}%`,
                background: 'var(--accent)',
                borderRadius: 3,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const canSeeRevenue = user?.role === 'admin';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate: dateRange.start, endDate: dateRange.end });
      const { data: d } = await api.get(`/admin/reports?${params}`);
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {};

  return (
    <div style={{ maxWidth: 1200, animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        @media (max-width: 600px) {
          .apex-rep-header { flex-direction: column; align-items: stretch !important; gap: 14px !important; }
          .apex-rep-daterange { width: 100%; }
          .apex-rep-daterange input { flex: 1; min-width: 0; }
        }
      `}</style>
      <div className="apex-rep-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Reports</h1>
        </div>

        <div className="apex-rep-daterange" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
            style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 13, outline: 'none', colorScheme: 'dark' }}
          />
          <span style={{ color: 'var(--text-tertiary)' }}>→</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
            style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 13, outline: 'none', colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div className="apex-grid-4" style={{ gap: 16, marginBottom: 24 }}>
        {[
          ...(canSeeRevenue ? [{ icon: '💰', label: 'Total Revenue', value: formatCurrency(stats.totalRevenue || 0) }] : []),
          { icon: '👥', label: 'New Members', value: (stats.newMembers || 0).toLocaleString() },
          { icon: '🗓', label: 'Total Bookings', value: (stats.totalBookings || 0).toLocaleString() },
          { icon: '📈', label: 'Churn Rate', value: stats.churnRate ? `${stats.churnRate.toFixed(1)}%` : '-' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-1px', marginTop: 10, marginBottom: 4 }}>
              {loading ? '-' : s.value}
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="apex-grid-2" style={{ gap: 20, marginBottom: 20, ...(canSeeRevenue ? {} : { gridTemplateColumns: '1fr' }) }}>

        {canSeeRevenue && (
          <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>Revenue by Month</h3>
            {loading ? (
              <div style={{ height: 160, background: 'var(--surface2)', borderRadius: 10 }} />
            ) : (
              <BarChart data={data?.revenueByMonth || []} valueKey="revenue" labelKey="month" />
            )}
          </div>
        )}

        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>Bookings by Day (Last 30d)</h3>
          {loading ? (
            <div style={{ height: 160, background: 'var(--surface2)', borderRadius: 10 }} />
          ) : (
            <LineChart data={(data?.bookingsByDay || []).slice(-30)} valueKey="count" labelKey="date" />
          )}
        </div>
      </div>

      <div className="apex-grid-2" style={{ gap: 20 }}>

        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>Top Classes</h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4,5].map((i) => <div key={i} style={{ height: 32, background: 'var(--surface2)', borderRadius: 6 }} />)}
            </div>
          ) : (
            <HorizontalBar data={data?.topClasses || []} valueKey="bookings" labelKey="name" />
          )}
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>Member Growth</h3>
          {loading ? (
            <div style={{ height: 160, background: 'var(--surface2)', borderRadius: 10 }} />
          ) : (
            <LineChart data={data?.memberGrowth || []} valueKey="total" labelKey="month" />
          )}
        </div>
      </div>
    </div>
  );
}
