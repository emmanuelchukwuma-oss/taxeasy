# TaxEasy — Tech Debt Tracker

> Last updated: 2026-05-20 (post bank-statement pivot)

This document tracks known shortcuts, deferred work, and risks. It exists so the team (and judges) can see what we're aware of and what we'd fix with more time.

---

## 🔴 High Priority (would break under real-world use)

### 1. Limited persistence — history is local to one browser
- **Impact:** High in production. Payment history persists in `localStorage`, but it is still device/browser-bound and cannot sync across devices.
- **Why:** MVP speed and demo reliability. We deferred Supabase persistence for the tax-payment flow to a future increment.
- **Fix:** Persist user sessions, parsed statements, payment records, and TCC references to Supabase with row-level security.

### 1b. [RESOLVED 2026-05-20] `SMALL_BUSINESS_EXEMPTION_NAIRA` check only uses main income
- **Impact:** High (Could affect calculation accuracy? Yes. A business owner with ₦95M main + ₦10M side would incorrectly receive the exemption when their combined ₦105M exceeds the ₦100M threshold.)
- **Why:** Unclear from the 2026 Tax Act whether side income should factor into the CIT threshold. We went conservative.
- **Fix:** Changed logic to check `totalIncomeNaira <= SMALL_BUSINESS_EXEMPTION_NAIRA`.

### 2. Auth is entirely simulated
- **Impact:** OTP is hardcoded to `123456`. No real phone verification. Anyone can access the app.
- **Why:** Real OTP requires Twilio/Termii integration and backend infrastructure. Out of scope for hackathon demo.
- **Fix:** Integrate Termii (or Firebase Auth phone) for real OTP delivery and verification.

### 3. Payment is simulated (no payment gateway)
- **Impact:** No money actually moves. Payment references are randomly generated, not from a real payment processor.
- **Why:** Real payment integration (Paystack/Flutterwave) requires merchant accounts, webhooks, and compliance review.
- **Fix:** Integrate Paystack, handle webhook confirmation, generate real transaction references.

### 4. Identity verification is simulated
- **Impact:** BVN/NIN numbers are accepted without validation against NIMC/NIBSS. Any 11-digit string works.
- **Why:** Real BVN/NIN verification requires API partnerships with NIBSS/NIMC (paid, slow approval).
- **Fix:** Integrate a KYC provider (e.g., Smile Identity, Youverify) for real identity verification.

### 4b. Bank statement parser is MVP-limited
- **Impact:** The current parser demonstrates the GTBank path and uses seeded sample transactions. It is not robust enough for arbitrary statement layouts.
- **Why:** Scope discipline. Multi-bank statement parsing, OCR, and bank API integrations would create a larger technical surface than the capstone MVP needs.
- **Fix:** Add structured parsers per bank, statement format detection, parser confidence scores, and secure server-side document processing.

---

## 🟡 Medium Priority (would cause friction at scale)

### 5. Single-file component (`app/page.js`)
- **Impact:** All screens live in one file. Hard to maintain, test, and review.
- **Why:** Incremental development — started small, grew organically. Screen-per-file refactor was not worth the risk mid-sprint.
- **Fix:** Extract each screen into its own component: `WelcomeScreen.tsx`, `PhoneScreen.tsx`, etc. Share state via context or a lightweight state manager.

### 6. Keyword categorization can misclassify transactions
- **Impact:** Medium. A vague narration such as "transfer from client" could be tagged incorrectly.
- **Why:** Keyword rules are explainable and fast enough for MVP. ML categorization is intentionally deferred.
- **Fix:** Add confidence scoring, richer merchant dictionaries, correction learning, and ML-assisted categorization after validating enough transaction data.

### 7. Metadata/SEO is stale from the survey era
- **Impact:** Page title still says "Help Us Build Something Useful — Tax Survey" and meta description references a survey. Misleading for the MVP product.
- **Why:** Haven't updated layout.js metadata since Increment 1 pivoted from survey to tax calculator.
- **Fix:** Update `app/layout.js` metadata to reflect "TaxEasy — Calculate and pay your tax in 90 seconds".

