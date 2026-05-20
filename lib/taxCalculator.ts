export type IncomeType = "salary" | "freelance" | "business";

export type TaxCalculationInput = {
  incomeType: IncomeType;
  annualIncomeNaira: number;
  sideIncomeNaira?: number;
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
  deductibleBusinessExpensesNaira: number;
  ignoredTransactionsNaira: number;
  individualExemptionNaira: number;
  smallBusinessExemptionApplied: boolean;
  taxableIncomeNaira: number;
  totalTaxNaira: number;
  effectiveRate: number;
  breakdown: TaxBandResult[];
  disclaimer: string;
};

export const INDIVIDUAL_EXEMPTION_NAIRA = 800000;
export const SMALL_BUSINESS_EXEMPTION_NAIRA = 100000000;

export const TAX_DISCLAIMER =
  "This is an estimate based on the 2026 Tax Act. For complex situations, consult a tax professional.";

const PIT_BANDS: Array<{ upTo: number | null; rate: number; label: string }> = [
  { upTo: 300000, rate: 0.07, label: "First ₦300,000" },
  { upTo: 300000, rate: 0.11, label: "Next ₦300,000" },
  { upTo: 500000, rate: 0.15, label: "Next ₦500,000" },
  { upTo: 500000, rate: 0.19, label: "Next ₦500,000" },
  { upTo: 1600000, rate: 0.21, label: "Next ₦1,600,000" },
  { upTo: null, rate: 0.24, label: "Above ₦3,200,000" },
];

const toSafeAmount = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
};

export const calculateTaxEstimate = (
  input: TaxCalculationInput
): TaxCalculationResult => {
  const annualIncomeNaira = toSafeAmount(input.annualIncomeNaira);
  const sideIncomeNaira = toSafeAmount(input.sideIncomeNaira ?? 0);
  const totalIncomeNaira = annualIncomeNaira + sideIncomeNaira;

  if (
    input.incomeType === "business" &&
    totalIncomeNaira < SMALL_BUSINESS_EXEMPTION_NAIRA
  ) {
    return {
      incomeType: input.incomeType,
      annualIncomeNaira,
      sideIncomeNaira,
      totalIncomeNaira,
      deductibleBusinessExpensesNaira: 0,
      ignoredTransactionsNaira: 0,
      individualExemptionNaira: 0,
      smallBusinessExemptionApplied: true,
      taxableIncomeNaira: 0,
      totalTaxNaira: 0,
      effectiveRate: 0,
      breakdown: [],
      disclaimer: TAX_DISCLAIMER,
    };
  }

  const taxableIncomeNaira = Math.max(
    totalIncomeNaira - INDIVIDUAL_EXEMPTION_NAIRA,
    0
  );

  let remaining = taxableIncomeNaira;
  let totalTaxNaira = 0;
  const breakdown: TaxBandResult[] = [];

  for (const band of PIT_BANDS) {
    if (remaining <= 0) break;
    const taxableAmount = band.upTo === null ? remaining : Math.min(remaining, band.upTo);
    const taxAmount = taxableAmount * band.rate;

    breakdown.push({
      label: band.label,
      rate: band.rate,
      taxableAmount,
      taxAmount,
    });

    totalTaxNaira += taxAmount;
    remaining -= taxableAmount;
  }

  return {
    incomeType: input.incomeType,
    annualIncomeNaira,
    sideIncomeNaira,
    totalIncomeNaira,
    deductibleBusinessExpensesNaira: 0,
    ignoredTransactionsNaira: 0,
    individualExemptionNaira: INDIVIDUAL_EXEMPTION_NAIRA,
    smallBusinessExemptionApplied: false,
    taxableIncomeNaira,
    totalTaxNaira,
    effectiveRate: totalIncomeNaira > 0 ? totalTaxNaira / totalIncomeNaira : 0,
    breakdown,
    disclaimer: TAX_DISCLAIMER,
  };
};

export const calculateTaxFromTransactions = (
  input: StatementTaxCalculationInput
): TaxCalculationResult => {
  const transactions = input.transactions ?? [];
  const grossIncomeNaira = transactions
    .filter((transaction) => transaction.direction === "credit" && transaction.category === "income")
    .reduce((sum, transaction) => sum + toSafeAmount(transaction.amountNaira), 0);
  const deductibleBusinessExpensesNaira = transactions
    .filter((transaction) => transaction.direction === "debit" && transaction.category === "business_expense")
    .reduce((sum, transaction) => sum + toSafeAmount(transaction.amountNaira), 0);
  const ignoredTransactionsNaira = transactions
    .filter((transaction) => transaction.category === "transfer" || transaction.category === "tax_exempt")
    .reduce((sum, transaction) => sum + toSafeAmount(transaction.amountNaira), 0);

  const netAssessableIncomeNaira = Math.max(
    grossIncomeNaira - deductibleBusinessExpensesNaira,
    0
  );

  const result = calculateTaxEstimate({
    incomeType: input.incomeType ?? "freelance",
    annualIncomeNaira: netAssessableIncomeNaira,
  });

  return {
    ...result,
    annualIncomeNaira: netAssessableIncomeNaira,
    totalIncomeNaira: netAssessableIncomeNaira,
    deductibleBusinessExpensesNaira,
    ignoredTransactionsNaira,
  };
};
