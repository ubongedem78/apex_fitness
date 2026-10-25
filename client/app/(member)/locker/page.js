'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import PageError from '@/components/ui/PageError';
import Padlock from '@/components/ui/Padlock';

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

function RenewalRing({ daysLeft, totalDays }) {
  const pct   = Math.max(0, Math.min(1, daysLeft / totalDays));
  const r     = 30;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * pct;
  const color = daysLeft <= 7 ? '#e07070' : daysLeft <= 14 ? '#f9a97b' : '#6fcf97';

  return (
    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface2)" strokeWidth="5" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 900, color, letterSpacing: -1, lineHeight: 1 }}>{daysLeft}</span>
        <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>days</span>
      </div>
    </div>
  );
}

export default function LockerPage() {
  const toast = useToast();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: lockerData, isValidating, error, mutate } = useSWR('/lockers/my');
  const { data: settingsData } = useSWR('/settings', { revalidateIfStale: false });

  const locker = lockerData?.locker || null;
  const loading = isValidating && !lockerData;

  const lockerDaysLeft = locker?.endDate
    ? Math.max(0, Math.ceil((new Date(locker.endDate) - Date.now()) / 86400000))
    : null;
  const lockerTotalDays = locker?.billingCycle === 'quarterly' ? 90 : 30;

  const settings = {};
  (settingsData?.settings || []).forEach((s) => { settings[s.key] = s.value; });
  const monthlyPrice = parseFloat(settings.locker_monthly_price) || 0;
  const quarterlyPrice = parseFloat(settings.locker_quarterly_price) || 0;
  const pricingAvailable = monthlyPrice > 0 || quarterlyPrice > 0;

  const selectedPrice = billingCycle === 'quarterly' ? quarterlyPrice : monthlyPrice;

  const setupFee = lockerData?.setupFee || 0;
  const setupFeeApplies = !!lockerData?.setupFeeApplies;
  const dueToday = selectedPrice + (setupFeeApplies ? setupFee : 0);

  const handleSubscribe = async () => {
    if (!termsAccepted) { toast.error('Please accept the terms and conditions'); return; }
    if (!selectedPrice) { toast.error('Locker pricing not available. Please contact us.'); return; }
    setSubscribing(true);
    try {
      const { data } = await api.post('/lockers/subscribe', { billingCycle });
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success('Locker subscription activated!');
        mutate();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start locker subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.delete('/lockers/cancel');
      toast.success('Locker subscription cancelled');
      setCancelModal(false);
      mutate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel locker subscription');
    } finally {
      setCancelling(false);
    }
  };

  if (error && !lockerData) return <PageError onRetry={() => mutate()} />;

  return (
    <div style={{ maxWidth: 680, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <p className="apex-member-label">Storage</p>
        <h1 className="apex-member-h1">Apex Vault</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
          Your own secure locker at any Apex Fitness location - reserved exclusively for you.
        </p>
      </div>

      {loading ? (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '28px 32px' }}>
          <Skeleton height={28} width="60%" />
          <div style={{ marginTop: 16 }}><Skeleton height={16} /></div>
          <div style={{ marginTop: 10 }}><Skeleton height={16} width="70%" /></div>
        </div>
      ) : locker ? (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Padlock size={30} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Active Locker</h2>
              </div>
              <Badge status={locker.status} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            {lockerDaysLeft !== null && (
              <RenewalRing daysLeft={lockerDaysLeft} totalDays={lockerTotalDays} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {[
                { label: 'Billing', value: locker.billingCycle === 'quarterly' ? 'Quarterly' : 'Monthly' },
                { label: 'Started', value: formatDate(locker.startDate) },
                { label: 'Renews', value: formatDate(locker.endDate) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
                  <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              Your locker is personal and non-transferable. Access is tied to your active membership. Show your member ID at reception to access your locker.
            </p>
          </div>

          <Button variant="danger" size="sm" onClick={() => setCancelModal(true)}>
            Cancel Locker Subscription
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!pricingAvailable ? (
            <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Padlock size={72} /></div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Apex Vault</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                Locker pricing has not been configured yet. Please contact the front desk for current rates.
              </p>
            </div>
          ) : (
            <>
              <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', padding: '28px 32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                  <Padlock size={84} />
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', margin: 0 }}>Apex Vault</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 380, margin: 0 }}>
                    A personal, lockable space for your gear - reserved just for you at any Apex Fitness location.
                  </p>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>Choose a Plan</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { cycle: 'monthly', label: 'Monthly', price: monthlyPrice, desc: 'Billed every month' },
                    { cycle: 'quarterly', label: 'Quarterly', price: quarterlyPrice, desc: 'Billed every 3 months' },
                  ].filter((o) => o.price > 0).map((option) => (
                    <div
                      key={option.cycle}
                      onClick={() => setBillingCycle(option.cycle)}
                      style={{
                        border: `2px solid ${billingCycle === option.cycle ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
                        background: billingCycle === option.cycle ? 'var(--accent-dim)' : 'var(--surface2)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 6 }}>{option.label}</p>
                      <p style={{ fontSize: 26, fontWeight: 900, color: billingCycle === option.cycle ? 'var(--accent-text)' : 'var(--text)', letterSpacing: '-1px', lineHeight: 1 }}>
                        {formatCurrency(option.price)}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{option.desc}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 18px', marginBottom: 24, borderLeft: '3px solid var(--accent-border)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>What&apos;s included</p>
                  <ul style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                    <li>Dedicated locker at any Apex Fitness location</li>
                    <li>Personal and non-transferable - tied to your membership</li>
                    <li>Secure access during gym operating hours</li>
                  </ul>
                </div>

                <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{billingCycle === 'quarterly' ? 'Quarterly rental' : 'Monthly rental'}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(selectedPrice)}</span>
                  </div>
                  {setupFeeApplies && setupFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>One-time setup fee</span>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(setupFee)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 6, borderTop: '1px solid var(--accent-border)' }}>
                    <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 800 }}>Total today</span>
                    <span style={{ fontSize: 16, color: 'var(--accent-text)', fontWeight: 900 }}>{formatCurrency(dueToday)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                    Then {formatCurrency(selectedPrice)} every {billingCycle === 'quarterly' ? '3 months' : 'month'}, billed automatically to your card. Cancel anytime.
                  </p>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 24 }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: 3, flexShrink: 0, accentColor: 'var(--accent)', width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                    I agree to the{' '}
                    <Link
                      href="/locker-terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'var(--accent-text)', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      locker rental terms and conditions
                    </Link>
                    . The locker is personal and non-transferable. Access is tied to my membership.
                  </span>
                </label>

                <Button
                  variant="accent"
                  loading={subscribing}
                  onClick={handleSubscribe}
                  style={{ width: '100%' }}
                >
                  Subscribe - Pay {formatCurrency(dueToday)} today
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Locker Subscription">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to cancel your locker subscription? You will retain access until the end of your current billing period.
        </p>
        <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setCancelModal(false)}>Keep Locker</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>Cancel Subscription</Button>
        </div>
      </Modal>
    </div>
  );
}