### 8. ESLint using deprecated v8
- **Impact:** Next.js 14.2.5 bundles ESLint 8 support. ESLint 8 is EOL. No security risk for now, but upgrading to Next.js 15+ will require ESLint 9+.
- **Why:** Version compatibility with current Next.js.
- **Fix:** Upgrade to Next.js 15 + ESLint 9 together when ready.

### 9. Tax bands are hardcoded — no remote config
- **Impact:** If Nigerian tax rates change, we need a code change and redeploy.
- **Why:** MVP — rates are unlikely to change before demo.
- **Fix:** Move tax band configuration to a remote config (Supabase table or environment variable).

### 9b. No OCR for scanned PDFs
- **Impact:** Users with image-only/scanned statements cannot be parsed.
- **Why:** OCR adds accuracy, privacy, and processing complexity.
- **Fix:** Add OCR as a V2 path with explicit consent, confidence warnings, and manual correction fallback.

---

## 🟢 Low Priority (nice-to-have improvements)

### 10. No error boundaries or fallback UI
- **Impact:** If a runtime error occurs, the app shows a white screen.
- **Why:** Unlikely during controlled demo. Not worth the complexity yet.
- **Fix:** Add React Error Boundary with a friendly "Something went wrong" fallback.

### 11. No analytics or event tracking
- **Impact:** We can't measure funnel drop-off (e.g., how many users reach payment vs. abandon at identity).
- **Why:** Not needed for hackathon demo.
- **Fix:** Add lightweight event tracking (Mixpanel, PostHog, or even custom Supabase events).

### 12. Survey code still ships in the bundle
- **Impact:** `lib/questions.js`, `app/results/page.js`, `app/admin/`, and related API routes are legacy survey code that still compiles and ships. Adds ~160KB to first-load JS for `/results`.
- **Why:** Not hurting the main page. Removal requires careful verification that nothing depends on those routes.
- **Fix:** Remove or gate behind a feature flag once we confirm nothing references them.

### 13. npm audit shows vulnerabilities
- **Impact:** 8 vulnerabilities (1 moderate, 6 high, 1 critical) from transitive dependencies (mostly dev tooling).
- **Why:** Common in the Node ecosystem. None are in production runtime code paths.
- **Fix:** Run `npm audit fix` and evaluate breaking changes. Consider upgrading Next.js.

### 14. [RESOLVED 2026-05-20] Hardcoded back-navigation history
- **Impact:** Low (Only an engineer would notice? Yes. The "Back" arrow logic in the header has hardcoded previous states, which might get complicated and error-prone as we add more navigation paths like History.)
- **Why:** Simple state management for a linear flow.
- **Fix:** Implemented a proper dynamic navigation history stack `navStack` during Increment 3.

### 15. Floating point precision in tax calculations
- **Impact:** Low (Only an engineer would notice? Yes. `totalTaxNaira` can have floating point noise. Not visible in UI because `formatNaira` rounds, but could affect exact comparisons.)
- **Why:** Standard JavaScript number behavior.
- **Fix:** Round to 2 decimal places at the end of calculation, or use integer arithmetic (kobo instead of naira).

### 16. Refreshing mid-flow resets to Welcome screen
- **Impact:** Low (Users might lose their flow if they manually hit refresh).
- **Why:** Navigation uses React `useState` (`screenState`) instead of Next.js URL routing (`/payment`, `/receipt`, etc.). Even though `localStorage` persists history, the current session flow is lost.
- **Fix:** Refactor navigation to use Next.js App Router for distinct URLs.

---

## Items Addressed in This Validation Gate

| Item | Status |
|------|--------|
| `annualIncomeValue` / `sideIncomeValue` unused variables | ✅ Not present in codebase (already clean) |
| Dead ternary `identityType === "bvn" ? 11 : 11` | ✅ Fixed — simplified to `const minLen = 11` |
| Test assertions for PIT band calculation | ✅ Fixed — tests now match correct calculator output |
| ESLint not configured | ✅ Fixed — `.eslintrc.json` added, eslint-config-next@14.2.5 installed |
| TypeScript strict mode | ✅ Passing clean |
| Production build | ✅ Passing clean |
| Small business exemption calculation bug | ✅ Fixed — now uses total income including side income |
| Hardcoded back-navigation history | ✅ Fixed — implemented `navStack` dynamic tracking |
| Bank-statement calculation path | ✅ Added — parser/categorizer utility, review screen, and transaction-based calculator tests |
