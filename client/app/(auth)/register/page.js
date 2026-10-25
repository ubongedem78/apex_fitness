'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { register as authRegister } from '@/lib/auth';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Button from '@/components/ui/Button';
import { MEMBERSHIP_TERMS } from '@/lib/terms';
import { uploadAvatar } from '@/lib/avatar';
import TermsSections from '@/components/TermsSections';

const STEPS = ['Account', 'Date of Birth', 'Photo', 'Terms & Conditions', 'Add Card'];

function ProgressBar({ step }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        {STEPS.map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: i <= step ? 'var(--accent-text)' : 'var(--muted)',
              transition: 'color 0.3s',
            }}
          >
            {label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 3,
              background: i <= step ? 'var(--accent)' : 'var(--border-strong)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

const MIN_PASSWORD_SCORE = 3;

function scorePassword(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  return score;
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = scorePassword(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];
  const colors = ['', '#ff4444', '#ffa500', 'var(--accent-text)', '#00d4ff', '#00d4ff'];
  const color = colors[score] || '#00d4ff';
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 3, flex: 1, borderRadius: 3, background: i <= score ? color : 'var(--border-strong)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color, fontWeight: 600 }}>{labels[score]}</p>
    </div>
  );
}

function StepAccount({ form, onChange, fieldErrors, onNext }) {
  const [showPwd, setShowPwd] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!form.email)            errs.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.phone)            errs.phone     = 'Phone number is required';
    if (!form.password)         errs.password  = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (scorePassword(form.password) < MIN_PASSWORD_SCORE) errs.password = 'Please choose a stronger password - add an uppercase letter, a number, or a symbol';
    if (!form.confirmPassword)  errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const nudgeWeakPassword = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([40, 30, 40]);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      if (errs.password) nudgeWeakPassword();
      onNext(null, errs);
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes apex-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .apex-shake { animation: apex-shake 0.4s ease; }
      `}</style>
      <div className="apex-register-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="First Name" name="firstName" value={form.firstName} onChange={onChange} placeholder="Chidi" error={fieldErrors.firstName} />
        <Input label="Last Name"  name="lastName"  value={form.lastName}  onChange={onChange} placeholder="Okonkwo" error={fieldErrors.lastName} />
      </div>
      <Input label="Email Address" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" error={fieldErrors.email} autoComplete="email" />
      <PhoneInput label="Phone Number" name="phone" value={form.phone} onChange={onChange} error={fieldErrors.phone} />
      <div>
        <div className={shake ? 'apex-shake' : ''} style={{ position: 'relative' }}>
          <Input label="Password" type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={onChange} placeholder="Min. 8 characters" error={fieldErrors.password} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 14, bottom: fieldErrors.password ? 28 : 13, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
            {showPwd ? 'Hide' : 'Show'}
          </button>
        </div>
        <PasswordStrength password={form.password} />
      </div>
      <Input label="Confirm Password" type={showPwd ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={onChange} placeholder="Repeat your password" error={fieldErrors.confirmPassword} autoComplete="new-password" />
      <Button type="submit" variant="accent" size="lg" style={{ width: '100%', marginTop: 4 }}>Continue →</Button>
    </form>
  );
}

function StepDOB({ form, onChange, fieldErrors, onNext, onBack, loading }) {
  const handleNext = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    else {
      const dob = new Date(form.dateOfBirth);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 16);
      if (dob > minAge) errs.dateOfBirth = 'You must be at least 16 years old to join';
    }
    if (form.ptRequested === null || form.ptRequested === undefined || form.ptRequested === '') {
      errs.ptRequested = 'Please indicate whether you want a personal trainer';
    }
    if (Object.keys(errs).length > 0) { onNext(null, errs); return; }
    onNext();
  };

  return (
    <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input
        label="Date of Birth"
        type="date"
        name="dateOfBirth"
        value={form.dateOfBirth}
        onChange={onChange}
        error={fieldErrors.dateOfBirth}
        max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
      />

      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
          Would you like a Personal Trainer?
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
          Our trainers work with you one-on-one. Payment is handled offline at the gym. You can always change this later.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ value: true, label: 'Yes, I want a PT' }, { value: false, label: 'Not right now' }].map(({ value, label }) => {
            const active = form.ptRequested === value;
            return (
              <button
                key={String(value)}
                type="button"
                onClick={() => onChange({ target: { name: 'ptRequested', value } })}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                  background: active ? 'var(--accent-dim)' : 'var(--surface2)',
                  color: active ? 'var(--accent-text)' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        {fieldErrors.ptRequested && <p style={{ fontSize: 12, color: '#ff4444', marginTop: 6 }}>{fieldErrors.ptRequested}</p>}
      </div>

      <div className="apex-actions" style={{ display: 'flex', gap: 10 }}>
        <Button type="button" variant="ghost" size="lg" onClick={onBack} style={{ flex: 1 }}>← Back</Button>
        <Button type="submit" variant="accent" size="lg" loading={loading} style={{ flex: 2 }}>Continue →</Button>
      </div>
    </form>
  );
}


function StepTerms({ onNext, onBack }) {
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const handleNext = (e) => {
    e.preventDefault();
    if (!agreed) { setError('You must read and accept the terms to continue.'); return; }
    onNext();
  };

  return (
    <form onSubmit={handleNext}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
        Please read the full terms before accepting. Scroll to review each section.
      </p>

      <div
        style={{
          height: 300, overflowY: 'auto', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 18px', marginBottom: 16,
          background: 'var(--surface2)',
        }}
      >
        <TermsSections terms={MEMBERSHIP_TERMS} compact />
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
          These terms constitute the full membership agreement between you and Apex Fitness. By accepting, you confirm you have read, understood, and agree to all of the above.
        </p>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => { setAgreed(e.target.checked); setError(''); }}
          style={{ marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0, width: 16, height: 16 }}
        />
        <span>
          I have read and agree to the{' '}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--accent-text)', fontWeight: 700, textDecoration: 'underline' }}
          >
            Apex Fitness Membership Terms &amp; Conditions
          </Link>
        </span>
      </label>
      {error && <p style={{ fontSize: 12, color: '#ff4444', marginBottom: 12 }}>{error}</p>}

      <div className="apex-actions" style={{ display: 'flex', gap: 10 }}>
        <Button type="button" variant="ghost" size="lg" onClick={onBack} style={{ flex: 1 }}>← Back</Button>
        <Button type="submit" variant="accent" size="lg" style={{ flex: 2 }}>Accept & Continue →</Button>
      </div>
    </form>
  );
}

function StepPhoto({ updateUser, onNext, onBack }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onSelect = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Please choose an image file'); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleContinue = async () => {
    if (!file) { setError('Please add a photo to continue'); return; }
    setUploading(true);
    setError('');
    try {
      const updated = await uploadAvatar(file);
      updateUser(updated);
      onNext();
    } catch (err) {
      setError(err.message || 'Could not upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
        A clear photo of your face is required. Reception uses it to verify you at check-in. You can change it anytime from your profile.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            width: 128, height: 128, borderRadius: '50%', overflow: 'hidden',
            cursor: uploading ? 'default' : 'pointer',
            background: preview ? 'transparent' : 'var(--surface2)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', fontSize: 34,
          }}
        >
          {preview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '📷'}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ background: 'none', border: 'none', color: 'var(--accent-text)', fontSize: 13, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', padding: 0 }}
        >
          {preview ? 'Choose a different photo' : 'Choose a photo'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={onSelect} style={{ display: 'none' }} />
      </div>

      {error && <p style={{ fontSize: 12, color: '#ff4444', margin: 0, textAlign: 'center' }}>{error}</p>}

      <div className="apex-actions" style={{ display: 'flex', gap: 10 }}>
        <Button type="button" variant="ghost" size="lg" onClick={onBack} style={{ flex: 1 }} disabled={uploading}>← Back</Button>
        <Button type="button" variant="accent" size="lg" onClick={handleContinue} loading={uploading} disabled={!file} style={{ flex: 2 }}>
          Upload &amp; Continue →
        </Button>
      </div>
    </div>
  );
}

function StepCard({ user, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const scriptLoaded          = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleCapture = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/cards/initialize');
      const { reference, accessCode, publicKey } = data;

      const PaystackPop = window.PaystackPop;
      if (!PaystackPop) {
        setError('Payment widget failed to load. Please refresh the page and try again.');
        setLoading(false);
        return;
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: 50 * 100,
        ref: reference,
        access_code: accessCode,
        metadata: { isCardCapture: true },
        onClose: () => { setLoading(false); },
        callback: (response) => {
          api.post('/cards/verify', { reference: response.reference })
            .then((verifyRes) => {
              const { user: updatedUser } = verifyRes.data;
              onComplete(updatedUser);
            })
            .catch((e) => {
              setError(e.response?.data?.message || 'Card verification failed. Please try again.');
              setLoading(false);
            });
        },
      });
      handler.openIframe();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to initialise payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '20px 22px',
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Why do we need your card?</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>
          We charge a refundable <strong style={{ color: 'var(--accent-text)' }}>₦50 verification fee</strong> to securely save your card. This amount is returned to you immediately - it&rsquo;s just to confirm the card is valid. Once saved, your card is used for membership payments.
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>🔒</span>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
          Your card details are encrypted and stored securely by Paystack. We never store your full card number.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, color: '#ff6666', fontSize: 13, marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      <Button onClick={handleCapture} variant="accent" size="lg" loading={loading} style={{ width: '100%' }}>
        Add Card (₦50 refundable)
      </Button>
    </div>
  );
}

export default function RegisterPage() {
  const router              = useRouter();
  const { login, user, loading: authLoading, updateUser } = useAuth();
  const [step, setStep]     = useState(0);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '',
    dateOfBirth: '', ptRequested: null,
  });

  useEffect(() => {
    if (authLoading || registeredUser || !user) return;

    if (user.role === 'member' && !user.cardLast4) {
      setRegisteredUser(user);
      setStep(4);
      return;
    }

    const dest = user.role === 'receptionist' ? '/receptionist/checkin'
      : ['admin', 'manager', 'staff'].includes(user.role) ? '/admin/dashboard'
      : '/dashboard';
    router.replace(dest);
  }, [user, authLoading, router, registeredUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const handleAccountNext = async (_, errs) => {
    if (errs) { setFieldErrors(errs); return; }
    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ptRequested, dateOfBirth, ...userData } = form;
      const data = await authRegister(userData);
      login(data.user);
      setRegisteredUser(data.user);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDOBNext = async (_, errs) => {
    if (errs) { setFieldErrors(errs); return; }
    setLoading(true);
    try {
      await api.patch('/auth/me', {
        dateOfBirth: form.dateOfBirth,
        ptRequested: form.ptRequested,
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTermsNext = async () => {
    setLoading(true);
    try {
      await api.patch('/auth/me', { termsAcceptedAt: new Date().toISOString() });
      setStep(4);
    } catch (_) {
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleCardComplete = (updatedUser) => {
    if (updatedUser) {
      updateUser(updatedUser);
    }
    router.push('/membership');
  };

  const headings = [
    'Create Account',
    'Personal Details',
    'Add Your Photo',
    'Terms & Conditions',
    'Secure Your Card',
  ];
  const subtitles = [
    'Start your fitness journey today',
    'Tell us a bit more about you',
    'Put a face to your membership',
    'Read and accept our membership agreement',
    'Add a card to complete your registration',
  ];

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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', textTransform: 'uppercase', marginBottom: 4 }}>
          {headings[step]}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{subtitles[step]}</p>
      </div>

      <ProgressBar step={step} />

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 12, color: '#ff6666', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠</span> {error}
        </div>
      )}

      {step === 0 && (
        <StepAccount
          form={form}
          onChange={handleChange}
          fieldErrors={fieldErrors}
          onNext={handleAccountNext}
          loading={loading}
        />
      )}
      {step === 1 && (
        <StepDOB
          form={form}
          onChange={handleChange}
          fieldErrors={fieldErrors}
          onNext={handleDOBNext}
          onBack={() => setStep(0)}
          loading={loading}
        />
      )}
      {step === 2 && (
        <StepPhoto
          updateUser={updateUser}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepTerms
          onNext={handleTermsNext}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepCard
          user={registeredUser}
          onComplete={handleCardComplete}
        />
      )}

      {step === 0 && (
        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--muted)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 700 }}>
            Sign In
          </Link>
        </p>
      )}
    </div>
  );
}
