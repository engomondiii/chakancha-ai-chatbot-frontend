/**
 * StoreWrapper.jsx
 * 'use client' boundary sitting just inside RootLayout.
 *
 * Why a separate file?
 *   layout.jsx must be a Server Component so the `metadata` export works.
 *   But we need client-side hooks (useAutoLogin, ToastContainer) to run
 *   on every page. The Next.js 14 pattern is to extract these into a
 *   thin client wrapper that layout.jsx imports.
 *
 * What this does:
 *   1. Renders children (Header + main + Footer) inside the Zustand store scope
 *   2. Mounts <ToastContainer> — global toast notifications visible on every page
 *   3. Runs useAutoLogin — verifies stored JWT once on app load
 */

'use client';

import React        from 'react';
import { ToastContainer } from '@/components/ui/Toast';
import { useAutoLogin }   from '@/lib/hooks/useAuth';

function AutoLoginRunner() {
  useAutoLogin();
  return null;
}

export default function StoreWrapper({ children }) {
  return (
    <>
      {/* Silent auto-login on every page load */}
      <AutoLoginRunner />

      {/* Page content */}
      {children}

      {/* Global toast overlay — renders above everything via z-index: var(--z-toast) */}
      <ToastContainer />
    </>
  );
}