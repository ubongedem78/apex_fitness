'use client';
import { useState, useCallback } from 'react';
import useSWR, { mutate as swrMutate } from 'swr';
import api from '@/lib/api';
import { formatDate, formatTime, debounce } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import PageError from '@/components/ui/PageError';

function ClassCard({ cls, onBook, onWaitlist, bookedIds }) {
  const isBooked  = bookedIds.has(cls._id);
  const isFull    = cls.bookedCount >= cls.capacity;
  const spotsLeft = cls.capacity - (cls.bookedCount || 0);

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
    >

      <div style={{ height: 4, background: isBooked ? 'var(--accent)' : isFull ? '#ff4444' : 'var(--border-strong)' }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
          <h3 style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
            {cls.name}
          </h3>
          <Badge status={cls.classType || 'scheduled'}>{cls.classType}</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
            <span>📅</span>
            <span>{formatDate(cls.date)} • {formatTime(cls.startTime)} – {formatTime(cls.endTime)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
            <span>📍</span>
            <span>{cls.location?.name || cls.locationName || 'TBD'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
            <span>🏋️</span>
            <span>
              {cls.trainer
                ? `${cls.trainer.user?.firstName || ''} ${cls.trainer.user?.lastName || ''}`.trim() || 'TBD'
                : 'TBD'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: isFull ? '#ff4444' : spotsLeft <= 3 ? '#ff6644' : 'var(--accent)',
            }}
          >
            {isFull ? 'Fully Booked' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </span>
          {isBooked ? (
            <button
              disabled
              style={{
                padding: '8px 18px',
                borderRadius: 100,
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent-text)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'default',
              }}
            >
              Booked ✓
            </button>
          ) : isFull ? (
            <Button variant="ghost" size="sm" onClick={() => onWaitlist(cls)}>
              Join Waitlist
            </Button>
          ) : (
            <Button variant="accent" size="sm" onClick={() => onBook(cls)}>
              Book Class
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemberClassesPage() {
  const toast = useToast();

  const [filters, setFilters] = useState({ search: '', location: '', date: '', classType: '' });
  const [page,    setPage]    = useState(1);
  const [confirmModal, setConfirmModal] = useState({ open: false, cls: null });
  const [booking,      setBooking]      = useState(false);

  const classParams = new URLSearchParams({ page, limit: 12 });
  if (filters.search)    classParams.set('search',     filters.search);
  if (filters.location)  classParams.set('locationId', filters.location);
  if (filters.date)      classParams.set('date',       filters.date);
  if (filters.classType) classParams.set('classType',  filters.classType);
  const classesKey = `/classes?${classParams}`;

  const { data: classesData, isValidating: isLoading, error: classesError, mutate: refreshClasses } = useSWR(classesKey);

  const { data: locationsData }          = useSWR('/locations', { revalidateIfStale: false });
  const { data: bookingsData }           = useSWR('/bookings?upcoming=true&limit=100');

  const classes    = classesData?.classes  || classesData  || [];
  const totalPages = classesData?.totalPages || 1;
  const locations  = locationsData?.locations || locationsData || [];
  const bookedIds  = new Set(
    (bookingsData?.bookings || bookingsData || []).map(b => b.class?._id || b.classId)
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((val) => {
      setFilters(prev => ({ ...prev, search: val }));
      setPage(1);
    }, 400),
    []
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleBook = async () => {
    if (!confirmModal.cls) return;
    setBooking(true);
    try {
      await api.post('/bookings', { classId: confirmModal.cls._id });
      toast.success(`Booked: ${confirmModal.cls.name}`);
      swrMutate('/bookings?upcoming=true&limit=100');
      refreshClasses();
      setConfirmModal({ open: false, cls: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleWaitlist = async (cls) => {
    try {
      await api.post(`/classes/${cls._id}/waitlist`);
      toast.success(`Added to waitlist for ${cls.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join waitlist');
    }
  };

  if (classesError && !classesData) return <PageError onRetry={refreshClasses} />;

  return (
    <div style={{ maxWidth: 1100, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <p className="apex-member-label">Browse</p>
        <h1 className="apex-member-h1">Classes</h1>
      </div>

      <div
        className="apex-classes-filters"
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: '16px 20px',
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <Input
          placeholder="Search classes..."
          onChange={(e) => debouncedSearch(e.target.value)}
        />
        <select
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          style={{
            padding: '12px 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            color: filters.location ? 'var(--text)' : 'var(--text-tertiary)',
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l._id} value={l._id}>{l.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => handleFilterChange('date', e.target.value)}
          style={{
            padding: '12px 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            color: filters.date ? 'var(--text)' : 'var(--text-tertiary)',
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
            colorScheme: 'dark',
          }}
        />
        <select
          value={filters.classType}
          onChange={(e) => handleFilterChange('classType', e.target.value)}
          style={{
            padding: '12px 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            color: filters.classType ? 'var(--text)' : 'var(--text-tertiary)',
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">All Types</option>
          {['hiit', 'yoga', 'spinning', 'boxing', 'pilates', 'strength', 'cardio', 'other'].map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="apex-grid-3" style={{ gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', borderRadius: 20, height: 220, border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🗓</p>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>No classes found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="apex-grid-3" style={{ gap: 16, marginBottom: 24 }}>
            {classes.map((cls) => (
              <ClassCard
                key={cls._id}
                cls={cls}
                bookedIds={bookedIds}
                onBook={(c) => setConfirmModal({ open: true, cls: c })}
                onWaitlist={handleWaitlist}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
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
        </>
      )}

      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, cls: null })}
        title="Confirm Booking"
      >
        {confirmModal.cls && (
          <>
            <div
              style={{
                background: 'var(--surface2)',
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16, marginBottom: 10 }}>
                {confirmModal.cls.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['Date', formatDate(confirmModal.cls.date)],
                  ['Time', `${formatTime(confirmModal.cls.startTime)} – ${formatTime(confirmModal.cls.endTime)}`],
                  ['Location', confirmModal.cls.location?.name || 'TBD'],
                  ['Trainer', confirmModal.cls.trainer
                    ? `${confirmModal.cls.trainer.user?.firstName || ''} ${confirmModal.cls.trainer.user?.lastName || ''}`.trim()
                    : 'TBD'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setConfirmModal({ open: false, cls: null })}>
                Cancel
              </Button>
              <Button variant="accent" loading={booking} onClick={handleBook}>
                Confirm Booking
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
