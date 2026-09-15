/**
 * src/app/chat/page.jsx
 * The /chat route — full AI conversation page.
 *
 * Receives ?q= from HeroSection → PromptInput → router.push('/chat?q=...')
 * ConversationView reads the param and fires initFromQuery on mount.
 *
 * This is a Client Component because ConversationView uses hooks.
 * The metadata export is defined here for SEO even though the page is dynamic.
 */

import { Suspense } from 'react';
import { ConversationView } from '@/components/ai/ConversationView';
import { LogoLoader } from '@/components/ai/LogoLoader';

/* ── Metadata ────────────────────────────────────────────────────────────── */
export const metadata = {
  title:       'Chat — Ask Anything',
  description: 'Ask anything about Chakancha tea — origin, brewing, impact, ordering. Our AI tea guide is here to help.',
  robots:      { index: false, follow: false }, // Don't index chat sessions
};

/* ── Loading fallback ────────────────────────────────────────────────────── */
function ChatFallback() {
  return (
    <div
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        height:          '100vh',
        paddingTop:      72, // header height
        backgroundColor: 'var(--color-background-main)',
      }}
    >
      <LogoLoader size="lg" />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function ChatPage() {
  return (
    /*
     * Suspense is required because ConversationView uses useSearchParams()
     * which suspends during SSR in Next.js 14 App Router.
     * Wrap in Suspense to avoid the "missing Suspense boundary" error.
     */
    <Suspense fallback={<ChatFallback />}>
      <ConversationView />
    </Suspense>
  );
}
