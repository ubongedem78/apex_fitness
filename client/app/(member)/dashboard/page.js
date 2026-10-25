'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import useSWR from 'swr';
import api from '@/lib/api';
import PageError from '@/components/ui/PageError';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import BankCard from '@/components/ui/BankCard';
import { useToast } from '@/components/ui/Toast';

const BOOKINGS_KEY = '/users/bookings?filter=upcoming&limit=3';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Skeleton({ width = '100%', height = 20, radius = 8 }) {
  return (
    <div style={{
      width, height,
      background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%)',
      backgroundSize: '200% 100%', borderRadius: radius, animation: 'shimmer 1.4s infinite',
    }} />
  );
}

function TiltCard({ children, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const glare = card.querySelector('.dash-glare');
    const move = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const r = card.getBoundingClientRect();
      const x = (t.clientX - r.left) / r.width;
      const y = (t.clientY - r.top) / r.height;
      card.style.transform = `rotateY(${((x - 0.5) * 12).toFixed(2)}deg) rotateX(${(-(y - 0.5) * 12).toFixed(2)}deg)`;
      if (glare) {
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(255,255,255,0.30), rgba(255,255,255,0) 46%)`;
      }
    };
    const reset = () => {
      card.style.transform = 'rotateY(0deg) rotateX(0deg)';
      if (glare) glare.style.opacity = '0';
    };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', reset);
    card.addEventListener('touchmove', move, { passive: true });
    card.addEventListener('touchend', reset);
    return () => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerleave', reset);
      card.removeEventListener('touchmove', move);
      card.removeEventListener('touchend', reset);
    };
  }, []);

  return (
    <div className="dash-tilt-wrap">
      <div ref={ref} className="dash-tilt" style={{ position: 'relative', overflow: 'hidden', ...style }}>
        {children}
        <div className="dash-sweep" aria-hidden="true" />
        <div className="dash-glare" aria-hidden="true" />
      </div>
    </div>
  );
}

const STATUS = {
  active:    { label: 'ACTIVE',      color: '#5fe08a' },
  expiring:  { label: 'EXPIRING',    color: '#f0b45f' },
  attention: { label: 'PAYMENT DUE', color: '#f0b45f' },
  paused:    { label: 'PAUSED',      color: '#c9b8a5' },
  cancelled: { label: 'CANCELLED',   color: '#e88a7a' },
  expired:   { label: 'EXPIRED',     color: '#e88a7a' },
};

const MEMBER_CARD = {
  background: 'linear-gradient(160deg, #26261f 0%, #17170f 100%)',
  border: '1px solid rgba(249,169,123,0.28)',
  borderRadius: 20,
  padding: '22px 22px 20px',
  color: '#f4ede6',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 30px rgba(0,0,0,0.4)',
};

const LABEL_ON_CARD = { margin: 0, fontSize: 9.5, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'rgba(244,237,230,0.45)' };
const SECTION_LABEL = { fontSize: 11, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--muted)' };

export default function MemberDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const { data: member, isValidating: memberValidating, error: memberError, mutate: refreshMember } = useSWR('/users/me');
  const { data: bookingsData, isValidating: bookingsValidating, error: bookingsError, mutate: refreshBookings } = useSWR(BOOKINGS_KEY);

  const [cancelModal, setCancelModal] = useState({ open: false, booking: null });
  const [cancelling, setCancelling] = useState(false);

  const loading = (memberValidating || bookingsValidating) && !member;
  const pageError = (memberError || bookingsError) && !member;

  const sub = member?.subscription;
  const stats = member?.stats || {};
  const bookings = bookingsData?.bookings || bookingsData || [];
  const ptAssignment = member?.ptAssignment;
  const totalVisits = member?.totalVisits ?? 0;
  const meUser = member?.user;

  const firstName = user?.firstName || meUser?.firstName || '';
  const fullName = `${firstName} ${user?.lastName || meUser?.lastName || ''}`.trim();
  const displayMemberNumber = meUser?.displayMemberNumber
    || (meUser?.memberNumber ? String(100000 + meUser.memberNumber) : null);

  const today = new Date().toISOString().split('T')[0];
  const cancelledPending = !!sub?.cancelledAt && ['active', 'attention', 'paused'].includes(sub?.status) && sub?.endDate >= today;
  const effStatus = cancelledPending ? 'cancelled' : sub?.status;
  const statusCfg = STATUS[effStatus] || STATUS.active;

  const daysLeft = sub?.endDate ? Math.max(0, Math.ceil((new Date(sub.endDate) - Date.now()) / 86400000)) : null;
  const planDays = sub?.billingCycle === 'annual' ? 365 : sub?.billingCycle === 'quarterly' ? 90 : 30;
  const progress = daysLeft !== null ? Math.max(3, Math.min(100, (daysLeft / planDays) * 100)) : 0;

  const classLimit = sub?.plan?.classLimit || null;
  const booked = stats.classesBookedThisMonth ?? 0;
  const classesLeft = classLimit ? Math.max(0, classLimit - booked) : null;

  const validThru = sub?.endDate
    ? new Date(sub.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
    : null;

  const handleCancelBooking = async () => {
    if (!cancelModal.booking) return;
    setCancelling(true);
    try {
      await api.delete(`/bookings/${cancelModal.booking._id}`);
      toast.success('Booking cancelled successfully');
      setCancelModal({ open: false, booking: null });
      refreshBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (pageError) {
    return <PageError onRetry={() => { refreshMember(); refreshBookings(); }} />;
  }

  return (
    <div className="dash-wrap" style={{ animation: 'fadeIn 0.4s ease' }}>
      <style>{`
        /* Mobile-first: unchanged single 460px column.
           Desktop only (>=900px): widen and split into two columns, so the page
           uses the screen instead of stranding a phone-width strip in the middle. */
        .dash-wrap { max-width: 460px; margin: 0 auto; }
        .dash-grid { display: block; }
        @media (min-width: 900px) {
          .dash-wrap { max-width: 1040px; }
          .dash-grid {
            display: grid;
            grid-template-columns: minmax(0, 430px) minmax(0, 1fr);
            gap: 0 30px;
            align-items: start;
          }
          .dash-col > *:last-child { margin-bottom: 0; }
        }
        @keyframes dashSweep { 0% { transform: translateX(-160%) skewX(-14deg); } 45% { transform: translateX(300%) skewX(-14deg); } 100% { transform: translateX(300%) skewX(-14deg); } }
        @keyframes dashIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .dash-tilt-wrap { perspective: 1000px; animation: dashIn .5s ease both; }
        .dash-tilt { transition: transform .18s ease-out; transform-style: preserve-3d; will-change: transform; }
        .dash-sweep { position: absolute; top: -30%; left: 0; width: 32%; height: 160%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent); animation: dashSweep 6s ease-in-out infinite; pointer-events: none; }
        .dash-glare { position: absolute; inset: 0; opacity: 0; transition: opacity .2s ease; pointer-events: none; mix-blend-mode: screen; }
        @media (prefers-reduced-motion: reduce) {
          .dash-tilt-wrap { animation: none; }
          .dash-tilt { transition: none; }
          .dash-sweep { display: none; }
        }
      `}</style>

      <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)' }}>
        {greeting()}{firstName ? `, ${firstName}` : ''}
      </p>

      <div className="dash-grid">
      <div className="dash-col">
      {loading ? (
        <div style={{ marginBottom: 16 }}><Skeleton height={188} radius={20} /></div>
      ) : (
        <div style={{ marginBottom: sub ? 16 : 14 }}>
          <TiltCard style={MEMBER_CARD}>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
                <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.5px' }}>
                  APEX<span style={{ color: '#f9a97b' }}>FITNESS</span>
                </span>
                {sub && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: statusCfg.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg.color, display: 'inline-block' }} />
                    {statusCfg.label}
                  </span>
                )}
              </div>

              <p style={{ ...LABEL_ON_CARD, letterSpacing: '1.6px', marginBottom: 5 }}>Member number</p>
              <p style={{ margin: '0 0 24px', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 30, fontWeight: 800, letterSpacing: '7px', color: '#f9a97b', lineHeight: 1 }}>
                {displayMemberNumber || '------'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ ...LABEL_ON_CARD, marginBottom: 3 }}>Member</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase' }}>{fullName || '—'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ ...LABEL_ON_CARD, marginBottom: 3 }}>{sub ? `${sub.plan?.name || 'Member'} · valid thru` : 'Status'}</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: '.6px' }}>{sub ? (validThru || '—') : 'NO PLAN'}</p>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      )}

      {!loading && (sub ? (
        <div style={{ padding: '0 4px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {effStatus === 'cancelled' ? 'Access until' : 'Renews'} {formatDate(sub.endDate)}
            </span>
            {daysLeft !== null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-text)' }}>{daysLeft} days left</span>
            )}
          </div>
          <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.6s ease' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {classesLeft !== null ? `${classesLeft} of ${classLimit} classes left` : `${formatCurrency(sub.plan?.price || 0)} / ${sub.billingCycle || 'month'}`}
            </span>
            <Link href="/membership" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 700, color: 'var(--accent-text)' }}>
              {effStatus === 'cancelled' ? 'Reactivate ›' : 'Manage ›'}
            </Link>
          </div>

          {cancelledPending && (
            <p style={{ margin: '12px 0 0', fontSize: 12.5, color: '#e0836f', fontWeight: 600, lineHeight: 1.5 }}>
              Cancelled — you keep full access until {formatDate(sub.endDate)}. No further charges.
            </p>
          )}
        </div>
      ) : (
        <div style={{ padding: '2px 4px 0', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Choose a plan to start training.</span>
          <Link href="/membership" style={{ textDecoration: 'none' }}>
            <Button variant="accent" size="sm">Browse plans</Button>
          </Link>
        </div>
      ))}

      {!loading && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18,
          padding: '18px 6px', marginBottom: 22, display: 'flex', boxShadow: 'var(--card-shadow)',
        }}>
          {[
            { label: 'Booked', value: booked },
            { label: 'Attended', value: stats.classesAttended ?? 0 },
            { label: 'Visits', value: totalVisits },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
              {i > 0 && <div style={{ width: 1, background: 'var(--border-strong)', margin: '2px 0' }} />}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 25, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, color: 'var(--text)' }}>
                  {(s.value ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 6 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>

      <div className="dash-col">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 2px 11px' }}>
        <span style={SECTION_LABEL}>Upcoming</span>
        <Link href="/bookings" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600, color: 'var(--accent-text)' }}>View all</Link>
      </div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18,
        padding: bookings.length ? '4px 18px' : '32px 20px', marginBottom: 24, boxShadow: 'var(--card-shadow)',
      }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 0' }}>
            <Skeleton height={16} width="70%" /><Skeleton height={16} width="55%" />
          </div>
        ) : !bookings.length ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>No upcoming bookings</p>
            <Link href="/classes" style={{ textDecoration: 'none' }}>
              <Button variant="accent" size="sm">Browse classes</Button>
            </Link>
          </div>
        ) : (
          bookings.map((b, i) => {
            const d = new Date(b.class?.date || b.date);
            const valid = !isNaN(d.getTime());
            return (
              <div key={b._id || i} style={{
                display: 'flex', alignItems: 'center', gap: 15, padding: '15px 0',
                borderBottom: i < bookings.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ textAlign: 'center', flexShrink: 0, width: 38 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {valid ? d.toLocaleDateString('en-US', { month: 'short' }) : '—'}
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.05, color: 'var(--text)' }}>{valid ? d.getDate() : ''}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.class?.name || b.className || 'Class'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
                    {formatTime(b.class?.startTime || b.startTime)}
                    {b.class?.location?.name ? ` · ${b.class.location.name}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setCancelModal({ open: true, booking: b })}
                  style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: '6px 2px' }}
                >
                  Cancel
                </button>
              </div>
            );
          })
        )}
      </div>

      {!loading && meUser?.cardLast4 && (
        <div style={{ marginBottom: ptAssignment || meUser ? 22 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 2px 11px' }}>
            <span style={SECTION_LABEL}>Card on file</span>
            <Link href="/profile" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600, color: 'var(--accent-text)' }}>Update</Link>
          </div>
          <TiltCard style={{ maxWidth: 280, borderRadius: 16, boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
            <BankCard
              last4={meUser.cardLast4}
              type={meUser.cardType}
              bank={meUser.cardBank}
              expMonth={meUser.cardExpMonth}
              expYear={meUser.cardExpYear}
              holder={fullName}
            />
          </TiltCard>
        </div>
      )}

      {!loading && (ptAssignment ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 15, padding: '14px 16px' }}>
          {ptAssignment.Trainer?.User?.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={ptAssignment.Trainer.User.avatarUrl} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-dim)', flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.9px', textTransform: 'uppercase', color: 'var(--muted)' }}>Personal trainer</p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              {ptAssignment.Trainer?.User ? `${ptAssignment.Trainer.User.firstName} ${ptAssignment.Trainer.User.lastName}` : 'Your trainer'}
            </p>
          </div>
        </div>
      ) : meUser && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 15, padding: '14px 16px' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            {meUser.ptRequested
              ? 'Personal trainer requested — our team will assign one soon.'
              : 'Want a personal trainer? Ask the front desk on your next visit.'}
          </p>
        </div>
      ))}
      </div>
      </div>

      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, booking: null })}
        title="Cancel Booking"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to cancel your booking for{' '}
          <strong style={{ color: 'var(--text)' }}>{cancelModal.booking?.class?.name || 'this class'}</strong>? This action cannot be undone.
        </p>
        <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setCancelModal({ open: false, booking: null })}>Keep Booking</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancelBooking}>Cancel Booking</Button>
        </div>
      </Modal>
    </div>
  );
}
