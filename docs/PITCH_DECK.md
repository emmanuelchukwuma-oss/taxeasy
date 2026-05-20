# TaxEasy Pitch Deck

## Slide 1: TaxEasy
Pay tax from your bank statement in under 90 seconds.

GovTech/Public Services capstone, TS Academy Product Management, Group 3.

## Slide 2: The Problem
Many Nigerians do not pay tax because the process is confusing, manual, and low-trust.

Key discovery:
- 71% do not pay tax or do not know how to pay.
- 57% have unreported side income.
- 17.4% are uncomfortable sharing BVN upfront.

## Slide 3: The Insight
Users do not always keep clean income records, but their financial activity already exists in bank statements.

Manual self-declaration asks users to guess. TaxEasy starts from real transaction data and lets users review before calculation.

## Slide 4: The Solution
TaxEasy flow:
Upload bank statement -> Auto-categorize transactions -> Review and correct -> Calculate tax -> Verify identity -> Pay -> Get receipt/TCC.

## Slide 5: MVP Scope
Built:
- Phone OTP mock login.
- GTBank statement parser path and sample other-bank flow.
- Keyword categorization.
- Review/correction screen.
- Transaction-based tax calculation.
- Deferred BVN/NIN.
- Mock payment, QR receipt, TCC PDF, history.
- Transparency layer.

Deferred:
- OCR, SMS reading, multi-bank auto-detection, ML categorization, real bank APIs.

## Slide 6: Product Pillars
Simplicity: upload and review before paying.

Proof: QR receipt, TCC PDF, history retrieval.

Trust: state and LGA transparency data.

## Slide 7: Demo Walkthrough
Show:
1. Home dashboard.
2. Upload/use sample statement.
3. Review and correct categories.
4. Calculate tax.
5. Verify BVN/NIN.
6. Pay.
7. Receipt, TCC, history, transparency.

## Slide 8: Technical Execution
Stack:
- Next.js 14, React 18, TypeScript, Tailwind.
- Pure tax calculator utility.
- Pure statement parser/categorizer utility.
- `qrcode.react` receipts.
- `@react-pdf/renderer` TCC generation.
- localStorage for demo-safe state.

Validation:
- Typecheck, tests, lint, and build.

## Slide 9: Metrics
North Star Metric:
Verified digital tax payments completed per month.

Supporting metrics:
- Activation rate.
- TCC issuance rate.
- Transparency engagement.

## Slide 10: GTM
Start with Lagos freelancers and SME owners who need tax proof.

Scale through:
- SME lenders.
- Fintech wallets/banks.
- State revenue boards.
- Tax consultants.

## Slide 11: Roadmap
Next:
- Parser confidence score.
- More bank formats.
- OCR for scanned statements.
- Secure backend persistence.
- Real payment gateway and tax authority integrations.

## Slide 12: Close
TaxEasy turns tax from a confusing declaration exercise into a guided compliance flow based on real financial activity, verifiable proof, and public-sector trust.
