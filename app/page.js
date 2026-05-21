"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Wand2,
  ScanFace,
  UserCheck,
  Camera,
  Fingerprint,
  Plus,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Building2,
  DollarSign,
  ChevronRight,
  Mail,
  Printer,
  Calendar,
  Sparkles,
  MapPin,
  Lock,
  Award,
  Briefcase,
  Laptop,
  Store
} from "lucide-react";
import { calculateTaxEstimate, calculateTaxFromTransactions } from "@/lib/taxCalculator";
import { buildSampleStatement, parseGtbankPdfStatement } from "@/lib/bankStatement";
import { transparencyData } from "@/lib/transparencyData";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";

const TccDownloadButton = dynamic(() => import("@/components/TccPDF"), {
  ssr: false,
  loading: () => <div className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-700/50 text-white opacity-70">Loading PDF engine...</div>
});

// FaceEngine: browser-native FaceDetector API with video-stream fallback.
// No CDN, no WASM, no external dependencies.
const FaceEngineDynamic = dynamic(() => import("@/components/FaceEngine"), { ssr: false });

const formatNaira = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  })
    .format(Number.isFinite(value) ? value : 0)
    .replace("NGN", "₦");

// Defined outside component so setInterval closures never capture a stale copy
const PROCESSING_STEPS = [
  "Establishing secure connection to NIBSS API...",
  "Validating secure identity credentials...",
  "Processing monetary remittance...",
  "Confirming Federal Tax ID remittance...",
  "Generating verified Tax Clearance Certificate (TCC)...",
];

const SCREEN_TITLES = {
  welcome:          "TaxEasy",
  phone:            "Sign in",
  otp:              "Verify phone",
  bvnEntry:         "BVN Verification",
  faceVerification: "Face Scan",
  bvnSuccess:       "Identity Verified",
  home:             "Home Dashboard",
  incomeType:       "Income Source",
  incomeInput:      "Annual Income",
  deductionsWizard: "Deductions & Reliefs",
  result:           "Your Tax Estimate",
  paymentMethod:    "Payment Method",
  cardPayment:      "Card Payment",
  bankTransfer:     "Bank Transfer",
  ussdPayment:      "USSD Payment",
  paymentProcessing:"Processing Payment",
  paymentSuccess:   "Remittance Complete",
  receipt:          "Digital Receipt",
  history:          "Filing History",
  tcc:              "Tax Clearance Certificate",
  transparency:     "National Trust & Impact",
  statementUpload:  "Upload Bank Statement",
  statementReview:  "Verify Transactions",
};

const BOTTOM_NAV_HIDDEN_SCREENS = ["welcome", "phone", "otp", "bvnEntry", "faceVerification", "bvnSuccess", "paymentProcessing", "cardPayment", "bankTransfer", "ussdPayment"];
const STATEMENT_FLOW_SCREENS = [
  "statementUpload",
  "statementReview",
  "incomeType",
  "incomeInput",
  "deductionsWizard",
  "result",
  "paymentMethod",
  "paymentSuccess",
  "receipt",
  "tcc",
];

