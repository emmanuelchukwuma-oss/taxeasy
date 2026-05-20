"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Share2,
  Info,
  History,
  FileText,
  Home,
  PieChart,
  ChevronDown,
  UploadCloud,
  Wand2
} from "lucide-react";
import { calculateTaxEstimate, calculateTaxFromTransactions } from "@/lib/taxCalculator";
import { buildSampleStatement, parseGtbankPdfStatement } from "@/lib/bankStatement";
import { transparencyData } from "@/lib/transparencyData";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";

const DEMO_RECORDS = [
  {
    reference: "TXE-2026-FRLNC875",
    amountNaira: 87500,
    identity: "2***********9",
    identityType: "bvn",
    name: "Demo User",
    paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "success",
    tccRef: "TCC-2026-FRLNC875",
    method: "card",
  },
  {
    reference: "TXE-2026-MIXED340",
    amountNaira: 340000,
    identity: "2***********9",
    identityType: "bvn",
    name: "Demo User",
    paidAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    status: "success",
    tccRef: "TCC-2026-MIXED340",
    method: "bank_transfer",
  },
  {
    reference: "TXE-2026-SMALL125",
    amountNaira: 125000,
    identity: "2***********9",
    identityType: "bvn",
    name: "Demo User",
    paidAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
    status: "success",
    tccRef: "TCC-2026-SMALL125",
    method: "ussd",
  }
];

const TccDownloadButton = dynamic(() => import("@/components/TccPDF"), {
  ssr: false,
  loading: () => <div className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-700/50 text-white opacity-70">Loading PDF engine...</div>
});

const formatNaira = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  })
    .format(Number.isFinite(value) ? value : 0)
    .replace("NGN", "₦");

const SCREEN_TITLES = {
  welcome: "TaxEasy",
  phone: "Sign in",
  otp: "Verify phone",
  home: "Home",
  incomeType: "How you earn",
  incomeInput: "Income details",
  result: "Your estimate",
  identity: "Verify identity",
  paymentMethod: "Payment method",
  paymentProcessing: "Processing",
  paymentSuccess: "Payment successful",
  receipt: "Receipt",
  history: "History",
  tcc: "TCC Generation",
  transparency: "Transparency",
  statementUpload: "Upload statement",
  statementReview: "Review transactions",
};

const BOTTOM_NAV_HIDDEN_SCREENS = ["welcome", "phone", "otp", "paymentProcessing"];
const STATEMENT_FLOW_SCREENS = [
  "statementUpload",
  "statementReview",
  "incomeType",
  "incomeInput",
  "result",
  "identity",
  "paymentMethod",
  "paymentSuccess",
  "receipt",
  "tcc",
];

