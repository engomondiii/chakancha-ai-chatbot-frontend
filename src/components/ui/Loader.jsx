import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loader Component - Spinning loader
 * Sizes: sm, md, lg
 */
export function Loader({ size = 'md', color = 'tea-green', className = '' }) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const colorMap = {
    'tea-green': 'var(--color-tea-green)',
    'sunrise-gold': 'var(--color-sunrise-gold)',
    white: 'white',
    current: 'currentColor',
  };

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      role="status"
      aria-label="Loading"
    >
      <Loader2
        size={sizeMap[size]}
        color={colorMap[color]}
        style={{
          animation: 'spin 1s linear infinite',
        }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * FullPageLoader - Centered full-page loader
 */
export function FullPageLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(253, 253, 251, 0.95)',
        zIndex: 'var(--z-modal)',
      }}
    >
      <Loader size="lg" />
    </div>
  );
}