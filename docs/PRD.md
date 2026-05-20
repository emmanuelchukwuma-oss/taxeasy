# TaxEasy PRD / MVP Spec

## Objective
Build a mobile-first MVP that lets Nigerian users calculate and pay tax from reviewed bank-statement transactions, then receive verifiable proof and transparency context.

## Primary Flow
Phone login -> Upload bank statement -> Parse/categorize transactions -> Review/correct categories -> Calculate tax -> Verify BVN/NIN -> Pay -> Receipt/TCC -> History/Transparency.

## MoSCoW Scope

| Priority | Features |
|---|---|
| Must Have | Phone OTP mock auth, statement upload, GTBank parser path, sample non-GTBank data, keyword categorization, review/correct screen, transaction-based tax calculation, deferred BVN/NIN, mock payment, QR receipt, TCC PDF, payment history |
| Should Have | Demo mode with seeded history and statement, transparency state/LGA view, empty/loading/error states |
| Could Have | Manual income fallback, share receipt, advanced filters in history |
| Won't Have | OCR, SMS reading, real bank API, ML categorization, real BVN/NIN verification, real payment gateway, admin dashboard, help center |

## User Stories

| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US1 | As a taxpayer, I want to sign in with phone OTP so I can access the product quickly. | Phone input accepts Nigerian-style numbers; mock OTP `123456` signs user in; invalid OTP shows error. | Must |
| US2 | As a user, I want to upload a PDF bank statement so I do not need to manually estimate income. | Upload accepts PDFs; rejects non-PDF files; shows parsing/loading feedback. | Must |
| US3 | As a GTBank user, I want TaxEasy to parse my statement so transactions are extracted automatically. | GTBank path returns dated transactions with amounts, descriptions, and credit/debit direction. | Must |
| US4 | As a non-GTBank user, I want a demo path so I can still understand the product flow. | Other-bank selection loads seeded sample transactions and labels them as sample data. | Must |
| US5 | As a taxpayer, I want transactions categorized automatically so I can review faster. | Transactions are tagged as income, business expense, personal expense, transfer, or tax-exempt using keyword rules. | Must |
| US6 | As a taxpayer, I want to correct transaction categories before calculation so I can trust the result. | Each transaction has a category selector; changing it updates totals before calculation. | Must |
| US7 | As a taxpayer, I want tax calculated from reviewed transactions so the bill reflects actual activity. | Income less business expenses becomes assessable income; transfers and tax-exempt inflows are ignored. | Must |
| US8 | As a privacy-conscious user, I want to calculate before BVN/NIN capture so I understand value before sharing identity. | BVN/NIN appears only after estimate and before payment. | Must |
| US9 | As a payer, I want to choose a payment method so the payment flow feels realistic. | Card, bank transfer, and USSD options exist; selected method is shown in receipt/history. | Must |
| US10 | As a payer, I want an instant QR receipt so I can prove payment. | Success screen links to receipt; receipt has QR payload with reference, amount, date, and masked identity. | Must |
| US11 | As a payer, I want a downloadable TCC so I can use it for official proof. | TCC screen generates client-side PDF with payment and masked identity details. | Must |
| US12 | As a returning user, I want payment history so I can retrieve proof later. | History shows saved payments, empty state, receipt and TCC actions. | Must |
| US13 | As a skeptical taxpayer, I want to see where tax goes so I feel more willing to comply. | Transparency screen shows state budget categories and LGA drill-down. | Should |

## Edge Cases

| Case | Expected Behavior |
|---|---|
| User uploads non-PDF file | Show validation error and do not parse |
| Parser cannot support selected bank | Load seeded sample data and clearly label it as sample/non-GTBank |
| Auto-category is wrong | User can manually recategorize before calculation |
| All credits are transfer/tax-exempt | Taxable income becomes zero and payment amount is zero |
| User enters invalid BVN/NIN | Show 11-digit validation error |
| User has no history | Show empty state with guidance |
| PDF generator is slow | Show client-side loading state |

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Mobile-first UX | Optimized for 375px viewport |
| Demo reliability | No required backend dependency for core flow |
| Privacy | Statement and identity data stay client-side in MVP |
| Performance | Main flow should complete in under 90 seconds during demo |
| Testability | Tax rules stay in pure utility functions with unit tests |
| Accessibility | Buttons, inputs, loading states, and empty states are readable and keyboard-accessible |

## Measurement Plan
Track first payment completion, TCC download, transparency view after payment, statement upload started/completed, category correction count, and payment history retrieval.
