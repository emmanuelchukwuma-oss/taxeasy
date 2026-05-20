# TaxEasy: 5-Minute Capstone Demo Script

## 1. The Setup (Before Demo Starts)
- **URL to open:** `[Deployed URL]/?demo=true`
- **Device:** Present on a laptop, but **MUST** use Chrome Developer Tools toggled to Device Mode (375px width, e.g., iPhone SE/12 screen size) to show the mobile-first design.
- **Landing State:** The screen should show the "Home" dashboard with the amber "DEMO MODE" badge visible in the top right. 
- **Pre-check:** Run `npm run dev` in a terminal and load `localhost:3000/?demo=true` in a background browser tab BEFORE the demo begins. This ensures instant failover if the deployed URL fails mid-presentation. Before you start, quietly click "History" to ensure the 3 demo records loaded correctly, then click "Back" to return to Home.

---

## 2. The 5-Minute Walkthrough

| Time | What You Say (Verbatim) | What You Click / Show |
| :--- | :--- | :--- |
| **0:00 - 0:30**<br/>*(The Hook)* | "Good morning. In Nigeria, nearly half of small earners — 48% — either don't pay tax or don't know how. The system isn't broken because people refuse; it's broken because the existing tools are too confusing to even try. Today, we're showing you a better way. Meet **TaxEasy**." | Leave on **Home dashboard**. Let the judges see the clean interface. |
| **0:30 - 1:00**<br/>*(The Insight)* | "Our survey of 30+ Nigerians surfaced two critical insights. First, 17% are deeply uncomfortable handing over their BVN to digital tax platforms — which is why we let users calculate first and verify identity only when they're ready to pay. Second, 82% told us they'd be more willing to pay if they could clearly see where the money goes — which is why we built the Transparency Layer." | Point briefly to the three main cards: Calculate, History, and Transparency. |
| **1:00 - 2:15**<br/>*(Simplicity)* | "Let’s start a new payment. Instead of asking users to guess their annual income, TaxEasy starts from financial activity they already have: their bank statement. For this MVP, we parse a GTBank PDF and auto-categorize income, business expenses, personal expenses, transfers, and exempt inflows. The user stays in control by reviewing and correcting each category before tax is calculated. Only when they're ready to pay do we ask for BVN or NIN." | Click **Upload statement**. Click **Use sample statement**. Review the transaction list. Change one transaction category to show correction. Click **Calculate from reviewed statement**. Review estimate. Click **Proceed to payment**. Enter `12345678901`. Click **Verify**. Select **Card**. Click **Pay**. |
| **2:15 - 3:15**<br/>*(Proof)* | "The payment succeeds. But our research showed that *proof without retrieval breaks trust*. So, we instantly generate a receipt with a scannable QR code for on-the-spot verification. And for long-term proof, users can download an official Tax Clearance Certificate directly to their device." | Show **Success** screen. Click **View Receipt**. Show QR code. Click **Get TCC**. Click **Download PDF** (open PDF if possible to show official layout). |
| **3:15 - 4:00**<br/>*(Trust)* | "But the journey doesn't end there. To close that 82% willingness-to-pay gap, we built the Transparency Layer. Directly from the receipt, a taxpayer can see exactly how their state spends this money—down to the specific projects in their Local Government Area." | From TCC or Receipt, click **Where does this money go?** Scroll through the **Transparency** view. Change the dropdown to **Lagos State**. Show the LGA Drill-Down. |
| **4:00 - 4:30**<br/>*(Differentiation)* | "Unlike existing portals that act merely as collection buckets, TaxEasy integrates a complete *trust-and-proof loop*. We traded a complex, rules-heavy backend for a frictionless, mobile-first experience that actually converts skeptical users." | Click back to **Home**. Click **History** to show that the new payment joined the existing demo records. |
| **4:30 - 5:00**<br/>*(Close)* | "Next on our roadmap is OCR for scanned statements, multi-bank format detection, and FIRS/state revenue API integration. TaxEasy isn't just about collecting revenue; it's about rebuilding the social contract. Thank you." | Leave on **History** or **Transparency** screen as a backdrop for Q&A. |

