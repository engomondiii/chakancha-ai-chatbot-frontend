/**
 * src/app/account/page.jsx
 * Account overview — shows user profile summary, recent orders,
 * and Chakan Tree membership status.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter }         from 'next/navigation';
import { User, ShoppingBag, TreePine, Settings, ChevronRight } from 'lucide-react';
import { useAuth }     from '@/lib/hooks/useAuth';
import { useStore }    from '@/store';
import { Skeleton }    from '@/components/ui/Skeleton';

// ─── Nav card ─────────────────────────────────────────────────────────────────

function NavCard({ icon: Icon, title, subtitle, href, color = 'var(--color-tea-green)' }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             'var(--spacing-md)',
        backgroundColor: 'white',
        border:          '1px solid var(--color-border)',
        borderRadius:    'var(--radius-xl)',
        padding:         'var(--spacing-lg)',
        cursor:          'pointer',
        textAlign:       'left',
        width:           '100%',
        transition:      'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 2px' }}>{title}</p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>{subtitle}</p>
      </div>
      <ChevronRight size={18} color="var(--color-text-secondary)" />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router     = useRouter();
  const { user, isAuthenticated, authLoading, verifyToken } = useAuth();
  const membership = useStore((s) => s.membership);

  useEffect(() => { verifyToken(); }, [verifyToken]);

  // Redirect to login if not authenticated after loading
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <Skeleton variant="rect" height="100px" style={{ borderRadius: 'var(--radius-xl)' }} />
        <Skeleton variant="rect" height="80px" style={{ borderRadius: 'var(--radius-xl)' }} />
        <Skeleton variant="rect" height="80px" style={{ borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)' }}>

      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)', padding: 'var(--spacing-xl)', backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-tea-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, color: 'white' }}>{initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--color-earth-brown)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'My Account'}
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </p>
          {membership?.isActive && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: 'rgba(45,80,22,0.08)', border: '1px solid rgba(45,80,22,0.15)', borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-tea-green)' }}>
              <TreePine size={11} /> Chakan Tree member
            </span>
          )}
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        <NavCard icon={ShoppingBag} title="My Orders"       subtitle="View order history and tracking" href="/account/orders" />
        <NavCard icon={User}        title="Profile"         subtitle="Update your name, email, and password" href="/account/profile" />
        <NavCard icon={TreePine}    title="Chakan Tree"     subtitle={membership?.isActive ? `Code: ${membership.referralCode}` : 'Join the value-sharing program'} href={membership?.isActive ? '/chakan-tree/dashboard' : '/chakan-tree'} color="var(--color-tea-green)" />
        <NavCard icon={Settings}    title="Subscriptions"   subtitle="Manage your tea subscriptions" href="/account/subscriptions" color="var(--color-sunrise-gold)" />
      </div>
    </div>
  );
}