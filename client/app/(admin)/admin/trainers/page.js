'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const emptyForm = {
  userEmail: '',
  bio: '',
  specialties: [],
  certifications: '',
  yearsExperience: 0,
  locationId: '',
};

function SpecialtyInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const s = input.trim();
    if (s && !value.includes(s)) { onChange([...value, s]); setInput(''); }
  };
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
        Specialties
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {value.map((s) => (
          <span
            key={s}
            style={{
              padding: '4px 10px',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
              borderRadius: 100,
              fontSize: 12,
              color: 'var(--accent-text)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {s}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== s))} style={{ background: 'none', border: 'none', color: 'var(--accent-text)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type specialty and press Enter"
          style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none' }}
        />
        <Button type="button" variant="ghost" size="sm" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

export default function AdminTrainersPage() {
  const toast = useToast();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [formModal, setFormModal] = useState({ open: false, trainer: null });
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, trainer: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTrainers();
    fetchLocations();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/trainers');
      const list = Array.isArray(data) ? data : (data.trainers || data || []);
      setTrainers(list);
    } catch { setTrainers([]); } finally { setLoading(false); }
  };

  const fetchLocations = async () => {
    try {
      const { data } = await api.get('/locations');
      setLocations(data.locations || data || []);
    } catch {}
  };

  const openCreate = () => {
    setForm(emptyForm);
    setFormErrors({});
    setFormError('');
    setFormModal({ open: true, trainer: null });
  };

  const openEdit = (t) => {
    setForm({
      userEmail: t.user?.email || '',
      bio: t.bio || '',
      specialties: t.specialties || [],
      certifications: Array.isArray(t.certifications) ? t.certifications.join(', ') : (t.certifications || ''),
      yearsExperience: t.yearsExperience || 0,
      locationId: t.location?._id || '',
    });
    setFormErrors({});
    setFormError('');
    setFormModal({ open: true, trainer: t });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    const errs = {};
    if (!formModal.trainer && !form.userEmail.trim()) errs.userEmail = 'Email address is required';
    setFormErrors(errs);
    if (Object.keys(errs).length) {
      setFormError('Please fix the errors below before submitting.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        certifications: form.certifications.split(',').map((c) => c.trim()).filter(Boolean),
      };
      if (formModal.trainer) {
        await api.put(`/admin/trainers/${formModal.trainer._id}`, payload);
        toast.success('Trainer updated');
      } else {
        await api.post('/admin/trainers', payload);
        toast.success('Trainer added');
      }
      setFormModal({ open: false, trainer: null });
      fetchTrainers();
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

  const handleToggleStatus = async (trainer) => {
    try {
      const action = trainer.isActive ? 'deactivate' : 'activate';
      await api.patch(`/admin/trainers/${trainer._id}/${action}`);
      toast.success(`Trainer ${action}d`);
      fetchTrainers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.trainer) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/trainers/${deleteModal.trainer._id}`);
      toast.success('Trainer deleted');
      setDeleteModal({ open: false, trainer: null });
      fetchTrainers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Trainers</h1>
        </div>
        <Button variant="accent" onClick={openCreate}>+ Add Trainer</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 20,
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1.5fr 1fr 0.8fr 180px', gap: 16, padding: '13px 24px', borderBottom: '1px solid var(--border)', background: 'var(--row-hover)', minWidth: 760 }}>
            {['Trainer', 'Specialties', 'Location', 'Rating', 'Status', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>
          {trainers.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '50px 0', fontSize: 14 }}>No trainers yet</p>
          ) : (
            trainers.map((t, i) => (
              <div
                key={t._id}
                style={{
                  display: 'grid', gridTemplateColumns: '2.5fr 2fr 1.5fr 1fr 0.8fr 180px', gap: 16,
                  padding: '16px 24px', borderBottom: i < trainers.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center', transition: 'background 0.15s', minWidth: 680,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--row-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38, height: 38, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-fg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0,
                    }}
                  >
                    {getInitials(t.user?.firstName, t.user?.lastName)}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
                      {t.user?.firstName} {t.user?.lastName}
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{t.yearsExperience ? `${t.yearsExperience}y exp` : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(t.specialties || []).slice(0, 3).map((s) => (
                    <span key={s} style={{ padding: '2px 8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 100, fontSize: 10, color: 'var(--accent-text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {s}
                    </span>
                  ))}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t.location?.name || '-'}</span>
                <span style={{ color: 'var(--accent-text)', fontSize: 14, fontWeight: 700 }}>
                  {t.rating ? `${t.rating.toFixed(1)} ★` : '-'}
                </span>
                <Badge status={t.isActive ? 'active' : 'cancelled'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(t)}>
                    {t.isActive ? 'Off' : 'On'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteModal({ open: true, trainer: t })}>Delete</Button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}

      <Modal isOpen={formModal.open} onClose={() => setFormModal({ open: false, trainer: null })} title={formModal.trainer ? 'Edit Trainer' : 'Add Trainer'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {formError && (
            <div style={{ padding: '11px 14px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 10, color: '#e07070', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{formError}</span>
            </div>
          )}

          {!formModal.trainer && (
            <div>
              <Input
                label="User Email *"
                type="email"
                value={form.userEmail}
                onChange={(e) => { setForm((p) => ({ ...p, userEmail: e.target.value })); setFormErrors((p) => ({ ...p, userEmail: '' })); setFormError(''); }}
                error={formErrors.userEmail}
                placeholder="trainer@apexfitness.ng"
              />
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                The person must already have an account. Their role will be updated to Trainer.
              </p>
            </div>
          )}
          <Input
            label="Bio"
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Short bio..."
          />
          <SpecialtyInput
            value={form.specialties}
            onChange={(s) => setForm((p) => ({ ...p, specialties: s }))}
          />
          <Input
            label="Certifications (comma-separated)"
            value={form.certifications}
            onChange={(e) => setForm((p) => ({ ...p, certifications: e.target.value }))}
            placeholder="ACE, NASM, CrossFit L2"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Years Experience"
              type="number"
              min="0"
              value={form.yearsExperience}
              onChange={(e) => setForm((p) => ({ ...p, yearsExperience: parseInt(e.target.value) || 0 }))}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>Primary Location</label>
              <select value={form.locationId} onChange={(e) => setForm((p) => ({ ...p, locationId: e.target.value }))} style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: form.locationId ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 14, outline: 'none' }}>
                <option value="">Select location</option>
                {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setFormModal({ open: false, trainer: null })}>Cancel</Button>
            <Button type="submit" variant="accent" loading={saving}>{formModal.trainer ? 'Save Changes' : 'Add Trainer'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, trainer: null })} title="Delete Trainer">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Permanently delete this trainer? This removes their profile, any member assignments, and their reviews. If they&apos;re assigned to classes, you&apos;ll need to reassign or delete those first. This can&apos;t be undone.
        </p>
        <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setDeleteModal({ open: false, trainer: null })}>Keep Trainer</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete Permanently</Button>
        </div>
      </Modal>
    </div>
  );
}
