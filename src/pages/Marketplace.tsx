import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageSquare, Users } from 'lucide-react';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Listing, Buyer } from '@/types';

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [matchesByListing, setMatchesByListing] = useState<Record<string, Buyer[]>>({});

  useEffect(() => {
    api.listings().then(async ls => {
      setListings(ls);
      const out: Record<string, Buyer[]> = {};
      for (const l of ls) {
        try { out[l.id] = (await api.matches(l.id)).slice(0, 3); } catch {}
      }
      setMatchesByListing(out);
    });
    api.buyers().then(setBuyers);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            Disposition Marketplace
            <DemoChip variant="partner-mock" label="BidConnect Network: Demo" detail="In production this connects to the BidConnect verified buyer network: 500+ liquidators, auctioneers, REITs, PE firms, and strategic buyers with active mandates." />
          </h2>
          <p className="text-sm text-slate-500">Active listings, matched buyers, and the buyer network you can route assets through.</p>
        </div>
        <Link to="/disposition" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <ShoppingBag className="w-4 h-4" />Create New Listing
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-semibold text-slate-900">Active Listings</h3>
          <div className="space-y-4">
            {listings.map(l => (
              <div key={l.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{l.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium capitalize">{l.status.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-500">{l.borrower}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900">{l.asset_name}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{fmtCents(l.asking_price_cents)}</p>
                    <p className="text-xs text-slate-500">Asking Price</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-slate-100 mb-4">
                  <Cell label="Highest Bid" value={l.highest_bid ? fmtCents(l.highest_bid) : '—'} />
                  <Cell label="Bids" value={String(l.bid_count ?? 0)} />
                  <Cell label="Liquidation Est." value={fmtCents(l.liquidation_value_cents)} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">Matched Buyers <DemoChip variant="preview" /></p>
                  <div className="flex flex-wrap gap-2">
                    {(matchesByListing[l.id] ?? []).map(b => (
                      <div key={b.id} className="flex items-center gap-2 pl-2 pr-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                        <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">{b.match_score}</div>
                        <span className="text-sm text-indigo-900">{b.firm}</span>
                      </div>
                    ))}
                    {(matchesByListing[l.id]?.length ?? 0) === 0 && <span className="text-sm text-slate-400 italic">No matches yet</span>}
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Link to={`/disposition/${l.collateral_id}`} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 text-center">Manage Listing</Link>
                  <Link to={`/disposition/${l.collateral_id}`} className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 text-center">View Bids</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4" />Buyer Network</h3>
            <span className="text-xs text-slate-500">{buyers.length} verified</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {buyers.map(b => (
              <div key={b.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-slate-900 text-sm">{b.firm}</h4>
                    <p className="text-xs text-slate-500 capitalize">{b.type.replace('_', ' ')} · {b.geography}</p>
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {b.interests.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Budget:</span> {fmtCents(b.budget_min_cents)} – {fmtCents(b.budget_max_cents)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-900 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-semibold text-lg mb-2">BidConnect Network</h3>
              <p className="text-indigo-200 text-sm mb-4">{buyers.length} verified institutional buyers across strategic, financial, liquidator, and auctioneer channels.</p>
              <button className="w-full py-2 bg-white text-indigo-900 rounded-lg text-sm font-medium hover:bg-indigo-50">Invite Buyers</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}
