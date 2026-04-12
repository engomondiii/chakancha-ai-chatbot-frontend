/**
 * Navigation Configuration
 * Centralized navigation structure for the entire site
 */

export const mainNavigation = [
  {
    name: 'Discover',
    href: '/products',
    description: 'Explore our teas',
  },
  {
    name: 'Origin',
    href: '/origin',
    description: 'Nandi Hills story',
  },
  {
    name: 'Impact',
    href: '/impact',
    description: 'Living wage & transparency',
  },
  {
    name: 'Chakan Tree',
    href: '/chakan-tree',
    description: 'Join our community',
  },
];

export const footerNavigation = {
  discover: [
    { name: 'Our Teas', href: '/products' },
    { name: 'Origin Story', href: '/origin' },
    { name: 'Traceability', href: '/origin/traceability' },
    { name: 'About Us', href: '/about' },
  ],
  
  impact: [
    { name: 'Living Wage', href: '/impact' },
    { name: 'Tea Picker Stories', href: '/impact/stories' },
    { name: 'Chakan Tree', href: '/chakan-tree' },
  ],
  
  shop: [
    { name: 'All Teas', href: '/products' },
    { name: 'Black Tea', href: '/products?category=black' },
    { name: 'Green Tea', href: '/products?category=green' },
    { name: 'Gift Sets', href: '/products?category=gifts' },
    { name: 'Subscriptions', href: '/account/subscriptions' },
  ],
  
  support: [
    { name: 'Account', href: '/account' },
    { name: 'Orders', href: '/account/orders' },
    { name: 'Shipping', href: '/help/shipping' },
    { name: 'Returns', href: '/help/returns' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/help/faq' },
  ],
};

export const accountNavigation = [
  {
    name: 'Overview',
    href: '/account',
    icon: 'Home',
  },
  {
    name: 'Orders',
    href: '/account/orders',
    icon: 'ShoppingBag',
  },
  {
    name: 'Profile',
    href: '/account/profile',
    icon: 'User',
  },
  {
    name: 'Subscriptions',
    href: '/account/subscriptions',
    icon: 'Package',
  },
  {
    name: 'Chakan Tree',
    href: '/chakan-tree/dashboard',
    icon: 'Leaf',
  },
];

export const legalNavigation = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Cookie Policy', href: '/cookies' },
  { name: 'Refund Policy', href: '/refund' },
];

export const helpNavigation = [
  { name: 'FAQ', href: '/help/faq' },
  { name: 'Shipping', href: '/help/shipping' },
  { name: 'Returns', href: '/help/returns' },
  { name: 'Brewing Guide', href: '/help/brewing' },
  { name: 'Contact Us', href: '/contact' },
];

// Breadcrumb configuration
export const breadcrumbConfig = {
  '/': { label: 'Home' },
  '/products': { label: 'Our Teas' },
  '/origin': { label: 'Origin Story' },
  '/origin/traceability': { label: 'Traceability', parent: '/origin' },
  '/impact': { label: 'Impact' },
  '/impact/stories': { label: 'Stories', parent: '/impact' },
  '/chakan-tree': { label: 'Chakan Tree' },
  '/chakan-tree/join': { label: 'Join', parent: '/chakan-tree' },
  '/chakan-tree/dashboard': { label: 'Dashboard', parent: '/chakan-tree' },
  '/cart': { label: 'Cart' },
  '/checkout': { label: 'Checkout' },
  '/account': { label: 'Account' },
  '/account/orders': { label: 'Orders', parent: '/account' },
  '/account/profile': { label: 'Profile', parent: '/account' },
  '/account/subscriptions': { label: 'Subscriptions', parent: '/account' },
  '/about': { label: 'About' },
};

export default {
  mainNavigation,
  footerNavigation,
  accountNavigation,
  legalNavigation,
  helpNavigation,
  breadcrumbConfig,
};