---

## 3. Anticipated Questions + Prepared Answers

**1. "Why didn't you integrate with real FIRS / NIMC APIs?"**
*Answer:* "Real integrations require complex regulatory approvals and business KYC that are out of scope for a student MVP. We focused purely on proving the UX flow and validating the trust loop, which FIRS could easily adopt."

**2. "How would this scale to 200 million Nigerians?"**
*Answer:* "By keeping the frontend incredibly lightweight and shifting to edge computing for the pure tax logic. In a real deployment, we would also roll out a USSD version for the 50% of Nigerians without smartphones."

**3. "What's your monetization model?"**
*Answer:* "We propose a B2G (Business-to-Government) SaaS model. The government pays a small percentage fee per successful transaction, as our platform increases overall tax compliance and revenue collection."

**4. "What happens if BVN data is breached?"**
*Answer:* "In this MVP, we don't persist BVN data anywhere—not even in localStorage. In production, we would use tokenized API calls to NIMC so the BVN never touches our database."

**5. "How is this different from FIRS TaxPro Max?"**
*Answer:* "TaxPro Max is built for accountants and corporations. TaxEasy is built for the everyday citizen. We prioritize mobile-first design, plain English, and proactive transparency, which TaxPro Max lacks."

**6. "What did your user research actually tell you?"**
*Answer:* "Two massive insights: First, users abandon flows if asked for BVN before they see their tax bill. Second, 82% of respondents rated their willingness to pay as a 4 or 5 out of 5 *only if* they could see where the money goes."

**7. "Why did you use localStorage instead of a real database for history?"**
*Answer:* "Scope discipline. A full database requires authentication walls, which introduces friction. LocalStorage gave us a 100% reliable, zero-latency way to demo the 'Proof' pillar without building a login system."

**8. "What would you build next?"**
*Answer:* "A USSD interface (`*123#`) for offline users, and a direct API pipe to the State Boards of Internal Revenue for real-time receipt validation."

**9. "How accurate is your bank statement parser?"**
*Answer:* "For the MVP, we intentionally support one representative GTBank format and clearly route other banks through sample data. The product point we're validating is the upload-review-pay journey. Production accuracy would require bank-specific parsers, confidence scores, and a manual review fallback."

**10. "What if TaxEasy categorizes a transaction wrongly?"**
*Answer:* "That is why the review screen is mandatory. We do not compute tax immediately after parsing. The user can correct income, expenses, transfers, and exempt transactions before calculation, which protects trust and gives us a clear path to improve categorization later."

---

## 4. Backup Plans

- **If the internet goes down:** The deployed MVP is a Next.js app, but it relies heavily on client-side state. Have a local instance running (`npm run dev`) on the presenter's laptop beforehand. If both fail, have the `/docs/screenshots/` folder open and walk through the images.
- **If the live deployment URL fails:** Switch immediately to the `localhost:3000/?demo=true` instance running in the background. 
- **If the PDF generator hangs:** React-PDF can sometimes be heavy on older devices. If it spins for more than 5 seconds, say: *"The PDF is generating locally for privacy, but in the interest of time, let me show you the transparency layer,"* and click the link below the button.
- **If you run out of time:** Cut the "Differentiation" section. Finish the Transparency layer, deliver the final sentence ("rebuilding the social contract"), and stop.

---

## 5. Roles (Demo Day Team)

*(Fill in actual names before the presentation)*

- **The Presenter:** [Name] (Speaks the script, maintains eye contact with judges, handles pacing)
- **The Driver:** [Name] (Operates the mouse/keyboard, perfectly timed with the presenter's words)
- **The QA Anchor:** [Name] (Takes lead on answering the technical/research questions during the Q&A)
