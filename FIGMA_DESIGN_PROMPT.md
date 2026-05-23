# TaxEasy — Complete Figma Design Prompt

> Paste this entire prompt into Figma AI, Figma's "Make designs" feature, or hand to a UI designer as a full spec.

---

## PROJECT OVERVIEW

Design a **mobile-first Nigerian tax filing and payment app** called **TaxEasy**. The app targets Nigerian SMEs, freelancers, salary earners with side income, and informal earners. It must feel like a **premium ₦100M fintech product** — think Paystack, Moniepoint, and Stripe combined, but tuned for Nigerian culture and trust signals.

The app is a **single-page SPA** rendered inside a mobile frame (390×844px — iPhone 14 viewport). All screens except the dashboard have a **persistent sidebar on desktop** (1440px wide), but mobile is the primary design target.

---

## DESIGN SYSTEM (implement as Figma variables/tokens)

### Color Palette
```
Primary Forest Green:  #064e3b   ← brand primary, headers, CTAs
Forest Mid:            #065f46   ← hover states
Emerald Active:        #10b981   ← success states, progress, active pills
Emerald Light:         #34d399   ← highlights, accents
Gold Accent:           #f59e0b   ← warnings, premium indicators
Gold Light:            #fcd34d   ← gold tints
Ink (text):            #0a0f0d   ← body text
Mist (background):     #f0f4f2   ← app background
Rose Error:            #f43f5e   ← errors and destructive states
White:                 #ffffff
Slate 100:             #f1f5f9   ← subtle borders/dividers
Slate 200:             #e2e8f0   ← card borders
Slate 400:             #94a3b8   ← secondary text
Slate 500:             #64748b   ← tertiary text
Emerald 50:            #ecfdf5   ← tinted backgrounds
Emerald Green bg:      #d1fae5   ← input borders (unfocused)
```

### Typography — Inter (Google Fonts)
```
Display / Hero:    Inter Black (900), 28–32px, tracking -0.02em
Page title:        Inter ExtraBold (800), 20–24px
Section heading:   Inter Bold (700), 16–18px
Card label:        Inter Bold (700), 12–14px, uppercase, tracking 0.08em
Body:              Inter SemiBold (600), 13–14px
Caption / meta:    Inter Medium (500), 10–11px
Mono (OTP/codes):  Inter Black (900), 20px, letter-spacing 0.4em
```

### Spacing & Shape
```
Card border-radius:    24px (1.5rem)
Button border-radius:  14px (0.875rem)
Input border-radius:   14px (0.875rem)
Icon chip radius:      12px (0.75rem)
Card padding:          28px (1.75rem)
Card shadow:           0 4px 16px rgba(6,78,59,0.10), 0 2px 6px rgba(6,78,59,0.06)
Sidebar width:         280px (desktop)
Bottom nav height:     72px
Top header height:     64px
```

### Component Library

