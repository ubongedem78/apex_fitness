'use client';

export default function Padlock({ size = 96 }) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return {
      x1: 60 + Math.cos(a) * 27, y1: 95 + Math.sin(a) * 27,
      x2: 60 + Math.cos(a) * 23, y2: 95 + Math.sin(a) * 23,
    };
  });

  return (
    <svg width={size} height={size * (140 / 120)} viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Padlock">
      <defs>
        <linearGradient id="apexLockBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d3d8dc" />
          <stop offset="1" stopColor="#969ca2" />
        </linearGradient>
        <linearGradient id="apexLockShackle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#eceff1" />
          <stop offset="0.5" stopColor="#b4b9be" />
          <stop offset="1" stopColor="#878d92" />
        </linearGradient>
        <radialGradient id="apexLockDial" cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#2a302c" />
          <stop offset="1" stopColor="#12160f" />
        </radialGradient>
      </defs>

      <path d="M34 62 V44 a26 26 0 0 1 52 0 V62" stroke="url(#apexLockShackle)" strokeWidth="11" strokeLinecap="round" fill="none" />

      <rect x="18" y="58" width="84" height="74" rx="16" fill="url(#apexLockBody)" />
      <rect x="18" y="58" width="84" height="74" rx="16" fill="none" stroke="rgba(0,0,0,0.14)" />

      <circle cx="60" cy="95" r="30" fill="url(#apexLockDial)" stroke="#3a3f42" strokeWidth="2" />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(249,169,123,0.55)" strokeWidth="1.5" />
      ))}
      <circle cx="60" cy="95" r="14" fill="#1b1f1c" stroke="#4a5049" strokeWidth="1.5" />
      <circle cx="60" cy="95" r="4" fill="#f9a97b" />

      <path d="M60 61 l4.5 8 h-9 z" fill="#f9a97b" />
    </svg>
  );
}
