import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Radar, Eye, AlertTriangle, ShieldCheck, Zap, CheckCircle2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { ThirdPartyFiling, DebtorWatch } from '@/types';

export default function Monitoring() {
  const [params] = useSearchParams();
  const debtorFilter = params.get('debtor');
  const [stats, setStats] = useState({ debtors_watched: 0, active_jurisdictions: 0, detected_30d: 0, unreviewed: 0 });
  const [filings, setFilings] = useState<ThirdPartyFiling[]>([]);
  const [watches, setWatches] = useState<DebtorWatch[]>([]);
  const [simulating, setSimulating] = useState(false);

  const load = async () => {
    const [s, f, w] = await Promise.all([
      api.monitoringStats(),
      api.monitoringFilings(debtorFilter ?? undefined),
      api.monitoringWatches(),
    ]);
    setStats(s); setFilings(f); setWatches(w);
  };
  useEffect(() => { load(); }, [debtorFilter]);

  async function simulate() {
    setSimulating(true);
    await api.simulateMonitoring();
    await load();
    setTimeout(() => setSimulating(false), 600);
  }
  async function review(id: string) {
    await api.reviewTpf(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            UCC Monitoring
            <DemoChip variant="simulated" label="Live watch" detail="Production version connects to CSC UCC Monitor or Wolters Kluwer iLien Watch with debtor-level real-time alerts, deduplication, and priority scoring." />
          </h2>
          <p className="text-sm text-slate-500">Third-party filings detected against debtors in your portfolio, plus current watch coverage.</p>
        </div>
        <button onClick={simulate} disabled={simulating} className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
          <Zap className="w-4 h-4" />{simulating ? 'Pushing…' : 'Simulate New Filing'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Debtors Watched" value={stats.debtors_watched} Icon={Eye} />
        <Stat label="Active Jurisdictions" value={stats.active_jurisdictions} Icon={MapPin} />
        <Stat label="Filings Detected (30d)" value={stats.detected_30d} Icon={Radar} />
        <Stat label="Unreviewed Alerts" value={stats.unreviewed} Icon={AlertTriangle} tone={stats.unreviewed > 0 ? 'amber' : undefined} />
      </div>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <Radar className="w-4 h-4" /> Recent Third-Party Filings
            {debtorFilter && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Filtered to debtor — <Link to="/monitoring" className="underline">clear</Link></span>}
          </div>
          <span className="text-xs text-slate-500">{filings.length} total</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left">Detected</th>
              <th className="px-6 py-3 text-left">Debtor</th>
              <th className="px-6 py-3 text-left">Juris</th>
              <th className="px-6 py-3 text-left">Secured Party</th>
              <th className="px-6 py-3 text-left">Collateral</th>
              <th className="px-6 py-3 text-left">Priority Impact</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filings.map(f => (
              <tr key={f.id} className={cn('hover:bg-slate-50', !f.reviewed && 'bg-amber-50/30')}>
                <td className="px-6 py-3 text-xs text-slate-500">
                  <div className="font-mono">{new Date(f.detected_at).toLocaleDateString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">{f.source}</div>
                </td>
                <td className="px-6 py-3">
                  <div className="font-medium text-slate-900 text-sm">{f.debtor_name ?? '—'}</div>
                  {f.terminated_at && <div className="text-[10px] text-slate-500">Terminated {f.terminated_at}</div>}
                </td>
                <td className="px-6 py-3 text-slate-600">{f.jurisdiction}</td>
                <td className="px-6 py-3 text-slate-700">{f.secured_party}</td>
                <td className="px-6 py-3 text-xs text-slate-600">
                  <div className="line-clamp-2">{f.collateral_description}</div>
                  {f.file_number && <div className="text-[10px] font-mono text-slate-400 mt-1">#{f.file_number}</div>}
                </td>
                <td className="px-6 py-3">
                  <ImpactPill impact={f.priority_impact} />
                  {f.priority_impact_reason && <div className="text-[10px] text-slate-500 mt-1 max-w-xs">{f.priority_impact_reason}</div>}
                </td>
                <td className="px-6 py-3 text-right">
                  {f.reviewed ? (
                    <span className="text-[10px] text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Reviewed</span>
                  ) : (
                    <button onClick={() => review(f.id)} className="text-xs text-indigo-600 font-medium hover:underline">Mark Reviewed</button>
                  )}
                </td>
              </tr>
            ))}
            {filings.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">No third-party filings detected.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <ShieldCheck className="w-4 h-4" /> Watch Coverage
          </div>
          <span className="text-xs text-slate-500">{watches.length} debtor / jurisdiction pairs</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left">Debtor</th>
              <th className="px-6 py-3 text-left">Watched Jurisdiction</th>
              <th className="px-6 py-3 text-left">Deals</th>
              <th className="px-6 py-3 text-left">Last Checked</th>
              <th className="px-6 py-3 text-left">Detections</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {watches.map(w => (
              <tr key={w.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{w.legal_name}</td>
                <td className="px-6 py-3 text-slate-700 font-mono text-xs">{w.watch_jurisdiction}</td>
                <td className="px-6 py-3 text-xs text-slate-600">{w.deals}</td>
                <td className="px-6 py-3 text-xs text-slate-500">{w.last_checked_at ? new Date(w.last_checked_at).toLocaleString() : '—'}</td>
                <td className="px-6 py-3 text-xs">{w.detections}</td>
                <td className="px-6 py-3">
                  <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    w.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                    {w.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 flex items-center gap-1">
          Watches refresh every 24 hours via the configured monitoring partner <DemoChip variant="simulated" />.
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, Icon, tone }: { label: string; value: number; Icon: any; tone?: 'amber' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className={cn('mt-2 text-2xl font-bold', tone === 'amber' ? 'text-amber-600' : 'text-slate-900')}>{value}</div>
    </div>
  );
}

function ImpactPill({ impact }: { impact: string }) {
  const map: any = {
    none: 'bg-slate-100 text-slate-600',
    subordinate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'pari-passu': 'bg-amber-50 text-amber-700 border-amber-200',
    senior: 'bg-red-50 text-red-700 border-red-200',
    unknown: 'bg-slate-100 text-slate-600',
  };
  return <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium border capitalize', map[impact] || map.none)}>{impact}</span>;
}
