'use client';

export default function BankCard({ last4, type, bank, expMonth, expYear, holder, style = {} }) {
  const brand = (type || 'CARD').trim();
  const exp = `${expMonth || '••'}/${expYear ? String(expYear).slice(-2) : '••'}`;

  return (
    <div style={{
      width: '100%', maxWidth: 360, aspectRatio: '1.586',
      borderRadius: 16, padding: 22, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #2c3b30 0%, #1c241f 55%, #10201a 100%)',
      border: '1px solid rgba(249,169,123,0.22)',
      boxShadow: '0 14px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      color: '#f4ede6', ...style,
    }}>

      <div style={{ position: 'absolute', top: -50, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,169,123,0.18), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(244,237,230,0.72)' }}>{bank || 'Apex Fitness'}</span>
        <span style={{ fontSize: 17, fontWeight: 900, fontStyle: 'italic', letterSpacing: 0.5, textTransform: 'uppercase', color: '#f9a97b' }}>{brand}</span>
      </div>

      <div style={{ position: 'relative', width: 44, height: 34, borderRadius: 7, background: 'linear-gradient(135deg,#f0d493,#c79a45)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.22)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 4, bottom: 4, width: 1, background: 'rgba(0,0,0,0.22)' }} />
      </div>

      <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 'clamp(14px, 4.4vw, 17px)', fontWeight: 700, letterSpacing: 2, color: '#f4ede6', textShadow: '0 1px 2px rgba(0,0,0,0.45)', position: 'relative', whiteSpace: 'nowrap' }}>
        ••••&nbsp;••••&nbsp;••••&nbsp;{last4 || '••••'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(244,237,230,0.5)' }}>Card Holder</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#f4ede6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{holder || 'Cardholder'}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(244,237,230,0.5)' }}>Expires</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, letterSpacing: 1, fontFamily: 'monospace', color: '#f4ede6' }}>{exp}</p>
        </div>
      </div>
    </div>
  );
}
