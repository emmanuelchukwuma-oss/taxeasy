export type TransactionCategory =
  | "income"
  | "business_expense"
  | "personal_expense"
  | "transfer"
  | "tax_exempt";

export type BankStatementTransaction = {
  id: string;
  date: string;
  description: string;
  amountNaira: number;
  direction: "credit" | "debit";
  category: TransactionCategory;
};

export type ParsedStatement = {
  bank: "GTBank" | "Demo Bank";
  accountName: string;
  accountNumberMasked: string;
  periodStart: string;
  periodEnd: string;
  source: "gtbank_pdf" | "sample_statement";
  transactions: BankStatementTransaction[];
};

type RawTransaction = Omit<BankStatementTransaction, "category">;

const CREDIT_INCOME_KEYWORDS = [
  "salary",
  "payroll",
  "freelance",
  "invoice",
  "client",
  "contract",
  "pos settlement",
  "sales",
  "business inflow",
];

const BUSINESS_EXPENSE_KEYWORDS = [
  "supplier",
  "inventory",
  "rent",
  "shop",
  "logistics",
  "ads",
  "advert",
  "internet",
  "software",
  "fuel",
];

const TRANSFER_KEYWORDS = [
  "self transfer",
  "transfer to savings",
  "own account",
  "wallet topup",
  "card funding",
];

const TAX_EXEMPT_KEYWORDS = [
  "refund",
  "reversal",
  "gift",
  "loan disbursement",
  "cashback",
];

const includesKeyword = (description: string, keywords: string[]) => {
  const normalized = description.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

export const categorizeTransaction = (
  transaction: RawTransaction
): TransactionCategory => {
  if (includesKeyword(transaction.description, TRANSFER_KEYWORDS)) return "transfer";
  if (includesKeyword(transaction.description, TAX_EXEMPT_KEYWORDS)) return "tax_exempt";

  if (transaction.direction === "credit") {
    if (includesKeyword(transaction.description, CREDIT_INCOME_KEYWORDS)) return "income";
    return "income";
  }

  if (includesKeyword(transaction.description, BUSINESS_EXPENSE_KEYWORDS)) {
    return "business_expense";
  }

  return "personal_expense";
};

export const GTBANK_SAMPLE_TRANSACTIONS: RawTransaction[] = [
  {
    id: "gtb-001",
    date: "2026-01-25",
    description: "SALARY PAYMENT - ALPHA TECH LTD",
    amountNaira: 620000,
    direction: "credit",
  },
  {
    id: "gtb-002",
    date: "2026-02-03",
    description: "FREELANCE INVOICE - DESIGN RETAINER",
    amountNaira: 280000,
    direction: "credit",
  },
  {
    id: "gtb-003",
    date: "2026-02-04",
    description: "SELF TRANSFER TO GTBANK SAVINGS",
    amountNaira: 150000,
    direction: "debit",
  },
  {
    id: "gtb-004",
    date: "2026-02-06",
    description: "INTERNET SUBSCRIPTION - SME OFFICE",
    amountNaira: 45000,
    direction: "debit",
  },
  {
    id: "gtb-005",
    date: "2026-02-11",
    description: "CLIENT PAYMENT - MOBILE APP CONTRACT",
    amountNaira: 450000,
    direction: "credit",
  },
  {
    id: "gtb-006",
    date: "2026-02-14",
    description: "RESTAURANT POS PURCHASE",
    amountNaira: 38500,
    direction: "debit",
  },
  {
    id: "gtb-007",
    date: "2026-02-18",
    description: "SUPPLIER PAYMENT - FABRIC INVENTORY",
    amountNaira: 210000,
    direction: "debit",
  },
  {
    id: "gtb-008",
    date: "2026-02-21",
    description: "REFUND REVERSAL - DUPLICATE POS CHARGE",
    amountNaira: 12000,
    direction: "credit",
  },
];

export const DEMO_BANK_SAMPLE_TRANSACTIONS: RawTransaction[] = [
  {
    id: "demo-001",
    date: "2026-03-01",
    description: "POS SETTLEMENT - BALOGUN SALES",
    amountNaira: 950000,
    direction: "credit",
  },
  {
    id: "demo-002",
    date: "2026-03-03",
    description: "SHOP RENT - LAGOS ISLAND",
    amountNaira: 180000,
    direction: "debit",
  },
  {
    id: "demo-003",
    date: "2026-03-08",
    description: "LOGISTICS RIDER PAYMENT",
    amountNaira: 35000,
    direction: "debit",
  },
  {
    id: "demo-004",
    date: "2026-03-12",
    description: "GIFT FROM FAMILY",
    amountNaira: 50000,
    direction: "credit",
  },
];

const withCategories = (
  transactions: RawTransaction[]
): BankStatementTransaction[] =>
  transactions.map((transaction) => ({
    ...transaction,
    category: categorizeTransaction(transaction),
  }));

export const buildSampleStatement = (
  bank: "GTBank" | "Demo Bank" = "GTBank"
): ParsedStatement => ({
  bank,
  accountName: bank === "GTBank" ? "Emeka Demo" : "Bisi Demo",
  accountNumberMasked: bank === "GTBank" ? "012****789" : "209****441",
  periodStart: bank === "GTBank" ? "2026-01-25" : "2026-03-01",
  periodEnd: bank === "GTBank" ? "2026-02-21" : "2026-03-12",
  source: bank === "GTBank" ? "gtbank_pdf" : "sample_statement",
  transactions: withCategories(
    bank === "GTBank" ? GTBANK_SAMPLE_TRANSACTIONS : DEMO_BANK_SAMPLE_TRANSACTIONS
  ),
});

export const parseGtbankPdfStatement = (fileName: string): ParsedStatement => {
  return {
    ...buildSampleStatement("GTBank"),
    accountName: "GTBank statement upload",
    source: "gtbank_pdf",
    transactions: withCategories(GTBANK_SAMPLE_TRANSACTIONS).map((transaction) => ({
      ...transaction,
      id: `${fileName.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "gtbank"}-${transaction.id}`,
    })),
  };
};

