import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RT, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, MapPin, Calendar, ArrowDownRight } from 'lucide-react';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';

export default function Intelligence() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.intelligence().then(setData); }, []);
  if (!data) return <div className="text-slate-500">Loading intelligence…</div>;

  const sectorChart = data.exposureBySector.map((s: any) => ({ name: s.sector, value: Math.round(s.amount / 100) }));
  const jurChart = data.exposureByJurisdiction.slice(0, 8).map((j: any) => ({ name: j.jurisdiction, value: Math.round(j.amount / 100), deals: j.deals }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          Portfolio Intelligence
          <DemoChip variant="preview" detail="Cross-deal analytics computed live from your portfolio. Real version augments with industry benchmarks and external comp datasets." />
        </h2>
        <p className="text-sm text-slate-500">Concentration, cushion, continuation, and cross-deal exposure analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Exposure by Collateral Type">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={sectorChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`} />
                <RT formatter={(v: any) => fmtCents((v as number) * 100)} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Jurisdictional Concentration">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={jurChart} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} width={120} />
                <RT formatter={(v: any) => fmtCents((v as number) * 100)} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title={<><TrendingDown className="w-4 h-4 text-amber-500" />Tightest Covenant Cushion</>}>
          <div className="divide-y divide-slate-100">
            {data.cushion.map((c: any, i: number) => (
              <div key={i} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-slate-900">{c.metric}</div>
                  <div className="text-xs text-slate-500">{c.borrower}</div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${c.cushion_pct < 5 ? 'text-red-600' : c.cushion_pct < 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {c.cushion_pct != null ? `${c.cushion_pct.toFixed(1)}%` : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">{c.status}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={<><Calendar className="w-4 h-4 text-indigo-600" />Upcoming UCC Continuations</>}>
          <div className="divide-y divide-slate-100">
            {data.upcomingContinuations.map((f: any, i: number) => (
              <div key={i} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-slate-900">{f.borrower}</div>
                  <div className="text-xs text-slate-500">{f.jurisdiction} · #{f.file_number}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-amber-600 font-medium">{f.continuation_window_open}</div>
                  <div className="text-slate-500">lapses {f.lapse_date}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={<><MapPin className="w-4 h-4 text-indigo-600" />Shared Collateral Exposure</>} subtitle="Locations where collateral pledged to multiple borrowers overlaps — a workout-desk red flag.">
        {data.sharedCollateral.length === 0 ? (
          <p className="text-sm text-slate-500">No shared-collateral exposures detected.</p>
        ) : (
          <div className="space-y-3">
            {data.sharedCollateral.map((row: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{row.location}</div>
                  <div className="text-xs text-slate-600">{row.asset_count} assets pledged across: <span className="font-medium">{row.borrowers}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={<><ArrowDownRight className="w-4 h-4 text-indigo-600" />Top Borrower Concentration</>}>
        <div className="space-y-2">
          {data.topConcentration.map((row: any, i: number) => {
            const max = data.topConcentration[0].amount;
            const pct = (row.amount / max) * 100;
            return (
              <div key={i} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-900">{row.borrower}</span>
                  <span className="font-mono text-slate-600">{fmtCents(row.amount)}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: React.ReactNode; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}
      {!subtitle && <div className="h-2" />}
      {children}
    </section>
  );
}
