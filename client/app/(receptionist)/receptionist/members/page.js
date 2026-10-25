'use client';
import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getInitials } from '@/lib/utils';
import ActivateSubscriptionModal from '@/components/ActivateSubscriptionModal';

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function MembersPage() {
  const toast = useToast();
  const inputRef = useRef(null);

  const [memberNumber, setMemberNumber] = useState('');
  const [looking,   setLooking]   = useState(false);
  const [member,    setMember]    = useState(null);
  const [ptData,    setPtData]    = useState(null);
  const [lookError, setLookError] = useState('');

  const [showActivate,    setShowActivate]    = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [ptNotes,         setPtNotes]         = useState('');
  const [assigning,       setAssigning]       = useState(false);
  const [removing,        setRemoving]        = useState(false);

  const { data: trainerData } = useSWR('/trainers?limit=100', fetcher);
  const trainers = trainerData?.data ?? [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLookup = async (numOverride) => {
    const num = (numOverride ?? memberNumber).trim();
    if (!num) return;
    if (!/^\d{6}$/.test(num)) {
      setLookError('Enter a valid 6-digit member number.');
      return;
    }
    setLookError('');
    setMember(null);
    setPtData(null);
    setShowActivate(false);
    setSelectedTrainer('');
    setPtNotes('');
    setLooking(true);
    try {
      const { data } = await api.get(`/receptionist/lookup/${num}`);
      setMember(data);

      const ptRes = await api.get(`/receptionist/pt-assignments`);
      const allAssignments = ptRes.data?.assignments ?? [];
      const memberAssignment = allAssignments.find((a) => a.userId === data.user.id);
      setPtData(memberAssignment || null);
    } catch (e) {
      setLookError(e.response?.data?.message || 'Member not found.');
    } finally {
      setLooking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup();
  };

  const handleAssign = async () => {
    if (!selectedTrainer || !member) return;
    setAssigning(true);
    try {
      await api.post('/receptionist/pt-assign', {
        userId:    member.user.id,
        trainerId: selectedTrainer,
        notes:     ptNotes.trim() || undefined,
      });
      toast.success('Personal trainer assigned successfully.');

      const ptRes = await api.get('/receptionist/pt-assignments');
      const allAssignments = ptRes.data?.assignments ?? [];
      const updated = allAssignments.find((a) => a.userId === member.user.id);
      setPtData(updated || null);
      setSelectedTrainer('');
      setPtNotes('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Assignment failed. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async () => {
    if (!member) return;
    setRemoving(true);
    try {
      await api.delete(`/receptionist/pt-assign/${member.user.id}`);
      toast.success('Personal trainer removed.');
      setPtData(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to remove trainer.');
    } finally {
      setRemoving(false);
    }
  };

  const trainerName = (t) => {
    if (!t) return 'Unknown';
    const u = t.User || t.user;
    return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
  };

  const currentTrainerName = ptData?.Trainer ? trainerName(ptData.Trainer) : null;

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px', marginBottom: 6 }}>
          Members
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Look up a member to view their profile and manage their personal trainer assignment.
        </p>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 'clamp(20px,4vw,28px)',
        boxShadow: 'var(--card-shadow)', marginBottom: 20,
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
              if (lookError) setLookError('');
              if (v.length === 6) handleLookup(v);
            }}
            onKeyDown={handleKeyDown}
            placeholder="100001"
            style={{
              flex: 1, padding: '14px 18px',
              background: 'var(--surface2)',
              border: `2px solid ${lookError ? '#ef4444' : 'var(--border-strong)'}`,
              borderRadius: 12, color: 'var(--text)',
              fontSize: 'clamp(18px,4vw,22px)', fontWeight: 900, letterSpacing: 'clamp(2px,1vw,4px)',
              fontFamily: 'monospace', outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { if (!lookError) e.target.style.borderColor = 'var(--border-strong)'; }}
          />
          <Button
            variant="accent"
            onClick={handleLookup}
            loading={looking}
            style={{ padding: '0 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, flexShrink: 0 }}
          >
            Search
          </Button>
        </div>
        {lookError && (
          <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
            ⚠ {lookError}
          </p>
        )}
      </div>

      {member && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>

          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 'clamp(16px,3vw,24px)',
            boxShadow: 'var(--card-shadow)',
            display: 'flex', alignItems: 'center', gap: 'clamp(16px,4vw,24px)', flexWrap: 'wrap',
          }}>
            <div style={{
              width: 'clamp(140px, 40vw, 190px)', height: 'clamp(140px, 40vw, 190px)', borderRadius: 18, flexShrink: 0,
              background: member.user.avatarUrl ? 'transparent' : 'linear-gradient(135deg,#f9a97b,#b85e2a)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 56, color: '#1b1b19',
              border: '3px solid var(--accent-border)',
            }}>
              {member.user.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={member.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(member.user.firstName, member.user.lastName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                {member.user.firstName} {member.user.lastName}
              </p>
              <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: 13, fontFamily: 'monospace', letterSpacing: '2px' }}>
                #{member.user.displayMemberNumber}
              </p>
              {member.user.email && (
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                  {member.user.email}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-1px' }}>
                  {member.totalVisits}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Visits</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: member.accessStatus === 'active' ? '#22c55e' : member.accessStatus === 'expiring' || member.accessStatus === 'attention' ? '#f97316' : '#ef4444' }}>
                  {member.accessStatus === 'active' ? 'Active'
                    : member.accessStatus === 'expiring' ? 'Expiring'
                    : member.accessStatus === 'attention' ? 'Payment Issue'
                    : member.accessStatus === 'expired' ? 'Expired'
                    : member.accessStatus === 'paused' ? 'Paused'
                    : member.accessStatus === 'cancelled' ? 'Cancelled'
                    : 'No Plan'}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 'clamp(16px,3vw,24px)',
            boxShadow: 'var(--card-shadow)', marginBottom: 'clamp(16px,3vw,20px)',
          }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Membership</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: ['active', 'expiring'].includes(member.accessStatus) ? '#16a34a' : member.accessStatus === 'attention' ? '#d97706' : '#dc2626' }}>
                    {member.accessMessage || 'No active membership.'}
                  </p>
                </div>
                <Button
                  variant={['active', 'expiring'].includes(member.accessStatus) ? 'ghost' : 'accent'}
                  size="sm"
                  onClick={() => setShowActivate(true)}
                  style={{ flexShrink: 0 }}
                >
                  {['active', 'expiring'].includes(member.accessStatus) ? 'Renew / Activate' : '✓ Activate Sub'}
                </Button>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>🔒 Locker</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: member.locker ? (member.locker.canAccess ? '#16a34a' : '#dc2626') : 'var(--muted)' }}>
                {member.locker ? member.locker.accessMessage : 'No locker rental'}
              </p>
            </div>
          </div>

          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 'clamp(16px,3vw,24px)',
            boxShadow: 'var(--card-shadow)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 18 }}>
              Personal Trainer
            </h2>

            {currentTrainerName ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                borderRadius: 14, padding: '14px 16px', marginBottom: 20,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: ptData?.Trainer?.User?.avatarUrl ? 'transparent' : 'linear-gradient(135deg,#f9a97b,#b85e2a)',
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14, color: '#1b1b19',
                }}>
                  {ptData?.Trainer?.User?.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={ptData.Trainer.User.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : getInitials(...currentTrainerName.split(' '))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{currentTrainerName}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--accent-text)', fontWeight: 600, marginTop: 2 }}>
                    Assigned Personal Trainer
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={removing}
                  onClick={handleRemove}
                  style={{ color: '#ff6666', borderColor: 'rgba(255,50,50,0.25)', flexShrink: 0 }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div style={{
                background: 'var(--surface2)', border: '1px dashed var(--border-strong)',
                borderRadius: 12, padding: '14px 16px', marginBottom: 20,
              }}>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13, fontWeight: 500 }}>
                  No personal trainer currently assigned.
                </p>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 8 }}>
                {currentTrainerName ? 'Change Trainer' : 'Assign a Trainer'}
              </label>
              <select
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--surface2)', border: '1px solid var(--border-strong)',
                  borderRadius: 12, color: selectedTrainer ? 'var(--text)' : 'var(--text-tertiary)',
                  fontSize: 14, outline: 'none', marginBottom: 12,
                }}
              >
                <option value="">Select a trainer...</option>
                {trainers.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {trainerName(t)}{t.specialties?.length ? ` - ${t.specialties.slice(0, 2).join(', ')}` : ''}
                  </option>
                ))}
              </select>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 8 }}>
                Notes <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                value={ptNotes}
                onChange={(e) => setPtNotes(e.target.value)}
                placeholder="e.g. Focuses on weight loss, available Mon–Wed mornings..."
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--surface2)', border: '1px solid var(--border-strong)',
                  borderRadius: 12, color: 'var(--text)',
                  fontSize: 13, resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', marginBottom: 14, boxSizing: 'border-box',
                }}
              />

              <Button
                variant="accent"
                loading={assigning}
                disabled={!selectedTrainer}
                onClick={handleAssign}
                style={{ width: '100%', borderRadius: 12 }}
              >
                {currentTrainerName ? 'Reassign Trainer' : 'Assign Trainer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!member && !looking && !lookError && (
        <div style={{ textAlign: 'center', paddingTop: 48, color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p style={{ fontSize: 14, fontWeight: 500 }}>Search for a member above</p>
        </div>
      )}

      {showActivate && member?.user && (
        <ActivateSubscriptionModal
          member={member.user}
          basePath="/receptionist/members"
          onClose={() => setShowActivate(false)}
          onSuccess={() => {
            setShowActivate(false);
            handleLookup(memberNumber);
          }}
        />
      )}
    </div>
  );
}
