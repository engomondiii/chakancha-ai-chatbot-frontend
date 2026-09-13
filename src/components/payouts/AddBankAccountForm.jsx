/**
 * src/components/payouts/AddBankAccountForm.jsx
 *
 * Add a bank account, in the member's terms:
 *
 *   Bank account → account holder name → country → the details that bank needs.
 *
 * The member never chooses a currency or a payment rail. The backend resolves
 * both from the country, confirms the route can be paid, and returns only the
 * fields that account needs. Earnings stay USD; the member is told what their
 * bank will receive.
 *
 * Saving is not blocked by the member's current balance: an amount limit is
 * checked when they review a withdrawal, not when they add an account.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Landmark, Loader2, Plus } from "lucide-react";

import {
  addDestination, getCorridors, getDestinationRequirements, payoutErrorOptions,
  refineDestinationRequirements,
} from "@/lib/api/payouts";
import { describePayoutError } from "@/lib/payouts/errors";
import {
  fieldDomId, initialValues, needsRefresh, refreshDetails, refreshesImmediately,
  splitPayload, validateAll, validateField, visibleFields,
} from "@/lib/payouts/requirements";

import { RequirementFields } from "./RequirementFields";
import styles from "./payouts.module.css";

const HOLDER_ID = "payout-holder-name";
const COUNTRY_ID = "payout-bank-country";
const REFRESH_DEBOUNCE_MS = 400;

function validateHolder(name) {
  const value = name.trim();
  if (!value) return "Enter the account holder name.";
  if (value.split(/\s+/).length < 2) {
    return "Enter the name exactly as it appears on your bank account, including first and last name.";
  }
  return "";
}

function focusById(id) {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => document.getElementById(id)?.focus());
}

/**
 * The backend pre-fills address.country with the bank's country through the
 * field's `default`. Only when it sends no default is the bank's country used,
 * and only for a field that exists and is still blank.
 */
function fillCountry(values, fields, country) {
  const field = fields.find((f) => f.key === "address.country");
  if (!field || values["address.country"] || field.default) return values;
  return { ...values, "address.country": country };
}

