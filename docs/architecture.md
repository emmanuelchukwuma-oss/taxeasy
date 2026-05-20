# TaxEasy MVP Architecture

TaxEasy operates as an entirely client-side Next.js application. We chose this architecture specifically for demo reliability (no backend latency during a 5-minute presentation), data privacy (sensitive identity, statement, and income data never leaves the device), and a radically reduced deployment surface area. Everything from statement categorization to tax calculation and PDF generation happens within the browser.

## System Diagram

```mermaid
flowchart TD
    User([User Device / Browser])
    
    subgraph Frontend [Next.js Client]
        UI[React UI Components]
        Parser[Statement Parser & Categorizer]
        Logic[Tax Calculator Utility]
        PDF[react-pdf Renderer]
        QR[qrcode.react]
    end
    
    subgraph External [External Services & Data]
        Local[(localStorage\n*App state & history)]
        Static[Static JSON/TS\n*Tax bands, Transparency]
    end

    User <-->|Interacts| UI
    UI -->|Parses PDF / sample statement| Parser
    Parser -->|Reviewed transactions| Logic
    UI -->|Computes tax| Logic
    UI -->|Generates TCC| PDF
    UI -->|Generates Receipt| QR
    UI <-->|Reads/Writes session| Local
    UI -->|Reads read-only context| Static
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as TaxEasy UI
    participant Parser as Statement Parser
    participant Calc as Tax Calculator
    participant PDF as react-pdf
    participant Local as localStorage
    participant Static as Static Data

    U->>UI: Enter Phone & OTP
    UI->>Local: Save Phone (Session Start)
    U->>UI: Upload GTBank PDF or load sample statement
    UI->>Parser: Parse and categorize transactions
    Parser-->>UI: Return categorized transaction array
    UI-->>U: Review and correct categories
    UI->>Calc: calculateTaxFromTransactions()
    Calc-->>UI: Return Tax Estimate Breakdown
    U->>UI: View Transparency Data
    UI->>Static: Fetch transparencyData.ts
    Static-->>UI: Return State Budgets
    U->>UI: Confirm Identity & Pay
    UI->>Local: saveToHistory(record)
    UI-->>U: Display Receipt with QR Code
    U->>UI: Tap Generate TCC
    UI->>PDF: Assemble payload & generate
    PDF-->>UI: Return PDF Blob
    UI-->>U: Prompt PDF Download
```

## Key Technical Decisions

- **Why localStorage for MVP history:** Guarantees zero backend latency and absolute reliability during the live demo. The trade-off is that history is tied to the specific browser session and clearing cache wipes data. See `TECH_DEBT.md` for our migration plan to Supabase.
- **Why pure-function tax calculator:** Extracts complex business logic (`lib/taxCalculator.ts`) from UI components, making it 100% testable and easy to swap or upgrade later.
- **Why pure statement parser/categorizer:** Keeps the upload, keyword categorization, and seeded demo data in `lib/bankStatement.ts` instead of burying financial rules in the React screen.
- **Why mocked identity verification:** Real FIRS/NIMC integrations require complex regulatory approvals and APIs that introduce unnecessary friction and failure points for an MVP demo.
- **Why static transparency data:** Hardcoded plausible 2024 budgets ensure the transparency layer always works instantly without relying on volatile external government APIs.
- **Why client-side PDF generation:** Using `@react-pdf/renderer` dynamically on the client avoids server overhead, ensures privacy (PDFs never leave the device), and provides instant downloads.
- **Why a Demo Mode URL parameter:** Activating `?demo=true` instantly seeds a rich history of payments and a parsed GTBank sample statement to support narrative storytelling during the presentation, while cleanly isolating this mock data from normal app usage.
