import test from "node:test";
import assert from "node:assert/strict";
import {
  SMALL_BUSINESS_EXEMPTION_NAIRA,
  NANO_BUSINESS_EXEMPTION_NAIRA,
  calculateTaxEstimate,
  calculateTaxFromTransactions,
} from "../lib/taxCalculator";

test("returns zero tax for income below the ₦800,000 tax-free band", () => {
  const result = calculateTaxEstimate({
    incomeType: "salary",
    annualIncomeNaira: 700000,
  });

  assert.equal(result.chargeableIncomeNaira, 700000);
  assert.equal(result.totalTaxNaira, 0);
  assert.equal(result.breakdown.length, 1);
  assert.equal(result.breakdown[0].rate, 0);
  assert.equal(result.breakdown[0].taxAmount, 0);
});

test("includes side income in total and chargeable amount and applies 15% rate on the excess", () => {
  const result = calculateTaxEstimate({
    incomeType: "freelance",
    annualIncomeNaira: 900000,
    sideIncomeNaira: 300000,
  });

  assert.equal(result.totalIncomeNaira, 1200000);
  assert.equal(result.chargeableIncomeNaira, 1200000);
  // First 800,000 is tax-free.
  // Next 400,000 is taxed at 15% = 60,000.
  assert.equal(result.totalTaxNaira, 60000);
  assert.equal(result.breakdown.length, 2);
  assert.equal(result.breakdown[0].rate, 0);
  assert.equal(result.breakdown[1].rate, 0.15);
  assert.equal(result.breakdown[1].taxAmount, 60000);
});

test("applies small business exemption under ₦100m threshold for formal businesses", () => {
  const result = calculateTaxEstimate({
    incomeType: "business",
    annualIncomeNaira: SMALL_BUSINESS_EXEMPTION_NAIRA - 1,
  });

  assert.equal(result.smallBusinessExemptionApplied, true);
  assert.equal(result.totalTaxNaira, 0);
});

test("small business exemption is denied if combined business income exceeds threshold", () => {
  const result = calculateTaxEstimate({
    incomeType: "business",
    annualIncomeNaira: 95000000,
    sideIncomeNaira: 10000000, // Total 105M
  });

  assert.equal(result.smallBusinessExemptionApplied, false);
  assert.equal(result.totalIncomeNaira, 105000000);
  assert.equal(result.chargeableIncomeNaira, 105000000);
  // PIT calculation:
  // Total 105M
  // First 800k @ 0%
  // Next 2.2M @ 15% = 330k
  // Next 9M @ 18% = 1.62M
  // Next 13M @ 21% = 2.73M
  // Next 25M @ 23% = 5.75M
  // Remaining 55M @ 25% = 13.75M
  // Total tax = 330k + 1.62M + 2.73M + 5.75M + 13.75M = 24.18M
  assert.equal(result.totalTaxNaira, 24180000);
});

test("applies PIT bands progressively for chargeable income above tax-free band", () => {
  const result = calculateTaxEstimate({
    incomeType: "salary",
    annualIncomeNaira: 2000000,
  });

  assert.equal(result.chargeableIncomeNaira, 2000000);
  // First 800k @ 0% = 0.
  // Remaining 1.2M @ 15% = 180k.
  assert.equal(result.totalTaxNaira, 180000);
  assert.equal(result.breakdown.length, 2);
  assert.equal(result.breakdown[0].rate, 0);
  assert.equal(result.breakdown[1].rate, 0.15);
});

test("applies deductions wizard inputs correctly (rent, pension, NHF, NHIS, life insurance)", () => {
  const result = calculateTaxEstimate({
    incomeType: "salary",
    annualIncomeNaira: 6000000,
    annualRentNaira: 1000000,      // 20% of rent = 200k relief (cap 500k)
    pensionNaira: 480000,          // 480k pension
    nhfNaira: 150000,              // 150k NHF
    nhisNaira: 50000,              // 50k NHIS
    lifeInsuranceNaira: 120000,    // 120k insurance
  });

  // Total deductions = 200k + 480k + 150k + 50k + 120k = 1,000,000.
  assert.equal(result.rentReliefNaira, 200000);
  assert.equal(result.pensionDeductionNaira, 480000);
  assert.equal(result.totalDeductionsNaira, 1000000);
  assert.equal(result.chargeableIncomeNaira, 5000000);

  // PIT on 5M:
  // First 800k @ 0% = 0
  // Next 2.2M @ 15% = 330,000
  // Remaining 2.0M @ 18% = 360,000
  // Total tax = 690,000
  assert.equal(result.totalTaxNaira, 690000);
});

test("applies nano business exemption for informal sector ≤ ₦12M", () => {
  const result = calculateTaxEstimate({
    incomeType: "informal",
    annualIncomeNaira: NANO_BUSINESS_EXEMPTION_NAIRA, // 12M
  });

  assert.equal(result.nanoBusinessExemptionApplied, true);
  assert.equal(result.presumptiveTaxApplied, false);
  assert.equal(result.totalTaxNaira, 0);
});

test("applies 1% presumptive tax for informal sector between ₦12M and ₦100M", () => {
  const result = calculateTaxEstimate({
    incomeType: "informal",
    annualIncomeNaira: 30000000, // 30M
  });

  assert.equal(result.nanoBusinessExemptionApplied, false);
  assert.equal(result.presumptiveTaxApplied, true);
  // 1% of 30M = 300k
  assert.equal(result.totalTaxNaira, 300000);
});

test("calculates tax from categorized bank statement transactions", () => {
  const result = calculateTaxFromTransactions({
    transactions: [
      { amountNaira: 3400000, direction: "credit", category: "income" },
      { amountNaira: 400000, direction: "debit", category: "business_expense" },
      { amountNaira: 100000, direction: "credit", category: "tax_exempt" },
      { amountNaira: 50000, direction: "debit", category: "transfer" },
    ],
  });

  // Gross assessable income: 3.4M credits - 400k expenses = 3.0M
  assert.equal(result.totalIncomeNaira, 3000000);
  assert.equal(result.deductibleBusinessExpensesNaira, 400000);
  assert.equal(result.ignoredTransactionsNaira, 150000);
  assert.equal(result.chargeableIncomeNaira, 3000000);
  // Tax on 3.0M:
  // First 800k @ 0% = 0.
  // Next 2.2M @ 15% = 330k.
  // Total tax = 330,000.
  assert.equal(result.totalTaxNaira, 330000);
});

