'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getInitials } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

function StarRating({ rating }) {
  const stars = Math.round(rating || 0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= stars ? 'var(--accent)' : 'var(--border-strong)', fontSize: 14 }}>★</span>
      ))}
    </div>
  );
}

function TrainerCard({ trainer, onView }) {
  const name = `${trainer.user?.firstName || ''} ${trainer.user?.lastName || ''}`.trim();
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >

      <div
        style={{
          height: 120,
          background: 'linear-gradient(135deg, var(--surface2) 0%, #111 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          {getInitials(trainer.user?.firstName, trainer.user?.lastName)}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <h3 style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16, marginBottom: 4 }}>{name}</h3>
        {trainer.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <StarRating rating={trainer.rating} />
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{trainer.rating.toFixed(1)}</span>
          </div>
        )}
        {trainer.yearsExperience > 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 10 }}>
            {trainer.yearsExperience} years experience
          </p>
        )}
        {trainer.specialties?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
            {trainer.specialties.slice(0, 4).map((s) => (
              <span
                key={s}
                style={{
                  padding: '3px 10px',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 100,
                  fontSize: 11,
                  color: 'var(--accent-text)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <Button variant="ghost" size="sm" style={{ width: '100%' }} onClick={() => onView(trainer)}>
          View Profile
        </Button>
      </div>
    </div>
  );
}

export default function PublicTrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchTrainers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/trainers?status=active');
        setTrainers(data.trainers || data || []);
      } catch { setTrainers([]); } finally { setLoading(false); }
    };
    fetchTrainers();
  }, []);

  return (
    <div style={{ padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,40px)', maxWidth: 1200, margin: '0 auto' }}>

      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>
          Our Team
        </p>
        <h1 style={{ fontSize: 'clamp(36px,8vw,52px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-3px', textTransform: 'uppercase', lineHeight: 1, marginBottom: 16 }}>
          Expert Trainers
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          World-class trainers dedicated to helping you reach your peak performance.
        </p>
      </div>

      {loading ? (
        <div className="apex-grid-4" style={{ gap: 20 }}>
          {[...Array(8)].map((_, i) => <div key={i} style={{ background: 'var(--surface)', borderRadius: 20, height: 280, border: '1px solid var(--border)' }} />)}
        </div>
      ) : trainers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏋️</p>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>No trainers listed yet.</p>
        </div>
      ) : (
        <div className="apex-grid-4" style={{ gap: 20 }}>
          {trainers.map((t) => (
            <TrainerCard key={t._id} trainer={t} onView={setSelected} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 64, textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', textTransform: 'uppercase', marginBottom: 12 }}>
          Train With The Best
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 24 }}>
          Get personalized training from Nigeria&apos;s top fitness professionals.
        </p>
        <Link href="/register"><Button variant="accent" size="lg">Get Started Today</Button></Link>
      </div>

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Trainer Profile">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'var(--accent-fg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {getInitials(selected.user?.firstName, selected.user?.lastName)}
              </div>
              <div>
                <h3 style={{ fontWeight: 800, color: 'var(--text)', fontSize: 18 }}>
                  {selected.user?.firstName} {selected.user?.lastName}
                </h3>
                {selected.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRating rating={selected.rating} />
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{selected.rating.toFixed(1)} rating</span>
                  </div>
                )}
              </div>
            </div>

            {selected.bio && (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{selected.bio}</p>
            )}

            {selected.specialties?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Specialties</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selected.specialties.map((s) => (
                    <span key={s} style={{ padding: '4px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 100, fontSize: 12, color: 'var(--accent-text)', fontWeight: 700 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {selected.certifications?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Certifications</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selected.certifications.map((c, i) => (
                    <span key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>• {c}</span>
                  ))}
                </div>
              </div>
            )}

            {selected.yearsExperience > 0 && (
              <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderRadius: 10 }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>Experience: </span>
                <span style={{ color: 'var(--accent-text)', fontWeight: 800, fontSize: 15 }}>{selected.yearsExperience} years</span>
              </div>
            )}

            <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              <Link href="/register" onClick={() => setSelected(null)}>
                <Button variant="accent">Book a Session</Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
