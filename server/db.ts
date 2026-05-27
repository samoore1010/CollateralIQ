import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_DIR
  ? path.resolve(process.env.DB_DIR)
  : path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH ?? path.join(DB_DIR, 'collateraliq.db');
console.log(`[db] using ${DB_PATH}`);
export const db = new Database(DB_PATH);
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

-- Change 2: multi-debtor support
CREATE TABLE IF NOT EXISTS debtors (
  id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  organization_form TEXT,
  state_of_formation TEXT,
  fein TEXT,
  org_id TEXT,
  prior_names_json TEXT,
  registered_address TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_debtors_normalized_name ON debtors(normalized_name);

CREATE TABLE IF NOT EXISTS transaction_debtors (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  debtor_id TEXT NOT NULL,
  role TEXT NOT NULL,
  joined_at TEXT,
  released_at TEXT,
  created_at INTEGER,
  UNIQUE(transaction_id, debtor_id)
);
CREATE INDEX IF NOT EXISTS idx_transaction_debtors_tx ON transaction_debtors(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_debtors_debtor ON transaction_debtors(debtor_id);

-- Change 3: draw/tranche hierarchy
CREATE TABLE IF NOT EXISTS draws (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  label TEXT NOT NULL,
  draw_type TEXT,
  commitment_cents INTEGER NOT NULL,
  drawn_cents INTEGER DEFAULT 0,
  outstanding_cents INTEGER DEFAULT 0,
  available_from TEXT,
  available_until TEXT,
  drawn_date TEXT,
  term_months INTEGER,
  rate_factor REAL,
  collateral_pool TEXT,
  status TEXT NOT NULL,
  repaid_date TEXT,
  notes TEXT,
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_draws_tx ON draws(transaction_id);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);

-- Change 4: UCC monitoring (incoming intelligence)
CREATE TABLE IF NOT EXISTS debtor_watches (
  id TEXT PRIMARY KEY,
  debtor_id TEXT NOT NULL,
  watch_jurisdiction TEXT NOT NULL,
  status TEXT NOT NULL,
  last_checked_at INTEGER,
  next_check_at INTEGER,
  created_at INTEGER,
  UNIQUE(debtor_id, watch_jurisdiction)
);

CREATE TABLE IF NOT EXISTS third_party_filings (
  id TEXT PRIMARY KEY,
  debtor_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  filing_type TEXT NOT NULL,
  secured_party TEXT NOT NULL,
  collateral_description TEXT,
  file_number TEXT,
  filed_at TEXT,
  lapse_date TEXT,
  terminated_at TEXT,
  detected_at INTEGER,
  priority_impact TEXT,
  priority_impact_reason TEXT,
  reviewed INTEGER DEFAULT 0,
  source TEXT,
  raw_payload_json TEXT,
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_tpf_debtor ON third_party_filings(debtor_id);
CREATE INDEX IF NOT EXISTS idx_tpf_reviewed ON third_party_filings(reviewed);
CREATE INDEX IF NOT EXISTS idx_tpf_priority ON third_party_filings(priority_impact);

-- Change 5: source provenance
CREATE TABLE IF NOT EXISTS source_attributions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_path TEXT,
  source_type TEXT NOT NULL,
  source_reference TEXT,
  retrieved_at INTEGER NOT NULL,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_attr_entity ON source_attributions(entity_type, entity_id);
`;

db.exec(SCHEMA);

// Idempotent column additions on existing databases
ensureColumn('filings', 'debtor_id', 'TEXT');
ensureColumn('collateral', 'draw_id', 'TEXT');

function ensureColumn(table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.find(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[.,]/g, '').replace(/\b(inc|incorporated|corporation|corp|llc|ltd|limited|lp|company|co)\b/g, '').replace(/\s+/g, ' ').trim();
}

export function inferOrgForm(name: string): string {
  const lc = name.toLowerCase();
  if (/\bllc\b/.test(lc)) return 'llc';
  if (/\b(inc|incorporated|corp|corporation)\b/.test(lc)) return 'corporation';
  if (/\blp\b/.test(lc)) return 'lp';
  return 'corporation';
}

const STATE_MAP: Record<string, string> = {
  delaware: 'DE', 'new york': 'NY', texas: 'TX', nevada: 'NV', massachusetts: 'MA',
  california: 'CA', 'new mexico': 'NM', 'district of columbia': 'DC',
};
export function jurisdictionToCode(j: string): string {
  if (!j) return '';
  if (j.length === 2 && j === j.toUpperCase()) return j;
  return STATE_MAP[j.toLowerCase()] ?? j.slice(0, 2).toUpperCase();
}

/**
 * Idempotent backfill that runs on every startup. Ensures every transaction
 * has at least a 'parent' debtor row and a 'Primary' draw row so existing
 * single-borrower / single-tranche deals continue to render correctly under
 * the new multi-debtor / multi-draw model.
 */
export function runBackfill() {
  const txs = db.prepare('SELECT * FROM transactions').all() as any[];
  const findDebtor = db.prepare('SELECT id FROM debtors WHERE normalized_name = ?');
  const insertDebtor = db.prepare(`INSERT INTO debtors (id, legal_name, normalized_name, organization_form, state_of_formation, is_active, created_at, updated_at) VALUES (?,?,?,?,?,1,?,?)`);
  const txDebtorCount = db.prepare('SELECT COUNT(*) AS c FROM transaction_debtors WHERE transaction_id = ?');
  const insertTxDebtor = db.prepare(`INSERT OR IGNORE INTO transaction_debtors (id, transaction_id, debtor_id, role, joined_at, created_at) VALUES (?,?,?,?,?,?)`);
  const drawCount = db.prepare('SELECT COUNT(*) AS c FROM draws WHERE transaction_id = ?');
  const insertDraw = db.prepare(`INSERT INTO draws (id, transaction_id, label, draw_type, commitment_cents, drawn_cents, outstanding_cents, status, collateral_pool, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);

  for (const tx of txs) {
    if ((txDebtorCount.get(tx.id) as any).c === 0) {
      const normalized = normalizeName(tx.borrower);
      let debtor = findDebtor.get(normalized) as { id: string } | undefined;
      if (!debtor) {
        const id = crypto.randomUUID();
        insertDebtor.run(id, tx.borrower, normalized, inferOrgForm(tx.borrower), jurisdictionToCode(tx.jurisdiction), Date.now(), Date.now());
        debtor = { id };
      }
      insertTxDebtor.run(crypto.randomUUID(), tx.id, debtor.id, 'parent', tx.closing_date, Date.now());
    }
    if ((drawCount.get(tx.id) as any).c === 0) {
      insertDraw.run(crypto.randomUUID(), tx.id, 'Primary', 'term', tx.amount_cents, tx.amount_cents, tx.amount_cents, 'outstanding', 'equipment', Date.now());
    }
  }
}

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
