'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const colors = {
  success: { bg: 'rgba(200,255,0,0.1)', border: 'rgba(200,255,0,0.3)', icon: 'var(--accent-text)' },
  error:   { bg: 'rgba(255,68,68,0.1)',  border: 'rgba(255,68,68,0.3)',  icon: '#ff4444' },
  info:    { bg: 'rgba(0,212,255,0.1)',  border: 'rgba(0,212,255,0.3)',  icon: '#00d4ff' },
};

function ToastItem({ toast, onRemove }) {
  const c = colors[toast.type] || colors.info;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        background: 'var(--surface)',
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.icon}`,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        maxWidth: 360,
        minWidth: 280,
        animation: 'fadeIn 0.3s ease forwards',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: c.bg,
          border: `1px solid ${c.border}`,
          color: c.icon,
          fontSize: 12,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {icons[toast.type]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
            {toast.title}
          </p>
        )}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (msg, title) => console.log('Toast success:', msg),
      error: (msg, title) => console.error('Toast error:', msg),
      info: (msg, title) => console.info('Toast info:', msg),
    };
  }
  return {
    success: (msg, title) => ctx.add(msg, 'success', title),
    error: (msg, title) => ctx.add(msg, 'error', title),
    info: (msg, title) => ctx.add(msg, 'info', title),
  };
}

export default function Toast() {
  return null;
}
