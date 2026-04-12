import React from 'react';
import { Link } from '@/components/common/Link';
import { usePathname } from 'next/navigation';

/**
 * Navigation Component - Main navigation menu
 * Used in both Header (desktop) and MobileMenu
 */
export function Navigation({ mobile = false, onLinkClick }) {
  const pathname = usePathname();

  const navItems = [
    { 
      name: 'Discover', 
      href: '/products',
      description: 'Explore our teas'
    },
    { 
      name: 'Origin', 
      href: '/origin',
      description: 'Nandi Hills story'
    },
    { 
      name: 'Impact', 
      href: '/impact',
      description: 'Living wage & transparency'
    },
    { 
      name: 'Chakan Tree', 
      href: '/chakan-tree',
      description: 'Join our community'
    },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navStyle = mobile ? mobileNavStyle : desktopNavStyle;

  return (
    <nav style={navStyle.nav}>
      <ul style={navStyle.list}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          
          return (
            <li key={item.name} style={navStyle.item}>
              <Link 
                href={item.href}
                onClick={onLinkClick}
                style={{
                  ...navStyle.link,
                  ...(active ? navStyle.activeLink : {}),
                }}
                onMouseEnter={(e) => {
                  if (!mobile) {
                    Object.assign(e.currentTarget.style, navStyle.hoverLink);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!mobile && !active) {
                    Object.assign(e.currentTarget.style, navStyle.link);
                  }
                }}
              >
                <span style={navStyle.linkText}>{item.name}</span>
                {mobile && (
                  <span style={navStyle.description}>{item.description}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Desktop Navigation Styles
const desktopNavStyle = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  list: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xl)',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    width: '100%',
    justifyContent: 'center',
  },
  item: {
    margin: 0,
  },
  link: {
    display: 'block',
    padding: '8px 12px',
    fontSize: '15px',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-primary)',
    textDecoration: 'none',
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast) var(--ease-out)',
  },
  activeLink: {
    color: 'var(--color-tea-green)',
    backgroundColor: 'var(--color-warm-cream)',
  },
  hoverLink: {
    color: 'var(--color-tea-green)',
    backgroundColor: 'var(--color-warm-cream)',
  },
  linkText: {
    display: 'block',
  },
};

// Mobile Navigation Styles
const mobileNavStyle = {
  nav: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    width: '100%',
  },
  item: {
    margin: 0,
    width: '100%',
  },
  link: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: 'var(--spacing-md)',
    fontSize: '18px',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-primary)',
    textDecoration: 'none',
    borderRadius: 'var(--radius-lg)',
    transition: 'all var(--transition-fast) var(--ease-out)',
    width: '100%',
  },
  activeLink: {
    color: 'var(--color-tea-green)',
    backgroundColor: 'var(--color-warm-cream)',
  },
  linkText: {
    display: 'block',
    fontSize: '18px',
  },
  description: {
    display: 'block',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-weight-regular)',
  },
};