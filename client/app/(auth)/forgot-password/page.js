'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function EmailStep({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      onSuccess(email);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
          Reset Password
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
          Enter your email address and we&apos;ll send you a 6-digit reset code.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, color: '#ff6666', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com"
          error={error && !email ? error : ''}
          autoComplete="email"
        />
        <Button type="submit" variant="accent" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
          Send Reset Code
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: 14 }}>
        <Link href="/login" style={{ color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 700 }}>
          ← Back to Sign In
        </Link>
      </p>
    </>
  );
}

function OtpStep({ email, onBack }) {
  const router = useRouter();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {

    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, '').slice(0, 6);
      if (cleaned.length === 6) {
        const next = cleaned.split('');
        setDigits(next);
        inputRefs.current[5]?.focus();
        return;
      }
    }

    const single = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = single;
    setDigits(next);
    setError('');

    if (single && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const cleaned = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!cleaned) return;
    const next = ['', '', '', '', '', ''];
    cleaned.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError('');
    const lastFilled = Math.min(cleaned.length - 1, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) { setError('Enter all 6 digits of your reset code'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { resetToken } = res.data;
      router.push(`/reset-password?token=${resetToken}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect or expired code. Try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setResent(true);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (_) {
      setError('Failed to resend code. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 20 }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
          Enter Code
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
          We sent a 6-digit code to{' '}
          <strong style={{ color: 'var(--accent-text)' }}>{email}</strong>.
          Enter it below - it expires in 15 minutes.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, color: '#ff6666', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠</span> {error}
        </div>
      )}

      {resent && (
        <div style={{ padding: '12px 16px', background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: 12, color: 'var(--accent-text)', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✓</span> New code sent - check your inbox.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              style={{
                width: 'clamp(40px, 12vw, 52px)',
                height: 'clamp(52px, 15vw, 64px)',
                background: 'var(--surface2)',
                border: d
                  ? '2px solid var(--accent-border)'
                  : '2px solid var(--border-strong)',
                borderRadius: 12,
                textAlign: 'center',
                fontSize: 'clamp(20px, 6vw, 28px)',
                fontWeight: 900,
                color: 'var(--text)',
                fontFamily: "'Courier New', monospace",
                outline: 'none',
                transition: 'border-color 0.15s ease, background 0.15s ease',
                caretColor: 'transparent',
              }}
              onFocusCapture={(e) => {
                e.target.style.borderColor = 'var(--accent-border)';
                e.target.style.background = 'var(--surface)';
              }}
              onBlurCapture={(e) => {
                e.target.style.borderColor = e.target.value ? 'var(--accent-border)' : 'var(--border-strong)';
                e.target.style.background = 'var(--surface2)';
              }}
            />
          ))}
        </div>

        <Button type="submit" variant="accent" size="lg" loading={loading} style={{ width: '100%' }}>
          Verify Code
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: 13 }}>
        Didn&apos;t receive it?{' '}
        <button
          onClick={handleResend}
          disabled={resending}
          style={{ background: 'none', border: 'none', cursor: resending ? 'default' : 'pointer', color: 'var(--accent-text)', fontWeight: 700, fontSize: 13, padding: 0 }}
        >
          {resending ? 'Sending...' : 'Resend code'}
        </button>
      </p>
    </>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');

  const handleEmailSuccess = (submittedEmail) => {
    setEmail(submittedEmail);
    setStep('otp');
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
        padding: 'clamp(24px,5vw,36px) clamp(20px,5vw,32px)',
        animation: 'fadeIn 0.4s ease forwards',
      }}
    >
      {step === 'email' ? (
        <EmailStep onSuccess={handleEmailSuccess} />
      ) : (
        <OtpStep email={email} onBack={() => setStep('email')} />
      )}
    </div>
  );
}