export default function TaxEasyMvp() {
  const [screenState, setScreenState] = useState("welcome");
  const [navStack, setNavStack] = useState([]);
  const [history, setHistory] = useState([]);

  const setScreen = (newScreen) => {
    if (newScreen === "welcome" || newScreen === "home" || newScreen === "incomeType") {
      setNavStack([]);
    } else {
      setNavStack((prev) => [...prev, screenState]);
    }
    setScreenState(newScreen);
  };
  const screen = screenState;
  const showBottomNav = !BOTTOM_NAV_HIDDEN_SCREENS.includes(screen);
  const activeBottomTab = (() => {
    if (screen === "home") return "home";
    if (screen === "history") return "history";
    if (screen === "transparency") return "transparency";
    if (STATEMENT_FLOW_SCREENS.includes(screen)) return "statement";
    return "home";
  })();
  const goToMainTab = (newScreen) => {
    setNavStack([]);
    setScreenState(newScreen);
  };

  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("demo") === "true") {
          setDemoMode(true);
          setPhone("0801 234 5678");
          setHistory(DEMO_RECORDS);
          setParsedStatement(buildSampleStatement("GTBank"));
          setScreenState("home");
          return;
        }
      }

      const savedPhone = localStorage.getItem("taxeasy_phone");
      if (savedPhone) setPhone(savedPhone);
      const savedHistory = localStorage.getItem("taxeasy_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.error("Failed to load state", e);
    }
  }, []);

  const saveToHistory = (record) => {
    const newHistory = [record, ...history];
    setHistory(newHistory);
    if (!demoMode) {
      try {
        localStorage.setItem("taxeasy_history", JSON.stringify(newHistory));
      } catch (e) {}
    }
  };

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [transparencyStateIdx, setTransparencyStateIdx] = useState(0);

  const [incomeType, setIncomeType] = useState("salary");
  const [annualIncomeInput, setAnnualIncomeInput] = useState("");
  const [sideIncomeEnabled, setSideIncomeEnabled] = useState(false);
  const [sideIncomeInput, setSideIncomeInput] = useState("");
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [calculation, setCalculation] = useState(null);
  const [statementBank, setStatementBank] = useState("GTBank");
  const [statementFileName, setStatementFileName] = useState("");
  const [parsedStatement, setParsedStatement] = useState(null);
  const [statementParseLoading, setStatementParseLoading] = useState(false);
  const [statementError, setStatementError] = useState("");

  const [identityType, setIdentityType] = useState("bvn");
  const [identityNumber, setIdentityNumber] = useState("");
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentRecord, setPaymentRecord] = useState(null);

  const canContinuePhone = phone.trim().length >= 11;
  const canVerifyOtp = otp.trim().length === 6;

  const toNumberInput = (raw) => raw.replace(/[^\d]/g, "");
  const toCurrencyInput = (raw) => {
    const numericValue = raw.replace(/[^\d]/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue, 10).toLocaleString("en-US");
  };

  const handleSendOtp = () => {
    if (!canContinuePhone) return;
    setAuthError("");
    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      setScreen("otp");
    }, 900);
  };

  const handleVerifyOtp = () => {
    if (!canVerifyOtp) return;
    setAuthError("");
    setAuthLoading(true);
    setTimeout(() => {
      if (otp.trim() !== "123456") {
        setAuthLoading(false);
        setAuthError("Invalid code. Try 123456.");
        return;
      }
      setAuthLoading(false);
      try {
        localStorage.setItem("taxeasy_phone", phone);
      } catch (e) {}
      setScreen("home");
    }, 800);
  };

  const handleCalculate = () => {
    setCalcError("");
    const annualIncomeNaira = Number(annualIncomeInput.replaceAll(",", ""));
    const sideIncomeNaira = sideIncomeEnabled
      ? Number(sideIncomeInput.replaceAll(",", ""))
      : 0;

    if (!Number.isFinite(annualIncomeNaira) || annualIncomeNaira <= 0) {
      setCalcError("Enter a valid yearly income amount.");
      return;
    }

    if (!Number.isFinite(sideIncomeNaira) || sideIncomeNaira < 0) {
      setCalcError("Enter a valid side income amount.");
      return;
    }

    setCalcLoading(true);
    setTimeout(() => {
      const result = calculateTaxEstimate({
        incomeType,
        annualIncomeNaira,
        sideIncomeNaira,
      });
      setCalculation(result);
      setCalcLoading(false);
      setScreen("result");
    }, 900);
  };

  const handleStatementFile = (file) => {
    if (!file) return;
    setStatementError("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatementError("Upload a PDF bank statement for this MVP demo.");
      return;
    }

    setStatementFileName(file.name);
    setStatementParseLoading(true);
    setTimeout(() => {
      const parsed =
        statementBank === "GTBank"
          ? parseGtbankPdfStatement(file.name)
          : buildSampleStatement("Demo Bank");
      setParsedStatement(parsed);
      setStatementParseLoading(false);
      setScreen("statementReview");
    }, 900);
  };

  const loadDemoStatement = () => {
    setStatementError("");
    setStatementFileName(statementBank === "GTBank" ? "gtbank-demo-statement.pdf" : "sample-bank-statement.pdf");
    setStatementParseLoading(true);
    setTimeout(() => {
      setParsedStatement(
        statementBank === "GTBank"
          ? buildSampleStatement("GTBank")
          : buildSampleStatement("Demo Bank")
      );
      setStatementParseLoading(false);
      setScreen("statementReview");
    }, 600);
  };

  const updateTransactionCategory = (transactionId, category) => {
    setParsedStatement((current) => {
      if (!current) return current;
      return {
        ...current,
        transactions: current.transactions.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, category } : transaction
        ),
      };
    });
  };

  const statementTotals = (transactions = []) => {
    const grossIncome = transactions
      .filter((transaction) => transaction.direction === "credit" && transaction.category === "income")
      .reduce((sum, transaction) => sum + transaction.amountNaira, 0);
    const businessExpenses = transactions
      .filter((transaction) => transaction.direction === "debit" && transaction.category === "business_expense")
      .reduce((sum, transaction) => sum + transaction.amountNaira, 0);
    const ignored = transactions
      .filter((transaction) => transaction.category === "transfer" || transaction.category === "tax_exempt")
      .reduce((sum, transaction) => sum + transaction.amountNaira, 0);
    return { grossIncome, businessExpenses, ignored };
  };

  const handleCalculateFromStatement = () => {
    if (!parsedStatement || parsedStatement.transactions.length === 0) {
      setStatementError("Upload or load a statement before calculating tax.");
      return;
    }
    setCalcLoading(true);
    setTimeout(() => {
      const result = calculateTaxFromTransactions({
        incomeType: parsedStatement.bank === "Demo Bank" ? "business" : "freelance",
        transactions: parsedStatement.transactions,
      });
      setCalculation(result);
      setCalcLoading(false);
      setScreen("result");
    }, 700);
  };

  const handleVerifyIdentity = () => {
    const minLen = 11; // Both BVN and NIN are 11 digits
    if (identityNumber.trim().length < minLen) {
      setIdentityError(identityType === "bvn" ? "Enter a valid 11-digit BVN." : "Enter a valid NIN.");
      return;
    }
    setIdentityError("");
    setIdentityLoading(true);
    setTimeout(() => {
      setIdentityLoading(false);
      setScreen("paymentMethod");
    }, 900);
  };

  const handlePay = () => {
    if (!calculation) return;
    setPaymentLoading(true);
    setScreen("paymentProcessing");
    setTimeout(() => {
      const now = new Date();
      const reference = `TXE-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const record = {
        reference,
        amountNaira: calculation.totalTaxNaira,
        method: paymentMethod,
        paidAt: now.toISOString(),
        statementSource: parsedStatement?.bank || "Manual estimate",
        identity: maskedIdentity(),
        identityType,
      };
      setPaymentRecord(record);
      saveToHistory(record);
      setPaymentLoading(false);
      setScreen("paymentSuccess");
    }, 2000);
  };

  const paymentMethodLabel = (value) => {
    if (value === "card") return "Card";
    if (value === "bank_transfer") return "Bank transfer";
    return "USSD";
  };

  const maskedIdentity = () => {
    if (!identityNumber) return "";
    const last4 = identityNumber.slice(-4);
    return `•••••••${last4}`;
  };

  const resetCalculation = () => {
    setCalculation(null);
    setAnnualIncomeInput("");
    setSideIncomeInput("");
    setSideIncomeEnabled(false);
    setCalcError("");
    setStatementFileName("");
    setParsedStatement(null);
    setStatementError("");
    setScreen("statementUpload");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-[#fcfffd] to-[#ecfdf5] text-slate-900 relative">
      <div className={`mx-auto w-full max-w-md px-4 pt-6 ${showBottomNav ? "pb-32" : "pb-8"}`}>
        <header className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (navStack.length > 0) {
                const prev = navStack[navStack.length - 1];
                setNavStack((stack) => stack.slice(0, -1));
                setScreenState(prev);
              }
            }}
            className="h-11 w-11 flex items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-900 disabled:opacity-0"
            disabled={navStack.length === 0}
          >
            <ArrowLeft className="mx-auto h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-emerald-900">{SCREEN_TITLES[screen]}</p>
          {demoMode ? (
            <div className="flex h-11 items-center justify-center rounded-full bg-amber-100 px-3 text-[10px] font-bold tracking-wider text-amber-800">
              DEMO
            </div>
          ) : (
            <div className="h-11 w-11" />
          )}
        </header>

        {screen === "welcome" && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              TaxEasy MVP
            </div>
            <h1 className="text-3xl font-bold leading-tight text-[#064e3b]">Pay your tax in under 90 seconds</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Upload your bank statement. Review the categories. Pay when ready and get instant proof.
            </p>
            <button
              type="button"
              onClick={() => setScreen("phone")}
              className="mt-6 h-12 w-full rounded-2xl bg-[#064e3b] text-base font-semibold text-white"
            >
              Continue
            </button>
          </section>
        )}

        {screen === "phone" && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#064e3b]">Enter your phone number</h2>
            <p className="mt-2 text-sm text-slate-600">We&apos;ll send a one-time code to sign you in.</p>
            <label className="mt-5 block text-sm font-medium text-slate-700">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(toNumberInput(e.target.value))}
              placeholder="08012345678"
              className="mt-2 h-12 w-full rounded-2xl border border-emerald-200 px-4 text-base outline-none ring-emerald-600 focus:ring-2"
            />
            {authError ? <p className="mt-3 text-sm text-rose-600">{authError}</p> : null}
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={!canContinuePhone || authLoading}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-[#064e3b] text-base font-semibold text-white disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send code"}
            </button>
          </section>
        )}

        {screen === "otp" && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#064e3b]">Verify your phone</h2>
            <p className="mt-2 text-sm text-slate-600">Enter 6-digit code sent to {phone}.</p>
            <label className="mt-5 block text-sm font-medium text-slate-700">OTP code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(toNumberInput(e.target.value).slice(0, 6))}
              placeholder="123456"
              className="mt-2 h-12 w-full rounded-2xl border border-emerald-200 px-4 text-base tracking-[0.3em] outline-none ring-emerald-600 focus:ring-2"
            />
            {authError ? <p className="mt-3 text-sm text-rose-600">{authError}</p> : null}
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={!canVerifyOtp || authLoading}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-[#064e3b] text-base font-semibold text-white disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify and continue"}
            </button>
          </section>
        )}

        {screen === "home" && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#064e3b]">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-600">Upload your bank statement, review the categories, then pay with proof.</p>
              <button
                type="button"
                onClick={() => setScreen("statementUpload")}
                className="mt-5 h-12 w-full rounded-2xl bg-[#064e3b] text-base font-semibold text-white"
              >
                Upload statement
              </button>
              <button
                type="button"
                onClick={() => setScreen("history")}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                <History className="h-5 w-5" />
                View History
              </button>
            </div>
            
            <div className="mb-6 rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-emerald-400" />
                <h3 className="font-semibold">Where your tax goes</h3>
              </div>
              <p className="mb-4 text-sm text-slate-300">See how government spends tax revenue in your state.</p>
              <button
                type="button"
                onClick={() => setScreen("transparency")}
                className="w-full rounded-xl bg-slate-800 py-3 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
              >
                View budget breakdown
              </button>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                <p className="text-sm text-emerald-900">Estimate first. Identity details are only required when you choose to pay.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDemoMode(false);
                setPhone("");
                setHistory([]);
                setNavStack([]);
                setScreenState("welcome");
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('demo');
                  window.history.replaceState({}, '', url);
                }
              }}
              className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 mt-8"
            >
              Sign out
            </button>
          </section>
        )}

        {screen === "statementUpload" && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                <UploadCloud className="h-4 w-4" />
                Bank statement MVP
              </div>
              <h2 className="text-xl font-semibold text-[#064e3b]">Upload your bank statement</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                TaxEasy parses GTBank PDFs in this MVP. Other banks use a seeded sample so the demo still shows the same review flow.
              </p>

              <label className="mt-5 block text-sm font-medium text-slate-700">Statement bank</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {["GTBank", "Other bank"].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setStatementBank(bank)}
                    className={`h-11 rounded-2xl border text-sm font-semibold ${
                      statementBank === bank
                        ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>

              <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center">
                <UploadCloud className="h-9 w-9 text-emerald-700" />
                <span className="mt-3 text-sm font-semibold text-emerald-950">
                  {statementFileName || "Choose PDF statement"}
                </span>
                <span className="mt-1 text-xs text-emerald-800">PDF only, demo parser runs locally</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => handleStatementFile(event.target.files?.[0])}
                  className="sr-only"
                />
              </label>

              {statementError ? <p className="mt-3 text-sm text-rose-600">{statementError}</p> : null}

              <button
                type="button"
                onClick={loadDemoStatement}
                disabled={statementParseLoading}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white text-base font-semibold text-emerald-900 disabled:opacity-50"
              >
                {statementParseLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                Use sample statement
              </button>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-900">
                Scope control: OCR, SMS reading, multi-bank auto-detection, and ML categorization are documented as V2 items.
              </p>
            </div>
          </section>
        )}

        {screen === "statementReview" && parsedStatement && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{parsedStatement.bank} statement</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#064e3b]">Review auto-categories</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {parsedStatement.transactions.length} txns
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Confirm or correct each category before TaxEasy computes your tax.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                {(() => {
                  const totals = statementTotals(parsedStatement.transactions);
                  return (
                    <>
                      <div>
                        <p className="text-slate-500">Income detected</p>
                        <p className="font-bold text-slate-900">{formatNaira(totals.grossIncome)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Expenses</p>
                        <p className="font-bold text-slate-900">{formatNaira(totals.businessExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Ignored</p>
                        <p className="font-bold text-slate-900">{formatNaira(totals.ignored)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Net assessable</p>
                        <p className="font-bold text-[#064e3b]">{formatNaira(Math.max(totals.grossIncome - totals.businessExpenses, 0))}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-3">
              {parsedStatement.transactions.map((transaction) => (
                <div key={transaction.id} className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{transaction.description}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(transaction.date).toLocaleDateString("en-NG")}</p>
                    </div>
                    <p className={`whitespace-nowrap text-sm font-bold ${transaction.direction === "credit" ? "text-emerald-700" : "text-slate-800"}`}>
                      {transaction.direction === "credit" ? "+" : "-"}{formatNaira(transaction.amountNaira)}
                    </p>
                  </div>
                  <select
                    value={transaction.category}
                    onChange={(event) => updateTransactionCategory(transaction.id, event.target.value)}
                    className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="income">Income</option>
                    <option value="business_expense">Business expense</option>
                    <option value="personal_expense">Personal expense</option>
                    <option value="transfer">Transfer - ignore</option>
                    <option value="tax_exempt">Tax-exempt</option>
                  </select>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCalculateFromStatement}
              disabled={calcLoading}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#064e3b] text-base font-semibold text-white disabled:opacity-50"
            >
              {calcLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Calculate from reviewed statement"}
            </button>
          </section>
        )}

        {screen === "incomeType" && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#064e3b]">How do you earn money?</h2>
            <div className="mt-4 space-y-3">
              {[
                { value: "salary", label: "Paid employee (salary)" },
                { value: "freelance", label: "Freelancer / gig worker" },
                { value: "business", label: "Small business owner" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setIncomeType(item.value)}
                  className={`w-full rounded-2xl border p-4 text-left text-sm font-medium ${
                    incomeType === item.value
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setScreen("incomeInput")}
              className="mt-6 h-12 w-full rounded-2xl bg-[#064e3b] text-base font-semibold text-white"
            >
              Continue
            </button>
          </section>
        )}

        {screen === "incomeInput" && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#064e3b]">Enter yearly income</h2>
            <p className="mt-2 text-sm text-slate-600">Use your best estimate in naira.</p>

            <label className="mt-5 block text-sm font-medium text-slate-700">Main income (annual)</label>
            <div className="mt-2 relative">
              <span className="absolute left-4 top-3 text-slate-500">₦</span>
              <input
                inputMode="numeric"
                value={annualIncomeInput}
                onChange={(e) => setAnnualIncomeInput(toCurrencyInput(e.target.value))}
                placeholder="1,200,000"
                aria-label="Main annual income"
                className="h-12 w-full rounded-2xl border border-emerald-200 pl-8 pr-4 text-base outline-none ring-emerald-600 focus:ring-2"
              />
            </div>

            <button
              type="button"
              onClick={() => setSideIncomeEnabled((v) => !v)}
              className="mt-4 flex h-11 w-full items-center justify-between rounded-2xl border border-slate-200 px-4 text-sm font-medium"
            >
              <span>I have side income</span>
              <span className={sideIncomeEnabled ? "text-emerald-700" : "text-slate-500"}>
                {sideIncomeEnabled ? "Yes" : "No"}
              </span>
            </button>

            {sideIncomeEnabled && (
              <>
                <label className="mt-4 block text-sm font-medium text-slate-700">Side income (annual)</label>
                <div className="mt-2 relative">
                  <span className="absolute left-4 top-3 text-slate-500">₦</span>
                  <input
                    inputMode="numeric"
                    value={sideIncomeInput}
                    onChange={(e) => setSideIncomeInput(toCurrencyInput(e.target.value))}
                    placeholder="300,000"
                    aria-label="Side annual income"
                    className="h-12 w-full rounded-2xl border border-emerald-200 pl-8 pr-4 text-base outline-none ring-emerald-600 focus:ring-2"
                  />
                </div>
              </>
            )}

            {calcError ? <p className="mt-3 text-sm text-rose-600">{calcError}</p> : null}

            <button
              type="button"
              onClick={handleCalculate}
              disabled={calcLoading}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-[#064e3b] text-base font-semibold text-white disabled:opacity-50"
            >
              {calcLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Calculate what I owe"}
            </button>
          </section>
        )}

        {screen === "result" && calculation && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Estimated tax</p>
              <h2 className="mt-1 text-3xl font-bold text-[#064e3b]">{formatNaira(calculation.totalTaxNaira)}</h2>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {parsedStatement ? (
                  <>
                    <p>Statement source: {parsedStatement.bank}</p>
                    <p className="mt-1">Deductible expenses: {formatNaira(calculation.deductibleBusinessExpensesNaira)}</p>
                    <p className="mt-1">Transfers/exempt ignored: {formatNaira(calculation.ignoredTransactionsNaira)}</p>
                  </>
                ) : null}
                <p className={parsedStatement ? "mt-1" : ""}>Total income: {formatNaira(calculation.totalIncomeNaira)}</p>
                <p className="mt-1">Taxable income: {formatNaira(calculation.taxableIncomeNaira)}</p>
                {calculation.smallBusinessExemptionApplied ? (
                  <p className="mt-1 font-medium text-emerald-700">Small business exemption applied (under ₦100M)</p>
                ) : null}
              </div>

              {!calculation.smallBusinessExemptionApplied && calculation.breakdown.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {calculation.breakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">{formatNaira(item.taxAmount)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                <p className="text-sm text-emerald-900">{calculation.disclaimer}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIdentityError("");
                setScreen("identity");
              }}
              className="h-12 w-full rounded-2xl bg-[#064e3b] text-base font-semibold text-white"
            >
              Proceed to payment
            </button>
            <button
              type="button"
              onClick={resetCalculation}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-700"
            >
              Recalculate
            </button>
          </section>
        )}

        {screen === "identity" && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#064e3b]">Verify identity to continue</h2>
              <p className="mt-2 text-sm text-slate-600">Why we need this: BVN/NIN links your payment to your official tax record so you can get a verifiable TCC.</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIdentityType("bvn");
                    setIdentityError("");
                  }}
                  className={`h-11 rounded-2xl border text-sm font-semibold ${
                    identityType === "bvn"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  BVN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentityType("nin");
                    setIdentityError("");
                  }}
                  className={`h-11 rounded-2xl border text-sm font-semibold ${
                    identityType === "nin"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  NIN
                </button>
              </div>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                {identityType === "bvn" ? "BVN number" : "NIN number"}
              </label>
              <input
                value={identityNumber}
                onChange={(e) => setIdentityNumber(toNumberInput(e.target.value))}
                placeholder={identityType === "bvn" ? "Enter 11-digit BVN" : "Enter NIN"}
                className="mt-2 h-12 w-full rounded-2xl border border-emerald-200 px-4 text-base outline-none ring-emerald-600 focus:ring-2"
              />
              {identityError ? <p className="mt-3 text-sm text-rose-600">{identityError}</p> : null}

              <button
                type="button"
                onClick={handleVerifyIdentity}
                disabled={identityLoading}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-[#064e3b] text-base font-semibold text-white disabled:opacity-50"
              >
                {identityLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify and continue"}
              </button>
            </div>
          </section>
        )}

        {screen === "paymentMethod" && calculation && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#064e3b]">Choose payment method</h2>
              <p className="mt-2 text-sm text-slate-600">Amount to pay: {formatNaira(calculation.totalTaxNaira)}</p>

              <div className="mt-4 space-y-3">
                {[
                  { id: "card", label: "Card", icon: CreditCard },
                  { id: "bank_transfer", label: "Bank transfer", icon: Landmark },
                  { id: "ussd", label: "USSD", icon: Smartphone },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-semibold ${
                        paymentMethod === method.id
                          ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </span>
                      <span>{paymentMethod === method.id ? "Selected" : ""}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handlePay}
                disabled={paymentLoading}
                className="mt-6 h-12 w-full rounded-2xl bg-[#064e3b] text-base font-semibold text-white disabled:opacity-50"
              >
                Pay {formatNaira(calculation.totalTaxNaira)}
              </button>
            </div>
          </section>
        )}

        {screen === "paymentProcessing" && calculation && (
          <section className="rounded-3xl bg-white p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
            </div>
            <h2 className="text-xl font-semibold text-[#064e3b]">Processing payment</h2>
            <p className="mt-2 text-sm text-slate-600">Please wait while we confirm your payment of {formatNaira(calculation.totalTaxNaira)}.</p>
            <p className="mt-4 text-xs text-slate-500">Do not close this screen.</p>
          </section>
        )}

        {screen === "paymentSuccess" && paymentRecord && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
                <p className="text-base font-semibold">Payment successful</p>
              </div>
              <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <p>Amount: {formatNaira(paymentRecord.amountNaira)}</p>
                <p>Method: {paymentMethodLabel(paymentRecord.method)}</p>
                <p>Reference: {paymentRecord.reference}</p>
                <p>Date: {new Date(paymentRecord.paidAt).toLocaleString("en-NG")}</p>
                <p>{identityType.toUpperCase()}: {maskedIdentity()}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScreen("receipt")}
              className="h-12 w-full rounded-2xl bg-[#064e3b] text-base font-semibold text-white"
            >
              View receipt
            </button>
            <button
              type="button"
              onClick={() => setScreen("home")}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-700"
            >
              Back to home
            </button>
          </section>
        )}

        {screen === "receipt" && paymentRecord && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#064e3b]">
                  <ReceiptText className="h-6 w-6" />
                  <h2 className="text-xl font-semibold">Tax payment receipt</h2>
                </div>
                <button 
                  onClick={async () => {
                    const shareText = `Tax Payment Receipt\nRef: ${paymentRecord.reference}\nAmount: ${formatNaira(paymentRecord.amountNaira)}\nIdentity: ${identityType.toUpperCase()} ${maskedIdentity()}`;
                    if (navigator.share) {
                      try { await navigator.share({ title: 'Tax Payment Receipt', text: shareText }); } catch (err) {}
                    } else {
                      alert("Sharing not supported on this device. You can screenshot this receipt.");
                    }
                  }} 
                  className="p-2 text-slate-500 hover:text-[#064e3b]" 
                  aria-label="Share receipt"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6 flex flex-col items-center justify-center space-y-2 rounded-2xl bg-slate-50 p-6">
                <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100">
                  <QRCodeSVG 
                    value={JSON.stringify({ 
                      ref: paymentRecord.reference, 
                      amt: paymentRecord.amountNaira, 
                      date: paymentRecord.paidAt, 
                      id: `${identityType.toUpperCase()}:${maskedIdentity()}` 
                    })} 
                    size={140} 
                  />
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <Info className="h-4 w-4" />
                  <span>Scan to verify payment authenticity</span>
                </div>
              </div>
              <div className="space-y-2 rounded-2xl border border-slate-100 p-4 text-sm text-slate-700">
                <p>Receipt No: RCP-{paymentRecord.reference}</p>
                <p>Reference: {paymentRecord.reference}</p>
                <p>Amount paid: {formatNaira(paymentRecord.amountNaira)}</p>
                <p>Payment method: {paymentMethodLabel(paymentRecord.method)}</p>
                <p>Payment date: {new Date(paymentRecord.paidAt).toLocaleString("en-NG")}</p>
                <p>Identity: {identityType.toUpperCase()} {maskedIdentity()}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setScreen("transparency")}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <PieChart className="h-4 w-4" />
                  Impact
                </button>
                <button
                  type="button"
                  onClick={() => setScreen("tcc")}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <FileText className="h-4 w-4" />
                  Get TCC
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScreen("home")}
              className="h-12 w-full rounded-2xl bg-[#064e3b] text-base font-semibold text-white"
            >
              Done
            </button>
          </section>
        )}

        {screen === "tcc" && paymentRecord && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-[#064e3b]">
                <ShieldCheck className="h-6 w-6" />
                <h2 className="text-xl font-semibold">Tax Clearance</h2>
              </div>
              <p className="mb-6 text-sm text-slate-600">
                Your Tax Clearance Certificate (TCC) is ready. You can download the official PDF below.
              </p>
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-sm font-medium text-slate-500">TCC No</span>
                  <span className="text-sm font-bold text-slate-800">TCC-{new Date(paymentRecord.paidAt).getFullYear()}-{paymentRecord.reference.split("-")[2] || paymentRecord.reference.substring(0,6)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-sm font-medium text-slate-500">Identity</span>
                  <span className="text-sm font-bold text-slate-800">{identityType.toUpperCase()} {maskedIdentity()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-500">Status</span>
                  <span className="text-sm font-bold text-emerald-600">Cleared</span>
                </div>
              </div>
              <TccDownloadButton record={paymentRecord} identityType={identityType} maskedIdentity={maskedIdentity()} />
              <button
                type="button"
                onClick={() => setScreen("transparency")}
                className="mt-6 flex w-full items-center justify-center gap-1 text-sm text-emerald-700 hover:underline"
              >
                <PieChart className="h-4 w-4" />
                Where does this money go?
              </button>
            </div>
            <button
              type="button"
              onClick={() => setScreen("home")}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-700"
            >
              Back to home
            </button>
          </section>
        )}

        {screen === "history" && (
          <section className="space-y-4">
            <h2 className="mb-2 text-xl font-semibold text-[#064e3b]">Payment History</h2>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-50">
                <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-400">
                  <History className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">No history yet</h3>
                <p className="text-sm text-slate-500">Your past tax payments and certificates will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.reference} className="rounded-3xl bg-white p-5 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{formatNaira(record.amountNaira)}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Paid</span>
                    </div>
                    <p className="mb-4 text-xs text-slate-500">{new Date(record.paidAt).toLocaleString("en-NG")}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPaymentRecord(record);
                          setScreen("receipt");
                        }}
                        className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Receipt
                      </button>
                      <button
                        onClick={() => {
                          setPaymentRecord(record);
                          setScreen("tcc");
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-50 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                      >
                        <FileText className="h-4 w-4" />
                        TCC
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setScreen("home")}
              className="mt-6 h-12 w-full rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-700"
            >
              Back to home
            </button>
          </section>
        )}

        {screen === "transparency" && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-[#064e3b]">
                <PieChart className="h-6 w-6" />
                <h2 className="text-xl font-semibold">Where Your Tax Goes</h2>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                See how government spends tax revenue in your state.
              </p>
              <p className="mb-6 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs italic text-amber-800">
                Sample data based on 2024 federal and state budget reports. For illustration purposes.
              </p>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Select State</label>
                  <div className="relative">
                    <select
                      value={transparencyStateIdx}
                      onChange={(e) => setTransparencyStateIdx(Number(e.target.value))}
                      className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-base font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {transparencyData.map((data, idx) => (
                        <option key={data.state} value={idx}>{data.state} State</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#064e3b] p-5 text-white shadow-sm">
                  <p className="text-sm font-medium text-emerald-200">{transparencyData[transparencyStateIdx].year} Total Budget</p>
                  <p className="text-2xl font-bold tracking-tight">₦{(transparencyData[transparencyStateIdx].totalBudget / 1000000000).toLocaleString()} Billion</p>
                </div>
              </div>

              <h3 className="mb-4 text-lg font-semibold text-slate-800">Top Spending Categories</h3>
              <div className="mb-8 space-y-5">
                {transparencyData[transparencyStateIdx].categories.map((cat, i) => {
                  const percentage = ((cat.amount / transparencyData[transparencyStateIdx].totalBudget) * 100).toFixed(1);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium text-slate-900">
                        <span>{cat.name}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">{cat.description}</p>
                      <p className="text-xs font-semibold text-slate-700">₦{(cat.amount / 1000000000).toLocaleString()} Billion</p>
                    </div>
                  );
                })}
              </div>

              <h3 className="mb-4 text-lg font-semibold text-slate-800">LGA Drill-Down</h3>
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                {transparencyData[transparencyStateIdx].lgas.length > 0 ? (
                  transparencyData[transparencyStateIdx].lgas.map((lga, i) => (
                    <div key={i} className="flex flex-col border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-800">{lga.name}</span>
                        <span className="text-sm font-semibold text-[#064e3b]">₦{(lga.allocation / 1000000000).toLocaleString()}B</span>
                      </div>
                      <span className="text-xs text-slate-500">Focus: {lga.focus}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm italic text-slate-500">Detailed LGA data coming soon.</p>
                )}
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                <p className="mb-3 text-xs text-slate-500">Updated quarterly from public budget documents.</p>
                <button type="button" className="text-sm font-medium text-emerald-700 hover:underline">
                  Have feedback? Send to your representative
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
      {showBottomNav && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-100 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto grid w-full max-w-md grid-cols-4 gap-1">
            {[
              { id: "home", label: "Home", icon: Home, screen: "home" },
              { id: "statement", label: "Statement", icon: UploadCloud, screen: "statementUpload" },
              { id: "history", label: "History", icon: History, screen: "history" },
              { id: "transparency", label: "Trust", icon: PieChart, screen: "transparency" },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeBottomTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToMainTab(item.screen)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-[#064e3b]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </main>
  );
}
