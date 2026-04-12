import React from 'react';
import Link from 'next/link';

/**
 * Logo Component
 * Displays Chakancha logo with optional link to home
 */
export function Logo({ 
  variant = 'full', 
  size = 'md',
  clickable = true,
  className = '' 
}) {
  const sizeMap = {
    sm: { width: 120, height: 36 },
    md: { width: 160, height: 48 },
    lg: { width: 200, height: 60 },
  };

  const dimensions = sizeMap[size];

  const LogoSVG = () => {
    if (variant === 'mark') {
      // CKC Mark only
      return (
        <svg
          width={dimensions.height}
          height={dimensions.height}
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="30" cy="30" r="28" fill="#F5F0E8" stroke="#2D5016" strokeWidth="2"/>
          <path 
            d="M30 15C30 15 22 18 22 28C22 38 30 43 30 43C30 43 38 38 38 28C38 18 30 15 30 15Z" 
            fill="#2D5016"
          />
          <line x1="30" y1="15" x2="30" y2="43" stroke="#4A7C2C" strokeWidth="1.5"/>
          <path d="M30 22C28 24 26 26 26 30" stroke="#4A7C2C" strokeWidth="1" strokeLinecap="round"/>
          <path d="M30 22C32 24 34 26 34 30" stroke="#4A7C2C" strokeWidth="1" strokeLinecap="round"/>
          <text 
            x="30" 
            y="53" 
            fontFamily="Georgia, serif" 
            fontSize="8" 
            fontWeight="600" 
            fill="#2D5016" 
            textAnchor="middle"
          >
            CKC
          </text>
        </svg>
      );
    }

    // Full logo with text
    return (
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 200 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Tea Leaf Icon */}
        <path 
          d="M30 10C30 10 25 15 25 25C25 35 30 40 30 40C30 40 35 35 35 25C35 15 30 10 30 10Z" 
          fill="#2D5016"
        />
        <path 
          d="M30 10C30 10 22 12 20 22C18 32 25 38 25 38" 
          stroke="#4A7C2C" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* CHAKANCHA Text */}
        <text 
          x="50" 
          y="35" 
          fontFamily="Georgia, serif" 
          fontSize="24" 
          fontWeight="600" 
          fill="#2D5016"
        >
          CHAKANCHA
        </text>
        
        {/* FROM NANDI HILLS Tagline */}
        <text 
          x="50" 
          y="48" 
          fontFamily="Inter, sans-serif" 
          fontSize="9" 
          fill="#6B5544" 
          letterSpacing="1"
        >
          FROM NANDI HILLS
        </text>
      </svg>
    );
  };

  if (!clickable) {
    return <LogoSVG />;
  }

  return (
    <Link 
      href="/" 
      aria-label="Chakancha - Home"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
    >
      <LogoSVG />
    </Link>
  );
}

// Convenience exports
export const LogoMark = (props) => <Logo variant="mark" {...props} />;
export const LogoFull = (props) => <Logo variant="full" {...props} />;