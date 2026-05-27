import express, { Router } from 'express';
import { db, logAudit } from './db';

export function createApi(): Router {
  const r = Router();
  r.use(express.json({ limit: '10mb' }));

  // ---------- helpers ----------
  const fmt = (c: number | null) => {
    if (c == null) return '$0';
    const v = c / 100;
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toLocaleString(undefined, {maximumFractionDigits: 0})}k`;
    return `$${v.toLocaleString()}`;
  };

  // ---------- transactions ----------
  r.get('/transactions', (_req, res) => {
    const rows = db.prepare(`SELECT t.*,
      (SELECT MAX(f.status) FROM filings f WHERE f.transaction_id = t.id AND f.filing_type = 'UCC-1') AS ucc_status,
      (SELECT MIN(f.continuation_window_open) FROM filings f WHERE f.transaction_id = t.id AND f.filing_type = 'UCC-1' AND f.status = 'confirmed') AS next_continuation
      FROM transactions t ORDER BY t.created_at DESC`).all();
    res.json(rows);
  });

  r.get('/transactions/:id', (req, res) => {
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    if (!tx) return res.status(404).json({ error: 'not found' });
    const contacts = db.prepare('SELECT * FROM contacts WHERE transaction_id = ?').all(req.params.id);
    const mechanics = db.prepare('SELECT * FROM mechanics WHERE transaction_id = ?').all(req.params.id);
    const rights = db.prepare('SELECT * FROM rights WHERE transaction_id = ?').all(req.params.id);
    const liens = db.prepare('SELECT * FROM liens WHERE transaction_id = ? ORDER BY position').all(req.params.id);
    const collateral = db.prepare('SELECT * FROM collateral WHERE transaction_id = ?').all(req.params.id);
    const borrowerGroup = db.prepare(`SELECT td.role, td.joined_at, td.released_at, d.* FROM transaction_debtors td JOIN debtors d ON d.id = td.debtor_id WHERE td.transaction_id = ? ORDER BY CASE td.role WHEN 'parent' THEN 0 WHEN 'co-borrower' THEN 1 WHEN 'guarantor' THEN 2 ELSE 3 END, d.legal_name`).all(req.params.id);
    const draws = db.prepare(`SELECT * FROM draws WHERE transaction_id = ? ORDER BY CASE status WHEN 'outstanding' THEN 0 WHEN 'available' THEN 1 WHEN 'repaid' THEN 2 ELSE 3 END, created_at`).all(req.params.id);
    const attributions = db.prepare(`SELECT * FROM source_attributions WHERE (entity_type = 'transaction' AND entity_id = ?)
      OR (entity_type = 'debtor' AND entity_id IN (SELECT debtor_id FROM transaction_debtors WHERE transaction_id = ?))
      OR (entity_type = 'lien' AND entity_id IN (SELECT id FROM liens WHERE transaction_id = ?))
      OR (entity_type = 'draw' AND entity_id IN (SELECT id FROM draws WHERE transaction_id = ?))
      OR (entity_type = 'filing' AND entity_id IN (SELECT id FROM filings WHERE transaction_id = ?))
      OR (entity_type = 'collateral' AND entity_id IN (SELECT id FROM collateral WHERE transaction_id = ?))
      OR (entity_type = 'covenant' AND entity_id IN (SELECT id FROM covenants WHERE transaction_id = ?))`).all(req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id);
    const debtorIds = (borrowerGroup as any[]).map(d => d.id);
    const thirdParty = debtorIds.length === 0 ? [] : db.prepare(`SELECT * FROM third_party_filings WHERE debtor_id IN (${debtorIds.map(() => '?').join(',')}) ORDER BY filed_at DESC`).all(...debtorIds);
    const covenants = db.prepare(`SELECT c.*,
        (SELECT actual_value FROM covenant_tests t WHERE t.covenant_id = c.id ORDER BY t.created_at DESC LIMIT 1) AS latest_actual,
        (SELECT status FROM covenant_tests t WHERE t.covenant_id = c.id ORDER BY t.created_at DESC LIMIT 1) AS latest_status,
        (SELECT trend FROM covenant_tests t WHERE t.covenant_id = c.id ORDER BY t.created_at DESC LIMIT 1) AS latest_trend,
        (SELECT cushion_pct FROM covenant_tests t WHERE t.covenant_id = c.id ORDER BY t.created_at DESC LIMIT 1) AS cushion_pct
      FROM covenants c WHERE c.transaction_id = ? ORDER BY c.created_at`).all(req.params.id);
    const filings = db.prepare('SELECT * FROM filings WHERE transaction_id = ? ORDER BY created_at DESC').all(req.params.id);
    const dacas = db.prepare('SELECT * FROM control_agreements WHERE transaction_id = ?').all(req.params.id);
    res.json({ ...tx, contacts, mechanics, rights, liens, collateral, covenants, filings, dacas, borrower_group: borrowerGroup, draws, attributions, third_party_filings: thirdParty });
  });

  // ---------- collateral ----------
  r.get('/collateral', (_req, res) => {
    const rows = db.prepare(`SELECT c.*, t.borrower FROM collateral c LEFT JOIN transactions t ON t.id = c.transaction_id ORDER BY c.created_at DESC`).all();
    res.json(rows);
  });

  r.get('/collateral/:id', (req, res) => {
    const c: any = db.prepare(`SELECT c.*, t.borrower, t.id AS transaction_id FROM collateral c LEFT JOIN transactions t ON t.id = c.transaction_id WHERE c.id = ?`).get(req.params.id);
    if (!c) return res.status(404).json({ error: 'not found' });
    const listings = db.prepare('SELECT * FROM listings WHERE collateral_id = ?').all(req.params.id);
    res.json({ ...c, listings });
  });

  // ---------- filings ----------
  r.get('/filings', (_req, res) => {
    const rows = db.prepare(`SELECT f.*, t.borrower FROM filings f LEFT JOIN transactions t ON t.id = f.transaction_id ORDER BY f.created_at DESC`).all();
    res.json(rows);
  });

  r.post('/filings', (req, res) => {
    const id = crypto.randomUUID();
    const b = req.body;
    db.prepare(`INSERT INTO filings (id, transaction_id, filing_type, status, jurisdiction, debtor_name, debtor_address, secured_party, secured_party_address, collateral_description, amends_filing_id, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, b.transaction_id, b.filing_type, 'draft', b.jurisdiction, b.debtor_name, b.debtor_address ?? '', b.secured_party, b.secured_party_address ?? '', b.collateral_description, b.amends_filing_id ?? null, b.notes ?? '', Date.now());
    logAudit({ actor_role: b.actor_role ?? 'legal', actor_name: b.actor_name ?? 'system', action: 'filing.create', entity_type: 'filing', entity_id: id, detail: `${b.filing_type} draft created` });
    res.json({ id });
  });

  r.post('/filings/:id/submit', (req, res) => {
    const id = req.params.id;
    const f: any = db.prepare('SELECT * FROM filings WHERE id = ?').get(id);
    if (!f) return res.status(404).json({ error: 'not found' });
    // Simulate filing agent submission. Confirmed instantly with a synthetic file number.
    const fileNumber = `${new Date().getFullYear()}${Math.floor(Math.random() * 9000000 + 1000000)}`;
    const filedAt = new Date().toISOString().slice(0, 10);
    const lapse = new Date(); lapse.setFullYear(lapse.getFullYear() + 5);
    const lapseStr = lapse.toISOString().slice(0, 10);
    const windowOpen = new Date(lapse); windowOpen.setMonth(windowOpen.getMonth() - 6);
    const windowOpenStr = windowOpen.toISOString().slice(0, 10);
    db.prepare(`UPDATE filings SET status = 'confirmed', file_number = ?, filed_at = ?, lapse_date = ?, continuation_window_open = ? WHERE id = ?`)
      .run(fileNumber, filedAt, f.filing_type === 'UCC-1' ? lapseStr : f.lapse_date, f.filing_type === 'UCC-1' ? windowOpenStr : f.continuation_window_open, id);
    logAudit({ actor_role: req.body.actor_role ?? 'legal', actor_name: req.body.actor_name ?? 'system', action: 'filing.submit', entity_type: 'filing', entity_id: id, detail: `Filed via CSC sandbox; file #${fileNumber}` });
    db.prepare(`INSERT INTO alerts (id, type, severity, title, description, transaction_id, acked, created_at) VALUES (?,?,?,?,?,?,0,?)`)
      .run(crypto.randomUUID(), 'perfection_complete', 'success', 'Perfection Complete', `${f.filing_type} confirmed; file #${fileNumber}`, f.transaction_id, Date.now());
    res.json({ id, file_number: fileNumber, filed_at: filedAt });
  });

  r.post('/filings/:id/continue', (req, res) => {
    const id = req.params.id;
    const f: any = db.prepare('SELECT * FROM filings WHERE id = ?').get(id);
    if (!f) return res.status(404).json({ error: 'not found' });
    const newId = crypto.randomUUID();
    db.prepare(`INSERT INTO filings (id, transaction_id, filing_type, status, jurisdiction, debtor_name, secured_party, collateral_description, amends_filing_id, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(newId, f.transaction_id, 'UCC-3-continuation', 'queued', f.jurisdiction, f.debtor_name, f.secured_party, `Continuation of ${f.file_number ?? 'parent filing'}`, id, 'Continuation queued via CSC sandbox', Date.now());
    logAudit({ actor_role: req.body.actor_role ?? 'legal', actor_name: req.body.actor_name ?? 'system', action: 'filing.continue', entity_type: 'filing', entity_id: newId, detail: `Continuation of ${id}` });
    res.json({ id: newId });
  });

  r.post('/filings/:id/terminate', (req, res) => {
    const f: any = db.prepare('SELECT * FROM filings WHERE id = ?').get(req.params.id);
    if (!f) return res.status(404).json({ error: 'not found' });
    const newId = crypto.randomUUID();
    db.prepare(`INSERT INTO filings (id, transaction_id, filing_type, status, jurisdiction, debtor_name, secured_party, collateral_description, amends_filing_id, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(newId, f.transaction_id, 'UCC-3-termination', 'queued', f.jurisdiction, f.debtor_name, f.secured_party, `Termination of ${f.file_number ?? 'parent'}`, req.params.id, '', Date.now());
    logAudit({ actor_role: req.body.actor_role ?? 'legal', actor_name: req.body.actor_name ?? 'system', action: 'filing.terminate', entity_type: 'filing', entity_id: newId, detail: '' });
    res.json({ id: newId });
  });

  // ---------- covenants ----------
  r.get('/covenants', (_req, res) => {
    const rows = db.prepare(`SELECT c.*, t.borrower,
        (SELECT actual_value FROM covenant_tests ct WHERE ct.covenant_id = c.id ORDER BY ct.created_at DESC LIMIT 1) AS latest_actual,
        (SELECT status FROM covenant_tests ct WHERE ct.covenant_id = c.id ORDER BY ct.created_at DESC LIMIT 1) AS latest_status,
        (SELECT cushion_pct FROM covenant_tests ct WHERE ct.covenant_id = c.id ORDER BY ct.created_at DESC LIMIT 1) AS cushion_pct
      FROM covenants c LEFT JOIN transactions t ON t.id = c.transaction_id`).all();
    res.json(rows);
  });

  r.post('/covenants/:id/test', (req, res) => {
    const c: any = db.prepare('SELECT * FROM covenants WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'not found' });
    const actual = Number(req.body.actual_value);
    const status = computeStatus(c.operator, c.threshold, actual);
    const cushion = computeCushion(c.operator, c.threshold, actual);
    db.prepare(`INSERT INTO covenant_tests (id, covenant_id, transaction_id, period_end, actual_value, status, cushion_pct, source, cert_id, trend, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(crypto.randomUUID(), c.id, c.transaction_id, req.body.period_end ?? '—', actual, status, cushion, req.body.source ?? 'manual', req.body.cert_id ?? null, req.body.trend ?? 'stable', Date.now());
    logAudit({ actor_role: req.body.actor_role ?? 'pm', actor_name: req.body.actor_name ?? 'system', action: 'covenant.test', entity_type: 'covenant', entity_id: c.id, detail: `${c.metric}=${actual} → ${status}` });
    if (status !== 'pass') {
      db.prepare(`INSERT INTO alerts (id, type, severity, title, description, transaction_id, acked, created_at) VALUES (?,?,?,?,?,?,0,?)`)
        .run(crypto.randomUUID(), 'covenant_breach', status === 'fail' ? 'critical' : 'warning', `Covenant ${status === 'fail' ? 'Breach' : 'Watch'}`, `${c.metric}: ${actual} vs threshold ${c.threshold}`, c.transaction_id, Date.now());
    }
    res.json({ status, cushion });
  });

  // ---------- certificates / extraction ----------
  r.get('/certificates', (req, res) => {
    const where = req.query.transaction_id ? 'WHERE transaction_id = ?' : '';
    const args = req.query.transaction_id ? [req.query.transaction_id] : [];
    const rows = db.prepare(`SELECT * FROM certificates ${where} ORDER BY uploaded_at DESC`).all(...args as any);
    res.json(rows);
  });

  r.post('/certificates', async (req, res) => {
    const { transaction_id, period_end, uploaded_by, filename, content_base64 } = req.body;
    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO certificates (id, transaction_id, period_end, uploaded_at, uploaded_by, filename, extracted_json, status) VALUES (?,?,?,?,?,?,?,?)`)
      .run(id, transaction_id, period_end, Date.now(), uploaded_by ?? 'borrower', filename, null, 'processing');

    // Demo extraction. If GEMINI_API_KEY is set and content provided, hit Gemini; otherwise fabricate.
    let extracted: Record<string, number> | null = null;
    const useReal = !!process.env.GEMINI_API_KEY && content_base64;
    if (useReal) {
      try {
        extracted = await extractWithGemini(transaction_id, content_base64);
      } catch (e: any) {
        console.warn('[extract] Gemini failed, falling back to mock:', e?.message);
      }
    }
    if (!extracted) {
      extracted = mockExtractCovenants(transaction_id);
    }

    db.prepare(`UPDATE certificates SET extracted_json = ?, status = 'processed' WHERE id = ?`).run(JSON.stringify(extracted), id);

    // Auto-record covenant tests using extracted values
    const covs = db.prepare('SELECT * FROM covenants WHERE transaction_id = ?').all(transaction_id) as any[];
    for (const cv of covs) {
      const v = extracted[cv.metric];
      if (typeof v === 'number') {
        const status = computeStatus(cv.operator, cv.threshold, v);
        const cushion = computeCushion(cv.operator, cv.threshold, v);
        db.prepare(`INSERT INTO covenant_tests (id, covenant_id, transaction_id, period_end, actual_value, status, cushion_pct, source, cert_id, trend, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
          .run(crypto.randomUUID(), cv.id, transaction_id, period_end, v, status, cushion, useReal ? 'gemini' : 'extracted', id, 'stable', Date.now());
      }
    }

    logAudit({ actor_role: 'borrower_portal', actor_name: uploaded_by ?? 'borrower', action: 'certificate.upload', entity_type: 'certificate', entity_id: id, detail: `${filename} (${useReal ? 'gemini' : 'mock'} extract)` });
    res.json({ id, extracted, source: useReal ? 'gemini' : 'mock' });
  });

  // ---------- listings / marketplace ----------
  r.get('/listings', (_req, res) => {
    const rows = db.prepare(`SELECT l.*, c.name AS asset_name, c.category, c.image, c.liquidation_value_cents, c.transaction_id, t.borrower,
        (SELECT COUNT(*) FROM bids b WHERE b.listing_id = l.id) AS bid_count,
        (SELECT MAX(b.amount_cents) FROM bids b WHERE b.listing_id = l.id) AS highest_bid
      FROM listings l
      LEFT JOIN collateral c ON c.id = l.collateral_id
      LEFT JOIN transactions t ON t.id = c.transaction_id
      ORDER BY l.created_at DESC`).all();
    res.json(rows);
  });

  r.get('/listings/:id', (req, res) => {
    const l: any = db.prepare(`SELECT l.*, c.name AS asset_name, c.category, c.image, c.liquidation_value_cents, c.market_value_cents, c.location, c.a9_category, c.transaction_id, t.borrower
      FROM listings l LEFT JOIN collateral c ON c.id = l.collateral_id LEFT JOIN transactions t ON t.id = c.transaction_id WHERE l.id = ?`).get(req.params.id);
    if (!l) return res.status(404).json({ error: 'not found' });
    const bids = db.prepare(`SELECT b.*, by.firm AS buyer_firm, by.type AS buyer_type FROM bids b LEFT JOIN buyers by ON by.id = b.buyer_id WHERE b.listing_id = ? ORDER BY b.amount_cents DESC`).all(req.params.id);
    res.json({ ...l, bids });
  });

  r.post('/listings', (req, res) => {
    const id = `LST-${Math.floor(Math.random() * 9000 + 1000)}`;
    const { collateral_id, asking_price_cents, sale_method } = req.body;
    db.prepare(`INSERT INTO listings (id, collateral_id, asking_price_cents, status, sale_method, created_at) VALUES (?,?,?,?,?,?)`)
      .run(id, collateral_id, asking_price_cents, 'draft', sale_method ?? 'public', Date.now());
    logAudit({ actor_role: req.body.actor_role ?? 'workout', actor_name: req.body.actor_name ?? 'system', action: 'listing.create', entity_type: 'listing', entity_id: id, detail: '' });
    res.json({ id });
  });

  r.post('/listings/:id/notice', (req, res) => {
    const id = req.params.id;
    const recipients = req.body.recipients ?? [];
    const now = new Date();
    const ends = new Date(now); ends.setDate(ends.getDate() + 10);
    db.prepare(`UPDATE listings SET status = 'notice_sent', notice_sent_at = ?, notice_recipients = ?, notice_period_ends_at = ? WHERE id = ?`)
      .run(now.toISOString().slice(0, 10), JSON.stringify(recipients), ends.toISOString().slice(0, 10), id);
    logAudit({ actor_role: req.body.actor_role ?? 'workout', actor_name: req.body.actor_name ?? 'system', action: 'listing.notice', entity_type: 'listing', entity_id: id, detail: `Article 9-611 notice sent to ${recipients.length} recipients; 10-day clock starts.` });
    res.json({ notice_period_ends_at: ends.toISOString().slice(0, 10) });
  });

  r.post('/listings/:id/activate', (req, res) => {
    db.prepare(`UPDATE listings SET status = 'listed' WHERE id = ?`).run(req.params.id);
    logAudit({ actor_role: req.body.actor_role ?? 'workout', actor_name: req.body.actor_name ?? 'system', action: 'listing.activate', entity_type: 'listing', entity_id: req.params.id, detail: '' });
    res.json({ ok: true });
  });

  r.post('/listings/:id/bid', (req, res) => {
    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO bids (id, listing_id, buyer_id, amount_cents, status, notes, created_at) VALUES (?,?,?,?,?,?,?)`)
      .run(id, req.params.id, req.body.buyer_id, req.body.amount_cents, 'active', req.body.notes ?? '', Date.now());
    db.prepare(`UPDATE listings SET status = 'under_bid' WHERE id = ? AND status = 'listed'`).run(req.params.id);
    res.json({ id });
  });

  r.post('/listings/:id/sell', (req, res) => {
    const { bid_id, secured_balance_cents, costs_of_sale_cents, junior_liens_cents } = req.body;
    const bid: any = db.prepare('SELECT * FROM bids WHERE id = ?').get(bid_id);
    const listing: any = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    if (!bid || !listing) return res.status(404).json({ error: 'not found' });
    const proceeds = bid.amount_cents - (costs_of_sale_cents ?? 0);
    const toSecured = Math.min(proceeds, secured_balance_cents);
    const remainder = proceeds - toSecured;
    const toJuniors = Math.min(remainder, junior_liens_cents ?? 0);
    const surplus = remainder - toJuniors;
    const breakdown = {
      gross_sale: bid.amount_cents,
      costs_of_sale: costs_of_sale_cents ?? 0,
      to_secured_lender: toSecured,
      to_junior_liens: toJuniors,
      to_debtor_surplus: surplus,
      deficiency: secured_balance_cents - toSecured,
    };
    db.prepare(`UPDATE listings SET status = 'sold', sold_price_cents = ?, sold_at = ?, sold_to_buyer_id = ?, proceeds_breakdown = ? WHERE id = ?`)
      .run(bid.amount_cents, new Date().toISOString().slice(0, 10), bid.buyer_id, JSON.stringify(breakdown), req.params.id);
    db.prepare(`UPDATE collateral SET status = 'sold' WHERE id = ?`).run(listing.collateral_id);
    logAudit({ actor_role: req.body.actor_role ?? 'workout', actor_name: req.body.actor_name ?? 'system', action: 'listing.sold', entity_type: 'listing', entity_id: req.params.id, detail: `Sale completed. 9-615 accounting recorded.` });
    res.json({ breakdown });
  });

  // ---------- buyers / matching ----------
  r.get('/buyers', (_req, res) => {
    const rows = db.prepare('SELECT * FROM buyers').all().map((b: any) => ({ ...b, interests: JSON.parse(b.interests || '[]') }));
    res.json(rows);
  });

  r.get('/listings/:id/matches', (req, res) => {
    const listing: any = db.prepare(`SELECT l.*, c.category, c.a9_category, c.market_value_cents FROM listings l LEFT JOIN collateral c ON c.id = l.collateral_id WHERE l.id = ?`).get(req.params.id);
    if (!listing) return res.status(404).json({ error: 'not found' });
    const buyers = db.prepare('SELECT * FROM buyers').all().map((b: any) => ({ ...b, interests: JSON.parse(b.interests || '[]') }));
    const scored = buyers.map((b: any) => {
      let score = 0;
      // interest overlap
      const interestKeywords = b.interests.map((s: string) => s.toLowerCase());
      const cat = (listing.category ?? '').toLowerCase();
      const interestHit = interestKeywords.some((k: string) => cat.includes(k) || k.includes(cat));
      if (interestHit) score += 55;
      // budget fit
      const ask = listing.asking_price_cents ?? 0;
      if (ask >= b.budget_min_cents && ask <= b.budget_max_cents) score += 30;
      else if (ask <= b.budget_max_cents * 1.2) score += 10;
      // type alignment
      if (b.type === 'liquidator' || b.type === 'broker') score += 5;
      if (b.type === 'strategic' && interestHit) score += 5;
      // verification
      if (b.verified) score += 5;
      // small noise for demo
      score += Math.floor(Math.random() * 5);
      return { ...b, match_score: Math.min(99, score) };
    }).filter((b: any) => b.match_score >= 25).sort((a: any, b: any) => b.match_score - a.match_score);
    res.json(scored);
  });

  // ---------- alerts ----------
  r.get('/alerts', (_req, res) => {
    res.json(db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all());
  });
  r.post('/alerts/:id/ack', (req, res) => {
    db.prepare('UPDATE alerts SET acked = 1 WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });
  r.post('/alerts/simulate', (req, res) => {
    const presets: any = {
      new_subordinate: { type: 'new_subordinate', severity: 'info', title: 'New Subordinate Lien', description: `Subordinate lien filed against ${req.body.borrower ?? 'a portfolio borrower'} (UCC #${Math.floor(Math.random() * 9e7 + 1e7)})` },
      jurisdiction_change: { type: 'jurisdiction_change', severity: 'warning', title: 'Debtor Reincorporation', description: 'Debtor changed state of incorporation — 4-month reperfection window opens.' },
      ucc_lapse: { type: 'ucc_lapse', severity: 'warning', title: 'UCC Filing Expiring', description: 'A UCC-1 filing enters its 6-month continuation window.' },
    };
    const preset = presets[req.body.kind] ?? presets.new_subordinate;
    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO alerts (id, type, severity, title, description, transaction_id, acked, created_at) VALUES (?,?,?,?,?,?,0,?)`)
      .run(id, preset.type, preset.severity, preset.title, preset.description, req.body.transaction_id ?? null, Date.now());
    res.json({ id });
  });

  // ---------- audit ----------
  r.get('/audit', (_req, res) => {
    res.json(db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200').all());
  });

  // ---------- intelligence ----------
  r.get('/intelligence', (_req, res) => {
    const exposureBySector = db.prepare(`SELECT collateral_type AS sector, SUM(amount_cents) AS amount FROM transactions GROUP BY collateral_type`).all();
    const exposureByJurisdiction = db.prepare(`SELECT jurisdiction, SUM(amount_cents) AS amount, COUNT(*) AS deals FROM transactions GROUP BY jurisdiction ORDER BY amount DESC`).all();
    const covenantHealth = db.prepare(`SELECT
        (SELECT COUNT(*) FROM covenant_tests ct WHERE ct.id IN (SELECT MAX(id) FROM covenant_tests GROUP BY covenant_id) AND status='pass') AS pass,
        (SELECT COUNT(*) FROM covenant_tests ct WHERE ct.id IN (SELECT MAX(id) FROM covenant_tests GROUP BY covenant_id) AND status='warning') AS watch,
        (SELECT COUNT(*) FROM covenant_tests ct WHERE ct.id IN (SELECT MAX(id) FROM covenant_tests GROUP BY covenant_id) AND status='fail') AS fail
      `).get();
    const sharedCollateral = db.prepare(`SELECT location, COUNT(*) AS asset_count, GROUP_CONCAT(DISTINCT t.borrower) AS borrowers
      FROM collateral c LEFT JOIN transactions t ON t.id = c.transaction_id
      GROUP BY location HAVING COUNT(DISTINCT t.borrower) > 1`).all();
    const topConcentration = db.prepare(`SELECT borrower, SUM(amount_cents) AS amount FROM transactions GROUP BY borrower ORDER BY amount DESC LIMIT 5`).all();
    const upcomingContinuations = db.prepare(`SELECT f.*, t.borrower FROM filings f LEFT JOIN transactions t ON t.id = f.transaction_id WHERE f.continuation_window_open IS NOT NULL ORDER BY f.continuation_window_open ASC LIMIT 5`).all();
    const cushion = db.prepare(`SELECT c.metric, t.borrower, ct.actual_value, c.threshold, ct.cushion_pct, ct.status FROM covenants c
      LEFT JOIN transactions t ON t.id = c.transaction_id
      LEFT JOIN covenant_tests ct ON ct.id = (SELECT id FROM covenant_tests WHERE covenant_id = c.id ORDER BY created_at DESC LIMIT 1)
      ORDER BY ct.cushion_pct ASC LIMIT 8`).all();
    res.json({ exposureBySector, exposureByJurisdiction, covenantHealth, sharedCollateral, topConcentration, upcomingContinuations, cushion });
  });

  // ---------- debtors ----------
  r.get('/debtors', (_req, res) => {
    res.json(db.prepare(`SELECT d.*,
      (SELECT json_group_array(json_object('transaction_id', td.transaction_id, 'role', td.role)) FROM transaction_debtors td WHERE td.debtor_id = d.id) AS memberships
      FROM debtors d ORDER BY d.legal_name`).all());
  });

  // ---------- draws ----------
  r.post('/draws/:id/repay', (req, res) => {
    const draw: any = db.prepare('SELECT * FROM draws WHERE id = ?').get(req.params.id);
    if (!draw) return res.status(404).json({ error: 'not found' });
    if (draw.status !== 'outstanding') return res.status(400).json({ error: `draw is ${draw.status}` });
    const today = new Date().toISOString().slice(0, 10);
    db.prepare(`UPDATE draws SET status = 'repaid', outstanding_cents = 0, repaid_date = ? WHERE id = ?`).run(today, req.params.id);
    logAudit({ actor_role: req.body.actor_role ?? 'pm', actor_name: req.body.actor_name ?? 'system', action: 'draw.repay', entity_type: 'draw', entity_id: req.params.id, detail: `${draw.label} (${draw.collateral_pool}) marked repaid.` });
    const isBlanket = draw.collateral_pool === 'blanket';
    db.prepare(`INSERT INTO alerts (id, type, severity, title, description, transaction_id, acked, created_at) VALUES (?,?,?,?,?,?,0,?)`)
      .run(crypto.randomUUID(), 'blanket_released', isBlanket ? 'info' : 'info', isBlanket ? 'Blanket Lien Released' : 'Draw Repaid', `${draw.label} repaid. ${isBlanket ? 'Conditional covenants released; UCC-3 amendment recommended to narrow collateral description.' : 'No collateral release triggered.'}`, draw.transaction_id, Date.now());
    if (isBlanket) {
      // Queue a UCC-3 amendment automatically for review.
      const parentFiling: any = db.prepare(`SELECT * FROM filings WHERE transaction_id = ? AND filing_type = 'UCC-1' AND status = 'confirmed' LIMIT 1`).get(draw.transaction_id);
      if (parentFiling) {
        db.prepare(`INSERT INTO filings (id, transaction_id, filing_type, status, jurisdiction, debtor_name, debtor_id, secured_party, collateral_description, amends_filing_id, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(crypto.randomUUID(), draw.transaction_id, 'UCC-3-amendment', 'draft', parentFiling.jurisdiction, parentFiling.debtor_name, parentFiling.debtor_id, parentFiling.secured_party, `Narrow collateral description to remove blanket lien; specific equipment only (per Master Agreement upon Blanket Lien Draw repayment).`, parentFiling.id, `Auto-queued upon repayment of draw ${draw.id}.`, Date.now());
      }
    }
    res.json({ ok: true });
  });

  // ---------- monitoring ----------
  r.get('/monitoring/stats', (_req, res) => {
    const watched = db.prepare(`SELECT COUNT(DISTINCT debtor_id) AS c FROM debtor_watches WHERE status = 'active'`).get() as any;
    const jurs = db.prepare(`SELECT COUNT(DISTINCT watch_jurisdiction) AS c FROM debtor_watches WHERE status = 'active'`).get() as any;
    const thirty = Date.now() - 30 * 86_400_000;
    const detected = db.prepare(`SELECT COUNT(*) AS c FROM third_party_filings WHERE detected_at >= ?`).get(thirty) as any;
    const unreviewed = db.prepare(`SELECT COUNT(*) AS c FROM third_party_filings WHERE reviewed = 0`).get() as any;
    res.json({ debtors_watched: watched.c, active_jurisdictions: jurs.c, detected_30d: detected.c, unreviewed: unreviewed.c });
  });

  r.get('/monitoring/filings', (req, res) => {
    const where = req.query.debtor_id ? 'WHERE tpf.debtor_id = ?' : '';
    const args = req.query.debtor_id ? [req.query.debtor_id] : [];
    const rows = db.prepare(`SELECT tpf.*, d.legal_name AS debtor_name, d.state_of_formation
      FROM third_party_filings tpf LEFT JOIN debtors d ON d.id = tpf.debtor_id ${where} ORDER BY tpf.detected_at DESC`).all(...args as any);
    res.json(rows);
  });

  r.get('/monitoring/watches', (_req, res) => {
    const rows = db.prepare(`SELECT w.*, d.legal_name, d.state_of_formation,
        (SELECT GROUP_CONCAT(DISTINCT t.borrower) FROM transaction_debtors td JOIN transactions t ON t.id = td.transaction_id WHERE td.debtor_id = w.debtor_id) AS deals,
        (SELECT COUNT(*) FROM third_party_filings tpf WHERE tpf.debtor_id = w.debtor_id) AS detections
      FROM debtor_watches w LEFT JOIN debtors d ON d.id = w.debtor_id
      ORDER BY d.legal_name, w.watch_jurisdiction`).all();
    res.json(rows);
  });

  r.post('/monitoring/filings/:id/review', (req, res) => {
    db.prepare('UPDATE third_party_filings SET reviewed = 1 WHERE id = ?').run(req.params.id);
    logAudit({ actor_role: req.body.actor_role ?? 'pm', actor_name: req.body.actor_name ?? 'system', action: 'tpf.review', entity_type: 'third_party_filing', entity_id: req.params.id, detail: '' });
    res.json({ ok: true });
  });

  r.post('/monitoring/simulate', (_req, res) => {
    const candidates = db.prepare(`SELECT id, legal_name, state_of_formation FROM debtors WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1`).get() as any;
    if (!candidates) return res.status(400).json({ error: 'no debtors' });
    const parties = ['Apex Credit Partners', 'Owl Rock Capital', 'Ares Direct Lending', 'Sixth Street Lending', 'Blue Owl Capital', 'Acme Equipment Leasing', 'Pacific Western Bank'];
    const collaterals = ['All assets of debtor', 'Specific manufacturing equipment (PMSI)', 'Accounts receivable and proceeds', 'Inventory and proceeds', 'Specific titled vehicles'];
    const impacts: Array<['none' | 'subordinate' | 'pari-passu' | 'senior' | 'unknown', string]> = [
      ['subordinate', 'Files after our perfection date; subordinate per first-to-file rule.'],
      ['pari-passu', 'PMSI on specific equipment — supersedes our blanket for those assets per §9-324.'],
      ['unknown', 'Filing description ambiguous; requires legal review.'],
    ];
    const [impact, reason] = impacts[Math.floor(Math.random() * impacts.length)];
    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO third_party_filings (id, debtor_id, jurisdiction, filing_type, secured_party, collateral_description, file_number, filed_at, detected_at, priority_impact, priority_impact_reason, reviewed, source, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?,?)`)
      .run(id, candidates.id, candidates.state_of_formation || 'DE', 'UCC-1', parties[Math.floor(Math.random() * parties.length)], collaterals[Math.floor(Math.random() * collaterals.length)], `2025${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`, new Date().toISOString().slice(0, 10), Date.now(), impact, reason, 'simulated', Date.now());
    db.prepare(`INSERT INTO alerts (id, type, severity, title, description, acked, created_at) VALUES (?,?,?,?,?,0,?)`)
      .run(crypto.randomUUID(), 'new_subordinate', impact === 'pari-passu' ? 'warning' : 'info', `New UCC Filing Detected`, `Filing detected against ${candidates.legal_name} (${candidates.state_of_formation}) — ${impact} priority impact.`, Date.now());
    res.json({ id });
  });

  // ---------- attributions ----------
  r.get('/attributions', (req, res) => {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) return res.json([]);
    res.json(db.prepare('SELECT * FROM source_attributions WHERE entity_type = ? AND entity_id = ? ORDER BY retrieved_at DESC').all(entity_type, entity_id));
  });

  // ---------- settings ----------
  r.get('/settings', (_req, res) => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
    const out: Record<string, string> = {};
    for (const row of rows) out[row.key] = row.value;
    res.json(out);
  });

  return r;
}

function computeStatus(op: string, threshold: number, actual: number): 'pass' | 'warning' | 'fail' {
  if (op === '>=') {
    if (actual >= threshold) return actual <= threshold * 1.05 ? 'warning' : 'pass';
    return 'fail';
  }
  if (op === '<=') {
    if (actual <= threshold) return actual >= threshold * 0.95 ? 'warning' : 'pass';
    return 'fail';
  }
  return 'pass';
}

function computeCushion(op: string, threshold: number, actual: number): number {
  if (threshold === 0) return 0;
  if (op === '>=') return ((actual - threshold) / threshold) * 100;
  if (op === '<=') return ((threshold - actual) / threshold) * 100;
  return 0;
}

function mockExtractCovenants(transactionId: string): Record<string, number> {
  const covs = db.prepare('SELECT * FROM covenants WHERE transaction_id = ?').all(transactionId) as any[];
  const out: Record<string, number> = {};
  for (const c of covs) {
    // Generate a value within ±15% of threshold to make the demo interesting
    const drift = (Math.random() - 0.4) * 0.2;
    const base = c.threshold * (1 + (c.operator === '>=' ? Math.abs(drift) : -Math.abs(drift)) + drift * 0.5);
    out[c.metric] = Number(base.toFixed(2));
  }
  return out;
}

async function extractWithGemini(transactionId: string, contentBase64: string): Promise<Record<string, number>> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const covs = db.prepare('SELECT metric, operator, threshold, unit FROM covenants WHERE transaction_id = ?').all(transactionId) as any[];
  const schema = covs.map(c => `- "${c.metric}" (${c.unit}, threshold ${c.operator} ${c.threshold})`).join('\n');
  const prompt = `You are extracting covenant compliance values from a compliance certificate. Return STRICT JSON with this shape: {"values": {"<metric>": <number>}}. Extract values for these covenants if present:\n${schema}\nReturn only numeric values. Omit metrics you can't find.`;
  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [
      { text: prompt },
      { inlineData: { mimeType: 'application/pdf', data: contentBase64 } },
    ]}],
  });
  const text = resp.text ?? '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no json in response');
  const parsed = JSON.parse(m[0]);
  return parsed.values ?? {};
}
