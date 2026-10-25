'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

function VerifyContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const reference = params.get('reference');

  const [status,  setStatus]  = useState('verifying');
  const [details, setDetails] = useState(null);
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!reference) {
      setMessage('No payment reference found.');
      setStatus('error');
      return;
    }

    let cancelled = false;

    const verify = () => {
      api.post('/memberships/verify-payment', { reference })
        .then(({ data }) => {
          if (cancelled) return;
          setDetails(data);
          setStatus('success');
          setTimeout(() => router.replace('/membership'), 3000);
        })
        .catch((err) => {
          if (cancelled) return;
          setMessage(err.response?.data?.message || 'We could not verify your payment. Please try again.');
          setStatus('error');
        });
    };

    const delay = attempt === 0 ? 800 : 0;
    const timer = setTimeout(verify, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reference, router, attempt]);

  if (status === 'verifying') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '80px 0' }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid var(--accent-border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>Confirming your payment…</p>
      </div>
    );
  }

  if (status === 'success') {
    const plan = details?.subscription?.plan || details?.payment;
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '60px 0', animation: 'fadeIn 0.4s ease' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(33,82,53,0.25)',
          border: '2px solid #215235',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 28px',
        }}>
          ✓
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', textTransform: 'uppercase', marginBottom: 12 }}>
          Payment confirmed
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Your membership is now active. We&apos;ve sent a confirmation to your email.
          <br />Redirecting you now…
        </p>
        <Button variant="accent" onClick={() => router.replace('/membership')}>
          Go to membership
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', padding: '60px 0', animation: 'fadeIn 0.4s ease' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(255,68,68,0.1)',
        border: '2px solid rgba(255,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, margin: '0 auto 28px',
      }}>
        ✕
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', textTransform: 'uppercase', marginBottom: 12 }}>
        Verification failed
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
        {message}
      </p>
      <div className="apex-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button variant="ghost" onClick={() => router.push('/membership')}>
          Back to membership
        </Button>
        <Button variant="accent" onClick={() => { setStatus('verifying'); setMessage(''); setAttempt((n) => n + 1); }}>
          Try again
        </Button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
