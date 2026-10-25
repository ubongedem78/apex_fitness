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
  description: '',
  price: '',
  billingCycle: 'monthly',
  classLimit: '',
  locationAccess: 'all',
  features: [],
  sortOrder: 0,
  paystackPlanCode: '',
};

function FeatureListInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const s = input.trim();
    if (s && !value.includes(s)) { onChange([...value, s]); setInput(''); }
  };
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
        Features
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {value.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add feature..."
          style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none' }}
        />
        <Button type="button" variant="ghost" size="sm" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

export default function AdminPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, plan: null });
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/plans');
      setPlans(data.plans || data || []);
    } catch { setPlans([]); } finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm); setFormErrors({}); setFormModal({ open: true, plan: null }); };
  const openEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      billingCycle: p.billingCycle || 'monthly',
      classLimit: p.classLimit || '',
      locationAccess: p.locationAccess || 'all',
      features: p.features || [],
      sortOrder: p.sortOrder || 0,
      paystackPlanCode: p.paystackPlanCode || '',
    });
    setFormErrors({});
    setFormModal({ open: true, plan: p });
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.price) errs.price = 'Required';
    else if (isNaN(parseFloat(form.price))) errs.price = 'Must be a number';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        classLimit: form.classLimit ? parseInt(form.classLimit) : null,
      };
      if (formModal.plan) {
        await api.put(`/admin/plans/${formModal.plan._id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/admin/plans', payload);
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
      await api.patch(`/admin/plans/${plan._id}/${action}`);
      toast.success(`Plan ${action}d`);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
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
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Membership Plans</h1>
        </div>
        <Button variant="accent" onClick={openCreate}>+ Create Plan</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
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
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                }}
              >
                <Badge status="cancelled">Inactive</Badge>
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-text)', margin: 0 }}>
                  {plan.billingCycle}
                </p>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>{plan.name}</h2>
              <p style={{ fontSize: 30, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-1px' }}>
                {formatCurrency(plan.price)}
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                Joining fee set in Settings → General
              </p>
            </div>
            {plan.description && (
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>{plan.description}</p>
            )}
            {plan.features?.length > 0 && (
              <ul style={{ listStyle: 'none', marginBottom: 18 }}>
                {plan.features.slice(0, 6).map((f, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent-text)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>Edit</Button>
              <Button variant={plan.isActive ? 'danger' : 'ghost'} size="sm" onClick={() => handleToggle(plan)}>
                {plan.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={formModal.open} onClose={() => setFormModal({ open: false, plan: null })} title={formModal.plan ? 'Edit Plan' : 'Create Plan'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Plan Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} error={formErrors.name} />
          <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Price (₦)" type="number" min="0" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} error={formErrors.price} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>Billing Cycle</label>
              <select value={form.billingCycle} onChange={(e) => setForm((p) => ({ ...p, billingCycle: e.target.value }))} style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none' }}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Class Limit (blank = unlimited)" type="number" min="0" value={form.classLimit} onChange={(e) => setForm((p) => ({ ...p, classLimit: e.target.value }))} placeholder="Unlimited" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>Location Access</label>
              <select value={form.locationAccess} onChange={(e) => setForm((p) => ({ ...p, locationAccess: e.target.value }))} style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none' }}>
                <option value="all">All Locations</option>
                <option value="single">Single Location</option>
                <option value="lagos">Lagos Locations</option>
                <option value="abuja">Abuja Locations</option>
              </select>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 10, lineHeight: 1.6 }}>
            💡 The one-time joining fee for new members is set globally in <strong style={{ color: 'var(--accent-text)' }}>Settings → General → Joining Fee</strong>.
          </p>
          <FeatureListInput value={form.features} onChange={(f) => setForm((p) => ({ ...p, features: f }))} />
          <div>
            <Input
              label="Paystack Plan Code"
              value={form.paystackPlanCode}
              onChange={(e) => setForm((p) => ({ ...p, paystackPlanCode: e.target.value }))}
              placeholder="PLN_xxxxxxxxxxxx"
            />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              Create the plan on your Paystack dashboard (Products → Plans), then paste the <strong>PLN_…</strong> code here. Required for recurring billing.
            </p>
          </div>
          <Input label="Sort Order" type="number" min="0" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} />
          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setFormModal({ open: false, plan: null })}>Cancel</Button>
            <Button type="submit" variant="accent" loading={saving}>{formModal.plan ? 'Save Changes' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
