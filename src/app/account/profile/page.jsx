/**
 * src/app/account/profile/page.jsx
 * Profile settings — update name, email, and password.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter }                   from 'next/navigation';
import { ArrowLeft, Save, Loader2 }    from 'lucide-react';
import { useAuth }  from '@/lib/hooks/useAuth';
import { Input }    from '@/components/ui/Input';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, authLoading, updateProfile, changePassword, authError, clearAuthError, verifyToken } = useAuth();

  const [profile,  setProfile]  = useState({ name: '', email: '' });
  const [password, setPassword] = useState({ current: '', newPass: '', confirm: '' });
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg,      setMsg]      = useState('');
  const [pwMsg,    setPwMsg]    = useState('');

  useEffect(() => { verifyToken(); }, [verifyToken]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login?redirect=/account/profile'); return; }
    if (user) setProfile({ name: user.name || '', email: user.email || '' });
  }, [user, isAuthenticated, authLoading, router]);

  const handleSaveProfile = async () => {
    setSaving(true); setMsg('');
    const result = await updateProfile(profile);
    setMsg(result.success ? '✓ Profile updated' : result.error || 'Update failed');
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (password.newPass !== password.confirm) { setPwMsg('Passwords do not match'); return; }
    if (password.newPass.length < 8) { setPwMsg('Password must be at least 8 characters'); return; }
    setPwSaving(true); setPwMsg('');
    const result = await changePassword(password.current, password.newPass);
    setPwMsg(result.success ? '✓ Password changed' : result.error || 'Failed to change password');
    if (result.success) setPassword({ current: '', newPass: '', confirm: '' });
    setPwSaving(false);
  };

  if (authLoading || !user) return null;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 'calc(72px + var(--spacing-2xl)) var(--spacing-lg) var(--spacing-3xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
        <button type="button" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, padding: 0 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h2)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 }}>Profile</h1>
      </div>

      {/* Profile section */}
      <FormSection title="Personal Information">
        <Input label="Full name"      id="name"  value={profile.name}  onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}  fullWidth />
        <Input label="Email address"  id="email" type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} fullWidth />
        {msg && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: msg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-error)', margin: 0 }}>{msg}</p>}
        <SaveButton onClick={handleSaveProfile} loading={saving} />
      </FormSection>

      {/* Password section */}
      <FormSection title="Change Password">
        <Input label="Current password" id="current" type="password" value={password.current}  onChange={(e) => setPassword(p => ({ ...p, current: e.target.value }))}  fullWidth />
        <Input label="New password"      id="newpass" type="password" value={password.newPass}  onChange={(e) => setPassword(p => ({ ...p, newPass: e.target.value }))}  fullWidth helperText="Minimum 8 characters" />
        <Input label="Confirm new password" id="confirm" type="password" value={password.confirm} onChange={(e) => setPassword(p => ({ ...p, confirm: e.target.value }))} fullWidth />
        {pwMsg && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: pwMsg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-error)', margin: 0 }}>{pwMsg}</p>}
        <SaveButton onClick={handleChangePassword} loading={pwSaving} label="Update password" />
      </FormSection>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-2xl)', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

function SaveButton({ onClick, loading, label = 'Save changes' }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'var(--color-tea-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 24px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={14} /> {label}</>}
    </button>
  );
}