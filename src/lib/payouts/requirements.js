/**
 * src/lib/payouts/requirements.js
 *
 * The bank-details form, as pure functions.
 *
 * What a bank account needs is decided by the backend's requirements engine,
 * one country at a time — never by a table in this file. These functions only
 * decide how to SHOW what the backend sent:
 *
 *   - Only required fields are rendered. Optional fields (a Korean phone
 *     number, an email outside Korea) would clutter the form for no benefit.
 *   - Address fields are grouped under "Your address".
 *   - Some fields change which other fields are required; the form refreshes
 *     the requirements when one of those changes.
 *
 * No imports, on purpose: the React form uses this module and `node --test`
 * runs it directly (Node detects ES module syntax in a .js file).
 */

export const ADDRESS_PREFIX = "address.";

/**
 * Keys the backend answers itself. legalType is always PRIVATE for a member;
 * the account holder name is asked once, above the bank fields.
 */
const INTERNAL_KEYS = new Set(["legalType", "accountHolderName"]);

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function asList(fields) {
  return Array.isArray(fields) ? fields.filter((f) => f && f.key) : [];
}

/** Required fields only, in the order the backend sent them. */
export function visibleFields(fields) {
  return asList(fields).filter((f) => f.required === true && !INTERNAL_KEYS.has(f.key));
}

export function isAddressField(field) {
  return String(field?.key ?? "").startsWith(ADDRESS_PREFIX);
}

/** Bank fields first, then the holder's address. Order within each is preserved. */
export function groupFields(fields) {
  const bank = [];
  const address = [];
  for (const field of asList(fields)) {
    (isAddressField(field) ? address : bank).push(field);
  }
  return { bank, address };
}

/**
 * Starting values for a field set.
 *
 * A value the member already typed survives a requirements refresh as long as
 * the field still exists. Otherwise the backend's default, if any, is used.
 */
export function initialValues(fields, previous = {}) {
  const values = {};
  for (const field of asList(fields)) {
    const prior = previous?.[field.key];
    if (!isBlank(prior)) values[field.key] = String(prior);
    else if (!isBlank(field.default)) values[field.key] = String(field.default);
    else values[field.key] = "";
  }
  return values;
}

/** A pattern that cannot be compiled checks nothing; the backend still validates. */
export function compilePattern(pattern) {
  if (!pattern) return null;
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

/** "" when acceptable, otherwise a sentence naming the field. */
export function validateField(field, rawValue) {
  const name = field?.name || "This field";
  const value = isBlank(rawValue) ? "" : String(rawValue).trim();

  if (!value) return field?.required ? `${name} is required.` : "";

  if (field.minLength != null && value.length < field.minLength) {
    return `${name} must be at least ${field.minLength} characters.`;
  }
  if (field.maxLength != null && value.length > field.maxLength) {
    return `${name} must be at most ${field.maxLength} characters.`;
  }

  const options = (field.valuesAllowed ?? []).filter((o) => o && o.key);
  if (options.length && !options.some((o) => o.key === value)) {
    return `Choose a valid option for ${name}.`;
  }

  const pattern = compilePattern(field.validationRegexp);
  if (pattern && !pattern.test(value)) {
    return field.example
      ? `${name} doesn't look right. For example: ${field.example}`
      : `${name} doesn't look right.`;
  }
  return "";
}

/** Every field at once; firstInvalidKey is where focus should go. */
export function validateAll(fields, values) {
  const errors = {};
  let firstInvalidKey = null;
  for (const field of asList(fields)) {
    const message = validateField(field, values?.[field.key]);
    if (message) {
      errors[field.key] = message;
      if (firstInvalidKey === null) firstInvalidKey = field.key;
    }
  }
  return { errors, firstInvalidKey, valid: firstInvalidKey === null };
}

/**
 * Flat form values -> the two shapes destination creation takes.
 *
 * "address.city" becomes address.city; everything else identifies the account.
 * Blank values are left out so an untouched field is never sent as "".
 */
export function splitPayload(values) {
  const details = {};
  const address = {};
  for (const [key, raw] of Object.entries(values ?? {})) {
    if (isBlank(raw) || INTERNAL_KEYS.has(key)) continue;
    const value = String(raw).trim();
    if (key.startsWith(ADDRESS_PREFIX)) address[key.slice(ADDRESS_PREFIX.length)] = value;
    else details[key] = value;
  }
  return { details, address };
}

/** The flat, non-blank values a requirements refresh is asked about. */
export function refreshDetails(values) {
  const details = {};
  for (const [key, raw] of Object.entries(values ?? {})) {
    if (isBlank(raw) || INTERNAL_KEYS.has(key)) continue;
    details[key] = String(raw).trim();
  }
  return details;
}

/** Does changing this field change which fields are required? */
export function needsRefresh(field) {
  return Boolean(field?.refreshRequirementsOnChange);
}

/**
 * A choice from a list refreshes as soon as it is picked. A typed value waits
 * for blur, so the form is not re-asked on every keystroke.
 */
export function refreshesImmediately(field) {
  return needsRefresh(field) && (field.valuesAllowed ?? []).some((o) => o && o.key);
}

/** A DOM id that is safe for keys like "address.postCode". */
export function fieldDomId(key) {
  return `payout-field-${String(key).replace(/[^A-Za-z0-9_-]/g, "-")}`;
}
