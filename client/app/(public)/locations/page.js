'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

function LocationCard({ location }) {
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
          height: 160,
          background: 'linear-gradient(135deg, var(--surface2) 0%, var(--surface2) 50%, #111 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent-dim) 0%, transparent 70%)',
          }}
        />
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📍</div>
          <p style={{ color: 'var(--accent-text)', fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            {location.city || 'Lagos'}
          </p>
        </div>
      </div>

      <div style={{ padding: '22px 24px' }}>
        <h3 style={{ fontWeight: 900, color: 'var(--text)', fontSize: 18, letterSpacing: '-0.5px', marginBottom: 6 }}>
          {location.name}
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
          {[location.address, location.city, location.state].filter(Boolean).join(', ')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {location.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
              <span>📞</span><span>{location.phone}</span>
            </div>
          )}
          {location.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
              <span>✉</span><span>{location.email}</span>
            </div>
          )}
          {location.openingHours && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--muted)', fontSize: 13 }}>
              <span>🕐</span><span style={{ lineHeight: 1.4 }}>{location.openingHours}</span>
            </div>
          )}
        </div>

        {location.amenities?.length > 0 && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              Amenities
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {location.amenities.map((a) => (
                <span
                  key={a}
                  style={{
                    padding: '3px 10px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 100,
                    fontSize: 11,
                    color: 'var(--muted)',
                    fontWeight: 600,
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/locations?active=true');
        setLocations(data.locations || data || []);
      } catch { setLocations([]); } finally { setLoading(false); }
    };
    fetchLocations();
  }, []);

  return (
    <div style={{ padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,40px)', maxWidth: 1200, margin: '0 auto' }}>

      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>
          Find Us
        </p>
        <h1 style={{ fontSize: 'clamp(36px,8vw,52px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-3px', textTransform: 'uppercase', lineHeight: 1, marginBottom: 16 }}>
          Our Locations
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          Our world-class gym facility equipped with everything you need to train hard and hit your goals.
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: 'clamp(16px,3vw,20px) clamp(20px,4vw,40px)',
          marginBottom: 40,
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        {[
          { value: locations.length || '-', label: locations.length === 1 ? 'Location' : 'Locations' },
          { value: '24/7', label: 'Access' },
          { value: '50+', label: 'Classes/Week' },
          { value: 'Lekki', label: 'Phase 1, Lagos' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-text)', letterSpacing: '-1px' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="apex-grid-3" style={{ gap: 24 }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ background: 'var(--surface)', borderRadius: 20, height: 380, border: '1px solid var(--border)' }} />)}
        </div>
      ) : locations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏢</p>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>No locations listed yet.</p>
        </div>
      ) : (
        <div className="apex-grid-3" style={{ gap: 24 }}>
          {locations.map((loc) => <LocationCard key={loc._id} location={loc} />)}
        </div>
      )}

      <div
        style={{
          marginTop: 64,
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #0d1a10 0%, #1a2e1e 40%, #101a12 100%)',
          borderRadius: 24,
          padding: '64px 48px',
          textAlign: 'center',
        }}
      >

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(249,169,123,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,169,123,0.04) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(249,169,123,0.07) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase',
            color: 'rgba(249,169,123,0.65)', marginBottom: 16 }}>
            - Ready to Train? -
          </div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, letterSpacing: '-2px',
            textTransform: 'uppercase', lineHeight: 1, marginBottom: 16,
            background: 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            FIND YOUR GYM
          </h2>
          <p style={{ color: 'rgba(244,237,230,0.55)', fontSize: 16, lineHeight: 1.75,
            maxWidth: 400, margin: '0 auto 36px' }}>
            Visit us at Lekki Phase 1 and start your fitness journey today.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: '14px 32px', borderRadius: 100, fontWeight: 800, fontSize: 15,
              background: 'linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)',
              color: '#1b1b19', textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', transition: 'opacity .2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Join APEXFITNESS
            </Link>
            <Link href="/classes" style={{
              padding: '14px 32px', borderRadius: 100, fontWeight: 700, fontSize: 15,
              background: 'transparent', color: 'rgba(244,237,230,0.75)',
              border: '1px solid rgba(255,255,255,0.14)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', transition: 'border-color .2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(249,169,123,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
            >
              Browse Classes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
