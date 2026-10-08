/**
 * src/components/checkout/validation.js
 *
 * What has to be filled in before each checkout step will advance.
 *
 * Kept out of CheckoutForm.jsx, and free of any React or Stripe import, so it
 * can be run by `node --test` — see __tests__/validation.test.mjs. It was
 * untestable while it lived inside the component, which is how the bug below
 * reached production unnoticed.
 */

export function validateShipping(data) {
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

export function validatePayment(data) {
  //
  // Only the card method collects anything on this form, so only the card
  // method has anything to validate. PayPal has its own UI, and a Wise
  // transfer is sent by the customer from their own bank afterwards.
  //
  // THE BUG THIS SHAPE PREVENTS. This used to read "if the method is paypal,
  // nothing to check" and otherwise fall through to the card rules. When the
  // Wise method was added to the selector and to submit, nobody added it to
  // that exemption, so choosing Wise was asked for a name on card. The Wise
  // panel has no such input, so the error had nowhere to render: Continue
  // simply stopped working, showing nothing and offering the customer no way
  // forward. Asking "is it card?" cannot fail that way when the next payment
  // method is added.
  //
  if (data.method !== 'card') return {};

  // Stripe's CardElement validates the number, expiry and CVV internally and
  // reports through confirmCardPayment; the name is the only field we hold.
  const errs = {};
  if (!data.cardName?.trim()) errs.cardName = 'Required';
  return errs;
}
