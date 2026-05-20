# TaxEasy Metrics Plan

## North Star Metric
**Verified digital tax payments completed per month**

This measures the product's core outcome: users are not just browsing or estimating; they are completing tax compliance actions with proof.

## Supporting Metrics

| Metric | Definition | Why It Matters |
|---|---|---|
| Activation rate | Percentage of new users who complete first payment within 24 hours | Shows whether the upload-review-pay flow converts |
| TCC issuance rate | Percentage of payments that result in TCC download | Measures proof value delivery |
| Transparency engagement | Percentage of paying users who view the transparency layer | Measures whether the trust pillar is being used |

## Event Tracking Plan

| Event | Properties |
|---|---|
| `statement_upload_started` | bank_selected |
| `statement_parsed` | bank, source, transaction_count |
| `transaction_category_changed` | from_category, to_category |
| `tax_calculated` | gross_income, deductible_expenses, taxable_income, tax_due |
| `identity_started` | identity_type |
| `payment_completed` | method, amount, reference |
| `receipt_viewed` | reference |
| `tcc_downloaded` | reference |
| `transparency_viewed` | state |

## MVP Targets

| Metric | Demo/MVP Target |
|---|---|
| Activation rate | 40% of test users complete a first mock payment |
| TCC issuance rate | 60% of completed payments lead to TCC view/download |
| Transparency engagement | 50% of paying users open the transparency layer |
