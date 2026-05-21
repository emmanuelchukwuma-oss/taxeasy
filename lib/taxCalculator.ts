// ─────────────────────────────────────────────────────────────────────────────
// TaxEasy — Tax Calculation Engine
// Compliant with the Nigeria Tax Act 2025 (effective 1 January 2026)
// ─────────────────────────────────────────────────────────────────────────────

export type IncomeType = "salary" | "freelance" | "business" | "informal";

export type TaxCalculationInput = {
  incomeType: IncomeType;
  annualIncomeNaira: number;
  sideIncomeNaira?: number;
  // 2026 deductions (all optional — users may skip the deductions wizard)
  pensionNaira?: number;         // employee pension contribution (Pension Reform Act)
  nhfNaira?: number;             // National Housing Fund (2.5% of basic)
  nhisNaira?: number;            // National Health Insurance Scheme
  annualRentNaira?: number;      // annual rent paid — 20% relief, capped ₦500k
  lifeInsuranceNaira?: number;   // life insurance / deferred annuity premiums
};

export type StatementTransactionInput = {
  amountNaira: number;
  direction: "credit" | "debit";
  category:
    | "income"
    | "business_expense"
    | "personal_expense"
    | "transfer"
    | "tax_exempt";
};

export type StatementTaxCalculationInput = {
  incomeType?: IncomeType;
  transactions: StatementTransactionInput[];
  // deductions forwarded from wizard
  pensionNaira?: number;
  nhfNaira?: number;
  nhisNaira?: number;
  annualRentNaira?: number;
  lifeInsuranceNaira?: number;
};

export type TaxBandResult = {
  label: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
};

export type TaxCalculationResult = {
  incomeType: IncomeType;
  annualIncomeNaira: number;
  sideIncomeNaira: number;
  totalIncomeNaira: number;
  // deductions
  rentReliefNaira: number;
  pensionDeductionNaira: number;
  nhfDeductionNaira: number;
  nhisDeductionNaira: number;
  lifeInsuranceDeductionNaira: number;
  totalDeductionsNaira: number;
  // computation
  deductibleBusinessExpensesNaira: number;
  ignoredTransactionsNaira: number;
  chargeableIncomeNaira: number;   // income after all deductions (formerly "taxable")
  taxableIncomeNaira: number;      // alias for chargeableIncomeNaira (backwards compat)
  totalTaxNaira: number;
  serviceFeeNaira: number;
  totalAmountDueNaira: number;
  effectiveRate: number;
  breakdown: TaxBandResult[];
  // flags
  smallBusinessExemptionApplied: boolean;
  nanoBusinessExemptionApplied: boolean;   // informal ≤ ₦12M
  presumptiveTaxApplied: boolean;          // informal ₦12M–₦100M → 1%
  // meta
  disclaimer: string;
};

// ─── Constants (Nigeria Tax Act 2025) ────────────────────────────────────────

/** Small business (formal) CIT/CGT exemption threshold — ₦100M turnover */
export const SMALL_BUSINESS_EXEMPTION_NAIRA = 100_000_000;

/** Nano/informal business total exemption threshold — ₦12M turnover */
export const NANO_BUSINESS_EXEMPTION_NAIRA = 12_000_000;

/** Rent relief: 20% of annual rent, capped at this amount */
export const RENT_RELIEF_RATE = 0.20;
export const RENT_RELIEF_CAP_NAIRA = 500_000;

/** TaxEasy platform service fee */
export const SERVICE_FEE_RATE = 0.015;   // 1.5% of tax
export const SERVICE_FEE_CAP_NAIRA = 5_000;

export const TAX_DISCLAIMER =
  "This estimate is based on the Nigeria Tax Act 2025 (effective 1 January 2026). " +
  "For PAYE employees, your employer remits on your behalf. " +
  "Consult a certified tax professional for complex situations.";

// ─── 2026 Personal Income Tax Bands ──────────────────────────────────────────
// Applied to chargeable income (gross income minus eligible deductions).
// The first ₦800,000 is taxed at 0% — effectively the new tax-free threshold.

