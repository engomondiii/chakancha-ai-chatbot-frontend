/**
 * Badge.jsx
 * Status badge component. Implements the Phase 1 stub (Badge.jsx was 0 bytes).
 * Badge.module.css already existed in Phase 1 with a bug:
 *   var(--color-light-tea-green) → does not exist
 * Corrected to: var(--color-tea-green-light)  ✓
 */

import React from 'react';
import styles from './Badge.module.css';

/**
 * Badge
 *
 * @param {React.ReactNode} children
 * @param {'default'|'primary'|'secondary'|'success'|'error'|'warning'|'info'|'outline'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {string} className
 */
export function Badge({
  children,
  variant   = 'default',
  size      = 'md',
  className = '',
  ...props
}) {
  const cls = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} {...props}>
      {children}
    </span>
  );
}

// ── Convenience exports ────────────────────────────────────────────────────────

export const PrimaryBadge   = (props) => <Badge variant="primary"   {...props} />;
export const SuccessBadge   = (props) => <Badge variant="success"   {...props} />;
export const ErrorBadge     = (props) => <Badge variant="error"     {...props} />;
export const WarningBadge   = (props) => <Badge variant="warning"   {...props} />;
export const InfoBadge      = (props) => <Badge variant="info"      {...props} />;
export const OutlineBadge   = (props) => <Badge variant="outline"   {...props} />;

export default Badge;