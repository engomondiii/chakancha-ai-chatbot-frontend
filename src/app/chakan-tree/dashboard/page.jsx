/**
 * src/app/chakan-tree/dashboard/page.jsx
 */
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { TreePine }  from 'lucide-react';
import { ParticipantDashboard } from '@/components/chakan-tree/ParticipantDashboard';
import { useStore }             from '@/store';

export default function ChakanTreeDashboardPage() {
  const router     = useRouter();
  const membership = useStore((s) => s.membership);

  if (membership && !membership.isActive) {
    router.replace('/chakan-tree/join'); return null;
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-2xl)' }}>
        <TreePine size={22} color="var(--color-tea-green)" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 }}>My Chakan Tree</h1>
      </div>
      <ParticipantDashboard />
    </div>
  );
}