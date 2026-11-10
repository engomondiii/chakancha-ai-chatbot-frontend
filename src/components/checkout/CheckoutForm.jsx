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
 *  - PayPal flow unchanged
 */

import React, { useState }                      from 'react';
import { useRouter }                             from 'next/navigation';
import { useStripe, useElements, CardElement }   from '@stripe/react-stripe-js';
import { Check, ChevronRight, ChevronLeft, Loader2, Gift } from 'lucide-react';
import { ShippingForm }       from './ShippingForm';
import { PaymentForm }        from './PaymentForm';
import { createOrder, initStripePayment, initPayPalPayment } from '@/lib/api/orders';
import { syncCartToServer }   from '@/lib/api/cart';
import { CreditOption }      from './CreditOption';
import { validateShipping, validatePayment } from './validation';
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
    wise:     'Wise transfer — you send it from your bank',
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


// ── Main component ────────────────────────────────────────────────────────────

export function CheckoutForm({ quote = null, applyCredit = false,
                               onApplyCreditChange = () => {} }) {
  const router   = useRouter();
  const stripe   = useStripe();    // from @stripe/react-stripe-js
  const elements = useElements();  // from @stripe/react-stripe-js

  const [step,        setStep]        = useState('shipping');
  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);

  //
  // Asked at the top of the first step, which is where somebody buying a
  // present knows it is one. Asked at the end, after an address and a card, it
  // arrives as an interruption to a decision already made.
  //
  const [giftWrapping, setGiftWrapping] = useState(false);

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

  const cartItems     = useStore((s) => s.cartItems);
  const cartTotal     = useStore((s) => s.cartTotal);
  const appliedCoupon      = useStore((s) => s.appliedCoupon);
  const setShippingCountry = useStore((s) => s.setShippingCountry);
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

        //
        // Step 0: push the local cart to the authenticated Django cart.
        //
        // The card flow did not do this — only PayPal did — and got away with
        // it because the checkout page syncs once on load. It cannot be left to
        // that now: the backend derives the amount to charge from the server
        // cart, so a stale server cart would mean charging the wrong figure
        // and then having the order refused for not matching. Syncing here is
        // idempotent and removes the dependency on page-load timing.
        //
        try {
          await syncCartToServer(cartItems);
        } catch (syncErr) {
          throw new Error(
            syncErr.message || 'Could not prepare your cart for checkout. Please try again.'
          );
        }

        // Step 1: Backend prices the cart and creates a PaymentIntent for the
        //         part the card is paying — the total, less any credit applied.
        const stripeInit = await initStripePayment(cartTotal, 'USD', {
          country:     shipping.country || 'US',
          couponCode:  appliedCoupon?.code || '',
          applyCredit,
        });

        //
        // Credit covered the whole order, so there is no card payment to make.
        // Stripe refuses a zero PaymentIntent, so the backend says so instead
        // of creating one and the order is placed straight away.
        //
        if (stripeInit.card_not_required) {
          const order = await createOrder({
            shipping:       shippingPayload,
            payment_method: 'card',
            coupon_code:    appliedCoupon?.code || '',
            country:        shipping.country || 'US',
            apply_credit:   true,
            gift_wrapping:  giftWrapping,
          });

            //
          // Clearing the cart lands on the checkout page a beat before the
          // navigation does, and its "cart is empty" rule would send the
          // customer to an empty basket instead of their confirmation. This
          // tells that rule an order was just placed. See checkout/page.jsx.
          //
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('chakancha_order_placed', '1');
          }
        clearCart();
          showSuccess('Order placed — paid with your Chakancha earnings.');
          router.push(`/checkout/success?orderId=${order.id}`);
          return;
        }

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
          apply_credit:             applyCredit,
          gift_wrapping:            giftWrapping,
        });

          //
          // Clearing the cart lands on the checkout page a beat before the
          // navigation does, and its "cart is empty" rule would send the
          // customer to an empty basket instead of their confirmation. This
          // tells that rule an order was just placed. See checkout/page.jsx.
          //
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('chakancha_order_placed', '1');
          }
        clearCart();
        showSuccess('Order placed successfully!');
        router.push(`/checkout/success?orderId=${order.id}`);

      // ── PayPal flow ───────────────────────────────────────────────────────
      } else if (paymentMethod === 'paypal') {
        // Step 0: push the local cart to the authenticated Django cart.
        // orders/services.py builds the order from Cart.objects.get(user=...),
        // which is otherwise empty. Server-side only — the local zustand /
        // localStorage cart is untouched and is still cleared later, only
        // after createOrder() succeeds on the PayPal return page.
        try {
          await syncCartToServer(cartItems);
        } catch (syncErr) {
          throw new Error(
            syncErr.message || 'Could not prepare your cart for checkout. Please try again.'
          );
        }

        // Step 1: Backend creates a PayPal order and returns approval_url.
        //         country + coupon must match what createOrder() sends later,
        //         or the PayPal charge and Order.total will disagree.
        // ── LEGACY — DISABLED DURING PHASE A ──────────────────────────────
        // const paypalInit = await initPayPalPayment(cartTotal);
        // ── END LEGACY ────────────────────────────────────────────────────
        const paypalInit = await initPayPalPayment(
          cartTotal,
          shippingPayload.country || 'US',
          appliedCoupon?.code || '',
          'USD',
          applyCredit,
        );

        // Step 2: Save checkout data so /checkout/paypal/success can complete the order
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('chakancha_checkout_shipping', JSON.stringify(shippingPayload));
          sessionStorage.setItem('chakancha_checkout_coupon', appliedCoupon?.code || '');
          // The order is created on the return page, which must apply the same
          // credit the PayPal charge was reduced by, or the amounts disagree.
          sessionStorage.setItem('chakancha_checkout_credit', applyCredit ? '1' : '');
          // The order is created after PayPal sends the customer back, by which
          // time this component is gone. Anything chosen here and not handed
          // over now is simply lost.
          sessionStorage.setItem('chakancha_checkout_gift', giftWrapping ? '1' : '');
        }

        // Step 3: Redirect buyer to PayPal — they return to /checkout/paypal/success
        window.location.href = paypalInit.approval_url;
        return; // Do not call setSubmitting(false) — page is navigating away


      // ── Wise transfer ─────────────────────────────────────────────────────
      //
      // No gateway to talk to: the order is placed pending and the customer is
      // sent to the page that tells them where to send the money.
      } else if (paymentMethod === 'wise') {
        const order = await createOrder({
          shipping:       shippingPayload,
          payment_method: 'wise',
          coupon_code:    appliedCoupon?.code || '',
          country:        shipping.country || 'US',
          apply_credit:   applyCredit,
          gift_wrapping:  giftWrapping,
        });

          //
          // Clearing the cart lands on the checkout page a beat before the
          // navigation does, and its "cart is empty" rule would send the
          // customer to an empty basket instead of their confirmation. This
          // tells that rule an order was just placed. See checkout/page.jsx.
          //
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('chakancha_order_placed', '1');
          }
        clearCart();
        router.push(`/checkout/wise?orderId=${order.id}`);
        return; // the page is navigating away
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
            {/*
              First thing on the first step.

              A present is a present before it is an address, and somebody
              sending one wants to know early that we can wrap it -- not after
              they have typed a card number. It costs nothing, so there is no
              decision to weigh and nothing to go back and reconsider.
            */}
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', marginBottom: 'var(--spacing-lg)',
                backgroundColor: 'var(--color-warm-cream)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={giftWrapping}
                onChange={(e) => setGiftWrapping(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--color-tea-green)',
                  cursor: 'pointer', flexShrink: 0 }}
              />
              <Gift size={16} color="var(--color-muted-olive)" aria-hidden="true" />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                color: 'var(--color-text-primary)', flex: 1 }}>
                Include gift wrapping
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                fontWeight: 600, color: 'var(--color-muted-olive)' }}>
                Free
              </span>
            </label>

            <ShippingForm
              data={shipping}
              onChange={(next) => {
                setShipping(next);
                // Publish the country so /cart requests the SAME backend quote
                // this checkout will use — one set of figures everywhere.
                setShippingCountry(next?.country || '');
              }}
              errors={errors}
            />
            {/*
              No shipping estimator here.

              Carriage is inside the price of the tea, so the answer to "what
              will delivery cost?" is the same for every country and every
              basket: nothing. A control that asks the customer to pick a
              country and press Calculate promises a figure that can change,
              which is the one thing this checkout is trying to say it cannot
              -- and it invited them to do work whose only possible result was
              zero.

              The component is left in the tree unimported rather than deleted,
              since it is the thing to bring back if carriage is ever charged
              separately again.
            */}
          </>
        )}

        {step === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <PaymentForm
              data={payment}
              onChange={setPayment}
              errors={errors}
              wiseAvailable={Boolean(quote?.wise_available)}
            />
            {/*
              Offered after the method, not before it: the credit is settled
              the same way whichever rail pays the remainder, so it reads as
              "and also use my earnings" rather than as a fourth payment
              method competing with the other three.
            */}
            <CreditOption
              quote={quote}
              applyCredit={applyCredit}
              onChange={onApplyCreditChange}
              disabled={submitting}
            />
          </div>
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