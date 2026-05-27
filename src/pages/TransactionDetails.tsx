import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft, Shield, AlertTriangle, ArrowDown, FileText, Users, Gavel, Calendar, DollarSign, Briefcase, Activity,
  CheckCircle2, XCircle, AlertCircle, MapPin, ArrowRight, Box, Layers, Banknote, Building2, Radar, GitBranch, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import { SourceIcon, findAttributions } from '@/components/SourceIcon';
import type { TransactionFull } from '@/types';

export default function TransactionDetails() {
  const { id } = useParams();
  const [tx, setTx] = useState<TransactionFull | null>(null);
  const reload = () => { if (id) api.transaction(id).then(setTx).catch(() => setTx(null)); };
  useEffect(reload, [id]);

  if (!tx) return <div className="text-slate-500">Loading transaction…</div>;

  const uccConfirmed = tx.filings.find((f: any) => f.filing_type === 'UCC-1' && f.status === 'confirmed');
  const attr = (entityType: any, entityId: string, field?: string) => findAttributions(tx.attributions, entityType, entityId, field);
  const txAttr = attr('transaction', tx.id);

  async function repay(drawId: string) {
    if (!confirm('Mark draw as repaid? If this is a blanket-lien tranche, a UCC-3 amendment will be auto-queued.')) return;
    await api.repayDraw(drawId);
    reload();
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <Link to="/transactions" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />Back to Registry
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              {tx.borrower}
              <SourceIcon attributions={txAttr} />
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 flex-wrap">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{tx.id}</span>
              <span>•</span><span>{tx.deal_type}</span>
              <span>•</span><span>{tx.jurisdiction} ({tx.governing_law} law)</span>
              {tx.borrower_group && tx.borrower_group.length > 1 && (
                <><span>•</span><span className="text-indigo-700 font-medium">Master facility · {tx.borrower_group.length} co-borrowers</span></>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{fmtCents(tx.amount_cents)}</div>
            <div className="text-sm text-emerald-600 font-medium flex items-center justify-end gap-1">
              <Shield className="w-3 h-3" />
              {uccConfirmed ? `Perfected · UCC #${uccConfirmed.file_number}` : 'Perfection Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Syndicate / Agent structure */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-900 capitalize">{(tx.intercreditor_tranche || '').replace('-', ' ')}</span>
        </div>
        <div className="text-sm">
          <span className="text-slate-500">Agent of Record:</span> <span className="font-medium text-slate-900 ml-1">{tx.agent_firm}</span>
        </div>
        <div className="text-sm">
          <span className="text-slate-500">Our Share:</span> <span className="font-medium text-slate-900 ml-1">{tx.our_share_pct}%</span>
        </div>
        <div className="text-sm flex items-center gap-2">
          <span className="text-slate-500">DACAs:</span>
          {tx.dacas.length === 0 && <span className="text-slate-400 text-xs">none recorded</span>}
          {tx.dacas.map(d => (
            <span key={d.id} className={cn('text-xs px-2 py-0.5 rounded-full',
              d.status === 'executed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}>
              {d.institution} ·· {d.account_last4} ({d.status})
            </span>
          ))}
          <DemoChip variant="partner-mock" label="Bank link: mock" detail="Real implementations exchange control via DACA/securities-account-control-agreements with each institution. Bank webhook → DACA executed event." />
        </div>
      </section>

      {/* Borrower Group */}
      {tx.borrower_group && tx.borrower_group.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Borrower Group
              <span className="text-xs text-slate-500 font-normal">({tx.borrower_group.length} entit{tx.borrower_group.length === 1 ? 'y' : 'ies'})</span>
            </h2>
            <Link to="/monitoring" className="text-xs text-indigo-600 font-medium">UCC monitoring →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left">Legal Name</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Form</th>
                  <th className="px-6 py-3 text-left">State of Formation</th>
                  <th className="px-6 py-3 text-left">UCC Watch</th>
                  <th className="px-6 py-3 text-left">Third-Party Filings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tx.borrower_group.map(d => {
                  const detections = (tx.third_party_filings ?? []).filter(t => t.debtor_id === d.id);
                  const dAttrs = attr('debtor', d.id);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-900 flex items-center">
                          {d.legal_name}
                          <SourceIcon attributions={dAttrs} />
                        </div>
                        {d.registered_address && <div className="text-xs text-slate-500">{d.registered_address}</div>}
                      </td>
                      <td className="px-6 py-3">
                        <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                          d.role === 'parent' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700')}>{d.role}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-600 capitalize text-xs">{d.organization_form}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-700">{d.state_of_formation}</td>
                      <td className="px-6 py-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="w-3 h-3" />Active</span>
                      </td>
                      <td className="px-6 py-3 text-xs">
                        {detections.length === 0
                          ? <span className="text-slate-400">none</span>
                          : <Link to={`/monitoring?debtor=${d.id}`} className="text-indigo-600 font-medium hover:underline">{detections.length} detected →</Link>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Facility Structure (draws) */}
      {tx.draws && tx.draws.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-600" />
              Facility Structure
              <span className="text-xs text-slate-500 font-normal">({tx.draws.length} draw{tx.draws.length === 1 ? '' : 's'})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left">Draw</th>
                  <th className="px-6 py-3 text-left">Commitment</th>
                  <th className="px-6 py-3 text-left">Outstanding</th>
                  <th className="px-6 py-3 text-left">Pool</th>
                  <th className="px-6 py-3 text-left">Window</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tx.draws.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-900 flex items-center">
                        {d.label}
                        <SourceIcon attributions={attr('draw', d.id)} />
                      </div>
                      {d.notes && <div className="text-xs text-slate-500 max-w-md mt-0.5">{d.notes}</div>}
                    </td>
                    <td className="px-6 py-3 font-mono text-slate-900">{fmtCents(d.commitment_cents)}</td>
                    <td className="px-6 py-3 font-mono text-slate-700">{fmtCents(d.outstanding_cents)}</td>
                    <td className="px-6 py-3 text-xs">
                      <span className={cn('inline-block px-2 py-0.5 rounded-full font-medium capitalize',
                        d.collateral_pool === 'blanket' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700')}>
                        {d.collateral_pool ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {d.available_from && d.available_until ? `${d.available_from} → ${d.available_until}` : d.drawn_date ?? '—'}
                      {d.term_months && <div className="text-[10px] text-slate-400">{d.term_months}mo term · factor {d.rate_factor}</div>}
                    </td>
                    <td className="px-6 py-3">
                      <DrawStatusPill status={d.status} />
                      {d.repaid_date && <div className="text-[10px] text-slate-500 mt-1">Repaid {d.repaid_date}</div>}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {d.status === 'outstanding' && (
                        <button onClick={() => repay(d.id)} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700">Mark as Repaid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tx.mechanics.map((m, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="font-semibold text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Covenants */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />Covenant Compliance
              </h2>
              <Link to="/compliance" className="text-xs text-indigo-600 font-medium">Open compliance workflow →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Metric</th>
                    <th className="px-6 py-3 font-medium">Requirement</th>
                    <th className="px-6 py-3 font-medium">Actual</th>
                    <th className="px-6 py-3 font-medium">Cushion</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tx.covenants.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{c.metric}</div>
                        <div className="text-xs text-slate-500">{c.formula}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{c.operator} {fmtNum(c.threshold, c.unit)}</td>
                      <td className={cn('px-6 py-4 font-mono font-medium',
                        c.latest_status === 'pass' && 'text-emerald-600',
                        c.latest_status === 'warning' && 'text-amber-600',
                        c.latest_status === 'fail' && 'text-red-600',
                      )}>{c.latest_actual != null ? fmtNum(c.latest_actual, c.unit) : '—'}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">{c.cushion_pct != null ? `${c.cushion_pct.toFixed(1)}%` : '—'}</td>
                      <td className="px-6 py-4">
                        <StatusPill status={c.latest_status ?? 'pass'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Collateral */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-600" />Key Collateral Assets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tx.collateral.map(a => (
                <div key={a.id} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img src={a.image} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${a.status === 'Secured' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>{a.status}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{a.category}</span>
                      <span className="text-xs text-slate-400 font-mono">{a.id}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 min-h-[3rem]">{a.name}</h3>
                    <div className="flex flex-wrap gap-1 mb-3 text-[10px]">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">Art.9: {a.a9_category}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">Perf: {a.perfection_method}</span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /><span className="font-medium text-slate-900">{fmtCents(a.liquidation_value_cents)}</span><span className="text-xs text-slate-400">(liquidation)</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /><span>{a.location}</span></div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <Link to={`/collateral/${a.id}`} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 text-center">View Details</Link>
                      <Link to={`/disposition/${a.id}`} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2">List <ArrowRight className="w-3 h-3" /></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Lien priority */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ArrowDown className="w-5 h-5 text-indigo-600" />Lien Priority Stack
              </h2>
              <div className="flex items-center gap-2">
                {(tx.third_party_filings ?? []).filter(t => t.priority_impact !== 'none' && !t.terminated_at).length > 0 && (
                  <Link to="/monitoring" className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full hover:bg-amber-100">
                    <Radar className="w-3 h-3" />{(tx.third_party_filings ?? []).filter(t => t.priority_impact !== 'none' && !t.terminated_at).length} third-party filing(s) detected
                  </Link>
                )}
                <DemoChip variant="simulated" label="Live priority monitor" detail="Real version subscribes to UCC change-feeds and re-scores priority on every new filing, debtor name change, or jurisdictional move." />
              </div>
            </div>
            <div className="p-8 bg-slate-50/50">
              <div className="w-full max-w-2xl mx-auto space-y-3">
                {tx.liens.map((lien, index) => (
                  <motion.div key={lien.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}
                    className={cn('relative p-5 rounded-lg border',
                      lien.is_ours ? 'bg-white border-indigo-500 ring-1 ring-indigo-500/20 z-10' : 'bg-white border-slate-200 text-slate-600')}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className={cn('flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5',
                          lien.is_ours ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500')}>{lien.position}</span>
                        <div>
                          <h3 className={cn('font-semibold text-sm flex items-center', lien.is_ours ? 'text-indigo-900' : 'text-slate-900')}>
                            {lien.holder}
                            <SourceIcon attributions={attr('lien', lien.id)} />
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">{lien.lien_type} • {lien.collateral_scope}{lien.pmsi ? ' • PMSI' : ''}</p>
                          {lien.notes && <p className="text-[11px] text-amber-700 mt-1">{lien.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-mono font-medium text-sm text-slate-900">{lien.amount_cents > 0 ? fmtCents(lien.amount_cents) : '—'}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{lien.filing_date}</p>
                        </div>
                        {lien.status === 'Perfected' && <Shield className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Filings */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />UCC Filings
              </h2>
              <Link to="/filings" className="text-xs text-indigo-600 font-medium">Filing workflow →</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {tx.filings.map(f => (
                <div key={f.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-slate-900">{f.filing_type} <span className="text-slate-400 text-xs ml-1">{f.jurisdiction}</span></div>
                    <div className="text-xs text-slate-500">{f.file_number ?? '— not yet filed —'} {f.filed_at && `• filed ${f.filed_at}`}</div>
                  </div>
                  <div className="text-right">
                    <FilingPill status={f.status} />
                    {f.continuation_window_open && (
                      <div className="text-[10px] text-amber-700 mt-1">Continuation window opens {f.continuation_window_open}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rights */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-indigo-600" />Security Agreement Rights & Obligations
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {tx.rights.map((r, i) => (
                <div key={i} className="p-4 flex items-start gap-4">
                  <div className={cn('mt-1 w-2 h-2 rounded-full shrink-0', r.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500')} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900">{r.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{r.description}</p>
                  </div>
                  {r.status === 'pending' && <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Pending</span>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />Key Contacts
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {tx.contacts.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium text-xs">
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.role} • {c.firm}</p>
                    <a href={`mailto:${c.email}`} className="text-xs text-indigo-600 hover:underline">{c.email}</a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />Critical Dates
              </h2>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <Row label="Closing Date" value={tx.closing_date} />
              <Row label="Maturity Date" value={tx.maturity_date} />
              {uccConfirmed && (
                <>
                  <Row label="UCC Filed" value={uccConfirmed.filed_at!} />
                  <Row label="UCC Lapses" value={uccConfirmed.lapse_date!} />
                  <Row label="Continuation Window" value={uccConfirmed.continuation_window_open!} tone="amber" />
                </>
              )}
            </div>
          </section>

          <section className="bg-slate-900 rounded-xl text-white p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />Actions
            </h2>
            <div className="space-y-3 text-sm">
              <Link to="/filings" className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium">File UCC Amendment</Link>
              <Link to="/compliance" className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium">Request Compliance Certificate</Link>
              <Link to="/disposition" className="block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-lg shadow-indigo-900/50 flex items-center gap-2">
                <Banknote className="w-4 h-4" />Begin Article 9 Disposition
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: any = {
    pass: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
    warning: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: AlertCircle },
    fail: { cls: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
  };
  const m = map[status] ?? map.pass;
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', m.cls)}>
      <m.Icon className="w-3 h-3" /><span className="capitalize">{status}</span>
    </div>
  );
}

function FilingPill({ status }: { status: string }) {
  const map: any = {
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    queued: 'bg-blue-50 text-blue-700 border-blue-200',
    filed: 'bg-blue-50 text-blue-700 border-blue-200',
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    lapsed: 'bg-red-50 text-red-700 border-red-200',
  };
  return <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium border capitalize', map[status] ?? map.draft)}>{status}</span>;
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'amber' }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-600">{label}</span>
      <span className={cn('font-medium', tone === 'amber' ? 'text-amber-600' : 'text-slate-900')}>{value}</span>
    </div>
  );
}

function DrawStatusPill({ status }: { status: string }) {
  const map: any = {
    outstanding: 'bg-blue-50 text-blue-700 border-blue-200',
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    repaid: 'bg-slate-100 text-slate-600 border-slate-200',
    expired: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium border capitalize', map[status] || map.outstanding)}>{status}</span>;
}

function fmtNum(n: number, unit: string): string {
  if (unit === 'currency') return fmtCents(Math.round(n * 100));
  if (unit === 'percent') return `${n}%`;
  if (unit === 'months') return `${n} mo`;
  if (unit === 'ratio') return `${Number(n).toFixed(2)}x`;
  return String(n);
}
