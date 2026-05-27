import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Gavel, Send, CheckCircle2, Circle, ArrowRight, AlertTriangle, DollarSign, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Asset, Listing, Buyer } from '@/types';

type Step = 'qualify' | 'notice' | 'market' | 'bids' | 'close';

export default function Disposition() {
  const { id } = useParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<string | null>(id ?? null);

  const load = () => { api.collateral().then(setAssets); api.listings().then(setListings); };
  useEffect(load, []);
  useEffect(() => { setSelected(id ?? null); }, [id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          Article 9 Disposition Workflow
          <DemoChip variant="simulated" label="UCC §9-611/612/615" detail="Walks through the commercial-reasonableness requirements of Article 9 part 6: pre-sale notification (10-day), commercially reasonable sale, and 9-615 proceeds accounting." />
        </h2>
        <p className="text-sm text-slate-500">Drive a piece of collateral from default through notice, marketing, bids, and 9-615 accounting.</p>
      </div>

      {!selected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map(a => {
            const ex = listings.find(l => l.collateral_id === a.id);
            return (
              <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{a.category}</span>
                  {ex && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">{ex.status}</span>}
                </div>
                <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 min-h-[3rem]">{a.name}</h3>
                <div className="text-sm text-slate-600 mb-3">
                  <div>{a.borrower}</div>
                  <div className="font-mono text-xs">Liq. {fmtCents(a.liquidation_value_cents)}</div>
                </div>
                <button onClick={() => setSelected(a.id)} className="w-full py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2">
                  {ex ? 'Continue Workflow' : 'Begin Disposition'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <DispositionFlow assetId={selected} onBack={() => setSelected(null)} onChanged={load} />
      )}
    </div>
  );
}

function DispositionFlow({ assetId, onBack, onChanged }: { assetId: string; onBack: () => void; onChanged: () => void }) {
  const [asset, setAsset] = useState<(Asset & { listings: Listing[] }) | null>(null);
  const [listing, setListing] = useState<(Listing & { bids: any[] }) | null>(null);
  const [matches, setMatches] = useState<Buyer[]>([]);
  const [showNotice, setShowNotice] = useState(false);
  const [showSale, setShowSale] = useState(false);

  const loadAll = async () => {
    const a = await api.asset(assetId);
    setAsset(a);
    if (a.listings[0]) {
      const l = await api.listing(a.listings[0].id);
      setListing(l);
      const m = await api.matches(l.id);
      setMatches(m);
    } else {
      setListing(null); setMatches([]);
    }
  };
  useEffect(() => { loadAll(); }, [assetId]);

  if (!asset) return <div className="text-slate-500">Loading…</div>;

  const step: Step = !listing ? 'qualify'
    : listing.status === 'draft' || listing.status === 'notice_pending' ? 'notice'
    : listing.status === 'notice_sent' ? 'market'
    : listing.status === 'listed' || listing.status === 'under_bid' ? 'bids'
    : 'close';

  async function createListing() {
    const res = await api.createListing({ collateral_id: assetId, asking_price_cents: asset!.liquidation_value_cents, sale_method: 'public' });
    onChanged(); await loadAll();
  }
  async function activateListing() {
    if (!listing) return;
    await api.activateListing(listing.id);
    onChanged(); await loadAll();
  }
  async function placeMockBids() {
    if (!listing) return;
    const top = matches.slice(0, 3);
    const ask = listing.asking_price_cents;
    for (const [i, m] of top.entries()) {
      await api.placeBid(listing.id, m.id, Math.round(ask * (0.82 + i * 0.04)));
    }
    onChanged(); await loadAll();
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-indigo-600">← Back to assets</button>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 flex items-start gap-6">
          <img src={asset.image} className="w-32 h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{asset.name}</h3>
                <div className="text-sm text-slate-500">{asset.borrower} · {asset.location}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Liquidation Estimate</div>
                <div className="text-xl font-bold text-slate-900">{fmtCents(asset.liquidation_value_cents)}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Art.9: {asset.a9_category}</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Perfection: {asset.perfection_method}</span>
            </div>
          </div>
        </div>

        <StepTracker step={step} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step content */}
          {step === 'qualify' && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Gavel className="w-4 h-4 text-indigo-600" />Pre-disposition Qualification</h3>
              <Checklist items={[
                ['Default has occurred or is reasonably anticipated', true],
                ['Borrower notified of default; cure period expired', true],
                ['Collateral is identifiable and within secured-party control', true],
                ['Junior lienholders identified for notice', true],
                ['Commercially reasonable sale method selected', false],
              ]} />
              <button onClick={createListing} className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                Create Disposition Listing & Generate §9-611 Notice
              </button>
            </section>
          )}
          {step === 'notice' && listing && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Send className="w-4 h-4 text-indigo-600" />§9-611 Notification of Disposition</h3>
              <p className="text-sm text-slate-600">A 10-day pre-sale notice must be sent to the debtor, any guarantors, and known subordinate lienholders before the sale can be commercially reasonable.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-amber-800">The 10-day clock starts the day after sending. The marketplace is gated until the clock expires.</span>
              </div>
              <button onClick={() => setShowNotice(true)} className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                Generate & Send Notice
              </button>
            </section>
          )}
          {step === 'market' && listing && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" />Activate Marketplace</h3>
              <p className="text-sm text-slate-600">Notice sent to {(JSON.parse(listing.notice_recipients ?? '[]') as any[]).length} recipients. Period ends {listing.notice_period_ends_at}.</p>
              <button onClick={activateListing} className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                Activate Listing & Notify Matched Buyers
              </button>
            </section>
          )}
          {step === 'bids' && listing && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><DollarSign className="w-4 h-4 text-indigo-600" />Bids — {fmtCents(listing.asking_price_cents)} ask</h3>
                <div className="flex gap-2">
                  <button onClick={placeMockBids} className="text-xs px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">Simulate 3 Bids</button>
                  {listing.bids.length > 0 && <button onClick={() => setShowSale(true)} className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">Finalize Sale</button>}
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {listing.bids.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">No bids yet. Buyers in the matched network will see this listing.</div>
                ) : listing.bids.map(b => (
                  <div key={b.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-900">{b.buyer_firm}</div>
                      <div className="text-xs text-slate-500 capitalize">{b.buyer_type}</div>
                    </div>
                    <div className="font-mono font-medium">{fmtCents(b.amount_cents)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {step === 'close' && listing && (
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Sale Complete</h3>
              <p className="text-sm text-slate-600">Final sale price <span className="font-mono font-bold">{fmtCents(listing.sold_price_cents)}</span>. §9-615 proceeds accounting recorded.</p>
              {listing.proceeds_breakdown && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  {Object.entries(JSON.parse(listing.proceeds_breakdown)).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-600 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{fmtCents(v as number)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />Matched Buyers
              <DemoChip variant="preview" />
            </h3>
            {matches.length === 0 ? (
              <p className="text-sm text-slate-500">Matches appear once the listing is created.</p>
            ) : (
              <div className="space-y-2">
                {matches.slice(0, 8).map(b => (
                  <div key={b.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{b.firm}</div>
                      <div className="text-xs text-slate-500 capitalize">{b.type.replace('_', ' ')} · {b.geography}</div>
                    </div>
                    <div className="ml-2 text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{b.match_score}%</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-900 text-white rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />Documents</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between"><span>§9-611 Notice (Draft)</span><span className="text-indigo-300 text-xs">PDF</span></li>
              <li className="flex items-center justify-between"><span>Commercially Reasonable Plan</span><span className="text-indigo-300 text-xs">PDF</span></li>
              <li className="flex items-center justify-between"><span>Bid Log</span><span className="text-indigo-300 text-xs">CSV</span></li>
              <li className="flex items-center justify-between"><span>§9-615 Proceeds Accounting</span><span className="text-indigo-300 text-xs">PDF</span></li>
            </ul>
            <p className="mt-4 text-[10px] text-slate-400 flex items-center gap-1">Generated locally <DemoChip variant="simulated" /></p>
          </section>
        </div>
      </div>

      {showNotice && listing && <NoticeModal listing={listing} onClose={async () => { setShowNotice(false); await loadAll(); }} />}
      {showSale && listing && <SaleModal listing={listing} onClose={async () => { setShowSale(false); await loadAll(); onChanged(); }} />}
    </div>
  );
}

function StepTracker({ step }: { step: Step }) {
  const steps: Array<[Step, string]> = [
    ['qualify', 'Qualify'],
    ['notice', '§9-611 Notice'],
    ['market', 'Activate Market'],
    ['bids', 'Receive Bids'],
    ['close', '§9-615 Close'],
  ];
  const idx = steps.findIndex(([k]) => k === step);
  return (
    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
      <div className="flex items-center gap-3">
        {steps.map(([k, label], i) => (
          <React.Fragment key={k}>
            <div className={cn('flex items-center gap-2 text-sm', i < idx ? 'text-emerald-700' : i === idx ? 'text-indigo-700 font-semibold' : 'text-slate-400')}>
              {i < idx ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className={cn('w-4 h-4', i === idx && 'text-indigo-600 fill-indigo-100')} />}
              {label}
            </div>
            {i < steps.length - 1 && <div className={cn('flex-1 h-0.5', i < idx ? 'bg-emerald-300' : 'bg-slate-200')} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Checklist({ items }: { items: Array<[string, boolean]> }) {
  return (
    <ul className="space-y-2">
      {items.map(([label, done], i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-300" />}
          <span className={done ? 'text-slate-700' : 'text-slate-500'}>{label}</span>
        </li>
      ))}
    </ul>
  );
}

function NoticeModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [recipients, setRecipients] = useState([
    { name: 'Debtor (TechFlow Systems Inc.)', role: 'debtor' },
    { name: 'Guarantor (Founder, J. Smith)', role: 'guarantor' },
    { name: 'Subordinate lienholder (Regional Bank Corp)', role: 'subordinate' },
    { name: 'Subordinate lienholder (Equipment Leasing Co. - PMSI)', role: 'subordinate' },
  ]);
  const [sending, setSending] = useState(false);
  async function send() {
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    await api.sendNotice(listing.id, recipients);
    setSending(false);
    onClose();
  }
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">§9-611 Notification of Disposition</h3>
          <DemoChip variant="simulated" />
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
            <p className="font-medium mb-1">Notice will be sent to:</p>
            <ul className="space-y-1">
              {recipients.map((r, i) => <li key={i} className="text-xs">· {r.name} <span className="text-slate-400">({r.role})</span></li>)}
            </ul>
          </div>
          <p className="text-xs text-slate-500">10-day pre-sale clock begins on send. Sale cannot close before that period elapses absent recipient waiver.</p>
        </div>
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={send} disabled={sending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{sending ? 'Sending…' : 'Send Notice'}</button>
        </div>
      </div>
    </div>
  );
}

function SaleModal({ listing, onClose }: { listing: Listing & { bids: any[] }; onClose: () => void }) {
  const top = listing.bids.sort((a: any, b: any) => b.amount_cents - a.amount_cents)[0];
  const [secured, setSecured] = useState(String(Math.round(listing.asking_price_cents / 100)));
  const [costs, setCosts] = useState('5000');
  const [juniors, setJuniors] = useState('0');
  const [done, setDone] = useState<any>(null);

  async function finalize() {
    const res = await api.finalizeSale(listing.id, {
      bid_id: top.id,
      secured_balance_cents: Math.round(Number(secured) * 100),
      costs_of_sale_cents: Math.round(Number(costs) * 100),
      junior_liens_cents: Math.round(Number(juniors) * 100),
    });
    setDone(res.breakdown);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Finalize Sale — §9-615 Accounting</h3>
          <p className="text-sm text-slate-500 mt-1">Winning bid: {top?.buyer_firm} · {fmtCents(top?.amount_cents)}</p>
        </div>
        {!done ? (
          <>
            <div className="p-6 space-y-3 text-sm">
              <Field label="Secured Balance Owed (USD)"><input className="input" value={secured} onChange={e => setSecured(e.target.value)} /></Field>
              <Field label="Costs of Sale (USD)"><input className="input" value={costs} onChange={e => setCosts(e.target.value)} /></Field>
              <Field label="Junior Lien Balances (USD)"><input className="input" value={juniors} onChange={e => setJuniors(e.target.value)} /></Field>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={finalize} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Compute & Record</button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 space-y-2 text-sm">
              {Object.entries(done).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-600 capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="font-mono font-medium">{fmtCents(v as number)}</span>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Done</button>
            </div>
          </>
        )}
        <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid rgb(226 232 240); border-radius: 0.5rem; font-size: 0.875rem; background: white; }`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider block mb-1">{label}</span>
      {children}
    </label>
  );
}
