# TaxEasy MVP Decision Log

This document captures the major product and technical decisions made during the development of the TaxEasy MVP. It traces our choices back to user research, technical constraints, and strict scope discipline.

---

## Decision: Let users calculate before BVN/NIN capture
**Context:** When should we ask the user to verify their identity (BVN/NIN) during the flow?
**Options considered:** 
1. Upfront (require identity to even see the dashboard)
2. Deferred (let them calculate liability first, ask for identity only at the payment step)
**Decision:** We chose deferred identity capture (calculate first, verify identity later).
**Why:** Our survey data highlighted a 17.4% "comfort gap" — users are highly skeptical of handing over sensitive data like BVN/NIN to a government-adjacent portal without knowing what they owe first. By letting them calculate anonymously, we build trust and lower the barrier to entry.
**Trade-off accepted:** We lose funnel visibility into user drop-off points before identity verification since we don't capture any identifiers upfront.

---

## Decision: Elevate History from Should Have to Must Have
**Context:** Should a "Payment History" screen be included in the initial MVP?
**Options considered:** 
1. Defer to V2 (focus strictly on a single payment flow)
2. Include in MVP as a core pillar
**Decision:** Elevate History to a "Must Have" for the MVP.
**Why:** The core value proposition of TaxEasy relies heavily on the "Proof" pillar. Our discovery analysis highlighted that "proof without retrieval breaks trust." If a user pays but can't easily find their TCC later, the proof is useless. Continuity is essential for demonstrating value to stakeholders.
**Trade-off accepted:** Added state management complexity and required implementing a custom navigation stack (`navStack`) to handle routing back and forth smoothly.

---

## Decision: Keep Transparency in MVP, not deferred
**Context:** Should we include a feature showing users how their tax money is spent?
**Options considered:** 
1. Build a basic tracker showing national budgets
2. Cut from MVP entirely to save time
3. Build a detailed Transparency Layer with state/LGA drill-downs
**Decision:** Keep and build a detailed Transparency Layer in the MVP.
**Why:** Survey data showed that an overwhelming 82.6% of respondents rated their willingness to pay as a 4 or 5 (out of 5) *if* they could clearly see where their tax money goes. This is the strongest trust signal we discovered, making it a critical differentiator for the demo.
**Trade-off accepted:** Required creating and maintaining static mock datasets (`lib/transparencyData.ts`) and dedicating significant UI real estate and design effort to a non-transactional feature.

---

## Decision: Pure tax calculator utility instead of inline logic
**Context:** How should we implement the Nigerian Personal Income Tax (PIT) calculation logic?
**Options considered:** 
1. Inline logic directly inside the React components
2. Extract as a standalone, pure TypeScript utility function
**Decision:** Extracted into a standalone `lib/taxCalculator.ts`.
**Why:** Tax rules change, and calculations are notoriously error-prone. By extracting the logic into a pure function, we achieved 100% unit test coverage for edge cases (e.g., small business exemptions vs. mixed income), ensuring calculation integrity.
**Trade-off accepted:** There is no meaningful downside. Extracting pure functions is a clean architectural choice with almost no cost, beyond a slight initial overhead in separating UI state from the calculation payload.

---

## Decision: Simplified PIT logic instead of rules-complete
**Context:** How deep should the tax calculation logic go?
**Options considered:** 
1. Implement the complete Nigerian tax code with every possible deduction and edge case
2. Implement a simplified version using standard PIT bands, CRA (Consolidated Relief Allowance), and basic small business exemptions
**Decision:** Implement simplified PIT logic.
**Why:** The goal of the MVP is to demonstrate the *experience* of seamless payment and transparency, not to serve as production-grade accounting software. Simplified logic is sufficient for a demo and keeps development velocity high.
**Trade-off accepted:** Skips precise CRA (Consolidated Relief Allowance) rules, opting for a flat individual exemption instead. This makes exact calculations less technically compliant for complex real-world edge cases.

---

## Decision: localStorage instead of Supabase for app state
**Context:** How should we persist user sessions and payment history?
**Options considered:** 
1. Full backend integration with Supabase Auth and PostgreSQL
2. Client-side persistence using browser `localStorage`
**Decision:** Use `localStorage` for app state.
**Why:** Strict scope discipline. A backend introduces authentication friction, database schema management, and potential network latency during the 5-minute capstone demo. `localStorage` guarantees a lightning-fast, reliable experience that survives page reloads.
**Trade-off accepted:** History and session state are tied to the specific device/browser and cannot be synced across multiple devices.

