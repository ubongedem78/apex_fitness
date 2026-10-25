'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function ActivateSubscriptionModal({
  member,
  plans: plansProp,
  basePath = '/admin/members',
  onClose,
  onSuccess,
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    planId:        '',
    billingCycle:  'monthly',
    paymentMethod: 'cash',
    notes:         '',
    startDate:     new Date().toISOString().split('T')[0],
  });
  const [fetchedPlans, setFetchedPlans] = useState([]);
  const plans = plansProp && plansProp.length ? plansProp : fetchedPlans;
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [firstTime, setFirstTime]   = useState(false);
  const [joiningFee, setJoiningFee] = useState(0);
  const [chargeJoiningFee, setChargeJoiningFee] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`${basePath}/${member.id || member._id}/subscription`);
        if (cancelled) return;
        const isFirst = !!res.data?.firstTimeSubscriber;
        setFirstTime(isFirst);
        setJoiningFee(parseFloat(res.data?.joiningFee || 0));
        setChargeJoiningFee(isFirst);
      } catch {
        if (!cancelled) { setFirstTime(false); setJoiningFee(0); }
      }
    })();
    return () => { cancelled = true; };
  }, [member.id, member._id]);

  useEffect(() => {
    if (plansProp && plansProp.length) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/memberships/plans');
        if (!cancelled) setFetchedPlans(data.data?.plans || data.plans || []);
      } catch {
        if (!cancelled) setFetchedPlans([]);
      }
    })();
    return () => { cancelled = true; };
  }, [plansProp]);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const BILLING_CYCLES = [
    { value: 'monthly',   label: 'Monthly (1 month)' },
    { value: 'quarterly', label: 'Quarterly (3 months)' },
    { value: 'biannual',  label: 'Bi-annual (6 months)' },
    { value: 'annual',    label: 'Annual (12 months)' },
  ];
  const PAYMENT_METHODS = [
    { value: 'cash',     label: 'Cash' },
    { value: 'pos',      label: 'POS / Card Terminal' },
    { value: 'transfer', label: 'Bank Transfer' },
  ];

  const validate = () => {
    const e = {};
    if (!form.planId)     e.planId     = 'Please select a plan';
    if (!form.startDate)  e.startDate  = 'Start date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post(`${basePath}/${member.id || member._id}/activate-subscription`, {
        ...form,
        includeJoiningFee: firstTime && chargeJoiningFee,
      });
      toast.success(`Subscription activated for ${member.firstName}`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Activation failed');
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    width: '100%', padding: '12px 14px', background: 'var(--surface2)',
    border: '1px solid var(--border-strong)', borderRadius: 12,
    color: 'var(--text)', fontSize: 14, outline: 'none',
    cursor: 'pointer',
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
    textTransform: 'uppercase', color: 'var(--muted)',
    display: 'block', marginBottom: 6,
  };
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
  const errStyle = { fontSize: 11, color: '#e07070', marginTop: 4 };

  const selectedPlan = plans.find(p => (p._id || p.id) === form.planId);
  const appliedJoiningFee = (firstTime && chargeJoiningFee) ? joiningFee : 0;
  const totalCollected = (parseFloat(selectedPlan?.price) || 0) + appliedJoiningFee;

  return (
    <Modal isOpen={true} onClose={onClose} title="Activate Subscription - Walk-in">
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        Manually activate a membership for{' '}
        <strong style={{ color: 'var(--text)' }}>{member.firstName} {member.lastName}</strong>.
        Use this for cash, POS, or bank-transfer payments processed at the desk.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={fieldStyle}>
          <label style={labelStyle}>Membership Plan *</label>
          <select value={form.planId} onChange={set('planId')} style={selectStyle}>
            <option value="">- Select a plan -</option>
            {plans.map(p => (
              <option key={p._id} value={p._id}>
                {p.name} - {formatCurrency(p.price)} / {p.billingCycle || 'month'}
              </option>
            ))}
          </select>
          {errors.planId && <span style={errStyle}>{errors.planId}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Billing Cycle</label>
            <select value={form.billingCycle} onChange={set('billingCycle')} style={selectStyle}>
              {BILLING_CYCLES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Start Date *</label>
            <input
              type="date" value={form.startDate} onChange={set('startDate')}
              style={{ ...selectStyle }}
            />
            {errors.startDate && <span style={errStyle}>{errors.startDate}</span>}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Payment Method</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {PAYMENT_METHODS.map(m => (
              <label key={m.value} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
                border: `1px solid ${form.paymentMethod === m.value ? 'var(--accent-border)' : 'var(--border)'}`,
                background: form.paymentMethod === m.value ? 'var(--accent-dim)' : 'var(--surface2)',
                color: form.paymentMethod === m.value ? 'var(--accent-text)' : 'var(--text-secondary)',
                fontWeight: form.paymentMethod === m.value ? 700 : 500,
                transition: 'all .15s',
              }}>
                <input type="radio" name="paymentMethod" value={m.value}
                  checked={form.paymentMethod === m.value} onChange={set('paymentMethod')}
                  style={{ display: 'none' }} />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            value={form.notes} onChange={set('notes')}
            placeholder="e.g. Paid ₦28,000 cash. Receipt #0041"
            rows={2}
            style={{
              ...selectStyle, resize: 'vertical', lineHeight: 1.6,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {firstTime && joiningFee > 0 && (
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
            background: 'var(--surface2)', border: '1px solid var(--border-strong)',
            borderRadius: 12, padding: '12px 14px',
          }}>
            <input
              type="checkbox"
              checked={chargeJoiningFee}
              onChange={(e) => setChargeJoiningFee(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--accent-text)' }}
            />
            <span style={{ fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                Joining fee collected ({formatCurrency(joiningFee)})
              </span>
              <br />
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                First-time member. Untick if you did not collect it or it was waived.
              </span>
            </span>
          </label>
        )}

        {selectedPlan && (
          <div style={{
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-text)',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
              Activation Summary
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                ['Plan',          selectedPlan.name],
                ['Cycle',         BILLING_CYCLES.find(c => c.value === form.billingCycle)?.label],
                ['Membership',    formatCurrency(selectedPlan.price)],
                ...(appliedJoiningFee > 0 ? [['Joining fee', formatCurrency(appliedJoiningFee)]] : []),
                ['Method',        PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.label],
                ['Starts',        formatDate(form.startDate)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 14,
                borderTop: '1px solid var(--accent-border)', marginTop: 5, paddingTop: 8,
              }}>
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>Total collected</span>
                <span style={{ color: 'var(--accent-text)', fontWeight: 800 }}>
                  {formatCurrency(totalCollected)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="accent" loading={saving}>Activate Subscription</Button>
        </div>
      </form>
    </Modal>
  );
}