const PIT_BANDS: Array<{ upTo: number | null; rate: number; label: string }> = [
  { upTo: 800_000,    rate: 0.00, label: "First ₦800,000 (Tax-Free)" },
  { upTo: 2_200_000,  rate: 0.15, label: "Next ₦2,200,000 @ 15%" },
  { upTo: 9_000_000,  rate: 0.18, label: "Next ₦9,000,000 @ 18%" },
  { upTo: 13_000_000, rate: 0.21, label: "Next ₦13,000,000 @ 21%" },
  { upTo: 25_000_000, rate: 0.23, label: "Next ₦25,000,000 @ 23%" },
  { upTo: null,       rate: 0.25, label: "Above ₦50,000,000 @ 25%" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toSafeAmount = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value) || value < 0) return 0;
  return value;
};

const computeDeductions = (input: TaxCalculationInput) => {
  const rentReliefNaira = Math.min(
    toSafeAmount(input.annualRentNaira) * RENT_RELIEF_RATE,
    RENT_RELIEF_CAP_NAIRA
  );
  const pensionDeductionNaira     = toSafeAmount(input.pensionNaira);
  const nhfDeductionNaira         = toSafeAmount(input.nhfNaira);
  const nhisDeductionNaira        = toSafeAmount(input.nhisNaira);
  const lifeInsuranceDeductionNaira = toSafeAmount(input.lifeInsuranceNaira);
  const totalDeductionsNaira =
    rentReliefNaira +
    pensionDeductionNaira +
    nhfDeductionNaira +
    nhisDeductionNaira +
    lifeInsuranceDeductionNaira;

  return {
    rentReliefNaira,
    pensionDeductionNaira,
    nhfDeductionNaira,
    nhisDeductionNaira,
    lifeInsuranceDeductionNaira,
    totalDeductionsNaira,
  };
};

const applyPitBands = (chargeableIncome: number): { breakdown: TaxBandResult[]; totalTaxNaira: number } => {
  let remaining = chargeableIncome;
  let totalTaxNaira = 0;
  const breakdown: TaxBandResult[] = [];

  for (const band of PIT_BANDS) {
    if (remaining <= 0) break;
    const taxableAmount = band.upTo === null ? remaining : Math.min(remaining, band.upTo);
    const taxAmount = taxableAmount * band.rate;
    if (taxableAmount > 0) {
      breakdown.push({ label: band.label, rate: band.rate, taxableAmount, taxAmount });
    }
    totalTaxNaira += taxAmount;
    remaining -= taxableAmount;
  }

  return { breakdown, totalTaxNaira };
};

const computeServiceFee = (taxNaira: number): number =>
  Math.min(Math.round(taxNaira * SERVICE_FEE_RATE), SERVICE_FEE_CAP_NAIRA);

// ─── Main Calculation ─────────────────────────────────────────────────────────

