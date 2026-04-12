import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Icon Component - Wrapper for Lucide React icons
 * Provides consistent sizing and styling
 */
export function Icon({ 
  name, 
  size = 24, 
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props 
}) {
  // Get the icon component from lucide-react
  const IconComponent = LucideIcons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}

/**
 * Common icon presets for the application
 */
export const icons = {
  // Navigation
  menu: 'Menu',
  close: 'X',
  chevronLeft: 'ChevronLeft',
  chevronRight: 'ChevronRight',
  chevronDown: 'ChevronDown',
  chevronUp: 'ChevronUp',
  arrowLeft: 'ArrowLeft',
  arrowRight: 'ArrowRight',
  
  // UI Actions
  search: 'Search',
  filter: 'Filter',
  settings: 'Settings',
  plus: 'Plus',
  minus: 'Minus',
  edit: 'Edit',
  trash: 'Trash2',
  check: 'Check',
  
  // E-commerce
  shoppingCart: 'ShoppingCart',
  shoppingBag: 'ShoppingBag',
  heart: 'Heart',
  heartFilled: 'Heart',
  
  // User
  user: 'User',
  userCircle: 'UserCircle',
  users: 'Users',
  
  // Status
  info: 'Info',
  alertCircle: 'AlertCircle',
  alertTriangle: 'AlertTriangle',
  checkCircle: 'CheckCircle',
  xCircle: 'XCircle',
  
  // Tea & Nature (for Chakancha)
  leaf: 'Leaf',
  sprout: 'Sprout',
  coffee: 'Coffee', // Can be used for tea
  droplet: 'Droplet',
  sun: 'Sun',
  cloud: 'Cloud',
  
  // Social
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  linkedin: 'Linkedin',
  
  // Location
  mapPin: 'MapPin',
  map: 'Map',
  globe: 'Globe',
  
  // Time
  clock: 'Clock',
  calendar: 'Calendar',
  
  // Communication
  mail: 'Mail',
  phone: 'Phone',
  messageCircle: 'MessageCircle',
  send: 'Send',
  
  // Media
  image: 'Image',
  video: 'Video',
  file: 'File',
  download: 'Download',
  upload: 'Upload',
  
  // Loading
  loader: 'Loader2',
  
  // Other
  external: 'ExternalLink',
  link: 'Link',
  copy: 'Copy',
  share: 'Share2',
  eye: 'Eye',
  eyeOff: 'EyeOff',
};

/**
 * Preset icon components for common use cases
 */
export const MenuIcon = (props) => <Icon name="Menu" {...props} />;
export const CloseIcon = (props) => <Icon name="X" {...props} />;
export const SearchIcon = (props) => <Icon name="Search" {...props} />;
export const CartIcon = (props) => <Icon name="ShoppingCart" {...props} />;
export const UserIcon = (props) => <Icon name="User" {...props} />;
export const HeartIcon = (props) => <Icon name="Heart" {...props} />;
export const LeafIcon = (props) => <Icon name="Leaf" {...props} />;
export const SendIcon = (props) => <Icon name="Send" {...props} />;
export const LoaderIcon = (props) => <Icon name="Loader2" {...props} />;
export const CheckIcon = (props) => <Icon name="Check" {...props} />;
export const InfoIcon = (props) => <Icon name="Info" {...props} />;
export const AlertIcon = (props) => <Icon name="AlertCircle" {...props} />;