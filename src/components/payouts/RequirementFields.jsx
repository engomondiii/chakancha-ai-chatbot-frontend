/**
 * src/components/payouts/RequirementFields.jsx
 *
 * Renders the bank fields the backend says this account needs — required ones
 * only, already filtered by the caller. Nothing here knows about a country or
 * a bank rail: labels, examples, options and limits all come with each field.
 */

"use client";

import React from "react";

import { fieldDomId, groupFields } from "@/lib/payouts/requirements";

import styles from "./payouts.module.css";

function RequirementField({ field, value, error, onChange, onBlur, disabled }) {
  const id = fieldDomId(field.key);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const options = (field.valuesAllowed ?? []).filter((o) => o && o.key);
  const describedBy = [field.usageInfo ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  const shared = {
    id,
    name: field.key,
    value: value ?? "",
    disabled,
    required: true,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": describedBy,
    onBlur: () => onBlur(field),
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{field.name || field.key}</label>
      {options.length > 0 ? (
        <select {...shared} onChange={(e) => onChange(field, e.target.value)}>
          <option value="">Choose…</option>
          {options.map((o) => (
            <option key={o.key} value={o.key}>{o.name || o.key}</option>
          ))}
        </select>
      ) : (
        <input
          {...shared}
          type={field.type === "date" ? "date" : "text"}
          autoComplete="off"
          placeholder={field.example || field.displayFormat || undefined}
          maxLength={field.maxLength ?? undefined}
          onChange={(e) => onChange(field, e.target.value)}
        />
      )}
      {field.usageInfo && (
        <p id={hintId} className={styles.figureHint}>{field.usageInfo}</p>
      )}
      {error && (
        <p id={errorId} className={styles.fieldError}>{error}</p>
      )}
    </div>
  );
}

export function RequirementFields({ fields, values, errors, onChange, onBlur, disabled }) {
  const { bank, address } = groupFields(fields);
  const render = (field) => (
    <RequirementField
      key={field.key}
      field={field}
      value={values[field.key]}
      error={errors[field.key]}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
    />
  );

  return (
    <>
      {bank.length > 0 && <div className={styles.fieldGroup}>{bank.map(render)}</div>}
      {address.length > 0 && (
        <fieldset className={styles.fieldGroup} aria-describedby="payout-address-hint">
          <legend className={styles.formLegend}>Your address</legend>
          <p id="payout-address-hint" className={styles.figureHint}>
            The address your bank has on file.
          </p>
          {address.map(render)}
        </fieldset>
      )}
    </>
  );
}

export default RequirementFields;
