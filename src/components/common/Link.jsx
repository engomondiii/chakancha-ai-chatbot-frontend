import React from 'react';
import NextLink from 'next/link';
import { ExternalLink } from 'lucide-react';

/**
 * Link Component - Enhanced Next.js Link wrapper
 * Automatically handles internal/external links and styling
 */
export function Link({
  href,
  children,
  external = false,
  showExternalIcon = true,
  variant = 'default',
  className = '',
  ...props
}) {
  // Detect external links
  const isExternal = external || href.startsWith('http') || href.startsWith('//');

  // Base styles
  const baseStyles = {
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all var(--transition-fast) var(--ease-out)',
  };

  // Variant styles
  const variants = {
    default: {
      color: 'var(--color-tea-green)',
      textDecoration: 'underline',
      textDecorationColor: 'transparent',
      textUnderlineOffset: '2px',
    },
    nav: {
      color: 'var(--color-text-primary)',
      fontWeight: 'var(--font-weight-medium)',
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--spacing-xs)',
      padding: '8px 16px',
      backgroundColor: 'var(--color-tea-green)',
      color: 'white',
      borderRadius: 'var(--radius-md)',
      fontWeight: 'var(--font-weight-medium)',
    },
    subtle: {
      color: 'var(--color-text-secondary)',
    },
  };

  const linkStyles = {
    ...baseStyles,
    ...variants[variant],
  };

  const hoverStyles = {
    default: { textDecorationColor: 'var(--color-tea-green)' },
    nav: { color: 'var(--color-tea-green)' },
    button: { backgroundColor: 'var(--color-tea-green-light)' },
    subtle: { color: 'var(--color-tea-green)' },
  };

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={{
          ...linkStyles,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, hoverStyles[variant]);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, linkStyles);
        }}
        {...props}
      >
        {children}
        {showExternalIcon && variant !== 'button' && (
          <ExternalLink size={14} style={{ marginLeft: '2px' }} />
        )}
      </a>
    );
  }

  return (
    <NextLink
      href={href}
      className={className}
      style={linkStyles}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverStyles[variant]);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, linkStyles);
      }}
      {...props}
    >
      {children}
    </NextLink>
  );
}

/**
 * Convenience exports for common link types
 */
export const NavLink = (props) => <Link variant="nav" {...props} />;
export const ButtonLink = (props) => <Link variant="button" {...props} />;
export const SubtleLink = (props) => <Link variant="subtle" {...props} />;
export const ExternalLinkComponent = (props) => <Link external {...props} />;