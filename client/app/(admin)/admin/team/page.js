'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getInitials } from '@/lib/utils';

const ROLES = ['admin', 'manager', 'receptionist', 'staff'];

const ROLE_BADGE_MAP = {
  admin:        'active',
  manager:      'info',
  receptionist: 'trial',
  staff:        'cancelled',
};

const ROLE_LABELS = {
  admin:        'Admin',
  manager:      'Manager',
  receptionist: 'Receptionist',
  staff:        'Staff',
};

const ROLE_DESCRIPTIONS = {
  admin:        'Full access - manages everything including staff and settings.',
  manager:      'Manages members, classes, trainers, payments and reports.',
  receptionist: 'Front-desk access: check-ins, bookings, walk-in sign-ups.',
  staff:        'General staff access - classes and trainer schedules.',
};

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'receptionist' };
const emptyPwForm = { password: '', confirm: '' };

export default function AdminTeamPage() {
  const toast = useToast();
  const [staff, setStaff]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('');

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);

  const [editModal, setEditModal]     = useState({ open: false, member: null });
  const [editForm, setEditForm]       = useState({});
  const [editErrors, setEditErrors]   = useState({});
  const [editSaving, setEditSaving]   = useState(false);

  const [pwModal, setPwModal]         = useState({ open: false, member: null });
  const [pwForm, setPwForm]           = useState(emptyPwForm);
  const [pwErrors, setPwErrors]       = useState({});
  const [pwSaving, setPwSaving]       = useState(false);

  const [togglingId, setTogglingId]   = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const { data } = await api.get('/admin/staff', { params });
      setStaff(data.staff || []);
    } catch { setStaff([]); } finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const validateCreate = () => {
    const errs = {};
    if (!form.firstName.trim())  errs.firstName = 'Required';
    if (!form.lastName.trim())   errs.lastName  = 'Required';
    if (!form.email.trim())      errs.email     = 'Required';
    if (!form.password)          errs.password  = 'Required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (!ROLES.includes(form.role)) errs.role = 'Select a valid role';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateCreate()) return;
    setSaving(true);
    try {
      await api.post('/admin/staff', form);
      toast.success('Team member created');
      setCreateModal(false);
      setForm(emptyForm);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally { setSaving(false); }
  };

  const openEdit = (member) => {
    setEditForm({ firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone || '', role: member.role });
    setEditErrors({});
    setEditModal({ open: true, member });
  };

  const validateEdit = () => {
    const errs = {};
    if (!editForm.firstName?.trim()) errs.firstName = 'Required';
    if (!editForm.lastName?.trim())  errs.lastName  = 'Required';
    if (!editForm.email?.trim())     errs.email     = 'Required';
    if (!ROLES.includes(editForm.role)) errs.role = 'Select a valid role';
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateEdit()) return;
    setEditSaving(true);
    try {
      await api.put(`/admin/staff/${editModal.member._id}`, editForm);
      toast.success('Details updated');
      setEditModal({ open: false, member: null });
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setEditSaving(false); }
  };

  const openPw = (member) => { setPwForm(emptyPwForm); setPwErrors({}); setPwModal({ open: true, member }); };

  const handleResetPw = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.password || pwForm.password.length < 8) errs.password = 'Minimum 8 characters';
    if (pwForm.password !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setPwSaving(true);
    try {
      await api.patch(`/admin/staff/${pwModal.member._id}/reset-password`, { password: pwForm.password });
      toast.success('Password reset successfully');
      setPwModal({ open: false, member: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setPwSaving(false); }
  };

  const handleToggle = async (member) => {
    setTogglingId(member._id);
    try {
      await api.patch(`/admin/staff/${member._id}/toggle-active`);
      toast.success(member.isActive ? 'Account deactivated' : 'Account activated');
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setTogglingId(null); }
  };

  return (
    <div style={{ maxWidth: 1100, animation: 'fadeIn 0.4s ease' }}>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Team</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Create staff accounts and assign roles so your team can log in with the right access.
          </p>
        </div>
        <Button variant="accent" onClick={() => { setForm(emptyForm); setFormErrors({}); setCreateModal(true); }}>
          + Add Team Member
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
        {ROLES.map((r) => (
          <div
            key={r}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}
          >
            <div style={{ marginBottom: 6 }}>
              <Badge status={ROLE_BADGE_MAP[r]}>{ROLE_LABELS[r]}</Badge>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{ROLE_DESCRIPTIONS[r]}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{
            flex: 1, minWidth: 200,
            padding: '10px 14px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: 14, outline: 'none',
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: 14, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : staff.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>👥</p>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            {search || roleFilter ? 'No matching staff found' : 'No Team Members Yet'}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            {search || roleFilter
              ? 'Try adjusting your search or filter.'
              : 'Add your first team member to get started. Assign roles to control what each person can access.'}
          </p>
          {!search && !roleFilter && (
            <Button variant="accent" onClick={() => { setForm(emptyForm); setFormErrors({}); setCreateModal(true); }}>
              Add First Team Member
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {staff.map((member) => (
            <div
              key={member._id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
                opacity: member.isActive ? 1 : 0.6,
              }}
            >

              <div
                style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: member.isActive
                    ? 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)'
                    : 'var(--border)',
                  color: member.isActive ? '#1b1b19' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14,
                }}
              >
                {getInitials(member.firstName, member.lastName)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {member.firstName} {member.lastName}
                  </span>
                  <Badge status={ROLE_BADGE_MAP[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                  {!member.isActive && <Badge status="cancelled">Inactive</Badge>}
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.email}
                  {member.phone ? ` · ${member.phone}` : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => openPw(member)}>Reset PW</Button>
                <Button
                  variant={member.isActive ? 'danger' : 'ghost'}
                  size="sm"
                  loading={togglingId === member._id}
                  onClick={() => handleToggle(member)}
                >
                  {member.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Add Team Member">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              error={formErrors.firstName}
              placeholder="Jane"
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              error={formErrors.lastName}
              placeholder="Doe"
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            error={formErrors.email}
            placeholder="jane@apexfitness.ng"
          />
          <Input
            label="Phone (optional)"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+234 800 000 0000"
          />
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${formErrors.role ? 'var(--error)' : 'var(--border)'}`,
                background: 'var(--surface)', color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            {formErrors.role && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>{formErrors.role}</p>}
            {form.role && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{ROLE_DESCRIPTIONS[form.role]}</p>
            )}
          </div>
          <Input
            label="Temporary Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            error={formErrors.password}
            placeholder="Minimum 8 characters"
          />
          <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              Share the email and password with the team member. They can change their password after logging in.
            </p>
          </div>
          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" variant="accent" loading={saving}>Create Account</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, member: null })}
        title={editModal.member ? `Edit - ${editModal.member.firstName} ${editModal.member.lastName}` : 'Edit'}
      >
        <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="First Name"
              value={editForm.firstName || ''}
              onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
              error={editErrors.firstName}
            />
            <Input
              label="Last Name"
              value={editForm.lastName || ''}
              onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
              error={editErrors.lastName}
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            value={editForm.email || ''}
            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
            error={editErrors.email}
          />
          <Input
            label="Phone (optional)"
            type="tel"
            value={editForm.phone || ''}
            onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Role</label>
            <select
              value={editForm.role || ''}
              onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${editErrors.role ? 'var(--error)' : 'var(--border)'}`,
                background: 'var(--surface)', color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            {editErrors.role && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>{editErrors.role}</p>}
            {editForm.role && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{ROLE_DESCRIPTIONS[editForm.role]}</p>
            )}
          </div>
          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={() => setEditModal({ open: false, member: null })}>Cancel</Button>
            <Button type="submit" variant="accent" loading={editSaving}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={pwModal.open}
        onClose={() => setPwModal({ open: false, member: null })}
        title={pwModal.member ? `Reset Password - ${pwModal.member.firstName}` : 'Reset Password'}
      >
        <form onSubmit={handleResetPw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="New Password"
            type="password"
            value={pwForm.password}
            onChange={(e) => setPwForm((p) => ({ ...p, password: e.target.value }))}
            error={pwErrors.password}
            placeholder="Minimum 8 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
            error={pwErrors.confirm}
            placeholder="Re-enter the password"
          />
          <div style={{ background: 'rgba(255,150,50,0.08)', border: '1px solid rgba(255,150,50,0.2)', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              This will immediately update the team member&apos;s password. Make sure to share the new password with them.
            </p>
          </div>
          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={() => setPwModal({ open: false, member: null })}>Cancel</Button>
            <Button type="submit" variant="accent" loading={pwSaving}>Reset Password</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
