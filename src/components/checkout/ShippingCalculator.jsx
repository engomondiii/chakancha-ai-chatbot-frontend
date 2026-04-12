/**
 * ShippingCalculator.jsx
 * Estimates shipping cost for a given country.
 * Uses shippingZones.js constants. Shown in checkout before address entry.
 */

'use client';

import React, { useState } from 'react';
import { Truck, ChevronDown } from 'lucide-react';
import { SHIPPING_ZONES, getShippingZone, calculateShippingCost } from '@/lib/constants/shippingZones';
import { formatCurrency } from '@/lib/utils/currency';

export function ShippingCalculator({ orderSubtotal = 0, onEstimate }) {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [result, setResult]                   = useState(null);

  const handleCalc = () => {
    if (!selectedCountry) return;

    const zone = getShippingZone(selectedCountry);
    const cost = calculateShippingCost(orderSubtotal, selectedCountry);

    setResult({ zone, cost, country: selectedCountry });
    onEstimate?.({ zone, cost, country: selectedCountry });
  };

  // Flat country list for the dropdown
  const allCountries = SHIPPING_ZONES.flatMap((z) =>
    z.countries.map((c) => ({ code: c.code, name: c.name, zoneName: z.name }))
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      style={{
        border:        '1px solid var(--color-border)',
        borderRadius:  'var(--radius-lg)',
        padding:       'var(--spacing-lg)',
        backgroundColor: 'var(--color-warm-cream)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--spacing-md)' }}>
        <Truck size={16} color="var(--color-tea-green)" />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--color-earth-brown)' }}>
          Estimate Shipping
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {/* Country select */}
        <div style={{ flex: 1, position: 'relative' }}>
          <select
            value={selectedCountry}
            onChange={(e) => { setSelectedCountry(e.target.value); setResult(null); }}
            style={{
              width:           '100%',
              appearance:      'none',
              padding:         '9px 36px 9px 12px',
              fontFamily:      'var(--font-sans)',
              fontSize:        13,
              color:           selectedCountry ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              backgroundColor: 'white',
              border:          '1px solid var(--color-border)',
              borderRadius:    'var(--radius-md)',
              cursor:          'pointer',
              outline:         'none',
            }}
            aria-label="Select country for shipping estimate"
          >
            <option value="">Select country…</option>
            {allCountries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
        </div>

        <button
          type="button"
          onClick={handleCalc}
          disabled={!selectedCountry}
          style={{
            padding:         '9px 16px',
            backgroundColor: 'var(--color-tea-green)',
            color:           'white',
            border:          'none',
            borderRadius:    'var(--radius-md)',
            fontFamily:      'var(--font-sans)',
            fontSize:        13,
            fontWeight:      600,
            cursor:          selectedCountry ? 'pointer' : 'not-allowed',
            opacity:         selectedCountry ? 1 : 0.5,
            whiteSpace:      'nowrap',
          }}
        >
          Calculate
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          style={{
            marginTop:       'var(--spacing-sm)',
            padding:         '10px 14px',
            backgroundColor: 'white',
            border:          '1px solid var(--color-border)',
            borderRadius:    'var(--radius-md)',
            animation:       'fadeIn var(--transition-standard) var(--ease-out)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-text-primary)', margin: '0 0 2px', fontWeight: 600 }}>
                {result.zone?.name} · {result.zone?.estimatedDays}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
                Shipped via {result.zone?.carrier}
              </p>
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: result.cost === 0 ? 'var(--color-success)' : 'var(--color-earth-brown)' }}>
              {result.cost === 0 ? 'Free' : formatCurrency(result.cost, 'USD')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShippingCalculator;