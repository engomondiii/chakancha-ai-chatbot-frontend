/**
 * src/components/checkout/CheckoutForm.jsx — Integration Phase 3
 *
 * What changed from the original:
 *  - createOrder() payload updated to match CreateOrderSerializer:
 *      { shipping: {first_name, last_name, ...snake_case}, payment_method, coupon_code, country }
 *  - Field name mapping: firstName → first_name, postalCode → postal_code, etc.
 *  - Passes appliedCoupon.code as coupon_code if present
 *  - Uses router.push to /checkout/success?orderId=<id> after order created
 *  - ShippingCalculator onEstimate callback wired to update shipping display
 *  - Everything else unchanged (step logic, validation, UI)
 */

'use client';

import React, { useState } from 'react';
import { useRouter }        from 'next/navigation';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { ShippingForm }        from './ShippingForm';
import { PaymentForm }         from './PaymentForm';
import { ShippingCalculator }  from './ShippingCalculator';
import { createOrder }         from '@/lib/api/orders';
import { useStore }            from '@/store';
import styles                  from './CheckoutForm.module.css';

const STEPS = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment',  label: 'Payment'  },
  { id: 'review',   label: 'Review'   },
];

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

function ReviewStep({ shipping, payment }) {
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
    <div style={{ backgroundColor: 'var(--color-warm-cream)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-olive)', margin: '0 0 8px' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

const sectionTitle = { fontFamily: 'var(--font-display)', fontSize: 'var(--font-size-h3)', fontWeight: 600, color: 'var(--color-earth-brown)', margin: 0 };
const reviewText   = { fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-text-primary)', margin: '0 0 2px', lineHeight: 1.5 };

function validateShipping(data) {
  const errs = {};
  if (!data.firstName?.trim())   errs.firstName   = 'Required';
  if (!data.lastName?.trim())    errs.lastName    = 'Required';
  if (!data.email?.trim())       errs.email       = 'Required';
  if (!data.address1?.trim())    errs.address1    = 'Required';
  if (!data.city?.trim())        errs.city        = 'Required';
  if (!data.postalCode?.trim())  errs.postalCode  = 'Required';
  if (!data.country?.trim())     errs.country     = 'Required';
  return errs;
}

function validatePayment(data) {
  if (data.method === 'kginicis') return {};
  const errs = {};
  if (!data.cardNumber || data.cardNumber.length < 13) errs.cardNumber = 'Valid card number required';
  if (!data.expiry    || data.expiry.length   < 4)    errs.expiry     = 'Valid expiry required';
  if (!data.cvv       || data.cvv.length      < 3)    errs.cvv        = 'Valid CVV required';
  if (!data.cardName?.trim())                         errs.cardName   = 'Required';
  return errs;
}

export function CheckoutForm() {
  const router = useRouter();

  const [step,        setStep]        = useState('shipping');
  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [shippingEst, setShippingEst] = useState(null);

  const [shipping, setShipping] = useState({
    firstName:'', lastName:'', email:'', phone:'',
    address1:'', address2:'', city:'', state:'',
    postalCode:'', country:'', notes:'',
  });

  const [payment, setPayment] = useState({ method: 'card', cardNumber:'', expiry:'', cvv:'', cardName:'' });

  const cartItems    = useStore((s) => s.cartItems);
  const cartTotal    = useStore((s) => s.cartTotal);
  const appliedCoupon = useStore((s) => s.appliedCoupon);
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
      // Build backend-compatible payload (CreateOrderSerializer shape)
      const orderPayload = {
        shipping: {
          first_name:  shipping.firstName,
          last_name:   shipping.lastName,
          email:       shipping.email,
          phone:       shipping.phone        || '',
          address1:    shipping.address1,
          address2:    shipping.address2     || '',
          city:        shipping.city,
          state:       shipping.state        || '',
          postal_code: shipping.postalCode,
          country:     shipping.country,
          notes:       shipping.notes        || '',
        },
        payment_method: payment.method || 'card',
        coupon_code:    appliedCoupon?.code  || '',
        country:        shipping.country     || 'US',
      };

      const order = await createOrder(orderPayload);

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
          <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              : 'Place order'}
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default CheckoutForm;