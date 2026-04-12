import React from 'react';
import styles from './Card.module.css';

/**
 * Card Component - Glass-morphism styling
 * Variants: default, glass, subtle, product, elevated
 */
export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  className = '',
  onClick,
  ...props
}) {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    hover && styles.hover,
    clickable && styles.clickable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Component = clickable || onClick ? 'button' : 'div';

  return (
    <Component
      className={cardClasses}
      onClick={onClick}
      type={clickable ? 'button' : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}

// Convenience exports
export const GlassCard = (props) => <Card variant="glass" {...props} />;
export const ProductCard = (props) => <Card variant="product" {...props} />;
export const ElevatedCard = (props) => <Card variant="elevated" {...props} />;