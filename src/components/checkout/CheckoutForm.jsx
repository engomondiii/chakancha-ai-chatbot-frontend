/**
 * CheckoutForm.jsx
 * Multi-step checkout form: Shipping → Payment → Review.
 * Manages form state locally, calls order API on final submit.
 */

'use client';

import React, { useState } from 'react';
import { useRouter }        from 'next/navigation';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { ShippingForm }   from './ShippingForm';
import { PaymentForm }    from './PaymentForm';
import { ShippingCalculator } from './ShippingCalculator';
import { createOrder }    from '@/lib/api/orders';
import { useStore }       from '@/store';
import styles             from './CheckoutForm.module.css';

const STEPS = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment',  label: 'Payment'  },
  { id: 'review',   label: 'Review'   },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  const idx = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className={styles.stepper}>
      {STEPS.map((step, i) => {
        const isDone    = i < idx;
        const isActive  = i === idx;
        return (
          <React.Fragment key={step.id}>
            <div className={styles.stepItem}>
              <div className={`${styles.stepDot} ${isDone ? styles.stepDone : ''} ${isActive ? styles.stepActive : ''}`}>
                {isDone ? <Check size={12} /> : i + 1}
              </div>
              <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Review step ──────────────────────────────────────────────────────────────

function ReviewStep({ shipping, payment }) {
  const mask = (val, show = 4) => '•'.repeat(Math.max(0, val.length - show)) + val.slice(-show);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h3 style={sectionTitle}>Review your order</h3>

      {/* Shipping summary */}
      <ReviewSection title="Ship to">
        <p style={reviewText}>{shipping.firstName} {shipping.lastName}</p>
        <p style={reviewText}>{shipping.address1}{shipping.address2 ? ', ' + shipping.address2 : ''}</p>
        <p style={reviewText}>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
        <p style={reviewText}>{shipping.country}</p>
        {shipping.email && <p style={reviewText}>{shipping.email}</p>}
      </ReviewSection>

      {/* Payment summary */}
      <ReviewSection title="Payment">
        {payment.method === 'card' ? (
          <>
            <p style={reviewText}>Card ending in {(payment.cardNumber || '').slice(-4)}</p>
            <p style={reviewText}>Expiry {payment.expiry}</p>
          </>
        ) : (
          <p style={reviewText}>KG Inicis — redirected at payment step</p>
        )}
      </ReviewSection>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div style={{ backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-olive)', margin: '0 0 8px' }}>{title}</p>
      {children}
    </div>
  );
}

const sectionTitle = { fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h3)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 };
const reviewText   = { fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-primary)', margin: '0 0 2px', lineHeight: 1.5 };

// ─── Validation ───────────────────────────────────────────────────────────────

function validateShipping(data) {
  const errs = {};
  if (!data.firstName?.trim()) errs.firstName = 'Required';
  if (!data.lastName?.trim())  errs.lastName  = 'Required';
  if (!data.email?.trim())     errs.email     = 'Required';
  if (!data.address1?.trim())  errs.address1  = 'Required';
  if (!data.city?.trim())      errs.city      = 'Required';
  if (!data.postalCode?.trim())errs.postalCode= 'Required';
  if (!data.country?.trim())   errs.country   = 'Required';
  return errs;
}

function validatePayment(data) {
  if (data.method === 'kginicis') return {};
  const errs = {};
  if (!data.cardNumber || data.cardNumber.length < 13) errs.cardNumber = 'Valid card number required';
  if (!data.expiry || data.expiry.length < 4)          errs.expiry     = 'Valid expiry required';
  if (!data.cvv || data.cvv.length < 3)                errs.cvv        = 'Valid CVV required';
  if (!data.cardName?.trim())                          errs.cardName   = 'Required';
  return errs;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CheckoutForm() {
  const router = useRouter();

  const [step,     setStep]     = useState('shipping');
  const [errors,   setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [shipping, setShipping] = useState({
    firstName:'', lastName:'', email:'', phone:'',
    address1:'', address2:'', city:'', state:'',
    postalCode:'', country:'', notes:'',
  });

  const [payment, setPayment] = useState({ method: 'card', cardNumber:'', expiry:'', cvv:'', cardName:'' });

  const cartItems    = useStore((s) => s.cartItems);
  const cartTotal    = useStore((s) => s.cartTotal);
  const clearCart    = useStore((s) => s.clearCart);
  const showSuccess  = useStore((s) => s.showSuccess);
  const showError    = useStore((s) => s.showError);

  const goNext = () => {
    if (step === 'shipping') {
      const errs = validateShipping(shipping);
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setStep('payment');
    } else if (step === 'payment') {
      const errs = validatePayment(payment);
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setStep('review');
    }
  };

  const goBack = () => {
    if (step === 'payment') setStep('shipping');
    if (step === 'review')  setStep('payment');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const order = await createOrder({
        items:   cartItems,
        total:   cartTotal,
        shipping,
        payment: { method: payment.method },
      });

      clearCart();
      showSuccess('Order placed successfully!');
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (err) {
      showError(err.message || 'Order failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.form}>
      <StepIndicator currentStep={step} />

      {/* Step content */}
      <div className={styles.stepContent}>
        {step === 'shipping' && (
          <>
            <ShippingForm data={shipping} onChange={setShipping} errors={errors} />
            <ShippingCalculator orderSubtotal={cartTotal} />
          </>
        )}
        {step === 'payment' && (
          <PaymentForm data={payment} onChange={setPayment} errors={errors} />
        )}
        {step === 'review' && (
          <ReviewStep shipping={shipping} payment={payment} />
        )}
      </div>

      {/* Navigation */}
      <div className={styles.nav}>
        {step !== 'shipping' && (
          <button type="button" className={styles.backBtn} onClick={goBack}>
            <ChevronLeft size={16} /> Back
          </button>
        )}

        <div style={{ flex: 1 }} />

        {step !== 'review' ? (
          <button type="button" className={styles.nextBtn} onClick={goNext}>
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : 'Place order'}
          </button>
        )}
      </div>
    </div>
  );
}

export default CheckoutForm;