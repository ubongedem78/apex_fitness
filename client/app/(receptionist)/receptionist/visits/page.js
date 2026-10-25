'use client';
import useSWR from 'swr';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';

const fetcher = (url) => api.get(url).then((r) => r.data);

function formatTime(visitTime) {
  if (!visitTime) return '-';
  const [h, m] = visitTime.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function VisitsPage() {
  const { data, isLoading, mutate } = useSWR('/receptionist/visits/today', fetcher, {
    refreshInterval: 30_000,
  });

  const visits = data?.visits ?? [];
  const total  = data?.total  ?? 0;
  const date   = data?.date   ?? '';

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 4 }}>
            Today&rsquo;s Visits
          </h1>
          {date && (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{formatDate(date)}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            borderRadius: 12, padding: '10px 18px', textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-1px', lineHeight: 1 }}>
              {isLoading ? '…' : total}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Check-ins
            </p>
          </div>
          <button
            onClick={() => mutate()}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border-strong)',
              borderRadius: 10, padding: '9px 14px',
              color: 'var(--muted)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      )}

      {!isLoading && visits.length === 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
          padding: 48, textAlign: 'center',
          boxShadow: 'var(--card-shadow)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🏃</div>
          <p style={{ color: 'var(--muted)', fontSize: 15, fontWeight: 500 }}>No check-ins yet today.</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>
            Members will appear here as they check in.
          </p>
        </div>
      )}

      {!isLoading && visits.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
          overflow: 'hidden', boxShadow: 'var(--card-shadow)',
        }}>
          {visits.map((visit, idx) => {
            const member   = visit.User;
            const location = visit.Location;
            const initials = member ? getInitials(member.firstName, member.lastName) : '?';
            const dispNum  = member?.memberNumber ? String(100000 + member.memberNumber) : '-';

            return (
              <div
                key={visit.id || idx}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: 'clamp(12px,2.5vw,18px) clamp(16px,3vw,24px)',
                  borderBottom: idx < visits.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >

                <span style={{ minWidth: 28, fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: 'center', flexShrink: 0 }}>
                  {total - idx}
                </span>

                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: member?.avatarUrl ? 'transparent' : 'linear-gradient(135deg,#f9a97b,#b85e2a)',
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 15, color: '#1b1b19',
                }}>
                  {member?.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member ? `${member.firstName} ${member.lastName}` : 'Unknown'}
                  </p>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12, fontFamily: 'monospace', letterSpacing: '1.5px', marginTop: 1 }}>
                    #{dispNum}
                  </p>
                </div>

                {location && (
                  <span style={{
                    flexShrink: 0, fontSize: 12, fontWeight: 600, color: 'var(--muted)',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '4px 10px',
                    display: 'none',
                  }}
                  className="apex-visits-location"
                  >
                    {location.name}
                  </span>
                )}

                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--accent-text)' }}>
                    {formatTime(visit.visitTime)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (min-width: 520px) {
          .apex-visits-location { display: inline-flex !important; align-items: center; }
        }
      `}</style>
    </div>
  );
}