const Confetti = () => {
  const [dots, setDots] = useState([]);
  useEffect(() => {
    const colors = ["#10b981", "#34d399", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];
    const newDots = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      delay: `${Math.random() * 3}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: `${Math.random() * 8 + 6}px`,
      duration: `${Math.random() * 2 + 2.5}s`,
    }));
    setDots(newDots);
  }, []);

  return (
    <>
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="confetti-dot"
          style={{
            left: dot.left,
            animationDelay: dot.delay,
            backgroundColor: dot.color,
            width: dot.size,
            height: dot.size,
            animationDuration: dot.duration,
          }}
        />
      ))}
    </>
  );
};

export default function TaxEasyPremium() {
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

  useEffect(() => {
    // Restore persisted session on page load (phone, history, BVN profile)
    try {
      if (typeof window === "undefined") return;
      const savedPhone   = localStorage.getItem("taxeasy_phone");
      const savedHistory = localStorage.getItem("taxeasy_history");
      const savedProfile = localStorage.getItem("taxeasy_profile");
      if (savedPhone)   setPhone(savedPhone);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedProfile) setBvnProfile(JSON.parse(savedProfile));
    } catch (_) {
      // Silently ignore — corrupted localStorage should not crash the app
    }
  }, []);

  const saveToHistory = (record) => {
    // Persist payment history to localStorage for session continuity
    const newHistory = [record, ...history];
    setHistory(newHistory);
    try {
      localStorage.setItem("taxeasy_history", JSON.stringify(newHistory));
    } catch (_) {}
  };

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Onboarding ID state
  const [onboardingIdType, setOnboardingIdType] = useState("bvn");
  const [bvnNumber, setBvnNumber] = useState("");
  const [bvnLoading, setBvnLoading] = useState(false);
  const [bvnError, setBvnError] = useState("");
  const [bvnProfile, setBvnProfile] = useState(null);
  // ── Face detection state (detection only — no challenges) ──────────────────
  // livenessStep: "idle" | "loading" | "detecting" | "passed" | "blocked"
  const [livenessStep,  setLivenessStep]  = useState("idle");
  const [livenessError, setLivenessError] = useState("");
  const [faceVisible,   setFaceVisible]   = useState(false);
  const [engineReady,   setEngineReady]   = useState(false);

  const videoRef        = useRef(null);
  const streamRef       = useRef(null);
  const livenessStepRef = useRef("idle");  // stable ref for RAF callbacks
  const detectedFrames  = useRef(0);       // consecutive frames a face is present

  // Keep ref in sync
  useEffect(() => { livenessStepRef.current = livenessStep; }, [livenessStep]);

  // Stop camera stream helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Names pool for seed mock BVN
  const NG_FIRST = ["Chukwuemeka", "Adaeze", "Oluwafemi", "Aminat", "Babatunde", "Ngozi", "Emeka", "Fatima", "Tunde", "Chioma"];
  const NG_LAST = ["Adeyemi", "Okonkwo", "Ibrahim", "Nwosu", "Adeleke", "Okafor", "Bello", "Eze", "Musa", "Chukwu"];
  const NG_TOWNS = ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Enugu"];

  const generateNigerianProfile = (bvn, phoneNum) => {
    const seed = bvn.split("").reduce((acc, ch) => acc + Number(ch), 0);
    const firstName = NG_FIRST[seed % NG_FIRST.length];
    const lastName = NG_LAST[(seed * 3 + 7) % NG_LAST.length];
    const town = NG_TOWNS[(seed * 2 + 1) % NG_TOWNS.length];
    const year = 1975 + (seed % 25);
    const month = (seed * 7 % 12) + 1;
    const day = (seed * 13 % 28) + 1;
    const dob = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    const maskedBvn = `•••••••${bvn.slice(-4)}`;
    return { firstName, lastName, fullName: `${firstName} ${lastName}`, dob, town, bvn: maskedBvn, phone: phoneNum };
  };

  const handleVerifyBvn = () => {
    const minLen = 11;
    if (bvnNumber.trim().length !== minLen) {
      setBvnError(`Please enter a valid 11-digit ${onboardingIdType.toUpperCase()}.`);
      return;
    }
    setBvnError("");
    setBvnLoading(true);
    setTimeout(() => {
      const profile = generateNigerianProfile(bvnNumber, phone);
      setBvnProfile(profile);
      setIdentityType(onboardingIdType);
      setIdentityNumber(bvnNumber);
      try {
        localStorage.setItem("taxeasy_profile", JSON.stringify(profile));
      } catch (e) {}
      setBvnLoading(false);
      setScreen("faceVerification");
    }, 1200);
  };

  // ── Face detection helpers ───────────────────────────────────────────

  const resetLiveness = useCallback(() => {
    setLivenessStep("idle");
    setLivenessError("");
    setFaceVisible(false);
    setEngineReady(false);
    detectedFrames.current = 0;
  }, []);

  // Called every frame a face is found — after 40 stable frames (~1.3s) we pass
  const handleFaceDetected = useCallback(() => {
    setFaceVisible(true);
    if (livenessStepRef.current !== "detecting") return;
    detectedFrames.current++;
    if (detectedFrames.current > 40) {
      detectedFrames.current = 0;
      setLivenessStep("passed");
      stopCamera();
      // Use setScreenState directly (stable useState setter) to avoid
      // making setScreen (an unstable inline fn) a useCallback dependency.
      setTimeout(() => setScreenState("bvnSuccess"), 1600);
    }
  }, [stopCamera]);

  const handleFaceLost = useCallback(() => {
    setFaceVisible(false);
    detectedFrames.current = 0;  // reset counter when face disappears
  }, []);

  const handleEngineError = useCallback((msg) => {
    setLivenessError(msg || "Face detection engine failed to load.");
    setLivenessStep("idle");
    stopCamera();
  }, [stopCamera]);

  // Open camera and start face detection
  const startLiveness = async () => {
    resetLiveness();
    setLivenessStep("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setEngineReady(true);
      setLivenessStep("detecting");
    } catch (err) {
      setLivenessStep("blocked");
      setLivenessError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera access was denied. You must allow camera access to complete identity verification. Please check your browser permissions and try again."
          : err.name === "NotFoundError"
          ? "No camera was found on this device. A working camera is required to complete face verification."
          : `Camera error: ${err.message}`,
      );
    }
  };

  // State selector indices
  const [transparencyStateIdx, setTransparencyStateIdx] = useState(0);

  // Income & Calculation states
  const [incomeType, setIncomeType] = useState("salary");
  const [annualIncomeInput, setAnnualIncomeInput] = useState("");
  const [sideIncomeEnabled, setSideIncomeEnabled] = useState(false);
  const [sideIncomeInput, setSideIncomeInput] = useState("");
  
  // Deductions states
  const [pensionInput, setPensionInput] = useState("");
  const [nhfInput, setNhfInput] = useState("");
  const [nhisInput, setNhisInput] = useState("");
  const [rentInput, setRentInput] = useState("");
  const [lifeInsuranceInput, setLifeInsuranceInput] = useState("");

  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [calculation, setCalculation] = useState(null);

  // Bank statements states
  const [statementBank, setStatementBank] = useState("GTBank");
  const [statementFileName, setStatementFileName] = useState("");
  const [parsedStatement, setParsedStatement] = useState(null);
  const [statementParseLoading, setStatementParseLoading] = useState(false);
  const [statementError, setStatementError] = useState("");

  // ── Payment state ─────────────────────────────────────────────────────────
  const [identityType,   setIdentityType]   = useState("bvn");
  const [identityNumber, setIdentityNumber] = useState("");
  const [paymentMethod,  setPaymentMethod]  = useState("card");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentRecord,  setPaymentRecord]  = useState(null);

  // Card payment fields
  const [cardNumber,  setCardNumber]  = useState("");
  const [cardExpiry,  setCardExpiry]  = useState("");
  const [cardCvv,     setCardCvv]     = useState("");
  const [cardName,    setCardName]    = useState("");
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardError,   setCardError]   = useState("");
  const [cardCopied,  setCardCopied]  = useState(false);

  // Bank transfer — generated virtual account
  const [virtualAccount,    setVirtualAccount]    = useState(null);
  const [transferCopied,    setTransferCopied]    = useState(false);
  const [confirmSheetOpen,  setConfirmSheetOpen]  = useState(false);
  const [transferCountdown, setTransferCountdown] = useState(1800); // 30 min in seconds
  const countdownRef = useRef(null);

  // USSD bank selector
  const [ussdBank, setUssdBank] = useState("GTBank");

  // Payment processing steps
  const [processingStep, setProcessingStep] = useState(0);
  const [paymentKey,     setPaymentKey]     = useState(0);  // increments every Pay tap
  const processingTickerRef = useRef(null);
  const processingFinalRef  = useRef(null);
  const pendingPaymentRef   = useRef(null); // record snapshot, read by useEffect

  const canContinuePhone = phone.trim().replace(/\s/g, "").length >= 10;
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
      // Simulated backend — any 6-digit code passes (real SMS gateway in production)
      setAuthLoading(false);
      try {
        localStorage.setItem("taxeasy_phone", phone);
      } catch (e) {}

      if (bvnProfile) {
        setScreen("home");
      } else {
        setBvnNumber("");
        setBvnError("");
        resetLiveness();
        setScreen("bvnEntry");
      }
    }, 800);
  };

  // Auto-verify OTP: useEffect runs after React commits the otp state update,
  // so otp is guaranteed to equal 6 chars when handleVerifyOtp reads canVerifyOtp.
  useEffect(() => {
    if (otp.length === 6 && screen === "otp" && !authLoading) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // ── Payment processing engine ─────────────────────────────────────────────
  // Watches paymentKey (a counter that increments each time Pay is tapped).
  // This fires reliably even when screen was already "paymentProcessing".
  useEffect(() => {
    if (paymentKey === 0) return;           // skip initial mount
    const record = pendingPaymentRef.current;
    if (!record) return;

    // Clear any leftover timers from a previous attempt
    if (processingTickerRef.current) clearInterval(processingTickerRef.current);
    if (processingFinalRef.current)  clearTimeout(processingFinalRef.current);

    setProcessingStep(0);

    // Tick through steps every 600 ms
    let step = 0;
    processingTickerRef.current = setInterval(() => {
      step += 1;
      if (step < PROCESSING_STEPS.length) {
        setProcessingStep(step);
      } else {
        clearInterval(processingTickerRef.current);
        processingTickerRef.current = null;
      }
    }, 600);

    // Navigate to success after 3 400 ms
    processingFinalRef.current = setTimeout(() => {
      if (processingTickerRef.current) {
        clearInterval(processingTickerRef.current);
        processingTickerRef.current = null;
      }
      const r = pendingPaymentRef.current;
      pendingPaymentRef.current = null;
      setPaymentRecord(r);
      saveToHistory(r);
      setPaymentLoading(false);
      setScreenState("paymentSuccess");  // bypass setScreen nav-stack logic
    }, 3400);

    return () => {
      clearInterval(processingTickerRef.current);
      clearTimeout(processingFinalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentKey]);

  const handleCalculate = () => {
    setCalcError("");
    const annualIncomeNaira = Number(annualIncomeInput.replaceAll(",", ""));
    const sideIncomeNaira = sideIncomeEnabled ? Number(sideIncomeInput.replaceAll(",", "")) : 0;

    if (!Number.isFinite(annualIncomeNaira) || annualIncomeNaira <= 0) {
      setCalcError("Please enter a valid annual income.");
      return;
    }

    setCalcLoading(true);
    setTimeout(() => {
      const result = calculateTaxEstimate({
        incomeType: incomeType,
        annualIncomeNaira,
        sideIncomeNaira,
        pensionNaira: Number(pensionInput.replaceAll(",", "")) || 0,
        nhfNaira: Number(nhfInput.replaceAll(",", "")) || 0,
        nhisNaira: Number(nhisInput.replaceAll(",", "")) || 0,
        annualRentNaira: Number(rentInput.replaceAll(",", "")) || 0,
        lifeInsuranceNaira: Number(lifeInsuranceInput.replaceAll(",", "")) || 0,
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
      setStatementError("Only bank statement PDF files are accepted.");
      return;
    }

    setStatementFileName(file.name);
    setStatementParseLoading(true);
    setTimeout(() => {
      const parsed = statementBank === "GTBank" ? parseGtbankPdfStatement(file.name) : buildSampleStatement("Demo Bank");
      setParsedStatement(parsed);
      setStatementParseLoading(false);
      setScreen("statementReview");
    }, 1000);
  };

  const loadDemoStatement = () => {
    setStatementError("");
    setStatementFileName(statementBank === "GTBank" ? "gtbank-demo-statement.pdf" : "sample-bank-statement.pdf");
    setStatementParseLoading(true);
    setTimeout(() => {
      setParsedStatement(buildSampleStatement(statementBank));
      setStatementParseLoading(false);
      setScreen("statementReview");
    }, 800);
  };

  const updateTransactionCategory = (transactionId, category) => {
    setParsedStatement((current) => {
      if (!current) return current;
      return {
        ...current,
        transactions: current.transactions.map((t) =>
          t.id === transactionId ? { ...t, category } : t
        ),
      };
    });
  };

  const statementTotals = (transactions = []) => {
    const grossIncome = transactions
      .filter((t) => t.direction === "credit" && t.category === "income")
      .reduce((sum, t) => sum + t.amountNaira, 0);
    const businessExpenses = transactions
      .filter((t) => t.direction === "debit" && t.category === "business_expense")
      .reduce((sum, t) => sum + t.amountNaira, 0);
    const ignored = transactions
      .filter((t) => t.category === "transfer" || t.category === "tax_exempt")
      .reduce((sum, t) => sum + t.amountNaira, 0);
    return { grossIncome, businessExpenses, ignored };
  };

  const handleCalculateFromStatement = () => {
    if (!parsedStatement || parsedStatement.transactions.length === 0) {
      setStatementError("Please load a bank statement before calculation.");
      return;
    }
    setCalcLoading(true);
    setTimeout(() => {
      const result = calculateTaxFromTransactions({
        incomeType: incomeType === "salary" ? "freelance" : incomeType,
        transactions: parsedStatement.transactions,
        pensionNaira: Number(pensionInput.replaceAll(",", "")) || 0,
        nhfNaira: Number(nhfInput.replaceAll(",", "")) || 0,
        nhisNaira: Number(nhisInput.replaceAll(",", "")) || 0,
        annualRentNaira: Number(rentInput.replaceAll(",", "")) || 0,
        lifeInsuranceNaira: Number(lifeInsuranceInput.replaceAll(",", "")) || 0,
      });
      setCalculation(result);
      setCalcLoading(false);
      setScreen("result");
    }, 900);
  };

  // ── Card helpers ──────────────────────────────────────────────────────────
  const formatCardNumber = (raw) =>
    raw.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

  const formatExpiry = (raw) => {
    const d = raw.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const luhnValid = (num) => {
    const d = num.replace(/\D/g, "");
    if (d.length < 13) return false;
    let sum = 0;
    [...d].reverse().forEach((c, i) => {
      let n = parseInt(c);
      if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    });
    return sum % 10 === 0;
  };

  const cardNetwork = (num) => {
    const n = num.replace(/\s/g, "");
    if (/^4/.test(n))         return { label: "Visa",       color: "#1a1f71" };
    if (/^5[1-5]/.test(n))   return { label: "Mastercard", color: "#eb001b" };
    if (/^5[6-9]|^6/.test(n)) return { label: "Verve",     color: "#007b40" };
    return null;
  };

  const expiryValid = (exp) => {
    if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
    const [m, y] = exp.split("/").map(Number);
    if (m < 1 || m > 12) return false;
    const now = new Date();
    const expDate = new Date(2000 + y, m - 1, 1);
    return expDate > now;
  };

  const canSubmitCard =
    luhnValid(cardNumber) &&
    expiryValid(cardExpiry) &&
    cardCvv.replace(/\D/g, "").length >= 3 &&
    cardName.trim().length >= 2;

  // ── Bank transfer helpers ─────────────────────────────────────────────────
  const generateVirtualAccount = () => {
    const seed   = (identityNumber || "0000000000").replace(/\D/g, "").slice(-4).padStart(4, "0");
    const amount = calculation?.totalAmountDueNaira || 0;
    const suffix = String(amount).slice(-4).padStart(4, "0");
    const acctNo = `903${seed}${suffix}`.slice(0, 10);
    const banks  = ["Wema Bank", "Sterling Bank", "Providus Bank", "Fidelity Bank"];
    const bank   = banks[parseInt(seed, 10) % banks.length];
    setVirtualAccount({
      bank,
      accountNumber: acctNo,
      accountName:   "FIRS / TAXEASY COLLECTIONS",
    });
    setTransferCountdown(1800);
    // Start 30-min countdown
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTransferCountdown((s) => {
        if (s <= 1) { clearInterval(countdownRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const formatCountdown = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── USSD helpers ──────────────────────────────────────────────────────────
  const USSD_BANKS = [
    { bank: "GTBank",     code: (amt) => `*737*58*${amt}#` },
    { bank: "Access",     code: (amt) => `*901*${amt}#`    },
    { bank: "Zenith",     code: (amt) => `*966*${amt}#`    },
    { bank: "UBA",        code: (amt) => `*919*${amt}#`    },
    { bank: "First Bank", code: (amt) => `*894*${amt}#`    },
  ];

  const ussdCode = () => {
    const amt  = calculation?.totalAmountDueNaira || 0;
    const bank = USSD_BANKS.find((b) => b.bank === ussdBank) || USSD_BANKS[0];
    return bank.code(amt);
  };

  // ── Payment routing ───────────────────────────────────────────────────────
  // Routes from paymentMethod → method-specific detail screen
  const handleProceedToPayment = () => {
    setCardError("");
    if (paymentMethod === "card")          { setScreen("cardPayment"); }
    if (paymentMethod === "bank_transfer") { generateVirtualAccount(); setScreen("bankTransfer"); }
    if (paymentMethod === "ussd")          { setScreen("ussdPayment"); }
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text, setCopied) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  // ── handlePay ─────────────────────────────────────────────────────────────
  const handlePay = () => {
    if (!calculation) return;

    // Stop bank-transfer countdown if running
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // Snapshot the record into a ref so the useEffect closure is always fresh
    const now = new Date();
    pendingPaymentRef.current = {
      reference:       `TXE-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      amountNaira:     calculation.totalAmountDueNaira,
      taxNaira:        calculation.totalTaxNaira,
      serviceFeeNaira: calculation.serviceFeeNaira,
      method:          paymentMethod,
      paidAt:          now.toISOString(),
      statementSource: parsedStatement?.bank || "Manual estimate",
      identity:        bvnProfile?.bvn || maskedIdentity(),
      identityType:    identityType,
      name:            bvnProfile?.fullName || "Verified Taxpayer",
    };

    setPaymentLoading(true);
    setProcessingStep(0);
    setScreenState("paymentProcessing");  // bypass nav-stack; direct state write
    setPaymentKey((k) => k + 1);          // ← THIS triggers the useEffect
  };

  const paymentMethodLabel = (value) => {
    if (value === "card") return "Visa/Mastercard/Verve";
    if (value === "bank_transfer") return "Direct Bank Remittance";
    return "Instant USSD Code (*737#)";
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
    setPensionInput("");
    setNhfInput("");
    setNhisInput("");
    setRentInput("");
    setLifeInsuranceInput("");
    setCalcError("");
    setStatementFileName("");
    setParsedStatement(null);
    setStatementError("");
    setScreen("incomeType");
  };

  const handleEmailRepresentative = (stateName) => {
    const subject = encodeURIComponent(`Inquiry on ${stateName} State Public Tax Expenditure`);
    const body = encodeURIComponent(
      `Dear Honorable Representative,\n\nI am a tax-compliant citizen of Nigeria residing in ${stateName} State. I recently verified my tax compliance status through TaxEasy and reviewed the ${stateName} State local government capital allocation indices.\n\nI am writing to inquire about the budget implementation status of the capital development projects earmarked for our local constituency. Specifically, we would love to see updates on healthcare, transport infrastructure, and basic education project remits.\n\nThank you for your dedicated service and public leadership.\n\nSincerely,\n${bvnProfile?.fullName || "Taxpayer"}`
    );
    window.open(`mailto:representatives@nass.gov.ng?subject=${subject}&body=${body}`, "_blank");
  };

  const isOnboarding = BOTTOM_NAV_HIDDEN_SCREENS.includes(screen);
  const showSidebar = !isOnboarding;

  const SIDEBAR_NAV = [
    { id: "home", label: "Dashboard", icon: Home, screen: "home" },
    { id: "statement", label: "Tax Assessment", icon: UploadCloud, screen: "incomeType" },
    { id: "history", label: "Filing History", icon: History, screen: "history" },
    { id: "transparency", label: "Budget Impact", icon: PieChart, screen: "transparency" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#0a0f0d] flex flex-col">
      {/* Confetti element on successful payments */}
      {screen === "paymentSuccess" && <Confetti />}

      {/* ═══════════════════════════════════════════════
          DESKTOP SIDEBAR — hidden on mobile & onboarding
          ═══════════════════════════════════════════════ */}
      {showSidebar && (
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-r lg:border-[#d1fae5] lg:bg-white lg:shadow-sm lg:z-40">
          {/* Logo banner */}
          <div className="flex items-center gap-3 border-b border-[#e2ede7] px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#064e3b] to-[#065f46] shadow-md shadow-emerald-900/10">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-[#064e3b] tracking-tight">TaxEasy</span>
              <span className="block text-[9px] font-bold text-emerald-600 tracking-wider">NIGERIA REFORM</span>
            </div>

          </div>

          {/* User badge */}
          {bvnProfile && (
            <div className="mx-4 mt-5 p-3 rounded-2xl bg-[#f0fdf4] border border-[#d1fae5] flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-bold text-sm">
                {bvnProfile.firstName[0]}{bvnProfile.lastName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#064e3b] truncate">{bvnProfile.fullName}</p>
                <div className="badge-verified mt-0.5 scale-90 origin-left">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                  ID Verified
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 px-4 py-6">
            <p className="text-[10px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-2">Primary Menu</p>
            {SIDEBAR_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeBottomTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToMainTab(item.screen)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#064e3b] text-white shadow-lg shadow-emerald-950/15 sidebar-active-pill"
                      : "text-slate-500 hover:bg-[#f0fdf4] hover:text-[#064e3b]"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Sign Out block */}
          <div className="border-t border-[#e2ede7] px-5 py-4 space-y-2">
            {phone && (
              <div className="flex items-center gap-2.5 px-2 text-xs text-slate-500">
                <Smartphone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{phone}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setPhone("");
                setBvnProfile(null);
                setHistory([]);
                setNavStack([]);
                if (typeof window !== "undefined") {
                  localStorage.removeItem("taxeasy_phone");
                  localStorage.removeItem("taxeasy_history");
                  localStorage.removeItem("taxeasy_profile");
                }
                setScreenState("welcome");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Sign out taxpayer
            </button>
          </div>
        </aside>
      )}

      {/* ═══════════════════════════════════════════════
          MAIN WRAPPER
          ═══════════════════════════════════════════════ */}
      <main className={`flex-1 flex flex-col ${showSidebar ? "lg:pl-64" : ""}`}>
        {/* Desktop Header bar */}
        {showSidebar && (
          <header className="hidden lg:flex sticky top-0 z-30 items-center justify-between border-b border-[#e2ede7] bg-white/90 backdrop-blur-md px-8 py-4.5">
            <div className="flex items-center gap-3">
              {navStack.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const prev = navStack[navStack.length - 1];
                    setNavStack((stack) => stack.slice(0, -1));
                    setScreenState(prev);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d1fae5] bg-white text-[#064e3b] hover:bg-[#f0fdf4] transition-colors"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </button>
              )}
              <div>
                <h1 className="text-base font-extrabold text-[#064e3b] tracking-tight">
                  {SCREEN_TITLES[screen] || "Filing Dashboard"}
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Compliance Year: 2026</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f0fdf4] px-3.5 py-1 text-xs font-bold text-emerald-800 border border-[#d1fae5]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Nigeria PIT Act 2025 compliant
              </div>
            </div>
          </header>
        )}

        {/* ── Onboarding Center Content Panel ── */}
        {isOnboarding ? (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f0fdf4] via-[#f8fffe] to-[#ecfdf5] px-4 py-8 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square rounded-full bg-[#34d399]/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square rounded-full bg-[#fcd34d]/10 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md z-10 flex flex-col gap-6">
              {/* Onboarding Mobile/Title Header */}
              {screen !== "welcome" && (
                <header className="flex items-center justify-between lg:hidden px-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (navStack.length > 0) {
                        const prev = navStack[navStack.length - 1];
                        setNavStack((stack) => stack.slice(0, -1));
                        setScreenState(prev);
                      }
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-full border border-[#d1fae5] bg-white text-[#064e3b]"
                  >
                    <ArrowLeft className="h-4.5 w-4.5" />
                  </button>
                  <p className="text-xs font-bold text-[#064e3b] uppercase tracking-wider">{SCREEN_TITLES[screen]}</p>
                  <div className="h-10 w-10" />
                </header>
              )}

              {/* Logo representation */}
              {screen === "welcome" && (
                <div className="flex flex-col items-center text-center gap-1.5 mb-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#065f46] shadow-xl shadow-emerald-950/20 mb-2">
                    <ShieldCheck className="h-7 w-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-[#064e3b] tracking-tight">TaxEasy</h1>
                  <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 border border-[#d1fae5]">
                    Official Premium Remitter
                  </span>
                </div>
              )}

              {/* WELCOME SCREEN */}
              {screen === "welcome" && (
                <section className="premium-card p-7 space-y-6 screen-enter">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black leading-tight text-[#064e3b] tracking-tight">
                      Settle your tax in under 90 seconds
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-500">
                      Linking your banking profile is fast, automated, and secure. Review calculations under the new 2026 Nigeria PIT Act, pay, and receive a verified Tax Clearance Certificate immediately.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-[#f0fdf4] border border-[#d1fae5] p-4.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">2026 Reform Updates</p>
                    <ul className="space-y-2 text-xs font-medium text-emerald-950">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        First ₦800,000 completely tax-free
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        Small businesses &lt; ₦100M 100% CIT exempt
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        1% Presumptive rate for informal traders
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setScreen("phone")}
                      className="btn-primary"
                    >
                      Verify and Start
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Trust Strip */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="trust-strip">
                      <div className="trust-item">
                        <Lock className="h-3 w-3 text-slate-400" />
                        NIBSS Secure
                      </div>
                      <div className="trust-item">
                        <ShieldCheck className="h-3 w-3 text-slate-400" />
                        FIRS Compliant
                      </div>
                      <div className="trust-item">
                        <Smartphone className="h-3 w-3 text-slate-400" />
                        256-bit Encrypted
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* PHONE INPUT SCREEN */}
              {screen === "phone" && (
                <section className="premium-card p-7 space-y-6 screen-enter">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-xl bg-[#064e3b] flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-xl font-extrabold text-[#064e3b]">Sign in with phone</h2>
                    </div>
                    <p className="text-xs text-slate-500">We&apos;ll send a 6-digit OTP code to verify your number.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nigerian Phone Number</label>
                      {/* Flex row: prefix chip + input side by side */}
                      <div className="flex items-stretch h-[3.25rem] rounded-[0.875rem] border-[1.5px] border-[#d1fae5] bg-white overflow-hidden focus-within:border-[#10b981] focus-within:ring-2 focus-within:ring-[#10b981]/20 transition-all">
                        {/* +234 Prefix */}
                        <div className="flex items-center gap-1.5 px-3.5 border-r border-slate-200 bg-slate-50 shrink-0">
                          <span className="text-sm font-black text-[#064e3b]">🇳🇬</span>
                          <span className="text-sm font-bold text-slate-700">+234</span>
                        </div>
                        {/* Actual input — no extra padding needed */}
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(toNumberInput(e.target.value))}
                          placeholder="801 234 5678"
                          className="flex-1 bg-transparent px-4 text-sm font-semibold text-[#0a0f0d] placeholder:text-slate-300 outline-none"
                          maxLength={11}
                          inputMode="tel"
                          autoComplete="tel"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Example: 801 234 5678 (without the leading 0)</p>
                    </div>

                    {authError && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">{authError}</p>}

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={!canContinuePhone || authLoading}
                      className="btn-primary"
                    >
                      {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send verification code"}
                    </button>
                  </div>
                </section>
              )}

              {screen === "otp" && (
                <section className="premium-card p-7 space-y-6 screen-enter">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-xl bg-[#064e3b] flex items-center justify-center">
                        <Lock className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-xl font-extrabold text-[#064e3b]">Verify your phone</h2>
                    </div>
                    <p className="text-xs text-slate-500">
                      Enter the 6-digit code sent to <strong className="text-slate-700">+234 {phone}</strong>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">OTP Verification Code</label>
                      <div className="flex items-stretch h-[3.25rem] rounded-[0.875rem] border-[1.5px] border-[#d1fae5] bg-white overflow-hidden focus-within:border-[#10b981] focus-within:ring-2 focus-within:ring-[#10b981]/20 transition-all">
                        <div className="flex items-center gap-1.5 px-3.5 border-r border-slate-200 bg-slate-50 shrink-0">
                          <Lock className="h-3.5 w-3.5 text-[#064e3b]" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OTP</span>
                        </div>
                        <input
                          value={otp}
                          onChange={(e) => setOtp(toNumberInput(e.target.value).slice(0, 6))}
                          placeholder="Enter 6-digit code"
                          className="flex-1 bg-transparent px-4 text-xl font-black text-[#0a0f0d] tracking-[0.4em] placeholder:text-slate-300 placeholder:tracking-[0.2em] placeholder:font-normal outline-none"
                          maxLength={6}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          autoFocus
                          disabled={authLoading}
                        />
                        <div className="flex items-center pr-4 shrink-0">
                          {authLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                          ) : otp.length > 0 ? (
                            <span className="text-[10px] font-bold text-slate-400">{otp.length}/6</span>
                          ) : null}
                        </div>
                      </div>
                      {/* Progress dots — fill left to right as digits are entered */}
                      <div className="flex justify-center gap-2 mt-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-200 ${
                              i < otp.length ? "w-5 bg-emerald-500" : "w-2 bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {authError && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">{authError}</p>}

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={!canVerifyOtp || authLoading}
                      className="btn-primary"
                    >
                      {authLoading
                        ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying&hellip;</>
                        : "Confirm Code"}
                    </button>

                    <p className="text-center text-[10px] text-slate-400">
                      Didn&apos;t receive a code?{" "}
                      <button type="button" onClick={handleSendOtp} className="text-emerald-700 font-bold underline underline-offset-2">Resend</button>
                    </p>
                  </div>
                </section>
              )}

              {/* BVN / NIN ENTRY SCREEN */}
              {screen === "bvnEntry" && (
                <section className="space-y-4 screen-enter">
                  <div className="premium-card p-7 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0fdf4] border border-[#d1fae5]">
                        <Fingerprint className="h-6 w-6 text-[#064e3b]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-[#064e3b] tracking-tight">Verify Taxpayer Identity</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SECURE NIBSS LINKAGE</p>
                      </div>
                    </div>

                    {/* Toggle ID type */}
                    <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-100">
                      <button
                        type="button"
                        onClick={() => { setOnboardingIdType("bvn"); setBvnNumber(""); setBvnError(""); }}
                        className={`h-10 rounded-xl text-xs font-extrabold transition-all ${
                          onboardingIdType === "bvn" ? "bg-white text-[#064e3b] shadow-sm" : "text-slate-500"
                        }`}
                      >
                        Bank Verification (BVN)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOnboardingIdType("nin"); setBvnNumber(""); setBvnError(""); }}
                        className={`h-10 rounded-xl text-xs font-extrabold transition-all ${
                          onboardingIdType === "nin" ? "bg-white text-[#064e3b] shadow-sm" : "text-slate-500"
                        }`}
                      >
                        National Identity (NIN)
                      </button>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-500">
                      Providing your 11-digit {onboardingIdType.toUpperCase()} automatically imports and signs your profile records to authenticate your 2026 Tax Clearance Certificate (TCC).
                    </p>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {onboardingIdType.toUpperCase()} Number
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">{bvnNumber.length}/11</span>
                      </div>
                      <input
                        value={bvnNumber}
                        onChange={(e) => setBvnNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder={onboardingIdType === "bvn" ? "22345678901" : "33456789012"}
                        inputMode="numeric"
                        maxLength={11}
                        className="input-field text-lg font-bold tracking-widest text-center"
                      />
                    </div>

                    {bvnError && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">{bvnError}</p>}

                    <button
                      type="button"
                      onClick={handleVerifyBvn}
                      disabled={bvnLoading || bvnNumber.length !== 11}
                      className="btn-primary"
                    >
                      {bvnLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ScanFace className="h-5 w-5" /> Verify {onboardingIdType.toUpperCase()}</>}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-[#f0fdf4] p-4 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-emerald-950 font-medium">
                      Encryption Shield active: Your identification digits are only used to trigger a secure read request to verified governmental identity databases. Data is processed in-memory and never cached.
                    </p>
                  </div>
                </section>
              )}

              {/* FACE SCANNERS */}
              {screen === "faceVerification" && (
                <section className="premium-card p-6 space-y-6 screen-enter text-center">

                  {/* Header */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[9px] font-extrabold text-emerald-800 border border-[#d1fae5] mb-1">
                      <ScanFace className="h-3 w-3" /> NIBSS BIOMETRIC CHECK
                    </div>
                    <h2 className="text-xl font-extrabold text-[#064e3b]">Face Verification</h2>
                    <p className="text-xs text-slate-500">Hold your face steady inside the oval until detected.</p>
                  </div>

                  {/* Hard-blocked camera error */}
                  {livenessStep === "blocked" && (
                    <div className="liveness-blocked-panel">
                      <div className="h-14 w-14 rounded-full bg-rose-100 flex items-center justify-center">
                        <Camera className="h-7 w-7 text-rose-500" />
                      </div>
                      <p className="text-sm font-black text-rose-700">Camera Access Required</p>
                      <p className="text-[11px] text-rose-600 leading-relaxed max-w-[280px]">{livenessError}</p>
                      <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[10px] text-rose-700 font-semibold">
                        <strong>How to fix:</strong> Click the camera icon in your browser&apos;s address bar → select &quot;Allow&quot; → tap Retry.
                      </div>
                      <button type="button" onClick={resetLiveness} className="btn-primary">
                        <Camera className="h-4 w-4" /> Retry with Camera
                      </button>
                    </div>
                  )}

                  {/* Camera frame — shown once camera opens */}
                  {livenessStep !== "idle" && livenessStep !== "blocked" && (
                    <div className="relative mx-auto" style={{ width: "min(260px, 90%)", aspectRatio: "3/4" }}>
                      <div className={`relative overflow-hidden bg-slate-900 h-full w-full rounded-[2rem] transition-all duration-500 ${
                        livenessStep === "passed"
                          ? "ring-4 ring-emerald-400 shadow-lg shadow-emerald-400/30"
                          : faceVisible
                          ? "ring-4 ring-emerald-400"
                          : "ring-2 ring-slate-700"
                      }`}>

                        {/* Mirrored video */}
                        <video ref={videoRef} autoPlay muted playsInline
                          className="h-full w-full object-cover"
                          style={{ transform: "scaleX(-1)" }}
                        />

                        {/* Oval face guide */}
                        <div className="face-oval-guide" />

                        {/* Corner brackets */}
                        <div className="pointer-events-none absolute inset-0">
                          <div className="absolute top-3 left-3 h-7 w-7 rounded-tl-2xl border-t-[3px] border-l-[3px] border-emerald-400" />
                          <div className="absolute top-3 right-3 h-7 w-7 rounded-tr-2xl border-t-[3px] border-r-[3px] border-emerald-400" />
                          <div className="absolute bottom-3 left-3 h-7 w-7 rounded-bl-2xl border-b-[3px] border-l-[3px] border-emerald-400" />
                          <div className="absolute bottom-3 right-3 h-7 w-7 rounded-br-2xl border-b-[3px] border-r-[3px] border-emerald-400" />
                        </div>

                        {/* Loading overlay */}
                        {livenessStep === "loading" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90">
                            <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
                            <span className="text-[11px] text-emerald-300 font-bold">Opening camera…</span>
                          </div>
                        )}

                        {/* No face found — scan line + prompt */}
                        {livenessStep === "detecting" && !faceVisible && (
                          <>
                            <div className="face-scan-line" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/40">
                              <ScanFace className="h-12 w-12 text-emerald-400 animate-pulse" />
                              <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest bg-slate-950/50 px-3 py-1 rounded-full">
                                Position face in oval
                              </span>
                            </div>
                          </>
                        )}

                        {/* Face found — scan line still running + status pill */}
                        {livenessStep === "detecting" && faceVisible && (
                          <>
                            <div className="face-scan-line" />
                            <div className="absolute bottom-3 inset-x-3 flex justify-center">
                              <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping inline-block" />
                                Face Detected
                              </span>
                            </div>
                          </>
                        )}

                        {/* Passed overlay */}
                        {livenessStep === "passed" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-950/80 bounce-in">
                            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                              <CheckCircle2 className="h-10 w-10 text-white" />
                            </div>
                            <span className="text-emerald-300 font-black text-sm">Face Verified ✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status label */}
                  {livenessStep === "detecting" && (
                    <div className={`h-11 w-full flex items-center justify-center gap-2 rounded-2xl text-xs font-bold border transition-all ${
                      faceVisible
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      {faceVisible
                        ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Holding steady… verifying identity</>
                        : <><ScanFace className="h-4 w-4 animate-pulse" /> Look directly at the camera</>}
                    </div>
                  )}

                  {livenessStep === "passed" && (
                    <div className="h-11 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 bounce-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Identity confirmed — redirecting…
                    </div>
                  )}

                  {/* Idle: start button */}
                  {livenessStep === "idle" && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-left">
                        <p className="text-xs font-black text-[#064e3b] flex items-center gap-2">
                          <ScanFace className="h-4 w-4" /> How it works
                        </p>
                        <ul className="space-y-1.5 text-[11px] text-slate-500">
                          <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">1.</span> Your camera opens</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">2.</span> Position your face inside the oval guide</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">3.</span> Hold still for 1–2 seconds while we detect your face</li>
                          <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">4.</span> You’ll be automatically verified and continue</li>
                        </ul>
                      </div>
                      <button type="button" onClick={startLiveness} className="btn-primary">
                        <Camera className="h-5 w-5" /> Open Camera &amp; Verify Face
                      </button>
                    </div>
                  )}

                  {/* FaceEngine — mounted only while detecting */}
                  {engineReady && livenessStep === "detecting" && (
                    <FaceEngineDynamic
                      videoRef={videoRef}
                      challenge={null}
                      onFaceDetected={handleFaceDetected}
                      onFaceLost={handleFaceLost}
                      onError={handleEngineError}
                    />
                  )}

                </section>
              )}

              {/* IDENTITY SUCCESS BANNER */}
              {screen === "bvnSuccess" && bvnProfile && (
                <section className="space-y-4 screen-enter">
                  <div className="hero-card px-6 py-8 text-center text-white flex flex-col items-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 ring-4 ring-emerald-400/30 bounce-in">
                      <UserCheck className="h-8 w-8 text-emerald-300" />
                    </div>
                    <h2 className="text-xl font-black">Identity Verified!</h2>
                    <p className="mt-1 text-xs text-emerald-200 max-w-[280px]">Your personal details are authenticated from secure registries.</p>
                    <div className="badge-gold mt-4">
                      ₦2026 TAXPAYER STAMP READY
                    </div>
                  </div>

                  <div className="premium-card p-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Taxpayer Ledger Record</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Taxpayer Name", value: bvnProfile.fullName },
                        { label: "Birth Registry", value: bvnProfile.dob },
                        { label: "Origin Registry", value: bvnProfile.town },
                        { label: `${identityType.toUpperCase()} Ref`, value: bvnProfile.bvn },
                        { label: "Mobile Registry", value: bvnProfile.phone },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-semibold">
                          <span className="text-slate-400">{label}</span>
                          <span className="text-slate-800">{value}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setScreen("home")}
                      className="btn-primary mt-2"
                    >
                      Enter Tax Dashboard
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          /* ── Core Tax Flow & Main App Tabs ── */
          <div className="flex-1 flex flex-col">
            {/* Mobile Header bar */}
            <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#e2ede7] bg-white/95 backdrop-blur px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                {navStack.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const prev = navStack[navStack.length - 1];
                      setNavStack((stack) => stack.slice(0, -1));
                      setScreenState(prev);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d1fae5] bg-white text-[#064e3b]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <span className="text-sm font-extrabold text-[#064e3b] tracking-tight">{SCREEN_TITLES[screen]}</span>
              </div>
              <div className="flex items-center gap-2">

                <div className="h-8 w-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-black text-xs">
                  {bvnProfile ? `${bvnProfile.firstName[0]}${bvnProfile.lastName[0]}` : "T"}
                </div>
              </div>
            </header>

            {/* Container for content scroll */}
            <div className={`flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 py-6 space-y-6 ${showBottomNav ? "pb-24 lg:pb-8" : "pb-8"}`}>
              
              {/* HOME SCREEN */}
              {screen === "home" && (
                <section className="space-y-6 screen-enter">
                  {/* Greeting Hero card */}
                  <div className="hero-card p-6 text-white space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">NIGERIA TAXPAYER LEDGER</span>
                        <h2 className="text-xl font-black mt-1">Hello, {bvnProfile?.firstName || "Taxpayer"}</h2>
                        <p className="text-xs text-emerald-100 max-w-[260px] mt-0.5">Link your income records and comply with the PIT Reform Act 2026.</p>
                      </div>
                      <div className="badge-gold">2026 TAX YEAR</div>
                    </div>

                    <div className="pt-4 border-t border-emerald-800 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wide">Remittance Status</p>
                        <p className="text-sm font-extrabold mt-0.5">
                          {history.length > 0 ? "✅ FULLY COMPLIANT" : "⚠️ UNFILED ESTIMATE"}
                        </p>
                      </div>
                      <button
                        onClick={() => setScreen("incomeType")}
                        className="bg-white text-[#064e3b] px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-50 shadow-sm transition-all"
                      >
                        Start Compliance filing
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Grid */}
                  <div className="space-y-2.5">
                    <p className="section-label">Filing tools</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button onClick={() => { setIncomeType("freelance"); setScreen("incomeType"); }} className="quick-action">
                        <UploadCloud className="h-5 w-5 text-emerald-600 mb-1" />
                        Assess Income
                      </button>
                      <button onClick={() => { if (history.length > 0) { setPaymentRecord(history[0]); setScreen("tcc"); } else { setScreen("incomeType"); } }} className="quick-action">
                        <FileText className="h-5 w-5 text-emerald-600 mb-1" />
                        Download TCC
                      </button>
                      <button onClick={() => setScreen("transparency")} className="quick-action">
                        <PieChart className="h-5 w-5 text-emerald-600 mb-1" />
                        Trust Impact
                      </button>
                      <button onClick={() => setScreen("history")} className="quick-action">
                        <History className="h-5 w-5 text-emerald-600 mb-1" />
                        Filing History
                      </button>
                    </div>
                  </div>

                  {/* Compliance Timeline / Deadlines */}
                  <div className="premium-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#064e3b]" />
                        <h3 className="text-sm font-extrabold text-[#064e3b]">Annual Compliance Timeline</h3>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">2026 Fiscal Year</span>
                    </div>
                    <div className="relative pl-7 border-l-2 border-dashed border-slate-200 space-y-5">
                      <div className="relative">
                        <span className="timeline-dot-green" />
                        <h4 className="text-slate-800 font-extrabold text-xs leading-snug">1 January 2026</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">Nigeria PIT Act 2025 comes into full effect.</p>
                      </div>
                      <div className="relative">
                        <span className="timeline-dot-amber" />
                        <h4 className="text-slate-800 font-extrabold text-xs leading-snug">31 March 2026</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">PAYE annual returns filing due dates for FIRS/LIRS.</p>
                      </div>
                      <div className="relative">
                        <span className="timeline-dot-gray" />
                        <h4 className="text-slate-800 font-extrabold text-xs leading-snug">31 December 2026</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">Final presumptive tax and self-employed remittances deadline.</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Notice */}
                  <div className="rounded-2xl border border-emerald-100 bg-[#f0fdf4] p-4 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
                    <p className="text-[11px] leading-relaxed text-emerald-950 font-medium">
                      Legitimacy Guarantee: Every estimation is dynamically compiled in alignment with the gazetted Nigeria Tax Act 2025 guidelines. Small registered enterprises are verified for automatic CIT exemptions.
                    </p>
                  </div>
                </section>
              )}

              {/* INCOME TYPE SELECTOR */}
              {screen === "incomeType" && (
                <section className="premium-card p-6.5 space-y-6 screen-enter">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-extrabold text-[#064e3b]">How do you earn your income?</h2>
                    <p className="text-xs text-slate-500">Select the option that matches your current primary livelihood.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { 
                        value: "salary", 
                        label: "Formal Salary earner (PAYE)", 
                        desc: "Tax is remitted monthly by your employer. File for a TCC review.",
                        icon: Briefcase
                      },
                      { 
                        value: "freelance", 
                        label: "Freelancer / Gig Contractor", 
                        desc: "For creators, gig workers, and consultants with irregular credit lines.",
                        icon: Laptop
                      },
                      { 
                        value: "business", 
                        label: "Registered Small Business Owner", 
                        desc: "Registered LLC/Partnerships. Turnovers below ₦100M are CIT exempt.",
                        icon: Building2
                      },
                      { 
                        value: "informal", 
                        label: "Market Trader / Informal Worker", 
                        desc: "Micro businesses under ₦12M are 100% exempt. Presumptive tax rules apply.",
                        icon: Store
                      },
                    ].map((item) => {
                      const IconComponent = item.icon;
                      const isActive = incomeType === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setIncomeType(item.value)}
                          className={`w-full rounded-2xl border-2 p-4 text-left transition-all flex items-start gap-3.5 ${
                            isActive
                              ? "border-emerald-500 bg-[#f0fdf4] shadow-sm ring-1 ring-emerald-500/20"
                              : "border-slate-100 bg-white hover:bg-slate-50/80 hover:border-slate-200"
                          }`}
                        >
                          <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                            isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-50 text-slate-400"
                          }`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 space-y-0.5">
                            <span className="block text-xs font-black text-[#0a0f0d]">{item.label}</span>
                            <span className="block text-[10px] leading-relaxed text-slate-400 font-semibold">{item.desc}</span>
                          </div>
                          
                          <div className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                            isActive ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white"
                          }`}>
                            <div className={`h-2.5 w-2.5 rounded-full transition-all ${
                              isActive ? "bg-emerald-600 scale-100" : "bg-transparent scale-0"
                            }`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {incomeType === "salary" ? (
                    <button
                      type="button"
                      onClick={() => setScreen("incomeInput")}
                      className="btn-primary"
                    >
                      Proceed with Manual Entry
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setScreen("statementUpload")}
                        className="btn-secondary h-12 text-xs font-bold"
                      >
                        Upload Bank Statement
                      </button>
                      <button
                        type="button"
                        onClick={() => setScreen("incomeInput")}
                        className="btn-primary h-12 text-xs font-bold"
                      >
                        Proceed with Manual Entry
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* STATEMENT UPLOADER */}
              {screen === "statementUpload" && (
                <section className="premium-card p-6.5 space-y-6 screen-enter">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[9px] font-extrabold text-emerald-800 border border-[#d1fae5]">
                      <UploadCloud className="h-3 w-3" />
                      OCR BANK SCANNER
                    </div>
                    <h2 className="text-xl font-extrabold text-[#064e3b]">Upload your bank statement</h2>
                    <p className="text-xs text-slate-500">Provide your statement in PDF. Secure local parser parses records instantly.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Statement Issuer</label>
                      <div className="grid grid-cols-3 gap-3">
                        {["GTBank", "Access Bank", "Zenith Bank"].map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setStatementBank(bank)}
                            className={`h-11 rounded-2xl border text-xs font-bold transition-all ${
                              statementBank === bank
                                ? "border-emerald-600 bg-[#f0fdf4] text-[#064e3b]"
                                : "border-slate-200 bg-white text-[#0a0f0d]"
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#d1fae5] bg-[#f0fdf4]/50 p-6 text-center hover:bg-[#f0fdf4] transition-colors">
                      <UploadCloud className="h-10 w-10 text-emerald-700 mb-2" />
                      <span className="text-xs font-bold text-[#064e3b]">
                        {statementFileName || "Choose PDF bank statement"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">PDF format only. Run securely on your browser.</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(event) => handleStatementFile(event.target.files?.[0])}
                        className="sr-only"
                      />
                    </label>

                    {statementError && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">{statementError}</p>}

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={loadDemoStatement}
                        disabled={statementParseLoading}
                        className="w-full h-12 flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-xs font-black text-emerald-800 transition-all shadow-sm hover:shadow active:scale-[0.98]"
                      >
                        {statementParseLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                        ) : (
                          <Wand2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                        )}
                        <span>Generate Seeded Statement for {statementBank}</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setScreen("incomeType")}
                        className="btn-ghost text-xs text-center mt-1"
                      >
                        Back to income source
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* STATEMENT REVIEW SCREEN */}
              {screen === "statementReview" && parsedStatement && (
                <section className="space-y-6 screen-enter">
                  <div className="premium-card p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {parsedStatement.bank} PARSER ACTIVE
                        </span>
                        <h2 className="text-lg font-black text-[#064e3b] mt-0.5">Verify and categorise credit lines</h2>
                        <p className="text-xs text-slate-500">Correct classifications to ensure only eligible credits are taxed.</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3.5 py-0.5 text-xs font-bold text-emerald-800">
                        {parsedStatement.transactions.length} Records
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl text-xs font-semibold">
                      {(() => {
                        const totals = statementTotals(parsedStatement.transactions);
                        return (
                          <>
                            <div>
                              <p className="text-slate-400">Total Credits</p>
                              <p className="text-slate-800 font-bold mt-0.5">{formatNaira(totals.grossIncome)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Business Expenses</p>
                              <p className="text-slate-800 font-bold mt-0.5">{formatNaira(totals.businessExpenses)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Transfers Ignored</p>
                              <p className="text-slate-800 font-bold mt-0.5">{formatNaira(totals.ignored)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Assessable Livelihood</p>
                              <p className="text-[#064e3b] font-bold mt-0.5">{formatNaira(Math.max(totals.grossIncome - totals.businessExpenses, 0))}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Transaction loop list */}
                  <div className="space-y-2.5">
                    <p className="section-label">Transaction Records</p>
                    <div className="premium-card overflow-hidden">
                      <div className="divide-y divide-slate-100/80">
                        {parsedStatement.transactions.map((t) => (
                          <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                t.direction === "credit" ? "bg-emerald-50 text-emerald-700 border border-emerald-100/60" : "bg-slate-50 text-slate-500 border border-slate-100"
                              }`}>
                                {t.direction === "credit" ? "CR" : "DR"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{t.description}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{new Date(t.date).toLocaleDateString("en-NG")}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3.5 border-t md:border-0 pt-3 md:pt-0 shrink-0">
                              <span className={`text-xs font-black shrink-0 ${t.direction === "credit" ? "text-emerald-700" : "text-slate-800"}`}>
                                {t.direction === "credit" ? "+" : "-"}{formatNaira(t.amountNaira)}
                              </span>

                              <select
                                value={t.category}
                                onChange={(e) => updateTransactionCategory(t.id, e.target.value)}
                                className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                              >
                                <option value="income">Gross Assessable Income</option>
                                <option value="business_expense">Deductible Business Expense</option>
                                <option value="personal_expense">Personal / Private spend</option>
                                <option value="transfer">Self Transfer (Exempt)</option>
                                <option value="tax_exempt">Legislated Reliefs / Exempts</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setScreen("incomeInput")}
                      className="btn-secondary h-12 text-xs font-bold"
                    >
                      Configure Deductions Relieves
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCalculateFromStatement}
                      disabled={calcLoading}
                      className="btn-primary h-12 text-xs font-bold"
                    >
                      {calcLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Assess statement tax liability"}
                    </button>
                  </div>
                </section>
              )}

              {/* INCOME INPUT SCREEN */}
              {screen === "incomeInput" && (
                <section className="premium-card p-6.5 space-y-6 screen-enter">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-extrabold text-[#064e3b]">Enter annual livelihood details</h2>
                    <p className="text-xs text-slate-500">Specify income values manually. Estimate figures if uncertain.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Annual gross income (₦)</label>
                      <div className="input-flex-wrap">
                        <span className="input-prefix text-[#064e3b] font-black">₦</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={annualIncomeInput}
                          onChange={(e) => setAnnualIncomeInput(toCurrencyInput(e.target.value))}
                          placeholder="3,600,000"
                          className="input-inner"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSideIncomeEnabled((v) => !v)}
                      className="w-full h-12 flex items-center justify-between rounded-2xl border border-slate-200 px-4.5 text-xs font-bold bg-slate-50 transition-all hover:bg-slate-100"
                    >
                      <span>I have supplementary side income</span>
                      <span className={sideIncomeEnabled ? "text-emerald-700" : "text-slate-400"}>
                        {sideIncomeEnabled ? "Enabled (Tap to close)" : "Disabled (Tap to expand)"}
                      </span>
                    </button>

                    {sideIncomeEnabled && (
                      <div className="space-y-2 bounce-in">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Supplemental side income (₦)</label>
                        <div className="input-flex-wrap">
                          <span className="input-prefix text-[#064e3b] font-black">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={sideIncomeInput}
                            onChange={(e) => setSideIncomeInput(toCurrencyInput(e.target.value))}
                            placeholder="600,000"
                            className="input-inner"
                          />
                        </div>
                      </div>
                    )}

                    {calcError && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">{calcError}</p>}

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleCalculate}
                        disabled={calcLoading}
                        className="btn-secondary h-12 text-xs font-bold"
                      >
                        Skip Deductions & Assess
                      </button>
                      <button
                        type="button"
                        onClick={() => setScreen("deductionsWizard")}
                        className="btn-primary h-12 text-xs font-bold"
                      >
                        Apply Deductions Reliefs
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* DEDUCTIONS WIZARD */}
              {screen === "deductionsWizard" && (
                <section className="premium-card p-6.5 space-y-6 screen-enter">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-extrabold text-[#064e3b]">Configure tax reliefs and deductions</h2>
                    <p className="text-xs text-slate-500">
                      Under the Nigeria Tax Act, pension, health schemes, housing fund, and housing rent relief deduct your taxable income.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Pension Contributions</label>
                          <span className="text-[10px] text-slate-400">100% Tax Exempt</span>
                        </div>
                        <div className="input-flex-wrap">
                          <span className="input-prefix text-[#064e3b] font-black">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={pensionInput}
                            onChange={(e) => setPensionInput(toCurrencyInput(e.target.value))}
                            placeholder="240,000"
                            className="input-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">National Housing Fund (NHF)</label>
                          <span className="text-[10px] text-slate-400">2.5% of basic</span>
                        </div>
                        <div className="input-flex-wrap">
                          <span className="input-prefix text-[#064e3b] font-black">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={nhfInput}
                            onChange={(e) => setNhfInput(toCurrencyInput(e.target.value))}
                            placeholder="90,000"
                            className="input-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">National Health Insurance (NHIS)</label>
                          <span className="text-[10px] text-slate-400">Tax Exempt</span>
                        </div>
                        <div className="input-flex-wrap">
                          <span className="input-prefix text-[#064e3b] font-black">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={nhisInput}
                            onChange={(e) => setNhisInput(toCurrencyInput(e.target.value))}
                            placeholder="60,000"
                            className="input-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Housing Rent Paid</label>
                          <span className="text-[10px] text-slate-400">20% Relief (Max ₦500k)</span>
                        </div>
                        <div className="input-flex-wrap">
                          <span className="input-prefix text-[#064e3b] font-black">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={rentInput}
                            onChange={(e) => setRentInput(toCurrencyInput(e.target.value))}
                            placeholder="800,000"
                            className="input-inner"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Life Insurance premiums</label>
                        <span className="text-[10px] text-slate-400">Fully Exempt</span>
                      </div>
                      <div className="input-flex-wrap">
                        <span className="input-prefix text-[#064e3b] font-black">₦</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={lifeInsuranceInput}
                          onChange={(e) => setLifeInsuranceInput(toCurrencyInput(e.target.value))}
                          placeholder="120,000"
                          className="input-inner"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPensionInput(""); setNhfInput(""); setNhisInput(""); setRentInput(""); setLifeInsuranceInput("");
                          handleCalculate();
                        }}
                        className="btn-secondary h-12 text-xs font-bold"
                      >
                        Reset and Calculate
                      </button>
                      <button
                        type="button"
                        onClick={parsedStatement ? handleCalculateFromStatement : handleCalculate}
                        disabled={calcLoading}
                        className="btn-primary h-12 text-xs font-bold"
                      >
                        {calcLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Apply and Calculate"}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* ESTIMATION RESULT SCREEN */}
              {screen === "result" && calculation && (
                <section className="space-y-6 screen-enter">
                  <div className="premium-card p-6.5 space-y-5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        ANNUAL PERSONAL ASSESSMENT
                      </span>
                      <h2 className="text-2xl font-black text-[#064e3b] mt-0.5">Your tax estimate statement</h2>
                    </div>

                    {/* Numeric Hero box */}
                    <div className="bg-[#f0fdf4] border border-[#d1fae5] rounded-3xl p-6.5 text-center space-y-2">
                      <p className="text-xs font-bold text-[#064e3b]">Total Estimated PIT Liability</p>
                      <h3 className="number-hero text-[#064e3b] count-up">
                        {formatNaira(calculation.totalTaxNaira)}
                      </h3>
                      {calculation.effectiveRate > 0 && (
                        <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-100/60 inline-block px-3 py-1 rounded-full border border-[#d1fae5]">
                          Effective Rate: {(calculation.effectiveRate * 100).toFixed(1)}% of total income
                        </p>
                      )}
                    </div>

                    {/* Effective rate spectrum gauge */}
                    {!calculation.smallBusinessExemptionApplied && !calculation.nanoBusinessExemptionApplied && (
                      <div className="space-y-1.5 p-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                          <span>Progressive spectrum</span>
                          <span>Max 25% PIT Bracket</span>
                        </div>
                        <div className="rate-gauge-track">
                          <div
                            className="rate-gauge-fill bg-gradient-to-r from-emerald-400 to-emerald-600"
                            style={{ width: `${Math.min((calculation.effectiveRate / 0.25) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Financial summary blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-5 rounded-2xl text-xs font-semibold text-slate-700">
                      <div>
                        <p className="text-slate-400">Declared annual livelihood</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{formatNaira(calculation.totalIncomeNaira)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Relief Exempt Deductions</p>
                        <p className="text-sm font-bold text-[#064e3b] mt-0.5">-{formatNaira(calculation.totalDeductionsNaira)}</p>
                      </div>
                      <div className="md:col-span-2 pt-2.5 border-t border-slate-200">
                        <p className="text-slate-400">Net Assessable Chargeable Livelihood</p>
                        <p className="text-sm font-black text-slate-800 mt-0.5">{formatNaira(calculation.chargeableIncomeNaira)}</p>
                      </div>
                    </div>

                    {/* Exemptions Flag alerts */}
                    {calculation.smallBusinessExemptionApplied && (
                      <div className="rounded-2xl border border-emerald-100 bg-[#f0fdf4] p-4 flex gap-3">
                        <Sparkles className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-emerald-950">Small Business CIT Exemption Active</h4>
                          <p className="text-[11px] leading-relaxed text-emerald-800 mt-0.5">
                            LLC / Partnerships turnovers below ₦100,000,000 threshold are completely exempted from corporate income tax under the Reform act of 2026.
                          </p>
                        </div>
                      </div>
                    )}

                    {calculation.nanoBusinessExemptionApplied && (
                      <div className="rounded-2xl border border-emerald-100 bg-[#f0fdf4] p-4 flex gap-3">
                        <Sparkles className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-emerald-950">Micro Business Total Exemption Active</h4>
                          <p className="text-[11px] leading-relaxed text-emerald-800 mt-0.5">
                            Micro-enterprises and informal traders with turnouts below ₦12,000,000 are completely exempted from personal income tax bands.
                          </p>
                        </div>
                      </div>
                    )}

                    {calculation.presumptiveTaxApplied && (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex gap-3">
                        <Sparkles className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-amber-950">1% Presumptive Tax Scheme Applied</h4>
                          <p className="text-[11px] leading-relaxed text-amber-800 mt-0.5">
                            Livelihoods in informal sectors above ₦12M but below ₦100M qualify for the flat presumptive 1% turnover rate instead of progressive bands.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Progressive band rows */}
                    {!calculation.smallBusinessExemptionApplied && !calculation.nanoBusinessExemptionApplied && !calculation.presumptiveTaxApplied && calculation.breakdown.length > 0 && (
                      <div className="space-y-2">
                        <p className="section-label">Tax band allocations</p>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 shadow-sm overflow-x-auto">
                          {/* Table Header */}
                          <div className="grid grid-cols-3 gap-1 px-3 py-2.5 border-b border-slate-200 bg-slate-100/70 text-[9px] font-bold uppercase tracking-wider text-slate-500 min-w-[320px]">
                            <span>Band Rate</span>
                            <span className="text-center">Taxable Income</span>
                            <span className="text-right">Tax Due</span>
                          </div>

                          <div className="divide-y divide-slate-100 min-w-[320px]">
                            {calculation.breakdown.map((item, i) => (
                              <div key={i} className="grid grid-cols-3 gap-1 px-3 py-3 items-center text-xs font-semibold hover:bg-white/50 transition-colors">
                                <span className="text-slate-800 font-bold truncate">{item.label}</span>
                                <span className="text-slate-500 font-medium text-center">{formatNaira(item.taxableAmount)}</span>
                                <span className="text-[#064e3b] font-black text-right">{formatNaira(item.taxAmount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PLATFORM CHARGES */}
                    {!calculation.smallBusinessExemptionApplied && !calculation.nanoBusinessExemptionApplied && (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs font-semibold bg-white shadow-sm">
                        <div className="flex justify-between px-4 py-3 bg-slate-50 text-slate-500 border-b">
                          <span>Estimated PIT Liability</span>
                          <span className="text-slate-800 font-bold">{formatNaira(calculation.totalTaxNaira)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 text-slate-500 border-b">
                          <span className="flex items-center gap-1">
                            TaxEasy service fee
                            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-100">1.5%</span>
                          </span>
                          <span className="text-slate-800 font-bold">{formatNaira(calculation.serviceFeeNaira)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3.5 bg-[#f0fdf4] text-[#064e3b] font-black text-sm">
                          <span>Total due for settlement</span>
                          <span>{formatNaira(calculation.totalAmountDueNaira)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4.5 flex gap-3 text-xs leading-relaxed text-slate-500 font-medium">
                    <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <p>{calculation.disclaimer}</p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <button
                      type="button"
                      onClick={resetCalculation}
                      className="btn-secondary h-12 text-xs font-bold md:w-1/3"
                    >
                      Reset Assessment
                    </button>
                    <button
                      type="button"
                      onClick={() => setScreen("paymentMethod")}
                      className="btn-primary h-12 text-xs font-bold md:w-2/3"
                    >
                      Proceed to Secure Settlement
                    </button>
                  </div>
                </section>
              )}

              {/* PAYMENT METHOD SELECTION */}
              {screen === "paymentMethod" && calculation && (
                <section className="premium-card p-6.5 space-y-6 screen-enter">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-extrabold text-[#064e3b]">Select payment remittance mode</h2>
                    <p className="text-xs text-slate-500">Remit settlements securely through integrated partner gateways.</p>
                  </div>

                  {/* Checkout summaries */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs font-semibold">
                    <div className="flex justify-between px-4 py-2.5 text-slate-400 border-b">
                      <span>Assessable tax</span>
                      <span>{formatNaira(calculation.totalTaxNaira)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 text-slate-400 border-b">
                      <span>Remitter fee (1.5%)</span>
                      <span>{formatNaira(calculation.serviceFeeNaira)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 bg-[#f0fdf4] text-[#064e3b] font-black text-sm">
                      <span>Remittance total due</span>
                      <span>{formatNaira(calculation.totalAmountDueNaira)}</span>
                    </div>
                  </div>

                  {/* Payment selections list */}
                  <div className="space-y-3">
                    {[
                      { id: "card", title: "Verify with Credit or Debit card", desc: "Visa, Mastercard, or Verve cards. Instant confirmation.", icon: CreditCard },
                      { id: "bank_transfer", title: "Remit via Instant Bank Transfer", desc: "Generate dynamic virtual accounts for direct transfer.", icon: Landmark },
                      { id: "ussd", title: "Instant USSD Code Remittance", desc: "Initiate secure transactions with mobile network codes.", icon: Smartphone },
                    ].map((method) => {
                      const Icon = method.icon;
                      const isSelected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`payment-method-card ${isSelected ? "selected animate-scale" : ""}`}
                        >
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? "bg-emerald-100 text-[#064e3b]" : "bg-slate-100 text-slate-500"
                          }`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <h4 className="text-xs font-black text-[#0a0f0d]">{method.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{method.desc}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                          }`}>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={paymentLoading}
                    className="btn-primary"
                  >
                    Continue to Payment →
                  </button>
                </section>
              )}

              {/* ── CARD PAYMENT ─────────────────────────────────────────── */}
              {screen === "cardPayment" && calculation && (
                <section className="space-y-4 screen-enter">
                  {/* Live card preview */}
                  <div className="card-scene mx-auto" style={{ maxWidth: 360 }}>
                    <div className={`card-inner ${cardFlipped ? "flipped" : ""}`}>
                      <div className="card-face flex flex-col justify-between p-6" style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 60%,#0d9488 100%)" }}>
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-7 rounded-md" style={{ background: "linear-gradient(135deg,#fcd34d,#f59e0b)" }} />
                          <span className="text-xs font-black text-white/70 tracking-widest">{cardNetwork(cardNumber)?.label || ""}</span>
                        </div>
                        <div>
                          <p className="font-mono text-xl font-black text-white tracking-[0.25em] mb-3" style={{ minHeight: 28 }}>
                            {(cardNumber || "").padEnd(16,"•").match(/.{1,4}/g)?.join(" ")}
                          </p>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Card Holder</p>
                              <p className="text-sm font-bold text-white uppercase tracking-wider">{cardName || "FULL NAME"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-white/50 uppercase tracking-widest mb-0.5">Expires</p>
                              <p className="text-sm font-bold text-white">{cardExpiry || "MM/YY"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="card-back flex flex-col justify-center">
                        <div className="w-full h-10 bg-black/40 mb-4" />
                        <div className="mx-6">
                          <p className="text-[9px] text-white/50 uppercase tracking-widest mb-1">CVV</p>
                          <div className="bg-white/20 rounded-lg px-4 py-2 flex justify-end">
                            <span className="font-mono font-black text-white tracking-widest">{cardCvv ? "•".repeat(cardCvv.length) : "•••"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card form */}
                  <div className="premium-card p-6 space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-extrabold text-[#064e3b]">Enter card details</h2>
                      <p className="text-xs text-slate-500">Visa · Mastercard · Verve accepted</p>
                    </div>

                    <div className="input-flex-wrap">
                      <span className="input-left-chip"><CreditCard className="h-4 w-4 text-[#064e3b]" /><span className="text-[10px] font-black text-[#064e3b] uppercase tracking-wider">Card No</span></span>
                      <input type="tel" inputMode="numeric" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} className="input-right-field font-mono tracking-widest" maxLength={19} />
                      {cardNetwork(cardNumber) && <span className="pr-3 text-[10px] font-black" style={{ color: cardNetwork(cardNumber).color }}>{cardNetwork(cardNumber).label}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="input-flex-wrap">
                        <span className="input-left-chip"><Calendar className="h-4 w-4 text-[#064e3b]" /><span className="text-[10px] font-black text-[#064e3b] uppercase tracking-wider">Exp</span></span>
                        <input type="tel" inputMode="numeric" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} className="input-right-field font-mono" maxLength={5} />
                      </div>
                      <div className="input-flex-wrap">
                        <span className="input-left-chip"><Lock className="h-4 w-4 text-[#064e3b]" /><span className="text-[10px] font-black text-[#064e3b] uppercase tracking-wider">CVV</span></span>
                        <input type="tel" inputMode="numeric" placeholder="•••" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))} onFocus={() => setCardFlipped(true)} onBlur={() => setCardFlipped(false)} className="input-right-field font-mono tracking-widest" maxLength={4} />
                      </div>
                    </div>

                    <div className="input-flex-wrap">
                      <span className="input-left-chip"><UserCheck className="h-4 w-4 text-[#064e3b]" /><span className="text-[10px] font-black text-[#064e3b] uppercase tracking-wider">Name</span></span>
                      <input type="text" placeholder="Full name as on card" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} className="input-right-field uppercase" autoComplete="cc-name" />
                    </div>

                    {cardError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200">
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        <p className="text-xs text-rose-600 font-semibold">{cardError}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-[#f0fdf4] border border-[#d1fae5]">
                      <span className="text-xs font-bold text-slate-500">Total to charge</span>
                      <span className="text-base font-black text-[#064e3b]">{formatNaira(calculation.totalAmountDueNaira)}</span>
                    </div>

                    <button type="button" onClick={() => { if (!canSubmitCard) { setCardError("Please check your card details and try again."); return; } handlePay(); }} className="btn-primary flex items-center justify-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Pay {formatNaira(calculation.totalAmountDueNaira)} Securely
                    </button>

                    <div className="flex justify-center gap-4">
                      {["256-bit SSL","PCI DSS","3D Secure"].map((label) => (
                        <div key={label} className="flex items-center gap-1">
                          <Lock className="h-3 w-3 text-slate-400" />
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── BANK TRANSFER ─────────────────────────────────────────── */}
              {screen === "bankTransfer" && calculation && virtualAccount && (
                <section className="space-y-4 screen-enter">
                  <div className="premium-card p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Landmark className="h-4 w-4 text-[#064e3b]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-[#064e3b]">Bank Transfer Details</h2>
                        <p className="text-xs text-slate-500">Transfer the exact amount, then tap <strong>I Have Paid</strong>.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-center">
                      <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">Amount to Transfer</p>
                      <p className="text-3xl font-black text-amber-700">{formatNaira(calculation.totalAmountDueNaira)}</p>
                      <p className="text-[10px] text-amber-500 mt-1">Transfer exact amount · do not round up or down</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                      {[
                        { label: "Bank Name",      value: virtualAccount.bank },
                        { label: "Account Number", value: virtualAccount.accountNumber, mono: true },
                        { label: "Account Name",   value: virtualAccount.accountName },
                        { label: "Amount",         value: formatNaira(calculation.totalAmountDueNaira) },
                        { label: "Reference",      value: `TAX-${new Date().getFullYear()}-${virtualAccount.accountNumber.slice(-6)}`, mono: true },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label}</p>
                            <p className={`text-sm font-bold text-[#064e3b] mt-0.5 ${row.mono ? "font-mono tracking-wider" : ""}`}>{row.value}</p>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(row.value, setTransferCopied)} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                            <CheckCircle2 className={`h-4 w-4 ${transferCopied ? "text-emerald-500" : "text-slate-400"}`} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button type="button" onClick={() => { const text = `Bank: ${virtualAccount.bank}\nAccount: ${virtualAccount.accountNumber}\nName: ${virtualAccount.accountName}\nAmount: ${formatNaira(calculation.totalAmountDueNaira)}`; copyToClipboard(text, setTransferCopied); }} className={`w-full py-3 rounded-2xl border text-sm font-black transition-all flex items-center justify-center gap-2 ${transferCopied ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-[#064e3b] border-[#064e3b]"}`}>
                      <CheckCircle2 className="h-4 w-4" />
                      {transferCopied ? "✓ Copied to clipboard!" : "Copy All Details"}
                    </button>

                    <div className={`flex items-center justify-center gap-2 py-2 rounded-xl ${transferCountdown < 300 ? "bg-rose-50" : "bg-slate-50"}`}>
                      <Loader2 className={`h-3.5 w-3.5 ${transferCountdown < 300 ? "text-rose-500 animate-spin" : "text-slate-400"}`} />
                      <span className={`text-xs font-black ${transferCountdown < 300 ? "text-rose-500" : "text-slate-500"}`}>
                        Account expires in {formatCountdown(transferCountdown)}
                      </span>
                    </div>

                    <button type="button" onClick={() => setConfirmSheetOpen(true)} className="btn-primary flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      I Have Paid — Confirm Transfer
                    </button>
                  </div>

                  {confirmSheetOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-4 screen-enter">
                        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
                        <div className="text-center space-y-2">
                          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-7 w-7 text-[#064e3b]" />
                          </div>
                          <h3 className="text-lg font-extrabold text-[#064e3b]">Confirm Payment</h3>
                          <p className="text-sm text-slate-500">Have you completed the transfer of <strong className="text-[#064e3b]">{formatNaira(calculation.totalAmountDueNaira)}</strong> to {virtualAccount.bank}?</p>
                        </div>
                        <button type="button" onClick={() => { setConfirmSheetOpen(false); handlePay(); }} className="btn-primary">✓ Yes, I Have Paid</button>
                        <button type="button" onClick={() => setConfirmSheetOpen(false)} className="w-full py-3 rounded-2xl text-sm font-black text-slate-500 hover:text-slate-700">Not yet — go back</button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ── USSD PAYMENT ──────────────────────────────────────────── */}
              {screen === "ussdPayment" && calculation && (
                <section className="space-y-4 screen-enter">
                  <div className="premium-card p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-[#064e3b]" />
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-[#064e3b]">USSD Payment</h2>
                        <p className="text-xs text-slate-500">Select your bank, then dial the code below.</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select your bank</p>
                      <div className="flex flex-wrap gap-2">
                        {USSD_BANKS.map((b) => (
                          <button key={b.bank} type="button" onClick={() => setUssdBank(b.bank)} className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all ${ussdBank === b.bank ? "bg-[#064e3b] text-white border-[#064e3b]" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"}`}>
                            {b.bank}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border-2 border-[#064e3b] bg-[#f0fdf4] px-6 py-5 text-center">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">{ussdBank} USSD Code</p>
                      <p className="font-mono text-3xl font-black text-[#064e3b] tracking-wider">{ussdCode()}</p>
                      <p className="text-[10px] text-slate-500 mt-2">Dial this code on your {ussdBank} registered SIM</p>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-xs font-bold text-amber-600">Amount</span>
                      <span className="text-base font-black text-amber-700">{formatNaira(calculation.totalAmountDueNaira)}</span>
                    </div>

                    <a href={`tel:${ussdCode().replace(/#/g, "%23")}`} className="btn-primary flex items-center justify-center gap-2" style={{ display:"flex", textDecoration:"none", color:"#fff" }}>
                      <Smartphone className="h-4 w-4" />
                      Dial {ussdCode()} Now
                    </a>

                    <button type="button" onClick={() => setConfirmSheetOpen(true)} className="w-full py-3 rounded-2xl border-2 border-[#064e3b] text-sm font-black text-[#064e3b] hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      I Have Paid
                    </button>

                    <p className="text-[10px] text-slate-400 text-center">After dialling, follow your bank&apos;s prompts to complete the transfer. Then tap <strong>I Have Paid</strong>.</p>
                  </div>

                  {confirmSheetOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-4 screen-enter">
                        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
                        <div className="text-center space-y-2">
                          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Smartphone className="h-7 w-7 text-[#064e3b]" />
                          </div>
                          <h3 className="text-lg font-extrabold text-[#064e3b]">Confirm USSD Payment</h3>
                          <p className="text-sm text-slate-500">Have you dialled <strong className="font-mono text-[#064e3b]">{ussdCode()}</strong> and completed the payment of <strong className="text-[#064e3b]">{formatNaira(calculation.totalAmountDueNaira)}</strong>?</p>
                        </div>
                        <button type="button" onClick={() => { setConfirmSheetOpen(false); handlePay(); }} className="btn-primary">✓ Yes, Payment Complete</button>
                        <button type="button" onClick={() => setConfirmSheetOpen(false)} className="w-full py-3 rounded-2xl text-sm font-black text-slate-500 hover:text-slate-700">Not yet — go back</button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* PAYMENT PROCESSING SPINNER */}
              {screen === "paymentProcessing" && (
                <section className="premium-card p-8 text-center space-y-6 screen-enter">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f0fdf4] border border-[#d1fae5] scale-110">
                    <Loader2 className="h-9 w-9 animate-spin text-[#064e3b]" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-black text-[#064e3b]">Processing Livelihood Settlement</h2>
                    <p className="text-xs text-slate-500 max-w-[280px] mx-auto">
                      Remittance details are routing through banking gateways. Do not close or refresh this panel.
                    </p>
                  </div>

                  {/* Processing Step indicators */}
                  <div className="max-w-xs mx-auto border border-slate-100 bg-slate-50 p-4.5 rounded-2xl text-left space-y-3.5">
                    {PROCESSING_STEPS.map((step, idx) => {
                      const isActive = processingStep === idx;
                      const isCompleted = processingStep > idx;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 transition-opacity duration-300 ${
                            isActive ? "opacity-100" : isCompleted ? "opacity-60" : "opacity-30"
                          }`}
                        >
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-[#064e3b] text-white" : "bg-slate-200 text-slate-500"
                          }`}>
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 truncate">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* PAYMENT SUCCESS CELEBRATION */}
              {screen === "paymentSuccess" && paymentRecord && (
                <section className="space-y-4 screen-enter">
                  <div className="hero-card px-6 py-9 text-center text-white flex flex-col items-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 ring-4 ring-emerald-400/30 bounce-in">
                      <CheckCircle2 className="h-9 w-9 text-emerald-300" />
                    </div>
                    <h2 className="text-xl font-black">Settlement Confirmed!</h2>
                    <p className="mt-1 text-xs text-emerald-200">Your remittance has been validated and cleared with the Treasury.</p>
                    <div className="badge-gold mt-4 font-bold">
                      OFFICIAL ₦ RECEIPT ISSUED
                    </div>
                  </div>

                  <div className="premium-card p-6.5 space-y-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Remittance Summary</h3>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      {[
                        { label: "Settlement Total", value: formatNaira(paymentRecord.amountNaira) },
                        { label: "Payment Type", value: paymentMethodLabel(paymentRecord.method) },
                        { label: "Reference No", value: paymentRecord.reference },
                        { label: "Timestamp", value: new Date(paymentRecord.paidAt).toLocaleString("en-NG") },
                        { label: "Taxpayer", value: paymentRecord.name },
                        { label: "Registry ID", value: `${identityType.toUpperCase()} ${paymentRecord.identity}` },
                      ].map((row, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                          <span className="text-slate-400 shrink-0">{row.label}</span>
                          <span className="text-slate-800 font-bold text-right break-all">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setScreen("receipt")}
                        className="btn-secondary h-12 text-xs font-bold"
                      >
                        Print Digital Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => setScreen("tcc")}
                        className="btn-primary h-12 text-xs font-bold"
                      >
                        Generate TCC Certificate
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* DIGITAL RECEIPT */}
              {screen === "receipt" && paymentRecord && (
                <section className="space-y-4 screen-enter">
                  <div className="premium-card p-6.5 space-y-6 relative overflow-hidden">
                    {/* Background paid stamp */}
                    <div className="stamp-paid">PAID TCC</div>

                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <ReceiptText className="h-5.5 w-5.5 text-[#064e3b]" />
                        <div>
                          <h2 className="text-sm font-black text-[#064e3b]">TAX REMITTANCE RECEIPT</h2>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">REPUBLIC OF NIGERIA</p>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          const shareText = `Official Tax Remittance Receipt\nRef: ${paymentRecord.reference}\nAmount: ${formatNaira(paymentRecord.amountNaira)}\nTaxpayer: ${paymentRecord.name}\nIdentity: ${identityType.toUpperCase()} ${paymentRecord.identity}`;
                          if (navigator.share) {
                            try { await navigator.share({ title: 'Tax Clearance Remittance', text: shareText }); } catch (err) {}
                          } else {
                            alert("Copy of receipt details:\n\n" + shareText);
                          }
                        }}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 border hover:bg-slate-100 text-slate-600 transition-colors"
                        aria-label="Share receipt details"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* QR Code and verification box */}
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border rounded-2xl gap-3 text-center">
                      <div className="p-3 bg-white border rounded-xl shadow-sm">
                        <QRCodeSVG
                          value={JSON.stringify({
                            ref: paymentRecord.reference,
                            amt: paymentRecord.amountNaira,
                            taxpayer: paymentRecord.name,
                            date: paymentRecord.paidAt,
                            id: `${identityType.toUpperCase()}:${paymentRecord.identity}`
                          })}
                          size={130}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">Scan to Verify Authenticity</p>
                        <p className="text-[10px] text-slate-400 font-medium">Secured cryptographic signature registered in federal records.</p>
                      </div>
                    </div>

                    {/* Receipt Details rows */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white text-xs font-semibold shadow-sm">
                      {[
                        { label: "Remitter Name", value: paymentRecord.name },
                        { label: "Registry ID", value: `${identityType.toUpperCase()} ${paymentRecord.identity}` },
                        { label: "Receipt Ref", value: `RCP-${paymentRecord.reference}` },
                        { label: "Settlement Ref", value: paymentRecord.reference },
                        { label: "Tax Amount", value: formatNaira(paymentRecord.taxNaira) },
                        { label: "Platform Fee", value: formatNaira(paymentRecord.serviceFeeNaira) },
                      ].map((row, idx) => (
                        <div key={idx} className="flex items-start justify-between px-4 py-3 even:bg-slate-50/40 hover:bg-slate-50/20 transition-colors gap-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] shrink-0 pt-0.5 w-24">{row.label}</span>
                          <span className="text-slate-800 font-extrabold text-right text-xs break-all flex-1">{row.value}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#f0fdf4]">
                        <span className="font-bold text-[#064e3b] uppercase tracking-wider text-[9px]">Total Remitted</span>
                        <span className="text-base font-black text-[#064e3b]">{formatNaira(paymentRecord.amountNaira)}</span>
                      </div>
                    </div>

                    {/* Action links */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setScreen("transparency")}
                        className="flex-1 min-w-[90px] h-11 rounded-xl bg-slate-100 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <PieChart className="h-3.5 w-3.5 shrink-0" />
                        <span>Explore Impact</span>
                      </button>
                      
                      <button
                        onClick={() => window.print()}
                        className="flex-1 min-w-[90px] h-11 rounded-xl bg-slate-100 text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5 shrink-0" />
                        <span>Print Page</span>
                      </button>

                      <button
                        onClick={() => setScreen("tcc")}
                        className="flex-1 min-w-[90px] h-11 rounded-xl bg-emerald-50 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 border border-emerald-200"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span>Get TCC PDF</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setScreen("home")}
                    className="btn-primary"
                  >
                    Done and Continue
                  </button>
                </section>
              )}


              {/* TCC VIEW SCREEN */}
              {screen === "tcc" && paymentRecord && (
                <section className="space-y-4 screen-enter">
                  <div className="premium-card p-6.5 space-y-6 relative overflow-hidden border-2 border-emerald-700/25">
                    {/* Gold Ribbon / Seal */}
                    <div className="absolute top-6 right-6 flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 border-2 border-yellow-200 shadow-md flex items-center justify-center">
                        <Award className="h-6 w-6 text-amber-900" />
                      </div>
                      <span className="text-[7px] font-black text-amber-800 uppercase tracking-widest mt-1">OFFICIAL SEAL</span>
                    </div>

                    <div className="text-center space-y-2 border-b border-emerald-100 pb-5">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0fdf4] border border-[#d1fae5] text-[#064e3b] mb-1">
                        <ShieldCheck className="h-5.5 w-5.5" />
                      </div>
                      <h2 className="text-base font-black text-[#064e3b] tracking-wider uppercase">TAX CLEARANCE CERTIFICATE</h2>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">VERIFIED TAX COMPLIANCE CLEARANCE</p>
                    </div>

                    <div className="border border-emerald-100/60 rounded-2xl overflow-hidden divide-y divide-emerald-50/50 bg-white shadow-sm">
                      {[
                        { label: "Certificate No", value: `TCC-${new Date(paymentRecord.paidAt).getFullYear()}-${paymentRecord.reference.split("-")[2] || "894750"}` },
                        { label: "Taxpayer Name", value: paymentRecord.name },
                        { label: "Taxpayer ID", value: `${identityType.toUpperCase()} ${paymentRecord.identity}` },
                        { label: "Tax Period", value: "2026 Fiscal Tax Year" },
                        { label: "Remittance Ref", value: paymentRecord.reference },
                        { label: "Tax Liability", value: formatNaira(paymentRecord.taxNaira) },
                        { label: "Issuance Date", value: new Date(paymentRecord.paidAt).toLocaleDateString("en-NG") },
                        { label: "Compliance Status", value: "CLEARED & COMPLIANT", highlight: true },
                      ].map(({ label, value, highlight }) => (
                        <div key={label} className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50/10 transition-colors">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 w-24 pt-0.5">{label}</span>
                          <span className={`text-right text-xs break-all flex-1 ${highlight ? "text-emerald-700 font-black uppercase tracking-wider" : "text-slate-800 font-extrabold"}`}>
                            {value}
                          </span>
                          {highlight && (
                            <span className="shrink-0 bg-[#f0fdf4] border border-emerald-200 px-2 py-0.5 rounded-md text-[9px] font-black text-emerald-700 uppercase tracking-wider">✓</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Official PDF Link integration */}
                    <TccDownloadButton record={paymentRecord} identityType={identityType} maskedIdentity={paymentRecord.identity} />

                    <div className="pt-2 border-t border-slate-100 text-center">
                      <button
                        onClick={() => setScreen("transparency")}
                        className="text-xs font-bold text-emerald-700 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <PieChart className="h-3.5 w-3.5" />
                        Explore how your compliance supports development
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setScreen("home")}
                    className="btn-primary"
                  >
                    Done and Return
                  </button>
                </section>
              )}

              {/* HISTORIES */}
              {screen === "history" && (
                <section className="space-y-4 screen-enter">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-extrabold text-[#064e3b]">Remittance Ledger History</h2>
                    <span className="rounded-full bg-[#f0fdf4] border border-[#d1fae5] px-3.5 py-0.5 text-xs font-bold text-emerald-800">
                      {history.length} Filings
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <div className="premium-card p-10 text-center space-y-4">
                      <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                        <History className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-800">No Remittance Ledger History</h3>
                        <p className="text-xs text-slate-400">Your registered tax clearance receipts will compile here.</p>
                      </div>
                      <button
                        onClick={() => setScreen("incomeType")}
                        className="btn-primary max-w-xs mx-auto text-xs"
                      >
                        Assess Livelihood Tax Liability
                      </button>
                    </div>
                  ) : (
                    <div className="premium-card overflow-hidden">
                      <div className="divide-y divide-slate-100/80">
                        {history.map((record) => (
                          <div key={record.reference} className="p-5 space-y-4 hover:bg-slate-50/30 transition-colors relative">
                            {/* Compliant watermark */}
                            <div className="absolute top-1/2 right-6 transform -translate-y-1/2 rotate-[-8deg] border-2 border-emerald-500/10 text-emerald-500/10 font-black uppercase text-[10px] px-2 py-0.5 rounded tracking-widest pointer-events-none">
                              COMPLIANT
                            </div>

                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">
                                  Ref: {record.reference}
                                </p>
                                <h3 className="text-base font-black text-slate-800 mt-1">
                                  {formatNaira(record.amountNaira)}
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                  {new Date(record.paidAt).toLocaleString("en-NG")}
                                </p>
                              </div>

                              <span className="rounded-full bg-[#f0fdf4] border border-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                Confirmed
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-100 text-xs">
                              <button
                                onClick={() => {
                                  setPaymentRecord(record);
                                  setScreen("receipt");
                                }}
                                className="btn-secondary h-9 text-[10px] font-bold"
                              >
                                View Remittance Receipt
                              </button>
                              <button
                                onClick={() => {
                                  setPaymentRecord(record);
                                  setScreen("tcc");
                                }}
                                className="btn-primary h-9 text-[10px] font-bold"
                              >
                                View TCC Certificate
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setScreen("home")}
                    className="btn-secondary mt-2"
                  >
                    Return to Dashboard
                  </button>
                </section>
              )}

              {/* BUDGET TRANSPARENCY SCREEN */}
              {screen === "transparency" && (
                <section className="premium-card p-6.5 space-y-6 screen-enter">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[9px] font-extrabold text-emerald-800 border border-[#d1fae5]">
                      <PieChart className="h-3 w-3" />
                      CITIZEN TRUST LEDGER
                    </div>
                    <h2 className="text-xl font-extrabold text-[#064e3b]">State Capital Budgets & Expenditures</h2>
                    <p className="text-xs text-slate-500">Track and review how tax resources build capital infrastructure in your state.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex gap-3 text-xs leading-relaxed text-amber-900 font-medium">
                      <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                      <p>
                        Capital developmental values are calculated from State Fiscal Planning budgets of 2024. Local values are subject to regional allocations.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select State Constituency</label>
                        <div className="relative">
                          <select
                            value={transparencyStateIdx}
                            onChange={(e) => setTransparencyStateIdx(Number(e.target.value))}
                            className="input-field appearance-none pr-10 font-bold"
                          >
                            {transparencyData.map((data, idx) => (
                              <option key={data.state} value={idx}>{data.state} State Constituency</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#064e3b]" />
                        </div>
                      </div>

                      <div className="hero-card p-5 text-white flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                            Constituency Capital Budget ({transparencyData[transparencyStateIdx].year})
                          </p>
                          <p className="text-2xl font-black mt-1">
                            ₦{(transparencyData[transparencyStateIdx].totalBudget / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })} Billion
                          </p>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-emerald-300" />
                        </div>
                      </div>
                    </div>

                    {/* Spend allocation loop */}
                    <div className="space-y-2.5">
                      <p className="section-label">Top Capital Spending Categories</p>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-150/60 bg-white shadow-sm">
                        {transparencyData[transparencyStateIdx].categories.map((cat, i) => {
                          const percentage = ((cat.amount / transparencyData[transparencyStateIdx].totalBudget) * 100).toFixed(1);
                          return (
                            <div key={i} className="p-4 space-y-2 hover:bg-slate-50/20 transition-colors">
                              <div className="flex justify-between items-center text-xs font-extrabold">
                                <span className="text-slate-800 font-bold text-[10px] uppercase tracking-wider">{cat.name} Development</span>
                                <span className="text-[#064e3b] font-black">{percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100/80 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed flex-1">{cat.description}</p>
                                <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                  ₦{(cat.amount / 1_000_000_000).toFixed(1)}B
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* LGA allocation tables */}
                    <div className="space-y-2">
                      <p className="section-label">Constituency LGA Drilldowns</p>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 shadow-sm">
                        {/* Table Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-100/70 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          <span>Local Authority &amp; Focus</span>
                          <span>Budget Allocation</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {transparencyData[transparencyStateIdx].lgas.length > 0 ? (
                            transparencyData[transparencyStateIdx].lgas.map((lga, i) => (
                              <div key={i} className="flex items-start justify-between px-4 py-3.5 gap-3 hover:bg-white/50 transition-colors">
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs text-slate-800 font-extrabold block">{lga.name} LGA</span>
                                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-semibold">
                                    <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                                    <span className="truncate">{lga.focus}</span>
                                  </div>
                                </div>
                                <span className="text-xs text-[#064e3b] font-black shrink-0 whitespace-nowrap">
                                  ₦{(lga.allocation / 1_000_000_000).toFixed(1)}B
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-5 text-center">
                              <p className="text-xs italic text-slate-400">Drilldown records pending assembly updates.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rep engagement email */}
                    <div className="pt-5 border-t border-slate-150/60 text-center space-y-4">
                      <div className="inline-flex items-center gap-1.5 justify-center rounded-xl bg-slate-50 px-3.5 py-1.5 border border-slate-100/80 mx-auto">
                        <Info className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-bold leading-none">
                          Source: Public State Gazettes & Capital Development Reports
                        </span>
                      </div>
                      
                      <div className="bg-[#f0fdf4]/40 rounded-2xl border border-emerald-100/50 p-4 space-y-2.5 max-w-md mx-auto">
                        <h4 className="text-xs font-extrabold text-[#064e3b] uppercase tracking-wider">Demand Transparency</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">
                          As a tax-paying citizen, you have the right to question regional allocations and developmental timelines. Direct an inquiry directly to your constituency representative.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleEmailRepresentative(transparencyData[transparencyStateIdx].state)}
                          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#064e3b] text-white hover:bg-emerald-950 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                        >
                          <Mail className="h-4 w-4 text-[#10b981]" />
                          Email Local Constituency Representative
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

            </div>

            {/* Bottom Mobile/Tablets Navigation pill */}
            {showBottomNav && (
              <nav className="fixed inset-x-0 bottom-0 z-50 lg:hidden border-t border-[#e2ede7] bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 shadow-[0_-8px_25px_rgba(6,78,59,0.06)] backdrop-blur-md">
                <div className="mx-auto grid w-full max-w-md grid-cols-4 gap-1">
                  {[
                    { id: "home", label: "Dashboard", icon: Home, screen: "home" },
                    { id: "statement", label: "Filing", icon: UploadCloud, screen: "incomeType" },
                    { id: "history", label: "History", icon: History, screen: "history" },
                    { id: "transparency", label: "Impact", icon: PieChart, screen: "transparency" },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeBottomTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => goToMainTab(item.screen)}
                        className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black transition-all ${
                          isActive ? "bg-[#f0fdf4] text-[#064e3b]" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
