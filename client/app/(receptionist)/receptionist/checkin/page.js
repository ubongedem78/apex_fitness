'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getInitials } from '@/lib/utils';

const STATUS_CONFIG = {
  active:         { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  label: 'Active',         canCheckIn: true  },
  expiring:       { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  label: 'Expiring Soon',  canCheckIn: true  },
  attention:      { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', label: 'Payment Issue',  canCheckIn: true  },
  expired:        { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  label: 'Expired',        canCheckIn: false },
  payment_issue:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  label: 'Payment Failed', canCheckIn: false },
  paused:         { color: '#6b7280', bg: 'rgba(107,114,128,0.12)',border: 'rgba(107,114,128,0.3)',label: 'Paused',         canCheckIn: false },
  cancelled:      { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  label: 'Cancelled',      canCheckIn: false },
  no_membership:  { color: '#6b7280', bg: 'rgba(107,114,128,0.12)',border: 'rgba(107,114,128,0.3)',label: 'No Membership',  canCheckIn: false },
};

function formatTime(visitTime) {
  if (!visitTime) return '';
  const [h, m] = visitTime.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function CheckInPage() {
  const toast = useToast();
  const inputRef  = useRef(null);
  const resultRef = useRef(null);

  const [memberNumber, setMemberNumber] = useState('');
  const [looking,  setLooking]  = useState(false);
  const [checking, setChecking] = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [lastCheckedIn, setLastCheckedIn] = useState(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resetForNext = () => {
    setMemberNumber('');
    setResult(null);
    setError('');
    setLooking(false);
    setChecking(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleLookup = async (numStr) => {
    const num = numStr.trim();
    if (!num) return;
    if (!/^\d{6}$/.test(num)) {
      setError('Enter a valid 6-digit member number.');
      return;
    }
    setError('');
    setResult(null);
    setLooking(true);
    try {
      const { data } = await api.get(`/receptionist/lookup/${num}`);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } catch (e) {
      setError(e.response?.data?.message || 'Member not found.');
    } finally {
      setLooking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup(memberNumber);
  };

  const handleCheckIn = async () => {
    if (!result) return;
    setChecking(true);
    try {
      const { data } = await api.post('/receptionist/checkin', {
        displayMemberNumber: result.user.displayMemberNumber,
      });

      if (data.alreadyCheckedIn) {
        toast.info(data.message);
      } else {
        setLastCheckedIn({
          name: `${result.user.firstName} ${result.user.lastName}`,
          memberNumber: result.user.displayMemberNumber,
          time: formatTime(data.visit?.visitTime),
          avatarUrl: result.user.avatarUrl,
          initials: getInitials(result.user.firstName, result.user.lastName),
        });
        toast.success(data.message || 'Checked in successfully.');
      }
      resetForNext();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Check-in failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const cfg = result ? (STATUS_CONFIG[result.accessStatus] || STATUS_CONFIG.no_membership) : null;
  const lockerCfg = result?.locker ? (STATUS_CONFIG[result.locker.accessStatus] || STATUS_CONFIG.no_membership) : null;

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 6 }}>
          Member Check-In
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Enter the member&rsquo;s 6-digit ID to look them up and record their visit.
        </p>
      </div>

      {lastCheckedIn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 16, padding: '14px 18px',
          marginBottom: 24, animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: lastCheckedIn.avatarUrl ? 'transparent' : 'linear-gradient(135deg,#f9a97b,#b85e2a)',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, color: '#1b1b19',
          }}>
            {lastCheckedIn.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={lastCheckedIn.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : lastCheckedIn.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: 15 }}>
              ✓ {lastCheckedIn.name}
            </p>
            <p style={{ margin: 0, color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
              #{lastCheckedIn.memberNumber} - checked in at {lastCheckedIn.time}
            </p>
          </div>
          <button
            onClick={() => setLastCheckedIn(null)}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 'clamp(20px,4vw,32px)',
        boxShadow: 'var(--card-shadow)',
      }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 10 }}>
          Member ID
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            value={memberNumber}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              setMemberNumber(v);
              if (error) setError('');
              if (result) setResult(null);
              if (v.length === 6) handleLookup(v);
            }}
            onKeyDown={handleKeyDown}
            placeholder="100001"
            style={{
              flex: 1,
              padding: '16px 20px',
              background: 'var(--surface2)',
              border: `2px solid ${error ? '#ef4444' : 'var(--border-strong)'}`,
              borderRadius: 14,
              color: 'var(--text)',
              fontSize: 'clamp(20px,5vw,28px)',
              fontWeight: 900,
              letterSpacing: 'clamp(2px,1vw,6px)',
              fontFamily: 'monospace',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { if (!error) e.target.style.borderColor = 'var(--border-strong)'; }}
          />
          <Button
            variant="accent"
            onClick={() => handleLookup(memberNumber)}
            loading={looking}
            style={{ padding: '0 clamp(14px,3vw,22px)', borderRadius: 14, fontSize: 14, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Look Up
          </Button>
        </div>
        {error && (
          <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
            ⚠ {error}
          </p>
        )}
      </div>

      {result && (
        <div ref={resultRef} style={{ marginTop: 20, animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            background: 'var(--surface)',
            border: `1px solid ${cfg.border}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)',
          }}>

            <div style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}`, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>
                  {cfg.label}
                </span>
                {result.cancelled && cfg.canCheckIn && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Cancelled
                  </span>
                )}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderRadius: 20, padding: '3px 12px',
                fontSize: 12, fontWeight: 700, color: cfg.color,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                {cfg.canCheckIn ? 'Access Permitted' : 'Access Denied'}
              </span>
            </div>

            <div style={{ padding: 'clamp(16px,3vw,24px)', display: 'flex', alignItems: 'center', gap: 'clamp(16px,4vw,24px)', flexWrap: 'wrap' }}>
              <div style={{
                width: 'clamp(140px, 40vw, 190px)', height: 'clamp(140px, 40vw, 190px)', borderRadius: 18, flexShrink: 0,
                background: result.user.avatarUrl ? 'transparent' : 'linear-gradient(135deg,#f9a97b,#b85e2a)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 56, color: '#1b1b19',
                border: `3px solid ${cfg.border}`,
              }}>
                {result.user.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={result.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(result.user.firstName, result.user.lastName)}
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                  {result.user.firstName} {result.user.lastName}
                </p>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13, fontFamily: 'monospace', letterSpacing: '2px' }}>
                  #{result.user.displayMemberNumber}
                </p>
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-0.5px' }}>{result.totalVisits}</span>{' '}total visits
                </p>
              </div>
            </div>

            <div style={{ margin: '0 clamp(16px,3vw,24px)', padding: '12px 16px', background: cfg.bg, borderRadius: 12, border: `1px solid ${cfg.border}`, marginBottom: 'clamp(12px,2vw,16px)' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Membership</p>
              <p style={{ margin: 0, fontSize: 13, color: cfg.color, fontWeight: 600, lineHeight: 1.5 }}>
                {result.accessMessage}
              </p>
            </div>

            {lockerCfg ? (
              <div style={{ margin: '0 clamp(16px,3vw,24px)', padding: '12px 16px', background: lockerCfg.bg, borderRadius: 12, border: `1px solid ${lockerCfg.border}`, marginBottom: 'clamp(16px,3vw,24px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>🔒 Locker</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: lockerCfg.color }}>{lockerCfg.label}</span>
                  {result.locker.cancelled && lockerCfg.canCheckIn && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '1px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cancelled</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: lockerCfg.color }}>{lockerCfg.canCheckIn ? 'Access' : 'No Access'}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: lockerCfg.color, fontWeight: 600, lineHeight: 1.5 }}>
                  {result.locker.accessMessage}
                </p>
              </div>
            ) : (
              <div style={{ margin: '0 clamp(16px,3vw,24px)', padding: '10px 16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 'clamp(16px,3vw,24px)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>🔒 No locker rental</span>
              </div>
            )}

            {result.alreadyCheckedIn && (
              <div style={{ margin: '0 clamp(16px,3vw,24px)', padding: '12px 16px', background: 'rgba(234,179,8,0.08)', borderRadius: 12, border: '1px solid rgba(234,179,8,0.25)', marginBottom: 'clamp(16px,3vw,24px)' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#eab308', fontWeight: 600 }}>
                  Already checked in today at {formatTime(result.todayCheckInTime)}
                </p>
              </div>
            )}

            <div className="apex-actions" style={{ padding: '0 clamp(16px,3vw,24px) clamp(16px,3vw,24px)', display: 'flex', gap: 10 }}>
              <Button
                variant="ghost"
                onClick={resetForNext}
                style={{ borderRadius: 12 }}
              >
                Clear
              </Button>
              <Button
                variant="accent"
                loading={checking}
                disabled={!cfg.canCheckIn || result.alreadyCheckedIn}
                onClick={handleCheckIn}
                style={{ flex: 1, borderRadius: 12 }}
              >
                {result.alreadyCheckedIn
                  ? 'Already Checked In'
                  : cfg.canCheckIn
                  ? 'Check In'
                  : 'Cannot Check In'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!result && !looking && !error && (
        <div style={{ textAlign: 'center', marginTop: 48, color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🪪</div>
          <p style={{ fontSize: 14, fontWeight: 500 }}>Enter a member ID above to begin</p>
        </div>
      )}
    </div>
  );
}
