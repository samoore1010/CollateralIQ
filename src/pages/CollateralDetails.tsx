import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Box, ShoppingBag, Tag } from 'lucide-react';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Asset, Listing } from '@/types';

export default function CollateralDetails() {
  const { id } = useParams();
  const [a, setA] = useState<(Asset & { listings: Listing[] }) | null>(null);
  useEffect(() => { if (id) api.asset(id).then(setA).catch(() => setA(null)); }, [id]);
  if (!a) return <div className="text-slate-500">Loading asset…</div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <Link to={a.transaction_id ? `/transactions/${a.transaction_id}` : '/collateral'} className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />Back
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative h-64 bg-slate-100">
            <img src={a.image} alt={a.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500 text-white shadow-sm">{a.status}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-24">
              <h1 className="text-2xl font-bold text-white mb-2">{a.name}</h1>
              <div className="flex items-center gap-4 text-white/90 text-sm flex-wrap">
                <span className="flex items-center gap-1"><Box className="w-4 h-4" />{a.category}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{a.location}</span>
                <span className="flex items-center gap-1"><Tag className="w-4 h-4" />ID: {a.id}</span>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <ValueBox label="Est. Market Value" value={fmtCents(a.market_value_cents)} />
            <ValueBox label="Liquidation Value" value={fmtCents(a.liquidation_value_cents)} tone="amber" />
            <ValueBox label="Original Cost" value={fmtCents(a.original_cost_cents)} small />
            <div className="pt-4 md:pt-0 md:pl-6 flex items-center">
              <Link to={`/disposition/${a.id}`} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />Begin Disposition
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Asset Summary</h2>
            <p className="text-slate-600 leading-relaxed mb-6">{a.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <Spec label="Manufacturer" value={a.manufacturer} />
              <Spec label="Year" value={String(a.year)} />
              <Spec label="Serial / ID" value={a.serial_number} mono />
              <Spec label="Condition" value={a.condition ?? '—'} />
              <Spec label="Article 9 Category" value={a.a9_category} />
              <Spec label="Perfection Method" value={a.perfection_method} />
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Valuation & Liquidity</h2>
            <div className="space-y-4 text-sm">
              <Bar label="Market liquidity" pct={a.category === 'Real Estate' ? 55 : a.category === 'Intellectual Property' ? 30 : 80} tone="emerald" />
              <Bar label="Est. time to sell" pct={a.category === 'Real Estate' ? 25 : 70} tone="indigo" rightLabel={a.category === 'Real Estate' ? '90-180d' : '14-45d'} />
              <Bar label="Liquidation vs market" pct={Math.round((a.liquidation_value_cents / Math.max(1, a.market_value_cents)) * 100)} tone="slate" />
            </div>
            <p className="mt-4 text-xs text-slate-400 flex items-center gap-1">
              Liquidity scoring <DemoChip variant="preview" /> based on comp velocity, buyer-side mandates, and recent dispositions in this Article 9 category.
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Listings</h2>
            {a.listings.length === 0 ? (
              <p className="text-sm text-slate-500">No active listings. Use Begin Disposition to start the Article 9 process.</p>
            ) : (
              <div className="space-y-3">
                {a.listings.map(l => (
                  <Link key={l.id} to={`/disposition/${a.id}`} className="block p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30">
                    <div className="flex justify-between text-sm">
                      <div><span className="font-mono text-xs text-slate-400">{l.id}</span> · <span className="font-medium">{l.status}</span></div>
                      <div className="font-mono">{fmtCents(l.asking_price_cents)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ValueBox({ label, value, tone, small }: { label: string; value: string; tone?: 'amber'; small?: boolean }) {
  return (
    <div className="pt-4 md:pt-0 md:pl-6 first:pl-0 first:pt-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`${small ? 'text-xl font-semibold text-slate-700' : 'text-2xl font-bold'} ${tone === 'amber' ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function Spec({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">{label}</span>
      <span className={`font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function Bar({ label, pct, tone, rightLabel }: { label: string; pct: number; tone: 'emerald' | 'indigo' | 'slate'; rightLabel?: string }) {
  const colors: any = { emerald: 'bg-emerald-500', indigo: 'bg-indigo-500', slate: 'bg-slate-500' };
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{rightLabel ?? `${pct}%`}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${colors[tone]} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