export const calculateTaxEstimate = (
  input: TaxCalculationInput
): TaxCalculationResult => {
  const annualIncomeNaira = toSafeAmount(input.annualIncomeNaira);
  const sideIncomeNaira   = toSafeAmount(input.sideIncomeNaira);
  const totalIncomeNaira  = annualIncomeNaira + sideIncomeNaira;

  const deductions = computeDeductions(input);

  // ── Informal / presumptive tax path ──────────────────────────────────────
  if (input.incomeType === "informal") {
    // Nano business (≤ ₦12M): fully exempt
    if (totalIncomeNaira <= NANO_BUSINESS_EXEMPTION_NAIRA) {
      return {
        incomeType: input.incomeType,
        annualIncomeNaira, sideIncomeNaira, totalIncomeNaira,
        ...deductions,
        deductibleBusinessExpensesNaira: 0, ignoredTransactionsNaira: 0,
        chargeableIncomeNaira: 0, taxableIncomeNaira: 0,
        totalTaxNaira: 0, serviceFeeNaira: 0, totalAmountDueNaira: 0,
        effectiveRate: 0, breakdown: [],
        smallBusinessExemptionApplied: false,
        nanoBusinessExemptionApplied: true,
        presumptiveTaxApplied: false,
        disclaimer: TAX_DISCLAIMER,
      };
    }

    // Informal business (₦12M–₦100M): presumptive 1% of turnover
    if (totalIncomeNaira <= SMALL_BUSINESS_EXEMPTION_NAIRA) {
      const totalTaxNaira = Math.round(totalIncomeNaira * 0.01);
      const serviceFeeNaira = computeServiceFee(totalTaxNaira);
      return {
        incomeType: input.incomeType,
        annualIncomeNaira, sideIncomeNaira, totalIncomeNaira,
        ...deductions,
        deductibleBusinessExpensesNaira: 0, ignoredTransactionsNaira: 0,
        chargeableIncomeNaira: totalIncomeNaira, taxableIncomeNaira: totalIncomeNaira,
        totalTaxNaira, serviceFeeNaira,
        totalAmountDueNaira: totalTaxNaira + serviceFeeNaira,
        effectiveRate: totalTaxNaira / totalIncomeNaira,
        breakdown: [{ label: "Presumptive tax (1% of turnover)", rate: 0.01, taxableAmount: totalIncomeNaira, taxAmount: totalTaxNaira }],
        smallBusinessExemptionApplied: false,
        nanoBusinessExemptionApplied: false,
        presumptiveTaxApplied: true,
        disclaimer: TAX_DISCLAIMER,
      };
    }
  }

  // ── Formal small business exemption (registered, ≤ ₦100M) ────────────────
  if (input.incomeType === "business" && totalIncomeNaira < SMALL_BUSINESS_EXEMPTION_NAIRA) {
    return {
      incomeType: input.incomeType,
      annualIncomeNaira, sideIncomeNaira, totalIncomeNaira,
      ...deductions,
      deductibleBusinessExpensesNaira: 0, ignoredTransactionsNaira: 0,
      chargeableIncomeNaira: 0, taxableIncomeNaira: 0,
      totalTaxNaira: 0, serviceFeeNaira: 0, totalAmountDueNaira: 0,
      effectiveRate: 0, breakdown: [],
      smallBusinessExemptionApplied: true,
      nanoBusinessExemptionApplied: false,
      presumptiveTaxApplied: false,
      disclaimer: TAX_DISCLAIMER,
    };
  }

  // ── Standard PIT path ────────────────────────────────────────────────────
  // Chargeable income = total income minus eligible deductions (min 0)
  const chargeableIncomeNaira = Math.max(totalIncomeNaira - deductions.totalDeductionsNaira, 0);

  const { breakdown, totalTaxNaira } = applyPitBands(chargeableIncomeNaira);
  const serviceFeeNaira = computeServiceFee(totalTaxNaira);

  return {
    incomeType: input.incomeType,
    annualIncomeNaira, sideIncomeNaira, totalIncomeNaira,
    ...deductions,
    deductibleBusinessExpensesNaira: 0,
    ignoredTransactionsNaira: 0,
    chargeableIncomeNaira,
    taxableIncomeNaira: chargeableIncomeNaira,
    totalTaxNaira,
    serviceFeeNaira,
    totalAmountDueNaira: totalTaxNaira + serviceFeeNaira,
    effectiveRate: totalIncomeNaira > 0 ? totalTaxNaira / totalIncomeNaira : 0,
    breakdown,
    smallBusinessExemptionApplied: false,
    nanoBusinessExemptionApplied: false,
    presumptiveTaxApplied: false,
    disclaimer: TAX_DISCLAIMER,
  };
};

// ─── Statement-Based Calculation ─────────────────────────────────────────────

export const calculateTaxFromTransactions = (
  input: StatementTaxCalculationInput
): TaxCalculationResult => {
  const transactions = input.transactions ?? [];

  const grossIncomeNaira = transactions
    .filter((t) => t.direction === "credit" && t.category === "income")
    .reduce((sum, t) => sum + toSafeAmount(t.amountNaira), 0);

  const deductibleBusinessExpensesNaira = transactions
    .filter((t) => t.direction === "debit" && t.category === "business_expense")
    .reduce((sum, t) => sum + toSafeAmount(t.amountNaira), 0);

  const ignoredTransactionsNaira = transactions
    .filter((t) => t.category === "transfer" || t.category === "tax_exempt")
    .reduce((sum, t) => sum + toSafeAmount(t.amountNaira), 0);

  const netAssessableIncomeNaira = Math.max(grossIncomeNaira - deductibleBusinessExpensesNaira, 0);

  const result = calculateTaxEstimate({
    incomeType: input.incomeType ?? "freelance",
    annualIncomeNaira: netAssessableIncomeNaira,
    pensionNaira: input.pensionNaira,
    nhfNaira: input.nhfNaira,
    nhisNaira: input.nhisNaira,
    annualRentNaira: input.annualRentNaira,
    lifeInsuranceNaira: input.lifeInsuranceNaira,
  });

  return {
    ...result,
    annualIncomeNaira: netAssessableIncomeNaira,
    totalIncomeNaira: netAssessableIncomeNaira,
    deductibleBusinessExpensesNaira,
    ignoredTransactionsNaira,
  };
};
