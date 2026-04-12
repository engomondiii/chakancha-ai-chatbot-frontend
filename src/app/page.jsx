/**
 * Landing Page — src/app/page.jsx
 *
 * This is the ROOT route ( / ).
 * It renders the AI hero section with the Nandi Hills background,
 * the glass-morphism prompt input, and quick-suggestion chips.
 *
 * The CartPage component belongs exclusively in src/app/cart/page.jsx.
 */

import { HeroSection } from '@/components/hero/HeroSection';

export const metadata = {
  title: 'Chakancha - Premium Tea from Nandi Hills',
  description:
    'From the tea fields of Nandi Hills to your cup. Ask anything about our exceptional single-origin teas.',
};

export default function HomePage() {
  return <HeroSection />;
}