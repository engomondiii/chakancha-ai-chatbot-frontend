'use client';

/**
 * src/components/checkout/CheckoutForm.jsx
 *
 * What changed from the previous version:
 *  - useStripe() and useElements() hooks added — provided by the
 *    <Elements> wrapper in checkout/page.jsx
 *  - Stripe card flow uses elements.getElement(CardElement) instead of
 *    raw card number/expiry/CVV — PCI compliant, works in production
 *  - validatePayment() updated: card method only validates cardName now
 *    (Stripe validates the card details internally and returns errors
 *    through stripe.confirmCardPayment())
 *  - ReviewStep shows "Stripe-secured card" for card method since we no
 *    longer store the card number in local state
 *  - PayPal and KG Inicis flows unchanged
 */

import React, { useState }                      from 'react';
import { useRouter }                             from 'next/navigation';
import { useStripe, useElements, CardElement }   from '@stripe/react-stripe-js';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { ShippingForm }       from './ShippingForm';
import { PaymentForm }        from './PaymentForm';
import { ShippingCalculator } from './ShippingCalculator';
import { createOrder, initStripePayment, initPayPalPayment } from '@/lib/api/orders';
import { useStore }           from '@/store';
import styles                 from './CheckoutForm.module.css';

const STEPS = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment',  label: 'Payment'  },
  { id: 'review',   label: 'Review'   },
];

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  const idx = STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className={styles.stepper}>
      {STEPS.map((step, i) => {
        const isDone   = i < idx;
        const isActive = i === idx;
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

// ── Review step ───────────────────────────────────────────────────────────────

function ReviewStep({ shipping, payment }) {
  const methodLabels = {
    card:     'Stripe-secured card payment',
    paypal:   'PayPal',
    kginicis: 'KG Inicis — redirected at payment step',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <h3 style={sectionTitle}>Review your order</h3>
      <ReviewSection title="Ship to">
        <p style={reviewText}>{shipping.firstName} {shipping.lastName}</p>
        <p style={reviewText}>{shipping.address1}{shipping.address2 ? ', ' + shipping.address2 : ''}</p>
        <p style={reviewText}>{shipping.city}{shipping.state ? `, ${shipping.state}` : ''} {shipping.postalCode}</p>
        <p style={reviewText}>{shipping.country}</p>
        {shipping.email && <p style={reviewText}>{shipping.email}</p>}
      </ReviewSection>
      <ReviewSection title="Payment">
        <p style={reviewText}>{methodLabels[payment.method] || payment.method}</p>
        {payment.method === 'card' && payment.cardName && (
          <p style={reviewText}>Name on card: {payment.cardName}</p>
        )}
      </ReviewSection>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-warm-cream)',
      border:          '1px solid var(--color-border)',
      borderRadius:    'var(--radius-md)',
      padding:         'var(--spacing-md)',
    }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-olive)', margin: '0 0 8px' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

const sectionTitle = { fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h3)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 };
const reviewText   = { fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-primary)', margin: '0 0 2px', lineHeight: 1.5 };

// ── Validation ────────────────────────────────────────────────────────────────

function validateShipping(data) {
  const errs = {};
  if (!data.firstName?.trim())  errs.firstName  = 'Required';
  if (!data.lastName?.trim())   errs.lastName   = 'Required';
  if (!data.email?.trim())      errs.email      = 'Required';
  if (!data.address1?.trim())   errs.address1   = 'Required';
  if (!data.city?.trim())       errs.city       = 'Required';
  if (!data.postalCode?.trim()) errs.postalCode = 'Required';
  if (!data.country?.trim())    errs.country    = 'Required';
  return errs;
}

function validatePayment(data) {
  // PayPal — no local fields to validate (handled by PayPal's own UI)
  if (data.method === 'paypal')   return {};
  // KG Inicis — redirect flow, no local fields
  if (data.method === 'kginicis') return {};

  // Card — Stripe CardElement validates number/expiry/CVV internally.
  // We only validate the name on card which we collect locally.
  const errs = {};
  if (!data.cardName?.trim()) errs.cardName = 'Required';
  return errs;
}

// ── Main component ────────────────────────────────────────────────────────────

export function CheckoutForm() {
  const router   = useRouter();
  const stripe   = useStripe();    // from @stripe/react-stripe-js
  const elements = useElements();  // from @stripe/react-stripe-js

  const [step,        setStep]        = useState('shipping');
  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [shippingEst, setShippingEst] = useState(null);

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address1: '', address2: '', city: '', state: '',
    postalCode: '', country: '', notes: '',
  });

  const [payment, setPayment] = useState({
    method:   'card',
    cardName: '',
    // cardNumber / expiry / cvv removed — Stripe CardElement owns those
  });

  const cartTotal     = useStore((s) => s.cartTotal);
  const appliedCoupon = useStore((s) => s.appliedCoupon);
  const clearCart     = useStore((s) => s.clearCart);
  const showSuccess   = useStore((s) => s.showSuccess);
  const showError     = useStore((s) => s.showError);

  // ── Navigation ─────────────────────────────────────────────────────────────

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

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);

    // Shared shipping payload (snake_case for Django backend)
    const shippingPayload = {
      first_name:  shipping.firstName,
      last_name:   shipping.lastName,
      email:       shipping.email,
      phone:       shipping.phone    || '',
      address1:    shipping.address1,
      address2:    shipping.address2 || '',
      city:        shipping.city,
      state:       shipping.state    || '',
      postal_code: shipping.postalCode,
      country:     shipping.country,
      notes:       shipping.notes    || '',
    };

    const paymentMethod = payment.method || 'card';

    try {

      // ── Stripe card flow ──────────────────────────────────────────────────
      if (paymentMethod === 'card') {
        if (!stripe || !elements) {
          throw new Error('Stripe has not loaded yet. Please refresh the page and try again.');
        }

        // Step 1: Backend creates a PaymentIntent and returns client_secret
        const stripeInit = await initStripePayment(cartTotal);

        // Step 2: Confirm card using Stripe's hosted CardElement
        // The card details stay inside Stripe's iframe — never in our JS
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          stripeInit.client_secret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                name:  payment.cardName,
                email: shipping.email,
              },
            },
          }
        );

        if (stripeError) {
          throw new Error(stripeError.message || 'Card payment failed. Please check your card details.');
        }

        if (paymentIntent.status !== 'succeeded') {
          throw new Error(`Payment not completed (status: ${paymentIntent.status}). Please try again.`);
        }

        // Step 3: Create order — backend verifies the PaymentIntent server-side
        const order = await createOrder({
          shipping:                 shippingPayload,
          payment_method:           'card',
          coupon_code:              appliedCoupon?.code || '',
          country:                  shipping.country || 'US',
          stripe_payment_intent_id: paymentIntent.id,
        });

        clearCart();
        showSuccess('Order placed successfully!');
        router.push(`/checkout/success?orderId=${order.id}`);

      // ── PayPal flow ───────────────────────────────────────────────────────
      } else if (paymentMethod === 'paypal') {
        // Step 1: Backend creates a PayPal order and returns approval_url
        const paypalInit = await initPayPalPayment(cartTotal);

        // Step 2: Save checkout data so /checkout/paypal/success can complete the order
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('chakancha_checkout_shipping', JSON.stringify(shippingPayload));
          sessionStorage.setItem('chakancha_checkout_coupon', appliedCoupon?.code || '');
        }

        // Step 3: Redirect buyer to PayPal — they return to /checkout/paypal/success
        window.location.href = paypalInit.approval_url;
        return; // Do not call setSubmitting(false) — page is navigating away

      // ── KG Inicis flow ────────────────────────────────────────────────────
      } else if (paymentMethod === 'kginicis') {
        const order = await createOrder({
          shipping:       shippingPayload,
          payment_method: 'kginicis',
          coupon_code:    appliedCoupon?.code || '',
          country:        shipping.country || 'US',
        });

        clearCart();
        showSuccess('Order placed! You will be redirected to KG Inicis.');
        router.push(`/checkout/success?orderId=${order.id}`);
      }

    } catch (err) {
      showError(err.message || 'Order failed. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.form}>
      <StepIndicator currentStep={step} />

      <div className={styles.stepContent}>
        {step === 'shipping' && (
          <>
            <ShippingForm data={shipping} onChange={setShipping} errors={errors} />
            <div style={{ marginTop: 'var(--spacing-lg)' }}>
              <ShippingCalculator
                orderSubtotal={cartTotal}
                onEstimate={setShippingEst}
              />
            </div>
          </>
        )}

        {step === 'payment' && (
          <PaymentForm data={payment} onChange={setPayment} errors={errors} />
        )}

        {step === 'review' && (
          <ReviewStep shipping={shipping} payment={payment} />
        )}
      </div>

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
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || (payment.method === 'card' && !stripe)}
          >
            {submitting
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              : payment.method === 'paypal'
                ? 'Continue to PayPal'
                : 'Place order'}
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default CheckoutForm;