export function AddBankAccountForm({ onCancel, onAdded }) {
  const [holder, setHolder] = useState("");
  const [holderError, setHolderError] = useState("");

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState("");

  const [country, setCountry] = useState("");
  const [requirements, setRequirements] = useState(null);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshPending, setRefreshPending] = useState(false);
  const [requirementsError, setRequirementsError] = useState("");

  const [values, setValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [otherErrors, setOtherErrors] = useState([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Every requirements request gets a sequence number; a response that is not
  // the latest is dropped, so a slow answer can never overwrite a newer one.
  const requestSeq = useRef(0);
  const refreshTimer = useRef(null);
  const valuesRef = useRef(values);
  const requirementsRef = useRef(requirements);
  const countriesRef = useRef(countries);
  const lastAsked = useRef({});

  useEffect(() => { valuesRef.current = values; }, [values]);
  useEffect(() => { requirementsRef.current = requirements; }, [requirements]);
  useEffect(() => { countriesRef.current = countries; }, [countries]);
  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  const countryName = useMemo(
    () => requirements?.countryName || countries.find((c) => c.code === country)?.name || "",
    [requirements, countries, country],
  );

  // Countries, once per form.
  useEffect(() => {
    let cancelled = false;
    getCorridors()
      .then((c) => { if (!cancelled) setCountries(c.countries); })
      .catch((err) => {
        if (!cancelled) setCountriesError(describePayoutError(err, payoutErrorOptions()).message);
      })
      .finally(() => { if (!cancelled) setCountriesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // One country, one field set.
  useEffect(() => {
    clearTimeout(refreshTimer.current);
    const seq = ++requestSeq.current;
    setRequirements(null);
    setRequirementsError("");
    setFieldErrors({});
    setOtherErrors([]);
    setFormError("");
    setRefreshing(false);
    setRefreshPending(false);
    if (!country) {
      setLoadingRequirements(false);
      setValues({});
      return;
    }

    setLoadingRequirements(true);
    getDestinationRequirements(country)
      .then((reqs) => {
        if (seq !== requestSeq.current) return;
        const shown = visibleFields(reqs.fields);
        const next = fillCountry(initialValues(shown, {}), shown, country);
        lastAsked.current = { ...next };
        setRequirements(reqs);
        setValues(next);
      })
      .catch((err) => {
        if (seq !== requestSeq.current) return;
        const name = countriesRef.current.find((c) => c.code === country)?.name;
        setRequirementsError(
          describePayoutError(err, payoutErrorOptions({ country_name: name })).message,
        );
      })
      .finally(() => { if (seq === requestSeq.current) setLoadingRequirements(false); });
  }, [country]);

  const runRefresh = useCallback((snapshot) => {
    const current = requirementsRef.current;
    setRefreshPending(false);
    if (!current?.accountType || !country) return;

    const seq = ++requestSeq.current;
    lastAsked.current = { ...snapshot };
    setRefreshing(true);
    refineDestinationRequirements({
      country,
      type: current.accountType,
      details: refreshDetails(snapshot),
    })
      .then((next) => {
        if (seq !== requestSeq.current) return;
        setRequirements(next);
        const shown = visibleFields(next.fields);
        setValues((prev) => fillCountry(initialValues(shown, prev), shown, country));
      })
      .catch((err) => {
        if (seq !== requestSeq.current) return;
        setRequirementsError(
          describePayoutError(err, payoutErrorOptions({ country_name: countryName })).message,
        );
      })
      .finally(() => { if (seq === requestSeq.current) setRefreshing(false); });
  }, [country, countryName]);

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field.key]: value }));
    setFieldErrors((prev) => (prev[field.key] ? { ...prev, [field.key]: "" } : prev));

    if (refreshesImmediately(field) && (lastAsked.current[field.key] ?? "") !== value) {
      clearTimeout(refreshTimer.current);
      runRefresh({ ...valuesRef.current, [field.key]: value });
    }
  };

  const handleBlur = (field) => {
    const value = valuesRef.current[field.key] ?? "";
    setFieldErrors((prev) => ({ ...prev, [field.key]: validateField(field, value) }));

    if (needsRefresh(field) && !refreshesImmediately(field)
        && (lastAsked.current[field.key] ?? "") !== value) {
      clearTimeout(refreshTimer.current);
      setRefreshPending(true);
      refreshTimer.current = setTimeout(
        () => runRefresh({ ...valuesRef.current }), REFRESH_DEBOUNCE_MS);
    }
  };

  const fields = visibleFields(requirements?.fields);
  const bankAvailable = requirements ? requirements.bankPayoutAvailable !== false : false;
  const sameCurrency = requirements?.currency
    && requirements.currency === requirements.sourceCurrency;
  const currencyName = requirements?.currencyName || requirements?.currency || "";
  const waiting = loadingRequirements || refreshing || refreshPending;

  const submit = async (event) => {
    event.preventDefault();
    if (waiting || submitting || !requirements || !bankAvailable) return;

    setFormError("");
    setOtherErrors([]);
    const holderMessage = validateHolder(holder);
    const { errors, firstInvalidKey } = validateAll(fields, values);
    setHolderError(holderMessage);
    setFieldErrors(errors);
    if (holderMessage) { focusById(HOLDER_ID); return; }
    if (firstInvalidKey) { focusById(fieldDomId(firstInvalidKey)); return; }

    setSubmitting(true);
    try {
      const { details, address } = splitPayload(values);
      const destination = await addDestination({
        rail: "WISE",
        country,
        account_holder_name: holder.trim(),
        details,
        address,
        is_default: true,
      });
      await onAdded(destination);
    } catch (err) {
      const info = describePayoutError(err, payoutErrorOptions({ country_name: countryName }));
      const known = new Set(fields.map((f) => f.key));
      const mapped = {};
      const unmatched = [];
      let holderServerError = "";
      for (const [key, message] of Object.entries(info.fieldErrors)) {
        const text = Array.isArray(message) ? message.join(" ") : String(message);
        if (known.has(key)) mapped[key] = text;
        else if (key === "accountHolderName" || key === "account_holder_name") holderServerError = text;
        else unmatched.push(text);
      }
      setFieldErrors((prev) => ({ ...prev, ...mapped }));
      if (holderServerError) setHolderError(holderServerError);
      setOtherErrors(unmatched);
      setFormError(info.message);
      const firstMapped = fields.find((f) => mapped[f.key]);
      if (holderServerError) focusById(HOLDER_ID);
      else if (firstMapped) focusById(fieldDomId(firstMapped.key));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-busy={waiting || submitting}>
      <fieldset className={styles.fieldGroup}>
        <legend className={styles.formLegend}>How would you like to receive your money?</legend>
        <label className={styles.methodOption}>
          <input type="radio" name="payout-method" value="bank_account" checked onChange={() => {}} />
          <span className={styles.methodText}>
            <span className={styles.methodTitle}>
              <Landmark size={16} aria-hidden /> Bank account
            </span>
            <span className={styles.figureHint}>
              Receive your earnings directly into your bank account.
            </span>
          </span>
        </label>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor={HOLDER_ID}>Account holder name</label>
        <input
          id={HOLDER_ID}
          name="account_holder_name"
          autoComplete="name"
          value={holder}
          required
          aria-invalid={holderError ? "true" : undefined}
          aria-describedby={`${HOLDER_ID}-hint${holderError ? ` ${HOLDER_ID}-error` : ""}`}
          onChange={(e) => { setHolder(e.target.value); if (holderError) setHolderError(""); }}
          onBlur={() => setHolderError(holder ? validateHolder(holder) : "")}
        />
        <p id={`${HOLDER_ID}-hint`} className={styles.figureHint}>
          Enter the name exactly as it appears on your bank account.
        </p>
        {holderError && <p id={`${HOLDER_ID}-error`} className={styles.fieldError}>{holderError}</p>}
      </div>

      <div className={styles.field}>
        <label htmlFor={COUNTRY_ID}>Where is your bank account?</label>
        <select
          id={COUNTRY_ID}
          name="country"
          value={country}
          disabled={countriesLoading || submitting}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">{countriesLoading ? "Loading countries…" : "Choose a country…"}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        {countriesError && <p className={styles.fieldError}>{countriesError}</p>}
      </div>

      {loadingRequirements && (
        <p className={styles.figureHint} role="status">
          <Loader2 size={14} className={styles.spin} aria-hidden /> Checking what your bank needs…
        </p>
      )}

      {requirementsError && (
        <div className={styles.blockItem} role="alert">
          <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
          <span className={styles.blockText}>{requirementsError}</span>
        </div>
      )}

      {requirements && !bankAvailable && (
        <div className={styles.blockItem} role="alert">
          <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
          <span className={styles.blockText}>
            Bank payouts to {countryName || "this country"} aren&apos;t currently available.
          </span>
        </div>
      )}

      {requirements && bankAvailable && (
        <>
          {requirements.currency && (
            <p className={styles.infoLine}>
              {sameCurrency
                ? `Your bank will receive ${currencyName} (${requirements.currency}).`
                : `Your bank will receive ${currencyName} (${requirements.currency}). Your USD earnings are converted to ${currencyName} before they're sent.`}
            </p>
          )}

          {requirements.usageInfo && (
            <p className={styles.figureHint}>{requirements.usageInfo}</p>
          )}

          <RequirementFields
            fields={fields}
            values={values}
            errors={fieldErrors}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={submitting}
          />

          {(refreshing || refreshPending) && (
            <p className={styles.figureHint} role="status">
              <Loader2 size={14} className={styles.spin} aria-hidden /> Updating the details your bank needs…
            </p>
          )}
        </>
      )}

      {formError && (
        <div className={styles.blockItem} role="alert">
          <AlertCircle size={15} className={styles.blockIcon} aria-hidden />
          <span className={styles.blockText}>
            {formError}
            {otherErrors.length > 0 && (
              <ul className={styles.reasonList}>
                {otherErrors.map((text, i) => <li key={i}>{text}</li>)}
              </ul>
            )}
          </span>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.button}
          disabled={submitting || waiting || !requirements || !bankAvailable || !country}
        >
          {submitting ? <Loader2 size={15} className={styles.spin} aria-hidden /> : <Plus size={15} aria-hidden />}
          Save bank account
        </button>
        <button type="button" className={`${styles.button} ${styles.buttonQuiet}`}
                onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AddBankAccountForm;
