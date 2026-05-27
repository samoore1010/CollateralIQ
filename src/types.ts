export type UccStatus = 'draft' | 'queued' | 'filed' | 'confirmed' | 'rejected' | 'lapsed';
export type FilingType = 'UCC-1' | 'UCC-3-amendment' | 'UCC-3-continuation' | 'UCC-3-assignment' | 'UCC-3-termination';
export type CovenantStatus = 'pass' | 'warning' | 'fail';
export type ListingStatus = 'draft' | 'notice_pending' | 'notice_sent' | 'listed' | 'under_bid' | 'sold' | 'withdrawn';
export type Role = 'originator' | 'pm' | 'workout' | 'legal' | 'compliance' | 'borrower';

export interface Transaction {
  id: string;
  borrower: string;
  deal_type: string;
  amount_cents: number;
  closing_date: string;
  maturity_date: string;
  jurisdiction: string;
  governing_law: string;
  collateral_type: string;
  agent_firm: string;
  our_share_pct: number;
  intercreditor_tranche: 'first-lien' | 'second-lien' | 'unitranche' | 'bilateral';
  ucc_status?: string;
  next_continuation?: string;
}

export interface Filing {
  id: string;
  transaction_id: string;
  filing_type: FilingType;
  status: UccStatus;
  jurisdiction: string;
  debtor_name: string;
  secured_party: string;
  collateral_description: string;
  file_number?: string;
  filed_at?: string;
  lapse_date?: string;
  continuation_window_open?: string;
  notes?: string;
  borrower?: string;
}

export interface Covenant {
  id: string;
  transaction_id: string;
  metric: string;
  formula: string;
  operator: '>=' | '<=' | '=';
  threshold: number;
  unit: string;
  frequency: string;
  cure_period_days: number;
  latest_actual?: number;
  latest_status?: CovenantStatus;
  latest_trend?: string;
  cushion_pct?: number;
  borrower?: string;
}

export interface Asset {
  id: string;
  transaction_id?: string;
  name: string;
  category: string;
  a9_category: string;
  perfection_method: string;
  market_value_cents: number;
  liquidation_value_cents: number;
  original_cost_cents: number;
  location: string;
  status: string;
  serial_number: string;
  manufacturer: string;
  year: number;
  description: string;
  image: string;
  condition?: string;
  borrower?: string;
}

export interface Lien {
  id: string;
  transaction_id: string;
  position: number;
  holder: string;
  amount_cents: number;
  lien_type: string;
  collateral_scope: string;
  status: string;
  filing_date: string;
  is_ours: number;
  pmsi: number;
  notes?: string;
}

export interface Listing {
  id: string;
  collateral_id: string;
  asking_price_cents: number;
  status: ListingStatus;
  notice_sent_at?: string;
  notice_recipients?: string;
  notice_period_ends_at?: string;
  sale_method: 'public' | 'private';
  asset_name?: string;
  category?: string;
  image?: string;
  borrower?: string;
  bid_count?: number;
  highest_bid?: number;
  liquidation_value_cents?: number;
  sold_price_cents?: number;
  proceeds_breakdown?: string;
}

export interface Buyer {
  id: string;
  firm: string;
  type: 'strategic' | 'liquidator' | 'pe_vc' | 'dealer' | 'broker' | 'reit';
  interests: string[];
  budget_min_cents: number;
  budget_max_cents: number;
  geography: string;
  aum_cents: number;
  verified: number;
  contact_email: string;
  match_score?: number;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  transaction_id?: string;
  acked: number;
  created_at: number;
}

export interface AuditEntry {
  id: string;
  actor_role: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  detail: string;
  created_at: number;
}

export interface ControlAgreement {
  id: string;
  transaction_id: string;
  account_type: string;
  institution: string;
  account_last4: string;
  status: 'pending' | 'executed' | 'expired';
  signed_date?: string;
  expires_date?: string;
}

export interface Debtor {
  id: string;
  legal_name: string;
  normalized_name: string;
  organization_form: string;
  state_of_formation: string;
  registered_address?: string;
  is_active: number;
  role?: 'parent' | 'co-borrower' | 'guarantor' | 'pledgor';
  joined_at?: string;
  released_at?: string;
}

export interface Draw {
  id: string;
  transaction_id: string;
  label: string;
  draw_type: string;
  commitment_cents: number;
  drawn_cents: number;
  outstanding_cents: number;
  available_from?: string;
  available_until?: string;
  drawn_date?: string;
  term_months?: number;
  rate_factor?: number;
  collateral_pool?: 'equipment' | 'blanket' | 'mixed';
  status: 'available' | 'outstanding' | 'repaid' | 'expired';
  repaid_date?: string;
  notes?: string;
}

export interface SourceAttribution {
  id: string;
  entity_type: 'transaction' | 'debtor' | 'filing' | 'covenant' | 'lien' | 'collateral' | 'draw';
  entity_id: string;
  field_path?: string;
  source_type: 'sec_edgar' | 'csc' | 'wolters_kluwer' | 'uspto' | 'manual_entry' | 'borrower_portal' | 'simulated';
  source_reference?: string;
  retrieved_at: number;
  notes?: string;
}

export interface ThirdPartyFiling {
  id: string;
  debtor_id: string;
  debtor_name?: string;
  jurisdiction: string;
  filing_type: string;
  secured_party: string;
  collateral_description?: string;
  file_number?: string;
  filed_at?: string;
  lapse_date?: string;
  terminated_at?: string;
  detected_at: number;
  priority_impact: 'none' | 'subordinate' | 'pari-passu' | 'senior' | 'unknown';
  priority_impact_reason?: string;
  reviewed: number;
  source: string;
}

export interface DebtorWatch {
  id: string;
  debtor_id: string;
  legal_name?: string;
  state_of_formation?: string;
  watch_jurisdiction: string;
  status: 'active' | 'paused';
  last_checked_at: number;
  next_check_at: number;
  deals?: string;
  detections?: number;
}

export interface TransactionFull extends Transaction {
  contacts: Array<{ role: string; name: string; firm: string; email: string }>;
  mechanics: Array<{ label: string; value: string }>;
  rights: Array<{ title: string; description: string; status: string }>;
  liens: Lien[];
  collateral: Asset[];
  covenants: Covenant[];
  filings: Filing[];
  dacas: ControlAgreement[];
  borrower_group: Debtor[];
  draws: Draw[];
  attributions: SourceAttribution[];
  third_party_filings: ThirdPartyFiling[];
}
