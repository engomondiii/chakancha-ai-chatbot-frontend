/**
 * Toast.jsx
 * Global toast notification system.
 * Reads notifications from uiSlice and renders them as a fixed overlay stack.
 *
 * Replaces the Phase 1 stub (Toast.jsx existed but had no implementation detail
 * — it was listed in the file plan without content shown).
 *
 * Mount once in layout.jsx: <ToastContainer />
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useStore }                  from '@/store';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
  success: { Icon: CheckCircle,   color: 'var(--color-success)' },
  error:   { Icon: XCircle,       color: 'var(--color-error)'   },
  warning: { Icon: AlertTriangle, color: 'var(--color-warning)' },
  info:    { Icon: Info,          color: '#3b82f6'               },
};

// ─── Individual toast ─────────────────────────────────────────────────────────

function ToastItem({ notification }) {
  const dismiss = useStore((s) => s.dismissNotification);
  const { id, message, type = 'info' } = notification;
  const { Icon, color } = ICON_MAP[type] || ICON_MAP.info;

  // Animate in on mount
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Trigger reflow so the animation plays
    requestAnimationFrame(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    });
  }, []);

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="polite"
      style={{
        display:         'flex',
        alignItems:      'flex-start',
        gap:             10,
        minWidth:        280,
        maxWidth:        400,
        backgroundColor: 'white',
        border:          '1px solid var(--color-border)',
        borderLeft:      `3px solid ${color}`,
        borderRadius:    'var(--radius-lg)',
        padding:         '12px 14px',
        boxShadow:       'var(--shadow-lg)',
        cursor:          'default',
        // Animate in
        opacity:         0,
        transform:       'translateY(8px)',
        transition:      'opacity var(--transition-standard) var(--ease-out), transform var(--transition-standard) var(--ease-out)',
      }}
    >
      {/* Icon */}
      <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: 1 }} />

      {/* Message */}
      <span
        style={{
          flex:        1,
          fontFamily:  'var(--font-sans)',
          fontSize:    14,
          lineHeight:  1.5,
          color:       'var(--color-text-primary)',
        }}
      >
        {message}
      </span>

      {/* Dismiss */}
      <button
        onClick={() => dismiss(id)}
        type="button"
        aria-label="Dismiss notification"
        style={{
          display:          'flex',
          alignItems:       'center',
          justifyContent:   'center',
          width:            22,
          height:           22,
          background:       'none',
          border:           'none',
          cursor:           'pointer',
          borderRadius:     'var(--radius-sm)',
          color:            'var(--color-text-secondary)',
          flexShrink:       0,
          padding:          0,
          transition:       'background-color var(--transition-fast) var(--ease-out)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-warm-cream)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Container ─────────────────────────────────────────────────────────────────

/**
 * ToastContainer
 * Fixed overlay at bottom-right.
 * Mount once in root layout.jsx.
 */
export function ToastContainer() {
  const notifications = useStore((s) => s.notifications);

  if (!notifications.length) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position:       'fixed',
        bottom:         24,
        right:          24,
        zIndex:         'var(--z-toast)',
        display:        'flex',
        flexDirection:  'column',
        gap:            10,
        pointerEvents:  'none',
      }}
    >
      {notifications.map((n) => (
        <div key={n.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem notification={n} />
        </div>
      ))}
    </div>
  );
}

// ─── Hook convenience export ──────────────────────────────────────────────────

/**
 * useToast
 * Convenience hook for showing toasts without importing the store directly.
 *
 * @example
 * const toast = useToast();
 * toast.success('Added to cart!');
 * toast.error('Payment failed');
 */
export function useToast() {
  const showNotification = useStore((s) => s.showNotification);
  const showSuccess      = useStore((s) => s.showSuccess);
  const showError        = useStore((s) => s.showError);
  const showWarning      = useStore((s) => s.showWarning);
  const showInfo         = useStore((s) => s.showInfo);
  const dismiss          = useStore((s) => s.dismissNotification);
  const clearAll         = useStore((s) => s.clearNotifications);

  return {
    show:    showNotification,
    success: showSuccess,
    error:   showError,
    warning: showWarning,
    info:    showInfo,
    dismiss,
    clearAll,
  };
}

export default ToastContainer;