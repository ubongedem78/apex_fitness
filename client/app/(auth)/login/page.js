'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { login as authLogin } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      let dest = '/dashboard';
      if (['admin', 'manager', 'staff'].includes(user.role)) dest = '/admin/dashboard';
      else if (user.role === 'receptionist') dest = '/receptionist/checkin';
      router.replace(dest);
    }
  }, [user, router]);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const data = await authLogin(form.email, form.password);
      login(data.user);

    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    }
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
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: 'var(--text)',
            letterSpacing: '-1.5px',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Welcome Back
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Sign in to your Apex Fitness account</p>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(255,68,68,0.1)',
            border: '1px solid rgba(255,68,68,0.3)',
            borderRadius: 12,
            color: '#ff6666',
            fontSize: 13,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>⚠</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={fieldErrors.email}
          autoComplete="email"
        />

        <div style={{ position: 'relative' }}>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            error={fieldErrors.password}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{
              position: 'absolute', right: 14,
              bottom: fieldErrors.password ? 28 : 13,
              background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, padding: 0,
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
          <Link
            href="/forgot-password"
            style={{ color: 'var(--accent-text)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="accent" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
          Sign In
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: 14 }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 700 }}>
          Register
        </Link>
      </p>
    </div>
  );
}
