# TaxEasy 🇳🇬

> **Pay your Nigerian tax in under 90 seconds.**

TaxEasy is a mobile-first web application that removes every barrier between a Nigerian earner and tax compliance. Upload a bank statement PDF, review auto-categorised transactions, calculate your exact liability under the 2025 Tax Reform Act, pay, and receive an instant Tax Clearance Certificate (TCC) — all without leaving your phone.

**Live URL:** _[add after deploy]_

---

## The Problem

> _"71% of surveyed small earners don't pay tax or don't know how. 82.6% said they would pay if they could see where their money went."_
> — TaxEasy User Survey, May 2026 (n = 23)

The Nigerian tax system isn't broken because people refuse to pay — it's broken because existing tools are confusing, opaque, and demand sensitive information (BVN, NIN) before showing anything useful. TaxEasy was built directly from that survey data.

---

## Core User Flow

```
Sign in with Phone
    ↓
OTP Verification (auto-submits on 6th digit)
    ↓
BVN / NIN Identity Verification
    ↓
Face Verification (browser-native camera)
    ↓
Choose Income Type
    ↓
Upload Bank Statement PDF  ← or  Manual Tax Calculator
    ↓
Review Auto-Categorised Transactions
    ↓
View Tax Estimate
    ↓
Pay (Card / Bank Transfer / USSD)
    ↓
Download TCC PDF with QR Code
    ↓
Transparency Layer (see where tax goes)
```

---

## Features

| Feature | Description |
|---|---|
| 📱 **Phone + OTP auth** | 6-digit auto-submit, no confirm button needed |
| 🪪 **BVN / NIN verification** | Seeded NIBSS-style profile from 11-digit number |
| 📷 **Face verification** | Browser-native `FaceDetector` API, zero external deps |
| 📄 **PDF statement parser** | GTBank format + seeded fallback for all other banks |
| 🧮 **Tax calculator** | 2025 Nigeria PIT Reform Act bands, full relief stack |
| 💳 **Multi-method payment** | Card, bank transfer, USSD — all simulated |
| 📋 **TCC PDF generator** | `@react-pdf/renderer`, QR code, printable A4 |
| 📊 **Transparency layer** | Visual breakdown of how FIRS allocates tax revenue |
| 💾 **Session persistence** | `localStorage` — no backend login required |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript + React 18 |
| Styling | Vanilla CSS + Tailwind CSS utility classes |
| Icons | Lucide React |
| PDF generation | `@react-pdf/renderer` |
| QR codes | `qrcode.react` |
| Charts | Recharts |
| Face detection | Browser-native `window.FaceDetector` (Shape Detection API) |
| Storage | Browser `localStorage` |
| Backend (future) | Supabase (schema in `supabase-setup.sql`) |

---

## Project Structure

```
taxeasy/
├── app/
│   ├── page.js          # Main SPA — single state-machine with ~30 screens
│   ├── globals.css      # Full design system (tokens, components, animations)
│   └── layout.js        # Root layout, meta tags, font loading
│
├── components/
│   ├── FaceEngine.js    # Browser-native face detector (FaceDetector API + fallback)
│   └── TccPDF.js        # Tax Clearance Certificate PDF renderer
│
├── lib/
│   ├── taxCalculator.ts     # Nigeria 2025 PIT bands, relief calculations
│   ├── bankStatement.ts     # PDF statement parser + seeded statement builder
│   └── transparencyData.ts  # FIRS revenue allocation data
│
├── tests/
│   └── taxCalculator.test.ts  # Unit tests for all tax calculation logic
│
├── docs/                # Architecture diagrams and decision logs
├── supabase-setup.sql   # Database schema for future backend migration
├── next.config.js       # Webpack config (fs/path polyfills for PDF renderer)
└── tailwind.config.js   # Tailwind theme extensions
```

---

## Local Setup

**Requirements:** Node.js 18+, npm

```bash
# 1. Clone
git clone https://github.com/your-org/taxeasy.git
cd taxeasy

# 2. Install
npm install

# 3. (Optional) Configure environment
#    Supabase keys are only needed for the database backend — the app
#    runs fully on localStorage without them.
cp .env.example .env.local   # edit with your Supabase URL + anon key

# 4. Start dev server
npm run dev

# 5. Open in Chrome (recommended for FaceDetector API support)
open http://localhost:3000
```

> **Tip:** Use Chrome DevTools → Device Mode → 390px width for the best mobile experience.

---

## Face Verification

The face verification screen uses the browser's built-in **[Shape Detection API](https://developer.mozilla.org/en-US/docs/Web/API/FaceDetector)** (`window.FaceDetector`). No external libraries, no CDN WASM downloads.

| Browser | Behaviour |
|---|---|
| Chrome / Edge / Android Chrome | Real `FaceDetector` — detects actual face landmarks |
| Firefox / Safari | Fallback — checks video stream is active (camera still required) |

Camera access is **hard-blocked**: no camera = no proceed. The captured video frame is never stored or transmitted.

---

## Tax Calculation Logic

Located in [`lib/taxCalculator.ts`](lib/taxCalculator.ts).

**2025 Nigeria PIT Reform Act bands:**

| Taxable Income | Rate |
|---|---|
| First ₦800,000 | 0% (exempt) |
| Next ₦2,200,000 | 15% |
| Next ₦9,000,000 | 18% |
| Next ₦13,000,000 | 21% |
| Above ₦25,000,000 | 24% |

**Reliefs supported:** NHF, NHIS, pension (8% of gross), life insurance, CRA (20% of gross + ₦200,000), business expenses (from bank statement).

---

## Scripts

```bash
npm run dev        # Development server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
npm run typecheck  # TypeScript type check (no emit)
npm run test       # Run unit tests (tax calculator)
```

---

## Environment Variables

Create `.env.local` for Supabase (optional):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The app is fully functional without these — all state is kept in `localStorage`.

---

## Known Limitations

- **Bank statement parsing:** Supports GTBank format natively. All other banks use seeded sample data.
- **Payments:** Fully simulated — no real money moves. Payment gateway integration is the next production step.
- **Identity verification:** BVN/NIN lookup is seeded (deterministic from the input number). Real NIBSS API integration required for production.
- **Face verification:** Uses the browser's `FaceDetector` API. Falls back to video-stream presence check on Firefox/Safari.
- **Session storage:** `localStorage` only — no cross-device sync.

See [`TECH_DEBT.md`](TECH_DEBT.md) for the full migration roadmap.

---

## Contributing

1. Fork → create feature branch: `git checkout -b feat/your-feature`
2. Commit: `git commit -m "feat: describe your change"`
3. Push and open a Pull Request

---

## Licence

MIT — see [LICENSE](LICENSE)
