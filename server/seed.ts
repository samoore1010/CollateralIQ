import { db, parseAmount } from './db';

export function seedIfEmpty() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM transactions').get() as { c: number };
  if (existing.c > 0) return;
  console.log('[seed] populating CollateralIQ database…');

  const now = Date.now();
  const day = 86_400_000;

  // ---------- transactions ----------
  const tx = [
    { id: 'TRX-2024-001', borrower: 'TechFlow Systems Inc.', deal_type: 'Term Loan B', amount: 45_000_000, closing: '2023-11-15', maturity: '2028-11-15', jurisdiction: 'Delaware', law: 'New York', collateral_type: 'All Assets', agent: 'JPMorgan Chase', share: 38.5, tranche: 'first-lien' },
    { id: 'TRX-2024-002', borrower: 'Solaris Energy Group', deal_type: 'Equipment Finance', amount: 12_500_000, closing: '2024-01-20', maturity: '2029-01-20', jurisdiction: 'Texas', law: 'Texas', collateral_type: 'Specific Equipment', agent: 'CollateralIQ (Sole)', share: 100, tranche: 'bilateral' },
    { id: 'TRX-2024-003', borrower: 'Northwest Logistics', deal_type: 'Revolver', amount: 8_000_000, closing: '2022-06-10', maturity: '2027-06-10', jurisdiction: 'Nevada', law: 'Nevada', collateral_type: 'Accounts Receivable', agent: 'Wells Fargo', share: 25, tranche: 'first-lien' },
    { id: 'TRX-2024-004', borrower: 'Apex Manufacturing', deal_type: 'Acquisition Finance', amount: 22_000_000, closing: '2023-03-01', maturity: '2028-03-01', jurisdiction: 'Delaware', law: 'New York', collateral_type: 'Inventory & IP', agent: 'Goldman Sachs', share: 45, tranche: 'first-lien' },
    { id: 'TRX-2024-005', borrower: 'BioGen Innovations', deal_type: 'Venture Debt', amount: 15_000_000, closing: '2023-09-12', maturity: '2026-09-12', jurisdiction: 'Massachusetts', law: 'Delaware', collateral_type: 'Intellectual Property', agent: 'CollateralIQ (Sole)', share: 100, tranche: 'bilateral' },
    { id: 'TRX-2024-006', borrower: 'Urban Development Corp', deal_type: 'Real Estate Bridge', amount: 35_000_000, closing: '2024-02-01', maturity: '2027-02-01', jurisdiction: 'New York', law: 'New York', collateral_type: 'Commercial Real Estate', agent: 'CollateralIQ (Sole)', share: 100, tranche: 'first-lien' },
    { id: 'TRX-2024-007', borrower: 'RetailGiant Holdings', deal_type: 'Asset-Based Lending', amount: 60_000_000, closing: '2021-11-30', maturity: '2026-11-30', jurisdiction: 'Delaware', law: 'New York', collateral_type: 'Inventory & AR', agent: 'Bank of America', share: 18, tranche: 'first-lien' },
    { id: 'TRX-2024-008', borrower: 'GreenEnergy Solutions', deal_type: 'Mezzanine Financing', amount: 18_000_000, closing: '2023-07-22', maturity: '2028-07-22', jurisdiction: 'California', law: 'New York', collateral_type: 'Subordinated Interest', agent: 'CollateralIQ (Sole)', share: 100, tranche: 'second-lien' },
    { id: 'TRX-2024-009', borrower: 'SkyHigh Aviation', deal_type: 'Aircraft Finance', amount: 28_500_000, closing: '2024-01-05', maturity: '2034-01-05', jurisdiction: 'International Registry', law: 'New York', collateral_type: 'Specific Aircraft', agent: 'CollateralIQ (Sole)', share: 100, tranche: 'bilateral' },
    { id: 'TRX-2024-010', borrower: 'RestructureCo Inc.', deal_type: 'DIP Financing', amount: 10_000_000, closing: '2024-02-15', maturity: '2025-02-15', jurisdiction: 'Delaware', law: 'New York', collateral_type: 'Super-Priority All Assets', agent: 'CollateralIQ (Sole)', share: 100, tranche: 'bilateral' },
  ];

  const txStmt = db.prepare(`INSERT INTO transactions (id, borrower, deal_type, amount_cents, closing_date, maturity_date, jurisdiction, governing_law, collateral_type, agent_firm, our_share_pct, intercreditor_tranche, created_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const t of tx) {
    txStmt.run(t.id, t.borrower, t.deal_type, t.amount * 100, t.closing, t.maturity, t.jurisdiction, t.law, t.collateral_type, t.agent, t.share, t.tranche, now);
  }

  // ---------- contacts / mechanics / rights ----------
  const contacts = db.prepare('INSERT INTO contacts (transaction_id, role, name, firm, email) VALUES (?, ?, ?, ?, ?)');
  const mechs = db.prepare('INSERT INTO mechanics (transaction_id, label, value) VALUES (?, ?, ?)');
  const rights = db.prepare('INSERT INTO rights (transaction_id, title, description, status) VALUES (?, ?, ?, ?)');

  const t1 = 'TRX-2024-001';
  [
    ['Borrower Counsel', 'Sarah Jenkins', 'Latham & Watkins', 'sarah.j@lw.com'],
    ['Admin Agent', 'Michael Ross', 'JPMorgan Chase', 'm.ross@jpm.com'],
    ['Collateral Manager', 'David Chen', 'CollateralIQ', 'd.chen@collateraliq.com'],
  ].forEach(c => contacts.run(t1, ...c));
  [
    ['Interest Rate', 'SOFR + 4.50%'], ['Amortization', '1.0% per annum'],
    ['Call Protection', '102 / 101 / Par'], ['Excess Cash Flow', '50% sweep with step-downs'],
  ].forEach(m => mechs.run(t1, ...m));
  [
    ['Access to Books & Records', 'Lender has right to inspect books with 5 days notice.', 'active'],
    ['Board Observation', 'Right to appoint one non-voting observer to Board meetings.', 'active'],
    ['Insurance Proceeds', 'First claim on all insurance proceeds > $500k.', 'active'],
    ['Control Agreements', 'DACAs required on all deposit accounts > $250k.', 'pending'],
  ].forEach(r => rights.run(t1, ...r));

  const t2 = 'TRX-2024-002';
  [
    ['Borrower Counsel', 'Robert Miller', 'Vinson & Elkins', 'r.miller@velaw.com'],
    ['Lender Counsel', 'Amanda White', 'Kirkland & Ellis', 'a.white@kirkland.com'],
  ].forEach(c => contacts.run(t2, ...c));
  [['Interest Rate', 'Fixed 7.25%'], ['Term', '60 Months'], ['Payment Structure', 'Monthly P+I'], ['Residual Value', '10% Balloon']]
    .forEach(m => mechs.run(t2, ...m));
  [['Inspection Rights', 'Quarterly physical inspection of equipment.', 'active'], ['Maintenance Covenants', 'Borrower must maintain OEM service contracts.', 'active']]
    .forEach(r => rights.run(t2, ...r));

  const t5 = 'TRX-2024-005';
  [
    ['Borrower CFO', 'Dr. Elena Rostova', 'BioGen', 'elena@biogen.io'],
    ['IP Counsel', 'James T. Kirk', 'Cooley', 'jkirk@cooley.com'],
  ].forEach(c => contacts.run(t5, ...c));
  [['Interest Rate', 'Prime + 2.00%'], ['Warrants', '2.5% Coverage'], ['Interest Only', '12 Months'], ['Final Payment', '5% Backend Fee']]
    .forEach(m => mechs.run(t5, ...m));
  [['IP Pledge', 'Negative pledge on all intellectual property.', 'active'], ['Investor Rights', 'Information rights equal to major investors.', 'active']]
    .forEach(r => rights.run(t5, ...r));

  // ---------- collateral ----------
  const col = db.prepare(`INSERT INTO collateral (id, transaction_id, name, category, a9_category, perfection_method, market_value_cents, liquidation_value_cents, original_cost_cents, location, status, serial_number, manufacturer, year, description, image, condition, created_at)
                          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const assets = [
    { id: 'AST-001', tx: 'TRX-2024-001', name: '2022 Haas VF-4SS CNC Vertical Machining Center', cat: 'Industrial Equipment', a9: 'equipment', perf: 'filing', mv: 85_000, lv: 72_000, oc: 115_000, loc: 'Austin, TX (Facility A)', status: 'Secured', sn: '11892-442-A', mfg: 'Haas Automation', yr: 2022, cond: 'Excellent', img: 'https://picsum.photos/seed/cnc/800/600', desc: 'High-performance Super-Speed vertical machining center; 50"x20"x25", 40 taper, 30hp drive, 12,000 rpm, 30+1 side-mount tool changer.' },
    { id: 'AST-002', tx: 'TRX-2024-001', name: 'Commercial Real Estate - Warehouse B', cat: 'Real Estate', a9: 'fixtures', perf: 'filing+mortgage', mv: 2_400_000, lv: 1_950_000, oc: 1_800_000, loc: 'Reno, NV', status: 'Secured', sn: 'APN: 004-221-18', mfg: 'N/A', yr: 2015, cond: 'Good', img: 'https://picsum.photos/seed/warehouse/800/600', desc: '50,000 sq ft warehouse, 30ft clear height, 8 docks, 2,000 sq ft office. I-80 logistics hub.' },
    { id: 'AST-003', tx: 'TRX-2024-005', name: 'Patent Portfolio - AI Optimization Algorithms', cat: 'Intellectual Property', a9: 'general_intangibles', perf: 'filing+uspto', mv: 1_200_000, lv: 400_000, oc: 2_500_000, loc: 'Delaware', status: 'Secured', sn: 'USPTO-VARIOUS', mfg: 'BioGen Innovations', yr: 2020, cond: 'Active', img: 'https://picsum.photos/seed/patent/800/600', desc: '5 granted US patents covering neural network optimization for edge devices.' },
    { id: 'AST-004', tx: 'TRX-2024-003', name: 'Fleet of 12 Delivery Vans (Ford Transit)', cat: 'Vehicles', a9: 'titled_goods', perf: 'certificate_of_title', mv: 450_000, lv: 380_000, oc: 720_000, loc: 'Seattle, WA', status: 'At Risk', sn: 'VIN-VARIOUS', mfg: 'Ford', yr: 2021, cond: 'Good', img: 'https://picsum.photos/seed/vans/800/600', desc: '12 Ford Transit cargo vans, fleet-maintained, avg 60k miles.' },
    { id: 'AST-005', tx: 'TRX-2024-004', name: 'Inventory - High Grade Steel Raw Material', cat: 'Inventory', a9: 'inventory', perf: 'filing', mv: 320_000, lv: 280_000, oc: 350_000, loc: 'Pittsburgh, PA', status: 'Secured', sn: '—', mfg: 'Various', yr: 2024, cond: 'New', img: 'https://picsum.photos/seed/steel/800/600', desc: '4,400 tons high-grade structural steel, hot-rolled, A572 Gr. 50.' },
    { id: 'AST-006', tx: 'TRX-2024-001', name: 'Custom Manufacturing Line A', cat: 'Industrial Equipment', a9: 'equipment', perf: 'filing', mv: 1_100_000, lv: 720_000, oc: 1_400_000, loc: 'Austin, TX', status: 'Secured', sn: 'ML-A-2022', mfg: 'TechFlow Internal', yr: 2022, cond: 'Excellent', img: 'https://picsum.photos/seed/factory/800/600', desc: 'Custom assembly line with robotic stations, vision QA, conveyor.' },
    { id: 'AST-007', tx: 'TRX-2024-009', name: 'Gulfstream G650ER', cat: 'Aircraft', a9: 'titled_goods', perf: 'faa_registry+intl_registry', mv: 28_500_000, lv: 24_000_000, oc: 65_000_000, loc: 'Teterboro, NJ', status: 'Secured', sn: '6189', mfg: 'Gulfstream Aerospace', yr: 2016, cond: 'Excellent', img: 'https://picsum.photos/seed/jet/800/600', desc: '2016 G650ER, 2,400 TT, 14 PAX, Rolls-Royce BR725 on CorporateCare.' },
    { id: 'AST-008', tx: 'TRX-2024-005', name: 'SaaS Platform Source Code (v4.0)', cat: 'Intellectual Property', a9: 'general_intangibles', perf: 'filing+escrow', mv: 8_500_000, lv: 2_100_000, oc: 6_000_000, loc: 'Cloud (AWS)', status: 'Secured', sn: 'GIT-SHA-4.0.0', mfg: 'BioGen Engineering', yr: 2024, cond: 'Active', img: 'https://picsum.photos/seed/code/800/600', desc: 'Production SaaS platform, 1.2M LOC, source escrow with Iron Mountain.' },
    { id: 'AST-009', tx: 'TRX-2024-006', name: 'Downtown Office Tower (20 Stories)', cat: 'Real Estate', a9: 'fixtures', perf: 'mortgage', mv: 42_000_000, lv: 31_000_000, oc: 38_000_000, loc: 'Chicago, IL', status: 'Warning', sn: 'PIN: 17-09-450-022', mfg: 'N/A', yr: 1998, cond: 'Class B', img: 'https://picsum.photos/seed/building/800/600', desc: '20-story Class B office tower, 320,000 RSF, 78% leased (declining).' },
    { id: 'AST-010', tx: 'TRX-2024-004', name: 'MRI Machines (3x Siemens Magnetom)', cat: 'Healthcare Equipment', a9: 'equipment', perf: 'filing', mv: 4_200_000, lv: 2_900_000, oc: 5_400_000, loc: 'Boston, MA', status: 'Secured', sn: 'MAG-2021-{A,B,C}', mfg: 'Siemens Healthineers', yr: 2021, cond: 'Excellent', img: 'https://picsum.photos/seed/mri/800/600', desc: '3x Siemens Magnetom Vida 3T systems, hospital-grade installation.' },
  ];
  for (const a of assets) {
    col.run(a.id, a.tx, a.name, a.cat, a.a9, a.perf, a.mv * 100, a.lv * 100, a.oc * 100, a.loc, a.status, a.sn, a.mfg, a.yr, a.desc, a.img, a.cond, now);
  }

  // ---------- liens ----------
  const lien = db.prepare(`INSERT INTO liens (id, transaction_id, position, holder, amount_cents, lien_type, collateral_scope, status, filing_date, is_ours, pmsi, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const liens001 = [
    [1, 'CollateralIQ Capital (Us)', 45_000_000, 'Senior Secured', 'All Assets (Blanket)', 'Perfected', '2023-11-15', 1, 0, ''],
    [2, 'Regional Bank Corp', 5_000_000, 'Revolver', 'Accounts Receivable', 'Perfected', '2023-12-01', 0, 0, ''],
    [3, 'Equipment Leasing Co.', 2_500_000, 'PMSI', 'Specific Equipment (CNC Machines)', 'Perfected', '2024-01-10', 0, 1, 'PMSI supersedes blanket for these specific assets only.'],
    [4, 'Unsecured Creditors', 0, 'Unsecured', 'None', 'N/A', '—', 0, 0, ''],
  ];
  liens001.forEach((l, i) => lien.run(crypto.randomUUID(), 'TRX-2024-001', ...(l as any)));

  [[1, 'CollateralIQ Capital (Us)', 12_500_000, 'PMSI', 'Specific Equipment', 'Pending', '2024-01-20', 1, 1, '']]
    .forEach(l => lien.run(crypto.randomUUID(), 'TRX-2024-002', ...(l as any)));
  [
    [1, 'CollateralIQ Capital (Us)', 15_000_000, 'Senior Secured', 'All Assets ex. IP', 'Perfected', '2023-09-12', 1, 0, ''],
    [2, 'Silicon Valley Bank', 2_000_000, 'Revolver', 'Cash & AR', 'Perfected', '2022-05-10', 0, 0, ''],
  ].forEach(l => lien.run(crypto.randomUUID(), 'TRX-2024-005', ...(l as any)));
  [[1, 'CollateralIQ Capital (Us)', 28_500_000, 'Aircraft Mortgage', 'Airframe & Engines', 'Pending', '2024-01-05', 1, 0, 'Cape Town Convention registration pending.']]
    .forEach(l => lien.run(crypto.randomUUID(), 'TRX-2024-009', ...(l as any)));

  // ---------- filings ----------
  const filing = db.prepare(`INSERT INTO filings (id, transaction_id, filing_type, status, jurisdiction, debtor_name, debtor_address, secured_party, secured_party_address, collateral_description, file_number, filed_at, lapse_date, continuation_window_open, amends_filing_id, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  filing.run(crypto.randomUUID(), 'TRX-2024-001', 'UCC-1', 'confirmed', 'DE', 'TechFlow Systems Inc.', '1209 Orange St, Wilmington DE 19801', 'CollateralIQ Capital LLC', '200 Park Ave, New York NY', 'All assets of debtor, now owned or hereafter acquired', '20235621047', '2023-11-15', '2028-11-15', '2028-05-15', null, '', now);
  filing.run(crypto.randomUUID(), 'TRX-2024-002', 'UCC-1', 'queued', 'TX', 'Solaris Energy Group LLC', '500 Main St, Houston TX', 'CollateralIQ Capital LLC', '200 Park Ave, New York NY', 'Specific equipment described in Schedule A (PMSI)', null, null, null, null, null, 'Awaiting jurisdictional confirmation.', now);
  filing.run(crypto.randomUUID(), 'TRX-2024-005', 'UCC-1', 'confirmed', 'MA', 'BioGen Innovations Inc.', '100 Tech Sq, Cambridge MA', 'CollateralIQ Capital LLC', '200 Park Ave, New York NY', 'All assets excluding IP; negative pledge on IP', '202395122', '2023-09-12', '2028-09-12', '2028-03-12', null, '', now);
  filing.run(crypto.randomUUID(), 'TRX-2024-007', 'UCC-1', 'confirmed', 'DE', 'RetailGiant Holdings Inc.', '1209 Orange St, Wilmington DE', 'Bank of America NA (Agent)', '—', 'All inventory and accounts receivable', '20212210877', '2021-11-30', '2026-11-30', '2026-05-30', null, 'Continuation window opens soon.', now);
  filing.run(crypto.randomUUID(), 'TRX-2024-004', 'UCC-1', 'confirmed', 'DE', 'Apex Manufacturing Inc.', '—', 'Goldman Sachs (Agent)', '—', 'Inventory and IP collateral', '20230331045', '2023-03-01', '2028-03-01', '2027-09-01', null, 'Debtor name change pending — UCC-3 amendment required.', now);
  filing.run(crypto.randomUUID(), 'TRX-2024-006', 'UCC-1', 'confirmed', 'NY', 'Urban Development Corp', '—', 'CollateralIQ Capital LLC', '—', 'Commercial real estate fixtures', '202402011055', '2024-02-01', '2029-02-01', '2028-08-01', null, '', now);
  filing.run(crypto.randomUUID(), 'TRX-2024-009', 'UCC-1', 'draft', 'NY', 'SkyHigh Aviation LLC', '—', 'CollateralIQ Capital LLC', '—', 'Spare parts & ground equipment (FAA registry separate)', null, null, null, null, null, 'Pending review by aviation counsel.', now);

  // ---------- covenants ----------
  const cov = db.prepare(`INSERT INTO covenants (id, transaction_id, metric, formula, operator, threshold, unit, frequency, cure_period_days, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const cTest = db.prepare(`INSERT INTO covenant_tests (id, covenant_id, transaction_id, period_end, actual_value, status, cushion_pct, source, cert_id, trend, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

  const covenantSeed: Array<[string, string, string, string, number, string, string, number, number, string, string]> = [
    ['TRX-2024-001', 'Debt Service Coverage Ratio (DSCR)', 'EBITDA / (Interest + Principal)', '>=', 1.25, 'ratio', 'quarterly', 30, 1.42, 'pass', 'stable'],
    ['TRX-2024-001', 'Total Leverage Ratio', 'Total Debt / EBITDA', '<=', 4.00, 'ratio', 'quarterly', 30, 3.85, 'warning', 'worsening'],
    ['TRX-2024-001', 'Minimum Liquidity', 'Unrestricted Cash + Revolver Availability', '>=', 2_000_000, 'currency', 'monthly', 15, 3_100_000, 'pass', 'improving'],
    ['TRX-2024-001', 'Capital Expenditures', 'CapEx (TTM)', '<=', 500_000, 'currency', 'quarterly', 30, 320_000, 'pass', 'stable'],
    ['TRX-2024-002', 'Fixed Charge Coverage Ratio', 'EBITDAR / Fixed Charges', '>=', 1.10, 'ratio', 'quarterly', 30, 1.15, 'pass', 'stable'],
    ['TRX-2024-002', 'Loan to Value', 'Loan / Appraised Value', '<=', 80, 'percent', 'annual', 0, 75, 'pass', 'improving'],
    ['TRX-2024-005', 'Remaining Months Liquidity', 'Cash / Burn Rate', '>=', 6, 'months', 'monthly', 15, 8.5, 'pass', 'improving'],
    ['TRX-2024-005', 'Annual Recurring Revenue', 'ARR', '>=', 10_000_000, 'currency', 'quarterly', 30, 12_200_000, 'pass', 'stable'],
    ['TRX-2024-005', 'Churn Rate', 'Logo Churn (TTM)', '<=', 5, 'percent', 'quarterly', 30, 4.2, 'pass', 'stable'],
    ['TRX-2024-009', 'Loan to Value', 'Loan / Appraised Value', '<=', 85, 'percent', 'annual', 0, 82, 'pass', 'stable'],
    ['TRX-2024-009', 'Technical Dispatch Reliability', 'On-time Departures', '>=', 98, 'percent', 'monthly', 0, 99.5, 'pass', 'stable'],
    ['TRX-2024-008', 'Total Leverage Ratio', 'Total Debt / EBITDA', '<=', 6.00, 'ratio', 'quarterly', 30, 6.42, 'fail', 'worsening'],
    ['TRX-2024-008', 'Minimum EBITDA', 'EBITDA (TTM)', '>=', 4_000_000, 'currency', 'quarterly', 30, 3_650_000, 'fail', 'worsening'],
    ['TRX-2024-004', 'Debt Service Coverage Ratio (DSCR)', 'EBITDA / Debt Service', '>=', 1.20, 'ratio', 'quarterly', 30, 1.22, 'warning', 'worsening'],
  ];
  for (const c of covenantSeed) {
    const id = crypto.randomUUID();
    cov.run(id, c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], now);
    cTest.run(crypto.randomUUID(), id, c[0], '2024-Q1', c[8], c[9], computeCushion(c[3], c[4], c[8]), 'manual', null, c[10], now);
  }

  // ---------- buyers ----------
  const buyer = db.prepare(`INSERT INTO buyers (id, firm, type, interests, budget_min_cents, budget_max_cents, geography, aum_cents, verified, contact_email, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const buyers = [
    ['Precision Machining Co.', 'strategic', ['Industrial Equipment', 'CNC', 'Machining'], 100_000, 5_000_000, 'Southwest US', 50_000_000, 'pm@precisionmach.com'],
    ['Texas Industrial Supply', 'dealer', ['Industrial Equipment', 'Inventory'], 50_000, 2_000_000, 'Texas', 25_000_000, 'sales@txindsupply.com'],
    ['Logistics REIT Partners', 'reit', ['Real Estate', 'Warehouse', 'Industrial'], 5_000_000, 100_000_000, 'National', 2_400_000_000, 'acq@logisticsreit.com'],
    ['Nevada Distribution Corp', 'strategic', ['Real Estate', 'Warehouse'], 1_000_000, 25_000_000, 'Nevada', 180_000_000, 'rd@nvdc.com'],
    ['Global Manufacturing Inc.', 'strategic', ['Industrial Equipment', 'Robotics', 'Manufacturing Lines'], 1_000_000, 50_000_000, 'North America', 1_200_000_000, 'ma@globalmfg.com'],
    ['Asset Liquidation Partners', 'liquidator', ['Inventory', 'Vehicles', 'Equipment'], 100_000, 10_000_000, 'National', 80_000_000, 'deals@alp.com'],
    ['Tech Ventures Capital', 'pe_vc', ['IP', 'Patents', 'Software'], 1_000_000, 100_000_000, 'Silicon Valley', 1_800_000_000, 'partners@techvc.com'],
    ['Edge AI Startup Co.', 'strategic', ['IP', 'Patents', 'AI'], 500_000, 5_000_000, 'San Francisco', 50_000_000, 'cto@edgeai.io'],
    ['IP Aggregator Fund', 'pe_vc', ['IP', 'Patents'], 1_000_000, 50_000_000, 'National', 400_000_000, 'fund@ipagg.com'],
    ['Heritage Global Partners', 'liquidator', ['Industrial Equipment', 'Inventory', 'Real Estate'], 100_000, 50_000_000, 'National', 600_000_000, 'auctions@hgp.com'],
    ['Gordon Brothers', 'liquidator', ['Inventory', 'IP', 'Equipment', 'Real Estate'], 250_000, 250_000_000, 'Global', 1_500_000_000, 'team@gordonbrothers.com'],
    ['Hilco Global', 'liquidator', ['Inventory', 'IP', 'Real Estate'], 500_000, 500_000_000, 'Global', 3_000_000_000, 'team@hilco.com'],
    ['Ritchie Bros Auctioneers', 'broker', ['Equipment', 'Vehicles'], 10_000, 5_000_000, 'Global', 800_000_000, 'sales@ritchiebros.com'],
    ['Fortune 500 Flight Dept', 'strategic', ['Aircraft', 'Jets'], 5_000_000, 100_000_000, 'North America', 0, 'aviation@f500.example'],
    ['NetJets Acquisitions', 'strategic', ['Aircraft'], 1_000_000, 100_000_000, 'Global', 8_000_000_000, 'acq@netjets.com'],
    ['Boston Medical Group', 'strategic', ['Healthcare Equipment'], 250_000, 10_000_000, 'Northeast', 220_000_000, 'procurement@bmg.org'],
    ['Steel Recyclers United', 'dealer', ['Inventory', 'Steel', 'Metals'], 50_000, 5_000_000, 'Midwest', 60_000_000, 'buying@sru.com'],
    ['Manhattan REIT', 'reit', ['Real Estate', 'Office'], 10_000_000, 500_000_000, 'NY/NJ', 5_400_000_000, 'acq@manhattanreit.com'],
    ['Midwest Office Partners', 'pe_vc', ['Real Estate', 'Office'], 5_000_000, 100_000_000, 'Midwest', 350_000_000, 'team@midwestop.com'],
    ['Fleet Auction Co.', 'broker', ['Vehicles', 'Fleet'], 25_000, 2_000_000, 'Pacific Northwest', 12_000_000, 'auctions@fleetauction.com'],
  ];
  for (const b of buyers) {
    buyer.run(crypto.randomUUID(), b[0], b[1], JSON.stringify(b[2]), (b[3] as number) * 100, (b[4] as number) * 100, b[5], (b[7] as number) * 100, 1, b[8] ?? null, '');
  }

  // ---------- listings ----------
  const listing = db.prepare(`INSERT INTO listings (id, collateral_id, asking_price_cents, status, notice_sent_at, notice_recipients, notice_period_ends_at, sale_method, created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
  listing.run('LST-8842', 'AST-001', 85_000 * 100, 'listed', null, null, null, 'public', now);
  listing.run('LST-8845', 'AST-002', 2_400_000 * 100, 'under_bid', null, null, null, 'public', now - 45 * day);
  listing.run('LST-8810', 'AST-004', 450_000 * 100, 'notice_pending', null, null, null, 'public', now - 2 * day);

  // ---------- bids ----------
  const bid = db.prepare(`INSERT INTO bids (id, listing_id, buyer_id, amount_cents, status, notes, created_at) VALUES (?,?,?,?,?,?,?)`);
  const buyerIds = db.prepare('SELECT id, firm FROM buyers').all() as Array<{id: string, firm: string}>;
  const findBuyer = (firm: string) => buyerIds.find(b => b.firm === firm)?.id ?? buyerIds[0].id;
  bid.run(crypto.randomUUID(), 'LST-8842', findBuyer('Precision Machining Co.'), 78_500 * 100, 'active', '', now - 3 * day);
  bid.run(crypto.randomUUID(), 'LST-8845', findBuyer('Logistics REIT Partners'), 2_100_000 * 100, 'active', '', now - 10 * day);

  // ---------- alerts ----------
  const alert = db.prepare(`INSERT INTO alerts (id, type, severity, title, description, transaction_id, acked, created_at) VALUES (?,?,?,?,?,?,?,?)`);
  alert.run(crypto.randomUUID(), 'ucc_lapse', 'warning', 'UCC Filing Expiring', 'RetailGiant Holdings — 6-month continuation window opens in 30 days', 'TRX-2024-007', 0, now - 2 * 3600_000);
  alert.run(crypto.randomUUID(), 'covenant_breach', 'critical', 'Covenant Breach', 'GreenEnergy Solutions — Total Leverage 6.42x (req ≤ 6.00x)', 'TRX-2024-008', 0, now - 5 * 3600_000);
  alert.run(crypto.randomUUID(), 'new_subordinate', 'info', 'New Lien Detected', 'Subordinate lien filed against TechFlow Systems (UCC #20245621099)', 'TRX-2024-001', 0, now - 1 * day);
  alert.run(crypto.randomUUID(), 'perfection_complete', 'success', 'Perfection Complete', 'Solaris Energy Group — UCC-1 confirmed by Texas SOS', 'TRX-2024-002', 0, now - 2 * day);
  alert.run(crypto.randomUUID(), 'insurance_lapse', 'critical', 'Insurance Lapsed', 'Warehouse B — All-risk policy expired 2024-04-30', 'TRX-2024-001', 0, now - 2 * day);
  alert.run(crypto.randomUUID(), 'daca_pending', 'warning', 'DACA Pending', 'TechFlow operating account at JPM — DACA unsigned for 14 days', 'TRX-2024-001', 0, now - 8 * 3600_000);
  alert.run(crypto.randomUUID(), 'jurisdiction_change', 'warning', 'Debtor Reincorporation', 'Apex Manufacturing reincorporated DE → NV. 4-month reperfection window active.', 'TRX-2024-004', 0, now - 4 * 3600_000);

  // ---------- control agreements ----------
  const daca = db.prepare(`INSERT INTO control_agreements (id, transaction_id, account_type, institution, account_last4, status, signed_date, expires_date) VALUES (?,?,?,?,?,?,?,?)`);
  daca.run(crypto.randomUUID(), 'TRX-2024-001', 'deposit', 'JPMorgan Chase', '4421', 'pending', null, null);
  daca.run(crypto.randomUUID(), 'TRX-2024-001', 'deposit', 'Silicon Valley Bank', '7780', 'executed', '2023-11-20', '2028-11-15');
  daca.run(crypto.randomUUID(), 'TRX-2024-005', 'securities', 'Fidelity Institutional', '0099', 'executed', '2023-09-15', '2026-09-12');
  daca.run(crypto.randomUUID(), 'TRX-2024-007', 'deposit', 'Bank of America', '5511', 'executed', '2021-12-01', '2026-11-30');

  // ---------- settings ----------
  const setting = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
  setting.run('demo_mode', 'on');
  setting.run('soc2_status', 'Type II — Active (issued 2024-03-15, expires 2025-03-15)');
  setting.run('filing_partner', 'CSC Global (Sandbox)');
  setting.run('buyer_network_partner', 'BidConnect Network (Demo)');

  console.log('[seed] done.');
}

function computeCushion(op: string, threshold: number, actual: number): number {
  if (threshold === 0) return 0;
  if (op === '>=') return ((actual - threshold) / threshold) * 100;
  if (op === '<=') return ((threshold - actual) / threshold) * 100;
  return 0;
}
