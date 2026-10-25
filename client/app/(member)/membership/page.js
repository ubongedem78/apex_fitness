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

export default function MembershipPage() {
  const toast = useToast();
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling,  setCancelling]  = useState(false);
  const [resuming,    setResuming]    = useState(false);
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [locationId,  setLocationId]  = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const { data: me, isValidating: meValidating, error: meError, mutate: refreshSub } = useSWR('/users/me');
  const { data: plansData, isValidating: plansValidating, error: plansError, mutate: refreshPlans } =
    useSWR('/memberships/plans', { revalidateIfStale: false });
  const { data: locationsData } = useSWR('/locations', { revalidateIfStale: false });
  const { data: settingsData  } = useSWR('/settings',  { revalidateIfStale: false });

  const sub         = me?.subscription;
  const todayStr    = new Date().toISOString().split('T')[0];
  const cancelledPending = !!sub?.cancelledAt && ['active', 'attention', 'paused'].includes(sub?.status) && sub?.endDate >= todayStr;
  const allPlans    = Array.isArray(plansData) ? plansData : plansData?.plans || [];
  const plans       = allPlans.filter((p) => !p.isDailyPass);
  const locations   = locationsData?.locations || locationsData || [];
  const isFirstTime = me?.isFirstTimeMember ?? !sub;

  const settingsList = settingsData?.settings || (Array.isArray(settingsData) ? settingsData : []);
  const joiningFeeSetting = settingsList.find((s) => s.key === 'joining_fee');
  const globalJoiningFee = joiningFeeSetting ? parseFloat(joiningFeeSetting.value) : 0;

  const settingNum = (key) => {
    const row = settingsList.find((s) => s.key === key);
    return row ? parseFloat(row.value) || 0 : 0;
  };
  const lockerMonthly   = settingNum('locker_monthly_price');
  const lockerQuarterly = settingNum('locker_quarterly_price');
  const lockerSetupFee  = settingNum('locker_setup_fee');

  const handleSelectPlan = (plan) => {
    setLocationId('');
    setConfirmPlan(plan);
  };

  const meUser   = me?.user;
  const hasCard  = !!(meUser?.cardLast4);

  const handleSubscribe = async () => {
    if (!confirmPlan) return;
    if (confirmPlan.locationAccess === 'single' && !locationId) {
      toast.error('Please select a location');
      return;
    }
    setSubscribing(true);
    try {
      const endpoint = '/memberships/subscribe';
      const payload  = { planId: confirmPlan.id };
      if (locationId) payload.locationId = locationId;
      const { data } = await api.post(endpoint, payload);
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success(`${confirmPlan.name} membership activated. Welcome aboard!`);
        refreshSub();
        setConfirmPlan(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not process payment');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.delete('/memberships/cancel');
      toast.success('Membership cancelled. You retain access until your billing period ends.');
      setCancelModal(false);
      refreshSub();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel membership. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleResume = async () => {
    setResuming(true);
    try {
      await api.post('/memberships/resume');
      toast.success('Membership resumed. Your card will be charged on your usual renewal date, not before.');
      refreshSub();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resume membership. Please try again.');
    } finally {
      setResuming(false);
    }
  };

  if (meValidating || plansValidating) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 32, height: 32, border: "2px solid var(--accent-border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if ((meError && !me) || (plansError && !plansData)) {
    return <PageError onRetry={() => { refreshSub(); refreshPlans(); }} />;
  }

  return (
    <div style={{ maxWidth: 860, animation: "fadeIn 0.4s ease" }}>

      <div style={{ marginBottom: 32 }}>
        <p className="apex-member-label">Billing</p>
        <h1 className="apex-member-h1">Membership</h1>
      </div>

      {sub ? (
        <div
          style={{
            borderRadius: 20,
            border: "1px solid var(--accent-border)",
            overflow: "hidden",
            marginBottom: 40,
          }}
        >

          <div
            style={{
              height: 3,
              background:
                "linear-gradient(90deg, #215235 0%, #f9a97b 50%, #215235 100%)",
            }}
          />

          <div
            style={{
              padding: "clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px)",
              background: "var(--surface)",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 28,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color: "var(--accent-text)",
                    marginBottom: 6,
                  }}
                >
                  Current Plan
                </p>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "var(--text)",
                    letterSpacing: "-1px",
                    margin: 0,
                  }}
                >
                  {sub.plan?.name || "Unknown Plan"}
                </h2>
              </div>
              <Badge status={cancelledPending ? 'cancelled' : sub.status} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 1,
                background: "var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 28,
              }}
            >
              {[
                {
                  label: "Plan Price",
                  value: formatCurrency(sub.plan?.price || 0),
                },
                {
                  label: "Billing Cycle",
                  value: sub.plan?.billingCycle === "annual" ? "Annual"
                    : sub.plan?.billingCycle === "quarterly" ? "Quarterly"
                    : sub.plan?.billingCycle === "daily" ? "Day Pass"
                    : "Monthly",
                },
                {
                  label: (cancelledPending || sub.status === 'cancelled') ? "Access Until" : "Renews On",
                  value: formatDate(sub.endDate),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--surface2)",
                    padding: "18px 22px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      color: "var(--muted)",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {sub.plan?.features?.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "var(--muted)",
                  }}
                >
                  What&apos;s included
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "8px 24px",
                  }}
                >
                  {sub.plan.features.map((f, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "rgba(34,197,94,0.15)",
                          border: "1px solid rgba(34,197,94,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "#22c55e",
                          flexShrink: 0,
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </span>
                      <span
                        style={{ fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cancelledPending ? (
              <div style={{ paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
                  Your membership is cancelled. You have full access until <strong style={{ color: 'var(--accent-text)' }}>{formatDate(sub.endDate)}</strong>, after which no further charges will be made. Changed your mind?
                </p>
                <Button variant="accent" size="sm" loading={resuming} onClick={handleResume}>
                  Resume membership
                </Button>
              </div>
            ) : (sub.status === "active" || sub.status === "attention") ? (
              <div style={{ paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <Button variant="danger" size="sm" onClick={() => setCancelModal(true)}>
                  Cancel membership
                </Button>
              </div>
            ) : sub.status === "cancelled" ? (
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Your membership is cancelled. You have full access until <strong style={{ color: 'var(--accent-text)' }}>{formatDate(sub.endDate)}</strong>, after which no further charges will be made.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 20,
            border: "1px solid var(--border)",
            padding: "clamp(28px, 6vw, 48px) clamp(16px, 4vw, 32px)",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 14 }}>💳</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "var(--text)",
              letterSpacing: "-0.5px",
              marginBottom: 8,
            }}
          >
            No active plan
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            Choose a plan below to get started.
          </p>
        </div>
      )}

      {plans.length > 0 && !['active', 'paused', 'attention'].includes(sub?.status) && (
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "var(--text)",
              letterSpacing: "-0.5px",
              marginBottom: 20,
            }}
          >
            Choose a Plan
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {plans.map((plan) => {
              const isCurrent = sub?.plan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  style={{
                    background: "var(--surface)",
                    borderRadius: 16,
                    border: isCurrent
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border)",
                    padding: "clamp(14px, 3vw, 22px)",
                    position: "relative",
                    transition: "border-color 0.2s",
                  }}
                >
                  {isCurrent && (
                    <span
                      style={{
                        position: "absolute",
                        top: -11,
                        right: 18,
                        background: "var(--accent)",
                        color: "var(--accent-fg)",
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        padding: "4px 12px",
                        borderRadius: 100,
                      }}
                    >
                      Active
                    </span>
                  )}

                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "var(--text)",
                      margin: "0 0 4px",
                    }}
                  >
                    {plan.name}
                  </p>
                  <p style={{ margin: "0 0 12px" }}>
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: "var(--accent-text)",
                        letterSpacing: "-1px",
                      }}
                    >
                      {formatCurrency(plan.price)}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--muted)",
                        fontWeight: 500,
                      }}
                    >
                      /{plan.billingCycle}
                    </span>
                  </p>

                  {plan.description && (
                    <p
                      style={{
                        color: "var(--muted)",
                        fontSize: 13,
                        margin: "0 0 14px",
                        lineHeight: 1.5,
                      }}
                    >
                      {plan.description}
                    </p>
                  )}

                  {plan.features?.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      {plan.features.slice(0, 5).map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            padding: "3px 0",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--accent-text)",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {f}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isFirstTime && globalJoiningFee > 0 && (
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, padding: '6px 10px', background: 'var(--surface2)', borderRadius: 8, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-text)' }}>One-time joining fee: {formatCurrency(globalJoiningFee)}</span>
                      <br />Total today: {formatCurrency(parseFloat(plan.price) + globalJoiningFee)}
                    </p>
                  )}
                  <Button
                    variant="accent"
                    size="sm"
                    style={{ width: '100%' }}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Get started
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(lockerMonthly > 0 || lockerQuarterly > 0) && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text)', margin: 0 }}>
              Personal Locker
            </h2>
            <Link href="/locker" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 700, color: 'var(--accent-text)' }}>
              Manage locker ›
            </Link>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
            Keep your kit at the gym. A one-time setup fee applies to your first locker only.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { key: 'monthly',   label: 'Monthly',   price: lockerMonthly,   cycle: 'month'   },
              { key: 'quarterly', label: 'Quarterly', price: lockerQuarterly, cycle: 'quarter' },
            ].filter((o) => o.price > 0).map((opt) => (
              <div key={opt.key} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--card-shadow)',
              }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {opt.label}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)' }}>
                  {formatCurrency(opt.price)}
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>/{opt.cycle}</span>
                </p>
                {lockerSetupFee > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ color: 'var(--muted)' }}>Setup fee</span>
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(lockerSetupFee)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span style={{ color: 'var(--muted)', fontWeight: 700 }}>Total first {opt.cycle}</span>
                      <span style={{ color: 'var(--accent-text)', fontWeight: 800 }}>{formatCurrency(opt.price + lockerSetupFee)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={!!confirmPlan}
        onClose={() => setConfirmPlan(null)}
        title={sub ? 'Switch Plan' : 'Get Started'}
      >
        {confirmPlan && (
          <>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', marginBottom: 18, borderLeft: '3px solid var(--accent)' }}>
              <p style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Selected Plan</p>
              <p style={{ color: 'var(--text)', fontWeight: 900, fontSize: 18, letterSpacing: '-0.5px', marginBottom: 2 }}>{confirmPlan.name}</p>
              <p style={{ color: 'var(--accent-text)', fontWeight: 800, fontSize: 16 }}>
                {formatCurrency(confirmPlan.price)}
                <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 13 }}>/{confirmPlan.billingCycle}</span>
              </p>
              {isFirstTime && globalJoiningFee > 0 && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--surface)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)' }}>Plan price</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(confirmPlan.price)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)' }}>One-time joining fee</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(globalJoiningFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 700 }}>Total today</span>
                    <span style={{ color: 'var(--accent-text)', fontWeight: 900 }}>{formatCurrency(parseFloat(confirmPlan.price) + globalJoiningFee)}</span>
                  </div>
                </div>
              )}
            </div>

            {confirmPlan.locationAccess === 'single' && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 8 }}>Select Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: locationId ? 'var(--text)' : 'var(--text-tertiary)', fontSize: 14, outline: 'none' }}
                >
                  <option value="">Choose a location...</option>
                  {locations.map((l) => (
                    <option key={l._id || l.id} value={l._id || l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}

            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
              By proceeding, you agree to the{' '}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent-text)', fontWeight: 700, textDecoration: 'underline' }}
              >
                Membership Terms &amp; Conditions
              </Link>
              .
            </p>

            <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setConfirmPlan(null)}>Cancel</Button>
              <Button variant="accent" loading={subscribing} onClick={handleSubscribe}>
                Proceed to Payment
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={cancelModal} onClose={() => !cancelling && setCancelModal(false)} title="Cancel Membership">
        <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
          <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>
            Are you sure you want to cancel?
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65, margin: 0 }}>
            Your membership will remain <strong style={{ color: 'var(--accent-text)' }}>fully active until {sub?.endDate ? formatDate(sub.endDate) : 'the end of your billing period'}</strong>. After that date your card will not be charged again and your access will end.
          </p>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
          You can re-subscribe at any time. The one-time joining fee will not be charged again.
        </p>
        <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setCancelModal(false)} disabled={cancelling}>Keep membership</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>Yes, cancel membership</Button>
        </div>
      </Modal>
    </div>
  );
}