---

## Decision: Mocked BVN/NIN verification
**Context:** How should we handle identity verification?
**Options considered:** 
1. Integrate with a real KYC provider (e.g., Paystack, Smile Identity)
2. Mock the verification step entirely
**Decision:** Mock the BVN/NIN verification step.
**Why:** Real integrations require API keys, business registrations, and regulatory compliance that are out of scope for a student capstone project. Mocking allows us to demonstrate the *UX flow* of identity capture without the technical and legal overhead.
**Trade-off accepted:** While sufficient for a UX demonstration, this approach bypasses critical KYC requirements and cannot be used in a production environment.

---

## Decision: Demo mode via URL parameter
**Context:** How do we reliably demonstrate a populated app (with history and data) during a 5-minute presentation without doing data entry live?
**Options considered:** 
1. Hardcode demo data into the main app state
2. Require the presenter to manually enter 3 payments before the demo
3. Implement a hidden `?demo=true` URL parameter
**Decision:** Implement a `?demo=true` URL parameter.
**Why:** A URL parameter allows us to instantly seed a rich, realistic state (3 historical records spanning 8 months) with a single click, completely isolated from normal `localStorage` logic. It guarantees a flawless, fast demo.
**Trade-off accepted:** If end-users discover the `?demo=true` parameter in production, they could expose demo data in their UI. Though no persistent data is harmed or leaked, it represents a minor UI misuse case we accept for demo convenience.

---

## Decision: Tech stack choice (Next.js + Vercel + TypeScript)
**Context:** What framework and language should power the MVP?
**Options considered:** 
1. React SPA (Vite/Create React App)
2. Next.js (App Router)
3. Traditional backend MVC (Django/Rails)
**Decision:** Next.js + Vercel + TypeScript.
**Why:** Speed of execution, unified frontend/API routing, strong typing for financial data, and instant zero-config deployments on Vercel.
**Trade-off accepted:** Next.js SSR features are largely unused since state is strictly client-side (`localStorage`), meaning we carry a slightly heavier framework payload than needed for a pure SPA.

---

## Decision: Home dashboard progressive disclosure
**Context:** How to present options on the home screen to signed-in users.
**Options considered:** 
1. Dump all features (Calculate, History, Transparency details) onto one screen
2. Progressive disclosure (High-level CTAs leading to deep dives)
**Decision:** 3 clear CTAs (Calculate, History, Transparency) with hierarchical visual weight.
**Why:** Prevents cognitive overload. The primary action (Calculate) is most prominent, while secondary proof/trust actions are visually distinct but less demanding.
**Trade-off accepted:** Requires users to navigate an extra layer deep to find specific historical records or transparency states, increasing total click count slightly.

---

## Decision: Mock payment always succeeds (no failure path)
**Context:** How to handle the payment processing flow in the MVP.
**Options considered:** 
1. Build both success and failure paths (simulate declined cards, network errors)
2. Only build the happy path (always succeeds)
**Decision:** Only build the happy path.
**Why:** The MVP's goal is to demonstrate the ideal end-to-end journey (Simplicity -> Proof -> Trust). A failure path distracts from the core narrative during a strictly timed 5-minute capstone demo.
**Trade-off accepted:** We cannot currently demonstrate or test how the UI gracefully handles or recovers from declined cards or network timeouts.

---

## Decision: Bank statement upload instead of pure self-declaration
**Context:** Should users type their annual income manually, or should TaxEasy calculate from financial activity they already have in their bank statement?
**Options considered:**
1. Manual self-declaration only
2. Bank statement upload with automatic transaction categorization and user review
3. Real-time bank API integration
**Decision:** Use bank statement upload with keyword-based transaction categorization and a mandatory review/correction step before calculation.
**Why:** Survey data showed 57% of respondents have unreported side income. Asking those users to type an annual income number assumes they already keep accurate records, which is often false. Bank statements give users a concrete starting point, while the review step preserves trust by letting them correct miscategorized transactions before tax is computed.
**Trade-off accepted:** The MVP supports one representative GTBank PDF path and seeded sample data for other banks. OCR, multi-bank auto-detection, real-time bank APIs, SMS reading, and machine-learning categorization are explicitly deferred to V2.
