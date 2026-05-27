# CollateralIQ

A demo platform for investment & debt-finance firms that take secured interests in third-party collateral. Built end-to-end with realistic workflows for UCC compliance, covenant monitoring, lien-priority visualization, collateral management, and Article 9 disposition — including a connected buyer marketplace.

## Running

```bash
npm install
npm run dev
```

The Vite dev server boots an Express API as middleware (no separate process). A local SQLite database is created at `.data/collateraliq.db` and seeded automatically on first run. To reset:

```bash
npm run reset-db
```

Optional: set `GEMINI_API_KEY` in `.env.local` to enable real LLM extraction of compliance-certificate PDFs (uses `gemini-2.5-flash`). Without it, the dashboard falls back to plausible mocked values — clearly labeled with a Demo Chip.

## What's in the demo

| Surface | What it shows |
|---|---|
| **Dashboard** | Portfolio exposure, covenant health, live alerts feed with `Simulate` button |
| **Transactions** | Deal registry with UCC status, intercreditor tranche, agent of record, lender share |
| **Transaction Detail** | Lien-priority stack, covenants, collateral, DACAs, contacts, critical dates, syndicate context |
| **Collateral Vault** | Article 9 typed asset registry |
| **Collateral Detail** | Specs, valuation, liquidity profile, listings |
| **UCC Filings** | Workflow for UCC-1 / UCC-3 amendment / continuation / termination, sandbox filing gateway, continuation calendar (6-month window automation) |
| **Compliance** | Covenant test table, certificate intake with extraction stages, manual test recording |
| **Disposition** | Full Article 9 workflow: qualify → §9-611 notice (10-day clock) → activate market → bids → §9-615 proceeds accounting |
| **Marketplace** | Listings with matched-buyer scores, 20-buyer verified network |
| **Intelligence** | Cross-deal analytics: concentration, jurisdictional exposure, covenant cushion, shared collateral, upcoming continuations |
| **Security & Audit** | SOC 2 posture, MNPI walls, role-based permission matrix, tamper-evident audit log |
| **Borrower Portal** (`/portal`) | Separate borrower-facing surface for compliance certificate submission |

## Demo seam labeling

Anywhere a real integration would sit, the dashboard renders a small `Demo Chip`:

- **Sandbox** — UCC filing gateway (CSC), Secretary of State submissions
- **Simulated** — UCC monitoring feeds, new-filing detection
- **Partner: Mock** — DACA bank links, comp valuation feeds, BidConnect buyer network
- **Preview** — Buyer matching scores, liquidity heuristics, LLM extraction without a key

Hover any chip for an explanation of what the real implementation routes through.

## Stack

- React 19, TypeScript, Tailwind 4, recharts, motion, react-router-dom
- Express API mounted as a Vite middleware plugin
- better-sqlite3 with WAL mode, single-file DB
- Optional `@google/genai` integration for PDF extraction

## Project layout

```
server/
  db.ts            sqlite schema + helpers
  seed.ts          initial portfolio
  api.ts           REST endpoints
  vite-plugin.ts   mounts express middleware into Vite
src/
  api.ts           fetch client
  types.ts         shared TS types
  context/         role & demo-mode context
  components/
    DemoChip.tsx   sandbox/simulated/partner-mock badges
    layout/
  pages/
    Dashboard.tsx, Transactions.tsx, TransactionDetails.tsx,
    Collateral.tsx, CollateralDetails.tsx, Marketplace.tsx,
    Filings.tsx, Compliance.tsx, Disposition.tsx,
    Intelligence.tsx, Security.tsx, BorrowerPortal.tsx
```
