import React from 'react';
import NextImage from 'next/image';

/**
 * Image Component - Enhanced Next.js Image wrapper
 * Provides consistent image optimization and loading states
 */
export function Image({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 90,
  className = '',
  objectFit = 'cover',
  objectPosition = 'center',
  placeholder = 'blur',
  blurDataURL,
  sizes,
  onLoadingComplete,
  ...props
}) {
  // Generate blur placeholder for local images
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple blur placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=';
  };

  const imageProps = {
    src,
    alt: alt || '',
    quality,
    priority,
    className,
    onLoadingComplete,
    ...props,
  };

  // Fill mode (for background images, full containers)
  if (fill) {
    return (
      <NextImage
        {...imageProps}
        fill
        sizes={sizes || '100vw'}
        style={{
          objectFit,
          objectPosition,
        }}
        placeholder={placeholder}
        blurDataURL={getBlurDataURL()}
      />
    );
  }

  // Fixed dimensions mode
  if (width && height) {
    return (
      <NextImage
        {...imageProps}
        width={width}
        height={height}
        sizes={sizes}
        style={{
          width: '100%',
          height: 'auto',
          objectFit,
          objectPosition,
        }}
        placeholder={placeholder}
        blurDataURL={getBlurDataURL()}
      />
    );
  }

  // Fallback to regular image if no dimensions
  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      style={{
        maxWidth: '100%',
        height: 'auto',
        objectFit,
        objectPosition,
      }}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
}

/**
 * BackgroundImage - Full container background image
 */
export function BackgroundImage({
  src,
  alt = '',
  priority = false,
  quality = 90,
  overlay = false,
  overlayOpacity = 0.3,
  children,
  className = '',
  style = {},
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        objectFit="cover"
        style={{
          zIndex: 0,
        }}
      />
      
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            zIndex: 1,
          }}
        />
      )}
      
      {children && (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            height: '100%',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * ProductImage - Optimized for product photos
 */
export function ProductImage({
  src,
  alt,
  priority = false,
  className = '',
  aspectRatio = '1 / 1',
  ...props
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        backgroundColor: 'var(--color-warm-cream)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={95}
        objectFit="cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
}

/**
 * Avatar - Circular profile image
 */
export function Avatar({
  src,
  alt,
  size = 'md',
  className = '',
  fallback,
}) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const dimension = sizeMap[size];

  if (!src && fallback) {
    return (
      <div
        className={className}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: '50%',
          backgroundColor: 'var(--color-mist-gray)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: dimension / 2,
          fontWeight: 'var(--font-weight-semibold)',
          color: 'white',
        }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: dimension,
        height: dimension,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: 'var(--color-warm-cream)',
      }}
    >
      <Image
        src={src}
        alt={alt || 'Avatar'}
        fill
        objectFit="cover"
        quality={90}
      />
    </div>
  );
}