**Primary Button (btn-primary)**
- Full-width, height 52px, border-radius 14px
- Background: linear-gradient(135deg, #064e3b 0%, #065f46 100%)
- Text: white, Inter ExtraBold 14px uppercase tracking 0.05em
- Icon: Chevron Right or Loader spinner on right
- Hover: lift shadow + 2px translateY
- Disabled: opacity 40%

**Ghost Button (btn-ghost)**
- Transparent background, #064e3b text
- Underline on hover

**Premium Card**
- White background, 24px border-radius
- Shadow: 0 4px 16px rgba(6,78,59,0.10)
- Border: 1px solid rgba(209,250,229,0.6)

**Input Row (flex-row pattern)**
- Height 52px, border-radius 14px
- Border: 1.5px solid #d1fae5 (emerald-200)
- Focus border: 1.5px solid #10b981 + ring glow rgba(16,185,129,0.2)
- Left chip: 48–56px wide, bg #f8fafc, right divider border
- The chip holds a prefix (flag + dial code, or icon + label)
- Input right side: flex-1, no border, transparent bg
- Right side: counter or status icon (16px wide)

**Verified Badge**
- Pill shape, bg #ecfdf5, border #d1fae5
- CheckCircle icon (12px) + "ID Verified" text in emerald-700
- Font: Inter Bold 10px uppercase tracking 0.08em

**Trust Strip**
- Horizontal row of 3 items: icon + label
- Icons: Lock, ShieldCheck, Smartphone (12px, slate-400)
- Labels: "NIBSS Secure", "FIRS Compliant", "256-bit Encrypted"
- Font: 9px, uppercase, slate-400

---

## SCREEN-BY-SCREEN SPECIFICATIONS

### SCREEN 1 — Welcome / Landing
**Layout:** Full-height centered card on mist background

**Header block:**
- TaxEasy wordmark: "Tax" in forest-green, "Easy" in emerald — Inter Black 32px
- Tagline below: "Nigeria Tax Reform 2025 · File. Pay. Done." — slate-500 14px
- Animated gradient orb behind logo (subtle, radial, green to transparent)

**Hero visual:**
- A glowing shield icon (48px) in a forest-green rounded square (80×80)
- Below it: 3 feature pills in a row:
  - "📄 Bank Statement" / "🧮 Tax Calculator" / "🧾 Instant TCC"
  - Each pill: white bg, border emerald-200, rounded-full, 10px text

**Stats strip (horizontal, 3 columns):**
- "₦0 Hidden Fees" | "90 Seconds" | "2025 Reform Act"
- Each: forest-green value (bold) + slate label below

**CTA area:**
- "Create account" — Primary Button (full width)

**Trust Strip** (below button, with thin top border)

---

### SCREEN 2 — Sign-Up
**Layout:** Single premium card, centered, no nav

**Header:**
- Forest-green user-plus icon chip (32×32, rounded-xl) + "Create your account" ExtraBold 22px
- Subtext: "Just a few details to get started." slate-500 12px

**Inputs:**
- Full name
- Email
- Phone (Nigeria format)
- Password

**Error state:** Rose pill with field-level error text

**CTA:** "Sign up" Primary Button
- Secondary text link: "Already have an account? Log in"

---

### SCREEN 3 — Log-In
**Layout:** Single premium card, centered, no nav

**Header:**
- Lock icon chip (forest-green, 32×32) + "Welcome back" ExtraBold 22px
- Subtext: "Log in to continue your tax flow." — slate-500 12px

**Inputs:**
- Email or phone
- Password

**CTA:** "Log in" Primary Button
- Secondary text link: "New here? Sign up"

---

### SCREEN 4 — Dashboard (First-Time Empty State)
**Layout:** Desktop = sidebar left + main content right. Mobile = bottom nav + scrollable content.

**Main content — Hero card:**
- "Welcome, [Name]" ExtraBold 22px
- Helper line: "Start with: Calculate your tax"
- Primary CTA button label must be exactly: "Calculate your tax"
- Secondary CTAs: "Upload statement", "View History", "See Transparency"

**Empty-state cards:**
- "No calculations yet" with short guidance copy
- "No payments yet" with link to proof expectations after payment
- "No history yet" with reassurance that receipts/TCC will appear here

---

### SCREEN 5 — Upload Bank Statement
**Layout:** Card with upload area

**Header:** UploadCloud icon + "Upload Bank Statement"

**Bank selector (pill row):**
- Horizontal scroll: GTBank | Access | Zenith | UBA | First Bank | Other
- Active bank: forest-green bg, white text
- Inactive: white bg, slate border

**Upload dropzone:**
- Dashed border (2px, emerald-300), rounded-2xl (24px)
- 80px height, centered content
- UploadCloud icon (32px, emerald-500) + "Drop PDF here or tap to browse"
- Sub-label: "GTBank statement PDF · Max 10MB"

**CTA:** "Continue" Primary Button

---

### SCREEN 6 — Payment Identity Verification (BVN/NIN)
**Layout:** Stacked cards, appears only after tax estimate and right before payment.

**Card 1 — ID Toggle:**
- Header: Fingerprint icon + "Verify Taxpayer Identity"
- Tab switcher: "Bank Verification (BVN)" | "National Identity (NIN)"
- Input: 11-digit numeric with counter

**Card 2 — Privacy notice:**
- Shield icon + "Used only to complete this payment"
- 3 bullets: encrypted, masked in receipts, not persisted in MVP

**CTA:** "Verify identity to pay" Primary Button

---

### SCREEN 7 — Home Dashboard
**Layout:** Desktop = sidebar left + main content right. Mobile = bottom nav + scrollable content.

**Sidebar (desktop, 280px):**
- Logo area: green leaf icon + "TaxEasy" wordmark + "NIGERIA REFORM" badge
- User profile card: initials avatar + name + "ID Verified" badge
- Nav items (active = forest-green pill with white text + shadow):
  - 🏠 Home | 📊 Tax Calculator | 📄 Statement | 📋 TCC | 🏛️ Transparency | 🕐 History
- Bottom: phone number + "Sign Out" button

**Mobile Bottom Nav (72px):**
- 5 icons: Home, Tax Calc, Statement, TCC, Transparency
- Active: forest-green icon + label, indicator dot or underline
- Inactive: slate-400

**Main content — Hero card:**
- "Good morning, [Name]" ExtraBold 22px
- "Tax Year 2025 · Reform Act Ready" — emerald-600 badge
- 2 action cards side by side:
  - "📄 Upload Statement" — forest-green gradient, white text
  - "🧮 Manual Calculator" — white, forest-green text, border

**Quick stats strip (3 cols):**
- Last filing date | Total paid | TCC status

**Recent activity card:**
- "Filing History" header + See All link
- List of 3 recent filings (reference, amount, status badge, date)

---

### SCREEN 8 — Income Type Selection
**Layout:** Card with option list

**Header:** Income source question + "Select all that apply"

**Option grid (2×2 then 1 full-width):**
- Each option: icon (24px) + title Bold + subtitle slate-500 12px
  - 💼 "Salary / Employment" — "PAYE deducted at source"
  - 💻 "Freelance / Contract" — "Project-based income"
  - 🏪 "Small Business" — "Trade or retail income"
  - 🏠 "Rental Income" — "Property rental earnings"
  - ➕ "Multiple Sources" — "Salary + side income"
- Selected state: forest-green border (2px), bg emerald-50, checkmark in top-right corner
- Unselected: slate-200 border, white bg

**CTA:** "Continue →" Primary Button (disabled until selection made)

---

### SCREEN 9 — Annual Income Input
**Layout:** Card with currency inputs

**Header:** ReceiptText icon + "Annual Income" + tax year badge

**Primary input:**
- Label: "ANNUAL INCOME (₦)"
- Input Row: Left chip = ₦ icon + "NAIRA"
- Input: large numeric, currency formatted (commas), 18px SemiBold

**Toggle — Side income:**
- Pill toggle: "Add side income?" with animated on/off switch (emerald when on)
- When toggled ON: second input row slides down (animated)

**Optional deductions (collapsed by default):**
- "Advanced deductions" ChevronDown toggle
- Expands to show: Pension input, NHF input, NHIS input, Life Insurance, Annual Rent

**CTA:** "Calculate your tax" Primary Button

---

### SCREEN 10 — Deductions & Reliefs Wizard
**Layout:** Card with toggle rows

**Header:** DollarSign icon + "Deductions & Reliefs"

**Toggle rows (each has):**
- Left: icon (16px) + label + subtitle
- Right: on/off pill toggle (emerald when active)
- Expanded input (slides down when toggled):
  - ₦ Input Row with suggested amount hint

**Reliefs list:**
- 🏦 Pension (8% of gross — auto-calculated option)
- 🏠 NHF (National Housing Fund)
- ❤️ NHIS (Health Insurance)
- 📋 Life Insurance Premium
- 🏠 Annual Rent

**Running total sidebar (desktop):**
- "Estimated Deductions" card
- Each active relief: label + amount
- Total deduction amount in emerald-600

---

### SCREEN 11 — Tax Result / Estimate
**Layout:** Multi-card scroll

**Header card — The Big Number:**
- "Your Tax Estimate" — small uppercase label
- Large tax amount: "₦XXX,XXX" — Inter Black 36px, forest-green
- "per year" sub-label in slate-500
- Monthly amount: "≈ ₦XX,XXX / month" — emerald pill badge

**Tax Band Breakdown card:**
- Accordion table: Band | Rate | Tax
- Each row: stripe alternating white/emerald-50
- Progress bar under each band showing portion of income in that band
- Total row: bold, forest-green bg, white text

**Deductions Summary card:**
- CRA, Pension, NHF etc. listed with amounts
- "Total Reliefs" at bottom in emerald

**What this means card:**
- 3 context points (Sparkles icon + text):
  - "This is your estimated annual PAYE liability…"
  - "Monthly equivalent for budgeting…"
  - "Actual liability may differ…"

**CTA Buttons:**
- "Proceed to Payment →" Primary Button (forest-green gradient)
- "Recalculate" Ghost Button

---

### SCREEN 12 — Payment Method
**Layout:** Card with method selector

**Header:** CreditCard icon + "Choose Payment Method"

**Method options (full-width radio cards):**
Each has: left icon (24px) + title (Bold 14px) + subtitle (slate-500 12px) + right radio circle
- 💳 **Card Payment** — "Visa, Mastercard, Verve"
- 🏦 **Bank Transfer** — "Direct debit to your account"
- 📱 **USSD** — "*737# and other codes"
- 🟢 **Paystack** — "Secure checkout"

Selected state: forest-green border (2px) + emerald-50 bg + filled radio dot

**Summary card below:**
- Tax amount: ₦XXX,XXX
- Service fee: ₦X,XXX (0.5%, capped at ₦5,000)
- Divider
- Total: ₦XXX,XXX Bold forest-green

**CTA:** "Pay ₦XXX,XXX →" Primary Button

---

### SCREEN 13 — Payment Processing
**Layout:** Full-screen overlay, no nav

**Animated content (centered, vertically middle):**
- Circular spinner (forest-green, 64px diameter, 4px stroke)
- "Securing your payment…" Bold 18px
- Progress steps (fading in sequentially, 800ms each):
  - ✓ "Connecting to FIRS gateway"
  - ✓ "Validating taxpayer identity"
  - ✓ "Submitting remittance…"
- Subtle green pulse ring expanding from center

---

### SCREEN 14 — Payment Success
**Layout:** Full-height celebration screen

**Confetti:** 60 colored dots falling from top

**Checkmark animation:**
- 96×96 circle, forest-green fill
- White checkmark path draws in with stroke animation (0.6s)

**Content:**
- "Remittance Complete!" ExtraBold 28px
- Reference: "TXE-2026-XXXXX" — monospace pill, emerald-50 bg
- Amount paid: "₦XXX,XXX" Inter Black 28px
- Date: "21 May 2026" slate-500

**CTA buttons (stacked):**
- "View Digital Receipt →" Primary Button
- "Download TCC" Secondary Button (forest-green border, white bg)

---

### SCREEN 15 — Digital Receipt
**Layout:** White "paper" card with shadow, scrollable

**Header strip:**
- TaxEasy logo left + "OFFICIAL TAX RECEIPT" uppercase badge right
- Thin forest-green top border (4px)

**Receipt rows (key-value pairs):**
- Reference | Payment Date | Taxpayer Name | BVN | Tax Year | Amount | Service Fee | **Total** (Bold)
- Status badge: "✓ PAID" — emerald pill

**QR Code block (centered):**
- 120×120px QR code (black on white)
- Below: "Scan to verify this receipt" slate-500 12px

**Signature line:**
- "Issued by TaxEasy · FIRS Compliant · [date]"
- Forest-green watermark text at bottom

**Actions (bottom):**
- Share button (Share2 icon) | Print button (Printer icon)

---

### SCREEN 16 — Tax Clearance Certificate (TCC)
**Layout:** A4-style document card (portrait)

**Certificate design:**
- Forest-green header band (full width, 80px tall)
- "FEDERAL INLAND REVENUE SERVICE" uppercase white text
- "TAX CLEARANCE CERTIFICATE" — large white ExtraBold 20px
- Gold horizontal rule below header

**Body content:**
- "This is to certify that:" italics
- Taxpayer name: Bold 18px
- BVN: masked "••••••• XXXX"
- Tax Year: "2025"
- Amount Paid: "₦XXX,XXX"
- Issue Date, Valid Until, TCC Reference

**Official seal:**
- Circular green badge (64px): eagle icon or shield + "FIRS" text
- Positioned bottom-right

**QR code** bottom-left, 80×80

**"Download PDF" button** — gold gradient, white text

---

### SCREEN 17 — Filing History
**Layout:** List of cards, scrollable

**Header:** History icon + "Filing History" + count badge (emerald pill)

**Each history item (card):**
- Left: color-coded status icon (CheckCircle green, AlertCircle amber)
- Center: reference code + date
- Right: amount Bold + status badge ("PAID" green, "PENDING" amber)
- Bottom row: payment method chip + TCC link

**Empty state:**
- History icon (64px, slate-200) centered
- "No filings yet" slate-500
- "Start your first filing →" emerald link

---

### SCREEN 18 — Upload Bank Statement
**Layout:** Card with upload area

**Header:** UploadCloud icon + "Upload Bank Statement"

**Bank selector (pill row):**
- Horizontal scroll: GTBank | Access | Zenith | UBA | First Bank | Other
- Active bank: forest-green bg, white text
- Inactive: white bg, slate border

**Upload dropzone:**
- Dashed border (2px, emerald-300), rounded-2xl (24px)
- 80px height, centered content
- UploadCloud icon (32px, emerald-500) + "Drop PDF here or tap to browse"
- Sub-label: "GTBank statement PDF · Max 10MB"
- On hover/drag: emerald-50 fill

**File selected state:**
- FileText icon (24px, emerald) + filename + "×" delete
- "Parsing statement…" spinner + progress bar

**"Generate Seeded Statement" button:**
- Wand2 icon (animating pulse) + "Generate Seeded Statement for [Bank]"
- Style: emerald-50 bg, emerald-800 text, emerald-200 border

---

### SCREEN 19 — Statement Review / Transaction Categoriser
**Layout:** Scrollable table with sticky header

**Header card:**
- Bank name + account period
- 3 summary pills: Total Credit | Total Debit | Transactions count

**Filter bar (horizontal scroll):**
- "All" | "Income" | "Business Expenses" | "Personal" | "Transfers" pills

**Transaction list:**
Each row:
- Left: direction icon (↑ credit = emerald, ↓ debit = rose)
- Center: narration (truncated) + date small
- Right: amount (emerald for credit, rose for debit) + category dropdown
- Category dropdown: pill with chevron — "Income" | "Business Expense" | "Personal" | "Transfer"

**Summary footer (sticky bottom):**
- Gross Income: ₦XXX,XXX (emerald)
- Business Expenses: ₦XXX,XXX (slate)
- Taxable Net: ₦XXX,XXX (forest-green Bold)
- "Calculate Tax →" Primary Button

---

### SCREEN 20 — Transparency Layer
**Layout:** Multi-section scroll

**Header card:**
- Landmark icon + "National Trust & Impact"
- "See exactly where your tax goes" — slate-500

**Current year tax allocation (donut chart or horizontal bar):**
- Education: 28% (blue)
- Infrastructure: 22% (forest-green)
- Healthcare: 18% (emerald)
- Security: 15% (amber)
- Administration: 10% (slate)
- Social Welfare: 7% (rose)

**State-level breakdown:**
- Your state (Lagos/FCT etc.) card with:
  - Projects funded this year (3 bullet points)
  - Per-capita spend
  - Progress toward targets

**Community impact numbers:**
- 3 stat cards: "12,400 schools funded" | "₦2.4T collected" | "89% compliance rate"

**Your contribution card:**
- "Your [year] contribution"
- Pie slice graphic showing your tax vs. total pool
- "Your ₦XX,XXX helped fund…" 3 impact items with Sparkles icons

---

## LAYOUT SHELLS

### Mobile Shell (390px wide, used for screens 1–6 and all phone screens)
- Background: #f0f4f2 (mist)
- Scrollable inner: max-width 390px, centered
- No bottom nav on: welcome, phone, otp, bvnEntry, faceVerification, bvnSuccess, paymentProcessing

### App Shell (screens 7 onwards, logged in)
**Mobile (< 1024px):**
- Top header: 64px, white, shadow-sm
  - Left: back arrow (ArrowLeft, 16px) when sub-screen active
  - Center: screen title SemiBold 14px forest-green
  - Right: user initials avatar (32×32, forest-green bg)
- Bottom nav: 72px, white, shadow-up, 5 items
- Content: scrollable, padding 16px, padding-bottom 88px

**Desktop (≥ 1024px):**
- Sidebar: fixed 280px left, full-height, white, border-right
- Main area: ml-[280px], flex-col, header + scrollable content
- Content max-width: 768px, centered in main area

---

## MICRO-ANIMATIONS SPEC

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Screen transition | fadeInUp (opacity 0→1, Y 20→0) | 300ms | ease-out |
| Card appear | scaleIn (opacity 0→1, scale 0.94→1) | 250ms | ease-out |
| Success checkmark | stroke-dashoffset draw | 600ms | ease-in-out |
| Confetti dots | fall from top + fade | 2.5–4.5s | linear |
| OTP progress dot | width 8→20px + color change | 200ms | ease-in-out |
| Input focus | border-color + ring glow | 150ms | ease |
| Camera scan line | top 4%→92%→4% loop | 2.5s | linear |
| Face detected pill | opacity fade in | 300ms | ease |
| Payment spinner | rotate 360° loop | 800ms | linear |
| Payment steps | opacity 0→1 sequential | 800ms each | ease |
| Sidebar nav active | background fill slide | 200ms | ease-out |
| Toggle switch | translate + color | 200ms | spring |
| Option card select | border-color + bg | 150ms | ease |

---

## PROTOTYPE FLOW MAP

```
[Welcome]
    ↓ "Create account"
[Sign-Up]
    ↓ "Sign up"
[Dashboard (First-Time Empty State)]
    ↓ "Calculate your tax"
[Upload Bank Statement]
    ↓ PDF selected / seeded statement generated
[Statement Review / Categorise]
    ↓ "Calculate Tax"
         ← OR → Via "Upload statement" secondary CTA from dashboard
[Income Type Selection]
    ↓
[Annual Income Input]
    ↓
[Deductions & Reliefs Wizard]
    ↓ "Calculate your tax"
[Tax Result / Estimate]
    ↓ "Proceed to Payment"
[Payment Identity Verification (BVN/NIN)]
    ↓ "Verify identity to pay"
[Payment Method Selection]
    ↓ "Pay →"
[Payment Processing] (animated, 3s)
    ↓ auto-advance
[Payment Success]
    ↓ "View Receipt"
[Digital Receipt]
    ↓ "Download TCC" or via sidebar nav
[Tax Clearance Certificate]

Returning-user path:
[Log-In]
    ↓ "Log in"
[Dashboard]

Side nav destinations (accessible any time post-login):
→ [Filing History]
→ [Transparency Layer]
→ [Home Dashboard]
```

---

## ADDITIONAL DESIGN NOTES

1. **Nigerian cultural signals:** Use ₦ symbol everywhere (not NGN). Show 🇳🇬 flag on phone input. Reference FIRS, NIBSS, BVN/NIN at payment — these build trust.

2. **Trust signals throughout:** Every screen with ID or payment should have a small "NIBSS Secure · FIRS Compliant · 256-bit Encrypted" trust strip.

3. **Glassmorphism accents:** The hero card on Welcome and the Success screen use subtle glass overlays (rgba(255,255,255,0.72) backdrop with blur).

4. **Dark mode:** Not implemented — the app is light-mode only with the forest green / white palette.

5. **Accessibility:** All interactive elements need 44×44 minimum tap target. Contrast ratio ≥ 4.5:1 for all text. Focus rings visible.

6. **Responsive breakpoints:**
   - Mobile: 390px (primary)
   - Tablet: 768px (same as mobile layout, wider cards)
   - Desktop: 1024px+ (sidebar appears, content max-width 768px)

7. **Empty states:** Every list screen (History, Transparency) must have an illustrated empty state with a subtle icon and descriptive text.

8. **Loading states:** Every async action shows a Loader2 spinner (animated rotate) inline in the button. Skeleton cards for data loading.

9. **Error states:** Rose-600 text on rose-50 background, rounded-xl, with AlertCircle icon. Appears below the relevant input field.

10. **The confetti:** Used on exactly 1 screen — Payment Success. 60 colored dots (emerald, gold, blue, pink, purple) fall from random X positions with staggered delays.
