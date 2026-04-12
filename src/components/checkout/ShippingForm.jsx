/**
 * ShippingForm.jsx
 * Step 1 of checkout: shipping address.
 * Validates required fields before allowing progression.
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';

const COUNTRIES = [
  { code: 'KE', name: 'Kenya' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'UG', name: 'Uganda' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'Other', name: 'Other' },
].sort((a, b) => a.name.localeCompare(b.name));

export function ShippingForm({ data, onChange, errors = {} }) {
  const field = (name) => ({
    name,
    id:       name,
    value:    data[name] || '',
    onChange: (e) => onChange({ ...data, [name]: e.target.value }),
    error:    errors[name],
    fullWidth: true,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <h3 style={sectionTitle}>Shipping Address</h3>

      {/* Name row */}
      <div style={rowStyle}>
        <Input {...field('firstName')} label="First name" required placeholder="Jane" />
        <Input {...field('lastName')}  label="Last name"  required placeholder="Omondi" />
      </div>

      <Input {...field('email')} label="Email address" type="email" required placeholder="jane@example.com" />
      <Input {...field('phone')} label="Phone number"  type="tel"   placeholder="+254 700 000 000" />
      <Input {...field('address1')} label="Street address" required placeholder="123 Nandi Road" />
      <Input {...field('address2')} label="Apartment, suite, etc." placeholder="Unit 4B" />

      {/* City/State row */}
      <div style={rowStyle}>
        <Input {...field('city')}  label="City"  required placeholder="Nairobi" />
        <Input {...field('state')} label="County / State" placeholder="Nairobi County" />
      </div>

      {/* Zip/Country row */}
      <div style={rowStyle}>
        <Input {...field('postalCode')} label="Postal code" required placeholder="00100" />

        {/* Country select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <label style={labelStyle}>
            Country <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <select
            name="country"
            value={data.country || ''}
            onChange={(e) => onChange({ ...data, country: e.target.value })}
            style={{
              width:           '100%',
              padding:         '12px 16px',
              fontFamily:      'var(--font-sans)',
              fontSize:        16,
              color:           data.country ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              backgroundColor: 'white',
              border:          `1.5px solid ${errors.country ? 'var(--color-error)' : 'var(--color-border)'}`,
              borderRadius:    'var(--radius-md)',
              outline:         'none',
              cursor:          'pointer',
            }}
            aria-label="Country"
          >
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          {errors.country && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-error)', margin: 0 }}>
              {errors.country}
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      <Input
        {...field('notes')}
        label="Delivery notes (optional)"
        type="textarea"
        rows={2}
        placeholder="Leave at door, ring bell, etc."
      />
    </div>
  );
}

const sectionTitle = {
  fontFamily: 'var(--font-display)',
  fontSize:   'var(--font-size-h3)',
  fontWeight: 600,
  color:      'var(--color-earth-brown)',
  margin:     0,
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--spacing-md)',
};

const labelStyle = {
  display:    'block',
  fontSize:   14,
  fontWeight: 500,
  fontFamily: 'var(--font-sans)',
  color:      'var(--color-text-primary)',
};

export default ShippingForm;