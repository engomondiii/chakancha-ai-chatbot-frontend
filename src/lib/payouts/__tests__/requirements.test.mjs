/**
 * requirements.test.mjs — the bank-details form's pure logic.
 *
 * Run: npm run test:payouts
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  compilePattern, fieldDomId, groupFields, initialValues, needsRefresh,
  refreshDetails, refreshesImmediately, splitPayload, validateAll, validateField,
  visibleFields,
} from "../requirements.js";

// Trimmed from a USD -> KRW PayGate requirements response (sandbox, 13 Sep 2026).
const KOREA = [
  { key: "email", name: "Email", required: true, example: "name@example.com" },
  { key: "legalType", name: "Recipient type", required: true, refreshRequirementsOnChange: true,
    valuesAllowed: [{ key: "PRIVATE", name: "Person" }] },
  { key: "dateOfBirth", name: "Date of birth", type: "date", required: true },
  { key: "bankCode", name: "Bank", required: true,
    valuesAllowed: [{ key: "004", name: "Kookmin" }, { key: "088", name: "Shinhan" }] },
  { key: "accountNumber", name: "Account number", required: true, minLength: 6, maxLength: 16,
    validationRegexp: "^[0-9]+$", example: "12345678901" },
  { key: "phoneNumber", name: "Phone number", required: false },
  { key: "address.country", name: "Country", required: true, refreshRequirementsOnChange: true,
    valuesAllowed: [{ key: "KR", name: "South Korea" }, { key: "KE", name: "Kenya" }] },
  { key: "address.city", name: "City", required: true },
  { key: "address.state", name: "State", required: false },
  { key: "address.postCode", name: "Post code", required: true },
];

test("only required fields are shown, in the order sent", () => {
  const keys = visibleFields(KOREA).map((f) => f.key);
  assert.deepEqual(keys, [
    "email", "dateOfBirth", "bankCode", "accountNumber",
    "address.country", "address.city", "address.postCode",
  ]);
});

test("optional fields never appear, even ones Wise lists", () => {
  const keys = visibleFields(KOREA).map((f) => f.key);
  assert.ok(!keys.includes("phoneNumber"));
  assert.ok(!keys.includes("address.state"));
});

test("legalType and the holder name are answered elsewhere, never rendered", () => {
  const fields = [...KOREA, { key: "accountHolderName", name: "Name", required: true }];
  const keys = visibleFields(fields).map((f) => f.key);
  assert.ok(!keys.includes("legalType"));
  assert.ok(!keys.includes("accountHolderName"));
});

test("a field set where email is optional does not ask for it", () => {
  const kenya = [
    { key: "email", name: "Email", required: false },
    { key: "bankCode", name: "Bank", required: true },
    { key: "accountNumber", name: "Account number", required: true },
  ];
  assert.deepEqual(visibleFields(kenya).map((f) => f.key), ["bankCode", "accountNumber"]);
});

test("visibleFields tolerates missing or malformed input", () => {
  assert.deepEqual(visibleFields(undefined), []);
  assert.deepEqual(visibleFields([null, {}, { key: "x", required: true }]).map((f) => f.key), ["x"]);
});

test("address fields are grouped apart from bank fields, order kept", () => {
  const { bank, address } = groupFields(visibleFields(KOREA));
  assert.deepEqual(bank.map((f) => f.key), ["email", "dateOfBirth", "bankCode", "accountNumber"]);
  assert.deepEqual(address.map((f) => f.key), ["address.country", "address.city", "address.postCode"]);
});

test("splitPayload nests address keys and drops blanks and internal keys", () => {
  const { details, address } = splitPayload({
    bankCode: "004", accountNumber: " 12345678901 ", email: "",
    "address.city": "Seoul", "address.postCode": "04524", "address.state": "",
    legalType: "PRIVATE",
  });
  assert.deepEqual(details, { bankCode: "004", accountNumber: "12345678901" });
  assert.deepEqual(address, { city: "Seoul", postCode: "04524" });
});

test("refreshDetails keeps flat keys and drops blanks", () => {
  assert.deepEqual(
    refreshDetails({ "address.country": "KR", bankCode: "", legalType: "PRIVATE", email: "a@b.co" }),
    { "address.country": "KR", email: "a@b.co" },
  );
});

test("required, length, option and pattern validation", () => {
  const account = KOREA.find((f) => f.key === "accountNumber");
  assert.equal(validateField(account, ""), "Account number is required.");
  assert.equal(validateField(account, "   "), "Account number is required.");
  assert.equal(validateField(account, "123"), "Account number must be at least 6 characters.");
  assert.equal(validateField(account, "1".repeat(17)), "Account number must be at most 16 characters.");
  assert.match(validateField(account, "12AB5678"), /doesn't look right\. For example: 12345678901/);
  assert.equal(validateField(account, "12345678901"), "");

  const bank = KOREA.find((f) => f.key === "bankCode");
  assert.equal(validateField(bank, "999"), "Choose a valid option for Bank.");
  assert.equal(validateField(bank, "088"), "");

  assert.equal(validateField({ key: "x", name: "Optional", required: false }, ""), "");
});

test("a pattern that cannot compile does not block the member", () => {
  const field = { key: "x", name: "Code", required: true, validationRegexp: "([unclosed" };
  assert.equal(compilePattern(field.validationRegexp), null);
  assert.equal(validateField(field, "anything"), "");
});

test("validateAll reports every error and the first invalid key", () => {
  const fields = visibleFields(KOREA);
  const { errors, firstInvalidKey, valid } = validateAll(fields, { email: "a@b.co" });
  assert.equal(valid, false);
  assert.equal(firstInvalidKey, "dateOfBirth");
  assert.ok(errors.bankCode && errors["address.city"]);
  assert.ok(!("email" in errors));
});

test("refresh detection: lists refresh at once, typed values on blur", () => {
  const legal = KOREA.find((f) => f.key === "legalType");
  const country = KOREA.find((f) => f.key === "address.country");
  const typed = { key: "postcode", refreshRequirementsOnChange: true };
  assert.equal(needsRefresh(legal), true);
  assert.equal(needsRefresh(KOREA[0]), false);
  assert.equal(refreshesImmediately(country), true);
  assert.equal(refreshesImmediately(typed), false);
  assert.equal(needsRefresh(typed), true);
});

test("initial values use defaults and preserve what was typed", () => {
  const fields = [
    { key: "bankCode", required: true, default: "004" },
    { key: "accountNumber", required: true },
    { key: "address.country", required: true },
  ];
  assert.deepEqual(initialValues(fields, {}), { bankCode: "004", accountNumber: "", "address.country": "" });
  assert.deepEqual(
    initialValues(fields, { accountNumber: "123456", "address.country": "KR", removedField: "x" }),
    { bankCode: "004", accountNumber: "123456", "address.country": "KR" },
  );
  assert.deepEqual(initialValues(fields, { bankCode: "088" }).bankCode, "088");
  assert.equal(initialValues(fields, { bankCode: "" }).bankCode, "004");
});

test("dom ids are safe for dotted keys", () => {
  assert.equal(fieldDomId("address.postCode"), "payout-field-address-postCode");
});
