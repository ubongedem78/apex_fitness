'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const emptyForm = {
  name: '',
  sessions: '',
  price: '',
  description: '',
  sortOrder: 0,
};

export default function AdminPTPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, plan: null });
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, plan: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/pt-plans');
      setPlans(data.plans || data || []);
    } catch { setPlans([]); } finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm); setFormErrors({}); setFormModal({ open: true, plan: null }); };
  const openEdit = (p) => {
    setForm({
      name: p.name,
      sessions: p.sessions ?? p.durationMonths ?? '',
      price: p.price,
      description: p.description || '',
      sortOrder: p.sortOrder || 0,
    });
    setFormErrors({});
    setFormModal({ open: true, plan: p });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.sessions) errs.sessions = 'Required';
    else if (isNaN(parseInt(form.sessions)) || parseInt(form.sessions) < 1) errs.sessions = 'Must be a positive whole number';
    if (!form.price) errs.price = 'Required';
    else if (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) errs.price = 'Must be a positive amount';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, sessions: parseInt(form.sessions), price: parseFloat(form.price) };
      if (formModal.plan) {
        await api.put(`/admin/pt-plans/${formModal.plan._id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/admin/pt-plans', payload);
        toast.success('Plan created');
      }
      setFormModal({ open: false, plan: null });
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (plan) => {
    try {
      const action = plan.isActive ? 'deactivate' : 'activate';
      await api.patch(`/admin/pt-plans/${plan._id}/${action}`);
      toast.success(`Plan ${action}d`);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.plan) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/pt-plans/${deleteModal.plan._id}`);
      toast.success('Plan deleted');
      setDeleteModal({ open: false, plan: null });
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>PT Plans</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
            Configure personal trainer packages. Members choose from these plans when requesting a trainer.
          </p>
        </div>
        <Button variant="accent" onClick={openCreate}>+ Add Plan</Button>
      </div>

      {plans.length === 0 ? (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>💪</p>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>No PT Plans Yet</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Create your first personal trainer package. Members will see these plans when requesting a trainer.
          </p>
          <Button variant="accent" onClick={openCreate}>Create First Plan</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {plans.map((plan) => (
            <div
              key={plan._id}
              style={{
                background: 'var(--surface)',
                borderRadius: 20,
                border: plan.isActive ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                padding: 24,
                position: 'relative',
                opacity: plan.isActive ? 1 : 0.6,
              }}
            >
              {!plan.isActive && (
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  <Badge status="cancelled">Inactive</Badge>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-text)', margin: '0 0 6px' }}>
                  {plan.sessions ? `${plan.sessions} sessions` : `${plan.durationMonths} ${plan.durationMonths === 1 ? 'month' : 'months'}`}
                </p>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>{plan.name}</h2>
                <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-1px' }}>
                  {formatCurrency(plan.price)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {formatCurrency(Math.round(plan.price / (plan.sessions || plan.durationMonths || 1)))} / {plan.sessions ? 'session' : 'month'}
                </p>
              </div>

              {plan.description && (
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>{plan.description}</p>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>Edit</Button>
                <Button variant={plan.isActive ? 'danger' : 'ghost'} size="sm" onClick={() => handleToggle(plan)}>
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteModal({ open: true, plan })}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, plan: null })}
        title={formModal.plan ? 'Edit PT Plan' : 'Create PT Plan'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Plan Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g. Generic 12"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Sessions"
              type="number"
              min="1"
              value={form.sessions}
              onChange={(e) => setForm((p) => ({ ...p, sessions: e.target.value }))}
              error={formErrors.sessions}
              placeholder="12"
            />
            <Input
              label="Total Price (₦)"
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              error={formErrors.price}
              placeholder="90000"
            />
          </div>
          {form.sessions && form.price && !isNaN(parseFloat(form.price)) && parseInt(form.sessions) > 0 && (
            <p style={{ fontSize: 12, color: 'var(--accent-text)', padding: '6px 12px', background: 'var(--accent-dim)', borderRadius: 8 }}>
              ≈ {formatCurrency(Math.round(parseFloat(form.price) / parseInt(form.sessions)))} / session
            </p>
          )}
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="e.g. Build a lasting habit with guided sessions"
          />
          <Input
            label="Sort Order"
            type="number"
            min="0"
            value={form.sortOrder}
            onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
          />
          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setFormModal({ open: false, plan: null })}>Cancel</Button>
            <Button type="submit" variant="accent" loading={saving}>{formModal.plan ? 'Save Changes' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, plan: null })}
        title="Delete PT Plan"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Permanently delete <strong style={{ color: 'var(--text)' }}>{deleteModal.plan?.name}</strong>? This can&apos;t be undone. Any past PT requests for this plan are kept (they retain their own amount and session details).
        </p>
        <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setDeleteModal({ open: false, plan: null })}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete Plan</Button>
        </div>
      </Modal>
    </div>
  );
}
