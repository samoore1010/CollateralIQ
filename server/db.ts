import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

export const db = new Database(path.join(DB_DIR, 'collateraliq.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  borrower TEXT NOT NULL,
  deal_type TEXT,
  amount_cents INTEGER,
  closing_date TEXT,
  maturity_date TEXT,
  jurisdiction TEXT,
  governing_law TEXT,
  collateral_type TEXT,
  agent_firm TEXT,
  our_share_pct REAL,
  intercreditor_tranche TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT,
  role TEXT, name TEXT, firm TEXT, email TEXT
);

CREATE TABLE IF NOT EXISTS mechanics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT,
  label TEXT, value TEXT
);

CREATE TABLE IF NOT EXISTS rights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT,
  title TEXT, description TEXT, status TEXT
);

CREATE TABLE IF NOT EXISTS collateral (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  name TEXT, category TEXT,
  a9_category TEXT,
  perfection_method TEXT,
  market_value_cents INTEGER,
  liquidation_value_cents INTEGER,
  original_cost_cents INTEGER,
  location TEXT, status TEXT,
  serial_number TEXT, manufacturer TEXT, year INTEGER,
  description TEXT, image TEXT, condition TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS filings (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  filing_type TEXT,
  status TEXT,
  jurisdiction TEXT,
  debtor_name TEXT, debtor_address TEXT,
  secured_party TEXT, secured_party_address TEXT,
  collateral_description TEXT,
  file_number TEXT,
  filed_at TEXT,
  lapse_date TEXT,
  continuation_window_open TEXT,
  amends_filing_id TEXT,
  notes TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS covenants (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  metric TEXT,
  formula TEXT,
  operator TEXT,
  threshold REAL,
  unit TEXT,
  frequency TEXT,
  cure_period_days INTEGER,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS covenant_tests (
  id TEXT PRIMARY KEY,
  covenant_id TEXT,
  transaction_id TEXT,
  period_end TEXT,
  actual_value REAL,
  status TEXT,
  cushion_pct REAL,
  source TEXT,
  cert_id TEXT,
  trend TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  period_end TEXT,
  uploaded_at INTEGER,
  uploaded_by TEXT,
  filename TEXT,
  extracted_json TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS liens (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  position INTEGER,
  holder TEXT,
  amount_cents INTEGER,
  lien_type TEXT,
  collateral_scope TEXT,
  status TEXT,
  filing_date TEXT,
  is_ours INTEGER,
  pmsi INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  collateral_id TEXT,
  asking_price_cents INTEGER,
  status TEXT,
  notice_sent_at TEXT,
  notice_recipients TEXT,
  notice_period_ends_at TEXT,
  sale_method TEXT,
  sold_price_cents INTEGER,
  sold_at TEXT,
  sold_to_buyer_id TEXT,
  proceeds_breakdown TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS bids (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  buyer_id TEXT,
  amount_cents INTEGER,
  status TEXT,
  notes TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS buyers (
  id TEXT PRIMARY KEY,
  firm TEXT,
  type TEXT,
  interests TEXT,
  budget_min_cents INTEGER,
  budget_max_cents INTEGER,
  geography TEXT,
  aum_cents INTEGER,
  verified INTEGER,
  contact_email TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  type TEXT,
  severity TEXT,
  title TEXT,
  description TEXT,
  transaction_id TEXT,
  acked INTEGER DEFAULT 0,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_role TEXT,
  actor_name TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  detail TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS control_agreements (
  id TEXT PRIMARY KEY,
  transaction_id TEXT,
  account_type TEXT,
  institution TEXT,
  account_last4 TEXT,
  status TEXT,
  signed_date TEXT,
  expires_date TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

db.exec(SCHEMA);

export function logAudit(opts: {
  actor_role: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  detail?: string;
}) {
  db.prepare(`INSERT INTO audit_log (id, actor_role, actor_name, action, entity_type, entity_id, detail, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(crypto.randomUUID(), opts.actor_role, opts.actor_name, opts.action, opts.entity_type, opts.entity_id, opts.detail ?? '', Date.now());
}

export function parseAmount(s: string | number | null | undefined): number {
  if (s == null) return 0;
  if (typeof s === 'number') return Math.round(s * 100);
  const n = Number(String(s).replace(/[^0-9.\-]/g, ''));
  return Math.round((isNaN(n) ? 0 : n) * 100);
}

export function fmtCents(c: number | null | undefined): string {
  if (c == null) return '$0';
  const v = c / 100;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toLocaleString()}`;
}
