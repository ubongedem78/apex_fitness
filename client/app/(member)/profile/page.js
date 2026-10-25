'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Button from '@/components/ui/Button';
import BankCard from '@/components/ui/BankCard';
import { useToast } from '@/components/ui/Toast';
import { uploadAvatar } from '@/lib/avatar';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const psScriptLoaded = useRef(false);

  useEffect(() => {
    if (psScriptLoaded.current) return;
    psScriptLoaded.current = true;
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const [cardLoading, setCardLoading] = useState(false);
  const [cardError,   setCardError]   = useState('');

  const avatarInputRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarLoading(true);
    try {
      const updated = await uploadAvatar(file);
      updateUser(updated);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message || 'Could not update photo');
    } finally {
      setAvatarLoading(false);
    }
  };

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data?.user) updateUser(data.user);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateCard = async () => {
    setCardLoading(true);
    setCardError('');
    try {
      const { data } = await api.post('/cards/initialize');
      const { reference, accessCode, publicKey } = data;

      const PaystackPop = window.PaystackPop;
      if (!PaystackPop) {
        setCardError('Payment widget failed to load. Please refresh the page and try again.');
        setCardLoading(false);
        return;
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: 50 * 100,
        ref: reference,
        access_code: accessCode,
        metadata: { isCardCapture: true },
        onClose: () => { setCardLoading(false); },
        callback: (response) => {
          api.post('/cards/verify', { reference: response.reference })
            .then((verifyRes) => {
              const { user: updatedUser } = verifyRes.data;
              if (updatedUser) updateUser(updatedUser);
              toast.success('Card updated successfully.');
              setCardLoading(false);
            })
            .catch((e) => {
              setCardError(e.response?.data?.message || 'Card verification failed. Please try again.');
              setCardLoading(false);
            });
        },
      });
      handler.openIframe();
    } catch (e) {
      setCardError(e.response?.data?.message || 'Failed to initialise card update. Please try again.');
      setCardLoading(false);
    }
  };

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    emergencyContactName: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || '',
        emergencyContactName: user.emergencyContactName || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (profileErrors[e.target.name]) setProfileErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileForm.firstName.trim()) errs.firstName = 'Required';
    if (!profileForm.lastName.trim()) errs.lastName = 'Required';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    const original = {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      gender: user?.gender || '',
      emergencyContactName: user?.emergencyContactName || '',
    };
    const unchanged = Object.keys(original).every((k) => (profileForm[k] || '') === original[k]);
    if (unchanged) { toast.info('No changes to save'); return; }

    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/me', profileForm);
      updateUser(data.user || data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (passwordErrors[e.target.name]) setPasswordErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Required';
    if (!passwordForm.newPassword) errs.newPassword = 'Required';
    else if (passwordForm.newPassword.length < 8) errs.newPassword = 'Min. 8 characters';
    if (!passwordForm.confirmPassword) errs.confirmPassword = 'Required';
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }

    setPasswordLoading(true);
    try {
      const { data } = await api.post('/auth/change-password', {
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (data?.accessToken) localStorage.setItem('apex_access_token', data.accessToken);
      if (data?.refreshToken) localStorage.setItem('apex_refresh_token', data.refreshToken);
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 740, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <p className="apex-member-label">Account</p>
        <h1 className="apex-member-h1">Profile</h1>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 28px)',
          marginBottom: 24,
        }}
      >
        <div
          onClick={() => !avatarLoading && avatarInputRef.current?.click()}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: user?.avatarUrl ? 'transparent' : 'var(--accent)',
            color: 'var(--accent-fg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 900,
            flexShrink: 0,
            overflow: 'hidden',
            cursor: avatarLoading ? 'default' : 'pointer',
            position: 'relative',
          }}
        >
          {user?.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : getInitials(user?.firstName, user?.lastName)
          }
          {avatarLoading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
              …
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            {user?.firstName} {user?.lastName}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 3 }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-text)', fontSize: 13, fontWeight: 700, cursor: avatarLoading ? 'default' : 'pointer' }}
            >
              {avatarLoading ? 'Uploading…' : user?.avatarUrl ? 'Change photo' : 'Add photo'}
            </button>
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div
        className="apex-member-card"
        style={{ marginBottom: 20 }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.3px' }}>
          Personal Information
        </h2>
        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="apex-profile-2col">
            <Input
              label="First Name"
              name="firstName"
              value={profileForm.firstName}
              onChange={handleProfileChange}
              error={profileErrors.firstName}
            />
            <Input
              label="Last Name"
              name="lastName"
              value={profileForm.lastName}
              onChange={handleProfileChange}
              error={profileErrors.lastName}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--row-stripe)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--text-tertiary)',
                fontSize: 15,
              }}
            >
              {user?.email}
            </div>
          </div>
          <PhoneInput
            label="Phone Number"
            name="phone"
            value={profileForm.phone}
            onChange={handleProfileChange}
          />
          <div className="apex-profile-2col">
            <Input
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={profileForm.dateOfBirth}
              onChange={handleProfileChange}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Gender
              </label>
              <select
                name="gender"
                value={profileForm.gender}
                onChange={handleProfileChange}
                style={{
                  padding: '12px 16px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 12,
                  color: profileForm.gender ? 'var(--text)' : 'var(--text-tertiary)',
                  fontSize: 15,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <Input
            label="Emergency Contact"
            name="emergencyContactName"
            value={profileForm.emergencyContactName}
            onChange={handleProfileChange}
            placeholder="Name and phone number"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="submit" variant="accent" loading={profileLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <div className="apex-member-card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.3px' }}>
          Payment Card
        </h2>

        {user?.cardLast4 ? (
          <div style={{ marginBottom: 18 }}>
            <BankCard
              last4={user.cardLast4}
              type={user.cardType}
              bank={user.cardBank}
              expMonth={user.cardExpMonth}
              expYear={user.cardExpYear}
              holder={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
            />
          </div>
        ) : (
          <div style={{
            background: 'var(--surface2)', border: '1px dashed var(--border-strong)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 18,
          }}>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>No card on file.</p>
          </div>
        )}

        {cardError && (
          <div style={{ padding: '11px 14px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 10, color: '#ff6666', fontSize: 13, marginBottom: 14 }}>
            ⚠ {cardError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            A refundable <strong style={{ color: 'var(--accent-text)' }}>₦50 verification charge</strong> is made to confirm your card and is returned immediately.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="accent" loading={cardLoading} onClick={handleUpdateCard}>
              {user?.cardLast4 ? 'Update Card' : 'Add Card'}
            </Button>
          </div>
        </div>
      </div>

      <div className="apex-member-card">
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 20, letterSpacing: '-0.3px' }}>
          Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Input
              label="Current Password"
              name="currentPassword"
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.currentPassword}
            />
          </div>
          <Input
            label="New Password"
            name="newPassword"
            type={showPasswords ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.newPassword}
            placeholder="Min. 8 characters"
          />
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type={showPasswords ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.confirmPassword}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Show passwords
            </label>
            <Button type="submit" variant="dark" loading={passwordLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
