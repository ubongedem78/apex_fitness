'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import PageError from '@/components/ui/PageError';

function Skeleton({ width = '100%', height = 20, radius = 8 }) {
  return (
    <div style={{
      width, height,
      background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%)',
      backgroundSize: '200% 100%',
      borderRadius: radius,
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

export default function PersonalTrainerPage() {
  const toast = useToast();
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: ptData, isValidating, error, mutate } = useSWR('/pt-requests/my');
  const { data: meData } = useSWR('/users/me');
  const { data: plansData } = useSWR('/pt-plans', { revalidateIfStale: false });
  const { data: settingsData } = useSWR('/settings', { revalidateIfStale: false });

  const loading = isValidating && !ptData;
  const ptRequests = ptData?.ptRequests || [];
  const activeRequest = ptRequests.find((r) => ['pending', 'paid'].includes(r.status)) || null;

  const plans = plansData?.plans || (Array.isArray(plansData) ? plansData : []);
  const hasPTPlans = plans.length > 0;

  const settings = {};
  (settingsData?.settings || []).forEach((s) => { settings[s.key] = s.value; });
  const bankName = settings.bank_name || '';
  const bankAccountNumber = settings.bank_account_number || '';
  const bankAccountName = settings.bank_account_name || '';
  const hasBankDetails = !!(bankName || bankAccountNumber || bankAccountName);

  const ptAssignment = meData?.ptAssignment;
  if (ptAssignment) {
    router.replace('/dashboard');
    return null;
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId || p._id === selectedPlanId) || null;

  const handleSubmit = async () => {
    if (!selectedPlanId) { toast.error('Please select a plan'); return; }
    setSubmitting(true);
    try {
      await api.post('/pt-requests', { ptPlanId: selectedPlanId });
      toast.success('Personal trainer request submitted!');
      mutate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    setCancelling(true);
    try {
      await api.delete(`/pt-requests/${activeRequest.id || activeRequest._id}`);
      toast.success('PT request cancelled');
      setCancelModal(false);
      mutate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel request');
    } finally {
      setCancelling(false);
    }
  };

  if (error && !ptData) return <PageError onRetry={() => mutate()} />;

  return (
    <div style={{ maxWidth: 680, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <p className="apex-member-label">Training</p>
        <h1 className="apex-member-h1">Personal Trainer</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
          Work one-on-one with a certified Apex Fitness trainer. Your trainer will be assigned once payment is confirmed.
        </p>
      </div>

      {loading ? (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '28px 32px' }}>
          <Skeleton height={28} width="60%" />
          <div style={{ marginTop: 16 }}><Skeleton height={16} /></div>
          <div style={{ marginTop: 10 }}><Skeleton height={16} width="70%" /></div>
        </div>
      ) : activeRequest ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 28 }}>💪</span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                  {activeRequest.status === 'pending' ? 'Awaiting Payment Confirmation' : 'Payment Confirmed'}
                </h2>
                <Badge status={activeRequest.status} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 24 }}>
              {[
                { label: 'Plan', value: activeRequest.plan?.name || 'Personal Training' },
                {
                  label: activeRequest.sessions ? 'Sessions' : 'Duration',
                  value: activeRequest.sessions
                    ? `${activeRequest.sessions} sessions`
                    : `${activeRequest.durationMonths} month${activeRequest.durationMonths !== 1 ? 's' : ''}`,
                },
                { label: 'Amount Due', value: formatCurrency(parseFloat(activeRequest.totalAmount)) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
                  <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            {activeRequest.status === 'pending' && (
              <>
                <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-text)', marginBottom: 12 }}>
                    Payment Instructions
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, marginBottom: 12 }}>
                    Transfer exactly <strong style={{ color: 'var(--accent-text)' }}>{formatCurrency(parseFloat(activeRequest.totalAmount))}</strong> to the bank account below, then visit the front desk to confirm payment.
                  </p>
                  {hasBankDetails ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {bankName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Bank</span>
                          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>{bankName}</span>
                        </div>
                      )}
                      {bankAccountNumber && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Account Number</span>
                          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 900, fontFamily: 'monospace', letterSpacing: 1 }}>{bankAccountNumber}</span>
                        </div>
                      )}
                      {bankAccountName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Account Name</span>
                          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>{bankAccountName}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>Please speak to the front desk for bank details.</p>
                  )}
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Transfer the exact amount and notify the front desk. Your trainer will be assigned once payment is verified.
                  </p>
                </div>
                <div style={{ paddingTop: 4 }}>
                  <Button variant="danger" size="sm" onClick={() => setCancelModal(true)}>
                    Cancel Request
                  </Button>
                </div>
              </>
            )}

            {activeRequest.status === 'paid' && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '20px 22px' }}>
                <p style={{ fontSize: 14, color: '#22c55e', fontWeight: 700, marginBottom: 6 }}>Payment confirmed</p>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Our team will assign your personal trainer shortly. You will be notified and your trainer will appear on your dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: '28px 32px' }}>
          {!hasPTPlans ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>💪</p>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                Personal trainer packages have not been configured yet. Please contact the front desk for details.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>Choose a Package</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plans.map((plan) => {
                  const pid = plan._id || plan.id;
                  const selected = selectedPlanId === pid;
                  return (
                    <div
                      key={pid}
                      onClick={() => setSelectedPlanId(pid)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
                        background: selected ? 'var(--accent-dim)' : 'var(--surface2)',
                        transition: 'all 0.15s', gap: 16,
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 800, color: selected ? 'var(--accent-text)' : 'var(--text)', fontSize: 15, marginBottom: 2 }}>
                          {plan.name}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {plan.sessions ? `${plan.sessions} sessions` : `${plan.durationMonths} month${plan.durationMonths !== 1 ? 's' : ''}`}
                          {plan.description ? ` - ${plan.description}` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 20, fontWeight: 900, color: selected ? 'var(--accent-text)' : 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                          {formatCurrency(plan.price)}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {formatCurrency(Math.round(plan.price / (plan.sessions || plan.durationMonths || 1)))} / {plan.sessions ? 'session' : 'month'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  After submitting, you will receive bank transfer instructions. Your trainer will be assigned once the front desk confirms your payment.
                </p>
              </div>

              <Button
                variant="accent"
                loading={submitting}
                onClick={handleSubmit}
                style={{ width: '100%' }}
                disabled={!selectedPlanId}
              >
                {selectedPlan
                  ? `Request Trainer - ${formatCurrency(selectedPlan.price)}`
                  : 'Select a Package Above'}
              </Button>
            </>
          )}
        </div>
      )}

      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel PT Request">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to cancel your personal trainer request? You haven&apos;t made any payment yet, so no charges will be applied.
        </p>
        <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setCancelModal(false)}>Keep Request</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>Yes, Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
