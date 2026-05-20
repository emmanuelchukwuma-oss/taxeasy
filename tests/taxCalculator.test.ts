import test from "node:test";
import assert from "node:assert/strict";
import {
  INDIVIDUAL_EXEMPTION_NAIRA,
  SMALL_BUSINESS_EXEMPTION_NAIRA,
  calculateTaxEstimate,
  calculateTaxFromTransactions,
} from "../lib/taxCalculator";

test("returns zero tax for income below individual exemption", () => {
  const result = calculateTaxEstimate({
    incomeType: "salary",
    annualIncomeNaira: 700000,
  });

  assert.equal(result.taxableIncomeNaira, 0);
  assert.equal(result.totalTaxNaira, 0);
  assert.equal(result.breakdown.length, 0);
});

test("includes side income in total and taxable amount", () => {
  const result = calculateTaxEstimate({
    incomeType: "freelance",
    annualIncomeNaira: 900000,
    sideIncomeNaira: 300000,
  });

  assert.equal(result.totalIncomeNaira, 1200000);
  assert.equal(result.taxableIncomeNaira, 1200000 - INDIVIDUAL_EXEMPTION_NAIRA);
  assert.equal(result.totalTaxNaira, 300000 * 0.07 + 100000 * 0.11);
});

test("applies small business exemption under ₦100m threshold", () => {
  const result = calculateTaxEstimate({
    incomeType: "business",
    annualIncomeNaira: SMALL_BUSINESS_EXEMPTION_NAIRA - 1,
  });

  assert.equal(result.smallBusinessExemptionApplied, true);
  assert.equal(result.totalTaxNaira, 0);
});

test("small business exemption is denied if combined income exceeds threshold", () => {
  const result = calculateTaxEstimate({
    incomeType: "business",
    annualIncomeNaira: 95000000,
    sideIncomeNaira: 10000000, // Total 105M
  });

  assert.equal(result.smallBusinessExemptionApplied, false);
  assert.equal(result.totalIncomeNaira, 105000000);
  assert.equal(result.taxableIncomeNaira, 105000000 - INDIVIDUAL_EXEMPTION_NAIRA);
});

test("applies PIT bands progressively for taxable income above exemption", () => {
  const result = calculateTaxEstimate({
    incomeType: "salary",
    annualIncomeNaira: 2000000,
  });

  assert.equal(result.taxableIncomeNaira, 1200000);
  assert.equal(result.breakdown.length, 4);
  assert.equal(result.totalTaxNaira, 300000 * 0.07 + 300000 * 0.11 + 500000 * 0.15 + 100000 * 0.19);
});

test("calculates tax from categorized bank statement transactions", () => {
  const result = calculateTaxFromTransactions({
    transactions: [
      { amountNaira: 1400000, direction: "credit", category: "income" },
      { amountNaira: 200000, direction: "debit", category: "business_expense" },
      { amountNaira: 100000, direction: "credit", category: "tax_exempt" },
      { amountNaira: 50000, direction: "debit", category: "transfer" },
    ],
  });

  assert.equal(result.totalIncomeNaira, 1200000);
  assert.equal(result.deductibleBusinessExpensesNaira, 200000);
  assert.equal(result.ignoredTransactionsNaira, 150000);
  assert.equal(result.taxableIncomeNaira, 1200000 - INDIVIDUAL_EXEMPTION_NAIRA);
  assert.equal(result.totalTaxNaira, 300000 * 0.07 + 100000 * 0.11);
});
