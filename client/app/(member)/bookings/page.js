'use client';
import { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import PageError from '@/components/ui/PageError';

export default function BookingsPage() {
  const toast = useToast();
  const [activeTab,    setActiveTab]    = useState('upcoming');
  const [page,         setPage]         = useState(1);
  const [cancelModal,  setCancelModal]  = useState({ open: false, booking: null });
  const [cancelling,   setCancelling]   = useState(false);

  const params = new URLSearchParams({ page, limit: 10 });
  if (activeTab === 'upcoming') params.set('upcoming', 'true');
  else params.set('past', 'true');
  const key = `/bookings?${params}`;

  const { data, isValidating: isLoading, error, mutate: refreshBookings } = useSWR(key);

  const bookings   = data?.bookings || data || [];
  const totalPages = data?.totalPages || 1;

  const handleCancel = async () => {
    if (!cancelModal.booking) return;
    setCancelling(true);
    try {
      await api.delete(`/bookings/${cancelModal.booking._id}`);
      toast.success('Booking cancelled');
      setCancelModal({ open: false, booking: null });
      refreshBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (error && !data) return <PageError onRetry={refreshBookings} />;

  return (
    <div style={{ maxWidth: 1000, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <p className="apex-member-label">My Schedule</p>
        <h1 className="apex-member-h1">Bookings</h1>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          background: 'var(--surface)',
          borderRadius: 12,
          padding: 4,
          width: 'fit-content',
          marginBottom: 24,
          border: '1px solid var(--border)',
        }}
      >
        {['upcoming', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              color: activeTab === tab ? 'var(--accent-fg)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 100px',
            padding: '14px 24px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--row-hover)',
            minWidth: 580,
          }}
        >
          {['Class Name', 'Date & Time', 'Location', 'Status', 'Actions'].map((h) => (
            <span
              key={h}
              style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}
            >
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📅</p>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              {activeTab === 'upcoming' ? 'No upcoming bookings. Browse classes to book!' : 'No past bookings found.'}
            </p>
          </div>
        ) : (
          <>
            {bookings.map((booking, i) => (
              <div
                key={booking._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 100px',
                  padding: '16px 24px',
                  borderBottom: i < bookings.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                  minWidth: 580,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--row-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, marginBottom: 2 }}>
                    {booking.class?.name || 'Class'}
                  </p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                    {booking.class?.classType || ''}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 2 }}>
                    {formatDate(booking.class?.date || booking.date)}
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {formatTime(booking.class?.startTime || booking.startTime)}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {booking.class?.location?.name || '-'}
                  </p>
                  {booking.class?.trainer && (
                    <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>
                      {`${booking.class.trainer.user?.firstName || ''} ${booking.class.trainer.user?.lastName || ''}`.trim()}
                    </p>
                  )}
                </div>
                <Badge status={booking.status || 'booked'} />
                <div>
                  {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setCancelModal({ open: true, booking })}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </Button>
          <span style={{ padding: '8px 16px', color: 'var(--muted)', fontSize: 13 }}>
            Page {page} of {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </Button>
        </div>
      )}

      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, booking: null })}
        title="Cancel Booking"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to cancel your booking for{' '}
          <strong style={{ color: 'var(--text)' }}>
            {cancelModal.booking?.class?.name || 'this class'}
          </strong>
          ?
        </p>
        <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setCancelModal({ open: false, booking: null })}>
            Keep Booking
          </Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>
            Cancel Booking
          </Button>
        </div>
      </Modal>
    </div>
  );
}
