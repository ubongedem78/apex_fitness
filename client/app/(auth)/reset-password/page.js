'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 24px' }}>
          ✕
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', textTransform: 'uppercase', marginBottom: 12 }}>
          Invalid Link
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 28px' }}>
          This password reset link is invalid or has expired. Request a new one from the forgot password page.
        </p>
        <Link
          href="/forgot-password"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}
        >
          Request New Code →
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 24px' }}>
          ✓
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', textTransform: 'uppercase', marginBottom: 12 }}>
          Password Updated
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 28px' }}>
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--accent)', color: '#000', fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: 12, textDecoration: 'none' }}
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) { setError('Password is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Request a new code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
          New Password
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
          Choose a strong password for your Apex Fitness account.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, color: '#ff6666', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />
        <Button type="submit" variant="accent" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
          Reset Password
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

export default function ResetPasswordPage() {
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
      <Suspense fallback={<div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
