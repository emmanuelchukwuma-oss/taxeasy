# TaxEasy Product Brief

## One-Line Summary
TaxEasy helps Nigerian earners upload a bank statement, review automatically categorized transactions, calculate tax from real financial activity, pay, and receive verifiable proof.

## Problem
Many Nigerian SMEs, freelancers, salary earners with side income, and informal earners do not pay tax because the process is confusing, opaque, and disconnected from how they actually track money. In our survey of 23 respondents, 71% do not pay tax or do not know how to pay, and 57% have unreported side income.

## Target Users

| Persona | Need |
|---|---|
| Emeka, software developer with freelance income | Needs clarity on tax owed from side income |
| Bisi, fabric retailer | Needs proof of tax compliance for SME loan applications |
| Funke, admin officer | Needs a way to understand liability if employer remittance is unreliable |

## MVP Scope

| Included | Not Included |
|---|---|
| Phone + OTP mock authentication | Admin dashboard |
| Bank statement upload UI | Help center call/chat support |
| GTBank PDF demo parser | OCR for scanned PDFs |
| Seeded sample statements for other banks | Multi-bank auto-detection |
| Keyword transaction categorization | ML categorization |
| User review and category correction | Real bank API integration |
| Tax calculation from reviewed transactions | Real BVN/NIN verification |
| Deferred BVN/NIN capture at payment | Real payment gateway |
| Mock payment, QR receipt, TCC PDF, history | SMS reading |
| State/LGA transparency layer | Production-grade tax advisory |

## Product Pillars

| Pillar | MVP Evidence |
|---|---|
| Simplicity | Upload statement, review categories, calculate before identity capture |
| Proof | QR receipt, downloadable TCC, payment history |
| Trust | Transparency layer showing state and LGA budget breakdowns |

## Success Metrics
North Star Metric: verified digital tax payments completed per month.

Supporting metrics:
- Activation rate: users who complete first payment within 24 hours.
- TCC issuance rate: payments resulting in TCC download.
- Transparency engagement: paying users who view the transparency layer.

## Strategic Rationale
Manual self-declaration asks users to invent a number many of them do not track. Bank statements give users a concrete starting point, while the review step keeps the user in control and protects trust.
