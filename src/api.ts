import type {
  Transaction, TransactionFull, Asset, Filing, Covenant, Listing, Buyer, Alert, AuditEntry,
} from './types';

const BASE = '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json() as Promise<T>;
}

export const api = {
  transactions: () => req<Transaction[]>('/transactions'),
  transaction: (id: string) => req<TransactionFull>(`/transactions/${id}`),

  collateral: () => req<Asset[]>('/collateral'),
  asset: (id: string) => req<Asset & { listings: Listing[] }>(`/collateral/${id}`),

  filings: () => req<Filing[]>('/filings'),
  createFiling: (body: Partial<Filing> & { transaction_id: string }) =>
    req<{ id: string }>('/filings', { method: 'POST', body: JSON.stringify(body) }),
  submitFiling: (id: string) => req<{ file_number: string; filed_at: string }>(`/filings/${id}/submit`, { method: 'POST', body: '{}' }),
  continueFiling: (id: string) => req<{ id: string }>(`/filings/${id}/continue`, { method: 'POST', body: '{}' }),
  terminateFiling: (id: string) => req<{ id: string }>(`/filings/${id}/terminate`, { method: 'POST', body: '{}' }),

  covenants: () => req<Covenant[]>('/covenants'),
  testCovenant: (id: string, actual: number) =>
    req<{ status: string; cushion: number }>(`/covenants/${id}/test`, { method: 'POST', body: JSON.stringify({ actual_value: actual, period_end: new Date().toISOString().slice(0, 10) }) }),

  certificates: (transaction_id?: string) =>
    req<any[]>(`/certificates${transaction_id ? `?transaction_id=${transaction_id}` : ''}`),
  uploadCertificate: (body: { transaction_id: string; period_end: string; uploaded_by?: string; filename: string; content_base64?: string }) =>
    req<{ id: string; extracted: Record<string, number>; source: string }>('/certificates', { method: 'POST', body: JSON.stringify(body) }),

  listings: () => req<Listing[]>('/listings'),
  listing: (id: string) => req<Listing & { bids: any[] }>(`/listings/${id}`),
  createListing: (body: { collateral_id: string; asking_price_cents: number; sale_method?: 'public' | 'private' }) =>
    req<{ id: string }>('/listings', { method: 'POST', body: JSON.stringify(body) }),
  sendNotice: (id: string, recipients: Array<{ name: string; role: string }>) =>
    req<{ notice_period_ends_at: string }>(`/listings/${id}/notice`, { method: 'POST', body: JSON.stringify({ recipients }) }),
  activateListing: (id: string) => req<{ ok: boolean }>(`/listings/${id}/activate`, { method: 'POST', body: '{}' }),
  placeBid: (id: string, buyer_id: string, amount_cents: number) =>
    req<{ id: string }>(`/listings/${id}/bid`, { method: 'POST', body: JSON.stringify({ buyer_id, amount_cents }) }),
  finalizeSale: (id: string, body: { bid_id: string; secured_balance_cents: number; costs_of_sale_cents: number; junior_liens_cents: number }) =>
    req<{ breakdown: any }>(`/listings/${id}/sell`, { method: 'POST', body: JSON.stringify(body) }),

  buyers: () => req<Buyer[]>('/buyers'),
  matches: (listingId: string) => req<Buyer[]>(`/listings/${listingId}/matches`),

  alerts: () => req<Alert[]>('/alerts'),
  ackAlert: (id: string) => req<{ ok: boolean }>(`/alerts/${id}/ack`, { method: 'POST', body: '{}' }),
  simulateAlert: (kind: string, transaction_id?: string, borrower?: string) =>
    req<{ id: string }>('/alerts/simulate', { method: 'POST', body: JSON.stringify({ kind, transaction_id, borrower }) }),

  audit: () => req<AuditEntry[]>('/audit'),

  intelligence: () => req<any>('/intelligence'),
  settings: () => req<Record<string, string>>('/settings'),
};

export function fmtCents(c: number | null | undefined): string {
  if (c == null) return '$0';
  const v = c / 100;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k`;
  return `$${v.toLocaleString()}`;
}

export function parseAmount(s: string): number {
  const n = Number(String(s).replace(/[^0-9.\-]/g, ''));
  return Math.round((isNaN(n) ? 0 : n) * 100);
}
