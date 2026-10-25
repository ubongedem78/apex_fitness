'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const CLASS_TYPES = ['hiit', 'yoga', 'spinning', 'boxing', 'pilates', 'strength', 'cardio', 'other'];

const emptyForm = {
  name: '',
  description: '',
  classType: 'hiit',
  locationId: '',
  trainerId: '',
  date: '',
  startTime: '',
  endTime: '',
  capacity: 20,
  isRecurring: false,
};

const selectStyle = {
  padding: '12px 14px',
  background: 'var(--surface2)',
  border: '1px solid var(--border-strong)',
  borderRadius: 12,
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  cursor: 'pointer',
};
const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

function FormSelect({ label, value, onChange, options, placeholder, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={onChange}
        style={{
          ...selectStyle,
          border: error ? '1px solid rgba(255,68,68,0.6)' : '1px solid var(--border-strong)',
          color: value ? 'var(--text)' : 'var(--text-tertiary)',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span style={{ fontSize: 11, color: '#e07070', marginTop: 2 }}>{error}</span>}
    </div>
  );
}

export default function AdminClassesPage() {
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({ location: '', date: '', trainerId: '', status: '' });
  const [formModal, setFormModal] = useState({ open: false, cls: null });
  const [cancelModal, setCancelModal] = useState({ open: false, cls: null, reason: '' });
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, cls: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchTrainers();
  }, []);

  useEffect(() => {
    fetchClasses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const fetchLocations = async () => {
    try {
      const { data } = await api.get('/locations');
      setLocations(data.locations || data || []);
    } catch {}
  };

  const fetchTrainers = async () => {
    try {
      const { data } = await api.get('/admin/trainers');
      const list = Array.isArray(data) ? data : (data.trainers || data || []);
      setTrainers(list);
    } catch {}
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filters.location)  params.set('locationId', filters.location);
      if (filters.date)      params.set('date', filters.date);
      if (filters.trainerId) params.set('trainerId', filters.trainerId);
      if (filters.status)    params.set('status', filters.status);
      const { data } = await api.get(`/admin/classes?${params}`);
      const list = Array.isArray(data) ? data : (data.classes || data || []);
      setClasses(list);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
    } catch { setClasses([]); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors({});
    setFormError('');
    setFormModal({ open: true, cls: null });
  };

  const openEdit = (cls) => {
    setForm({
      name: cls.name,
      description: cls.description || '',
      classType: cls.classType,
      locationId: cls.location?._id || cls.locationId || '',
      trainerId: cls.trainer?._id || cls.trainerId || '',
      date: cls.date ? cls.date.split('T')[0] : '',
      startTime: cls.startTime || '',
      endTime: cls.endTime || '',
      capacity: cls.capacity || 20,
      isRecurring: cls.isRecurring || false,
    });
    setFormErrors({});
    setFormError('');
    setFormModal({ open: true, cls });
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim())  errs.name      = 'Class name is required';
    if (!form.locationId)   errs.locationId = 'Location is required';
    if (!form.trainerId)    errs.trainerId  = 'Trainer is required';
    if (!form.date)         errs.date       = 'Date is required';
    if (!form.startTime)    errs.startTime  = 'Start time is required';
    if (!form.endTime)      errs.endTime    = 'End time is required';
    if (!form.capacity)     errs.capacity   = 'Capacity is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) {
      setFormError('Please fix the errors below before submitting.');
      return;
    }
    setSaving(true);
    try {
      if (formModal.cls) {
        await api.put(`/admin/classes/${formModal.cls._id}`, form);
        toast.success('Class updated');
      } else {
        await api.post('/admin/classes', form);
        toast.success('Class created');
      }
      setFormModal({ open: false, cls: null });
      fetchClasses();
    } catch (err) {
      const serverFields = err.response?.data?.fields;
      const msg = err.response?.data?.message || 'Save failed - please try again.';
      if (serverFields) {
        setFormErrors((prev) => ({ ...prev, ...serverFields }));
      }
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/admin/classes/${cancelModal.cls._id}/cancel`, { reason: cancelModal.reason });
      toast.success('Class cancelled - members notified');
      setCancelModal({ open: false, cls: null, reason: '' });
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.cls) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/classes/${deleteModal.cls._id}`);
      toast.success('Class deleted');
      setDeleteModal({ open: false, cls: null });
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleReactivate = async (cls) => {
    try {
      await api.post(`/admin/classes/${cls._id}/reactivate`);
      toast.success('Class reactivated');
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reactivate failed');
    }
  };

  return (
    <div style={{ maxWidth: 1200, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Classes</h1>
        </div>
        <Button variant="accent" onClick={openCreate}>+ Create Class</Button>
      </div>

      <div
        className="apex-grid-4"
        style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 20, gap: 12 }}
      >
        {[
          { key: 'location', label: 'All Locations', options: locations.map((l) => ({ value: l._id, label: l.name })) },
          { key: 'trainerId', label: 'All Trainers', options: trainers.map((t) => ({ value: t._id, label: `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() })) },
          { key: 'status', label: 'All Statuses', options: [{ value: 'scheduled', label: 'Scheduled' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }] },
        ].map(({ key, label, options }) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => { setFilters((p) => ({ ...p, [key]: e.target.value })); setPage(1); }}
            style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: filters[key] ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 14, cursor: 'pointer', outline: 'none' }}
          >
            <option value="">{label}</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <input
          type="date"
          value={filters.date}
          onChange={(e) => { setFilters((p) => ({ ...p, date: e.target.value })); setPage(1); }}
          style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: filters.date ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 14, cursor: 'pointer', outline: 'none', colorScheme: 'dark' }}
        />
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 230px', gap: 14, padding: '13px 24px', borderBottom: '1px solid var(--border)', background: 'var(--row-hover)', minWidth: 850 }}>
            {['Class', 'Type', 'Date/Time', 'Location', 'Capacity', 'Status', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          ) : classes.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '50px 0', fontSize: 14 }}>No classes found</p>
          ) : (
            classes.map((cls, i) => (
              <div
                key={cls._id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 230px', gap: 14, padding: '14px 24px', borderBottom: i < classes.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background 0.15s', minWidth: 850 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--row-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{cls.name}</p>
                  {cls.isRecurring && <p style={{ color: 'var(--accent-text)', fontSize: 10, fontWeight: 700 }}>RECURRING</p>}
                </div>
                <Badge status={cls.classType}>{cls.classType}</Badge>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(cls.date)}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{formatTime(cls.startTime)} – {formatTime(cls.endTime)}</p>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{cls.Location?.name || cls.location?.name || '-'}</span>
                <span style={{ color: 'var(--accent-text)', fontSize: 13, fontWeight: 700 }}>{cls.bookedCount || 0}/{cls.capacity}</span>
                <Badge status={cls.status || 'scheduled'} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cls)}>Edit</Button>
                  {cls.status !== 'cancelled' ? (
                    <Button variant="ghost" size="sm" onClick={() => setCancelModal({ open: true, cls, reason: '' })}>Cancel</Button>
                  ) : (
                    <Button variant="accent" size="sm" onClick={() => handleReactivate(cls)}>Reactivate</Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => setDeleteModal({ open: true, cls })}>Delete</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
          <span style={{ padding: '8px 16px', color: 'var(--muted)', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
        </div>
      )}

      <Modal isOpen={formModal.open} onClose={() => setFormModal({ open: false, cls: null })} title={formModal.cls ? 'Edit Class' : 'Create Class'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {formError && (
            <div style={{ padding: '11px 14px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 10, color: '#e07070', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Class Name *"
            value={form.name}
            onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormErrors((p) => ({ ...p, name: '' })); }}
            error={formErrors.name}
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormSelect
              label="Class Type *"
              value={form.classType}
              onChange={(e) => setForm((p) => ({ ...p, classType: e.target.value }))}
              options={CLASS_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            />
            <FormSelect
              label="Location *"
              value={form.locationId}
              onChange={(e) => { setForm((p) => ({ ...p, locationId: e.target.value })); setFormErrors((p) => ({ ...p, locationId: '' })); }}
              options={locations.map((l) => ({ value: l._id, label: l.name }))}
              placeholder="- Select location -"
              error={formErrors.locationId}
            />
          </div>

          <FormSelect
            label="Trainer *"
            value={form.trainerId}
            onChange={(e) => { setForm((p) => ({ ...p, trainerId: e.target.value })); setFormErrors((p) => ({ ...p, trainerId: '' })); }}
            options={trainers.map((t) => ({ value: t._id, label: `${t.User?.firstName || t.user?.firstName || ''} ${t.User?.lastName || t.user?.lastName || ''}`.trim() }))}
            placeholder={trainers.length === 0 ? '- No trainers yet, add one first -' : '- Select trainer -'}
            error={formErrors.trainerId}
          />

          {trainers.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px' }}>
              No trainers found. Go to the <strong>Trainers</strong> page to add one before creating a class.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input
              label="Date *"
              type="date"
              value={form.date}
              onChange={(e) => { setForm((p) => ({ ...p, date: e.target.value })); setFormErrors((p) => ({ ...p, date: '' })); }}
              error={formErrors.date}
            />
            <Input
              label="Start Time *"
              type="time"
              value={form.startTime}
              onChange={(e) => { setForm((p) => ({ ...p, startTime: e.target.value })); setFormErrors((p) => ({ ...p, startTime: '' })); }}
              error={formErrors.startTime}
            />
            <Input
              label="End Time *"
              type="time"
              value={form.endTime}
              onChange={(e) => { setForm((p) => ({ ...p, endTime: e.target.value })); setFormErrors((p) => ({ ...p, endTime: '' })); }}
              error={formErrors.endTime}
            />
          </div>

          <Input
            label="Capacity *"
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => { setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 })); setFormErrors((p) => ({ ...p, capacity: '' })); }}
            error={formErrors.capacity}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13 }}>
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm((p) => ({ ...p, isRecurring: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} />
            Recurring weekly class
          </label>

          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setFormModal({ open: false, cls: null })}>Cancel</Button>
            <Button type="submit" variant="accent" loading={saving}>{formModal.cls ? 'Save Changes' : 'Create Class'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={cancelModal.open} onClose={() => setCancelModal({ open: false, cls: null, reason: '' })} title="Cancel Class">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          Cancelling <strong style={{ color: 'var(--text)' }}>{cancelModal.cls?.name}</strong> will notify all enrolled members.
        </p>
        <Input
          label="Reason (sent to members)"
          placeholder="e.g. Trainer unavailable"
          value={cancelModal.reason}
          onChange={(e) => setCancelModal((p) => ({ ...p, reason: e.target.value }))}
        />
        <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setCancelModal({ open: false, cls: null, reason: '' })}>Go Back</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>Cancel Class</Button>
        </div>
      </Modal>

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, cls: null })} title="Delete Class">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Permanently delete <strong style={{ color: 'var(--text)' }}>{deleteModal.cls?.name}</strong>? This removes the class and all of its bookings and waitlist entries. This can&apos;t be undone.
        </p>
        <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setDeleteModal({ open: false, cls: null })}>Keep Class</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete Permanently</Button>
        </div>
      </Modal>
    </div>
  );
}
