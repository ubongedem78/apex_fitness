'use client';
import { getStatusColor } from '@/lib/utils';

export default function Badge({ status, children }) {
  const color = status ? getStatusColor(status) : 'var(--muted)';
  const label = children || (status ? status.replace(/_/g, ' ') : '');

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
