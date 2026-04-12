import React from 'react';

/**
 * Skeleton Component - Loading placeholder
 * Variants: text, circle, rect
 */
export function Skeleton({
  variant = 'rect',
  width,
  height,
  className = '',
  count = 1,
  ...props
}) {
  const baseStyles = {
    backgroundColor: 'var(--color-mist-gray)',
    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: variant === 'circle' ? '50%' : 'var(--radius-md)',
  };

  const variantStyles = {
    text: {
      height: height || '1em',
      width: width || '100%',
      borderRadius: 'var(--radius-sm)',
    },
    circle: {
      height: height || '40px',
      width: width || '40px',
    },
    rect: {
      height: height || '100px',
      width: width || '100%',
    },
  };

  const skeletonStyle = {
    ...baseStyles,
    ...variantStyles[variant],
    ...(width && { width }),
    ...(height && { height }),
  };

  // Render multiple skeletons if count > 1
  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={className}
            style={skeletonStyle}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={skeletonStyle}
      aria-busy="true"
      aria-label="Loading"
      {...props}
    />
  );
}

// Keyframes for shimmer animation (add to globals.css if not present)
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  const shimmerKeyframes = `
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `;
  
  try {
    styleSheet.insertRule(shimmerKeyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Rule might already exist
  }
}

/**
 * Skeleton Presets
 */
export const SkeletonText = (props) => <Skeleton variant="text" {...props} />;
export const SkeletonCircle = (props) => <Skeleton variant="circle" {...props} />;
export const SkeletonCard = () => (
  <div style={{ padding: 'var(--spacing-lg)' }}>
    <SkeletonCircle width="48px" height="48px" />
    <div style={{ marginTop: 'var(--spacing-md)' }}>
      <SkeletonText height="20px" width="60%" />
      <SkeletonText height="16px" width="100%" count={3} />
    </div>
  </div>
);