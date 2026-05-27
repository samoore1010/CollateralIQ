import React, { useEffect, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, XCircle, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Covenant, Transaction } from '@/types';

export default function Compliance() {
  const [covenants, setCovenants] = useState<Covenant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'pass' | 'warning' | 'fail'>('all');
  const [recordingFor, setRecordingFor] = useState<Covenant | null>(null);
  const [uploadingFor, setUploadingFor] = useState<Transaction | null>(null);

  const load = () => { api.covenants().then(setCovenants); api.transactions().then(setTransactions); };
  useEffect(load, []);

  const filtered = filter === 'all' ? covenants : covenants.filter(c => c.latest_status === filter);
  const counts = {
    all: covenants.length,
    pass: covenants.filter(c => c.latest_status === 'pass').length,
    warning: covenants.filter(c => c.latest_status === 'warning').length,
    fail: covenants.filter(c => c.latest_status === 'fail').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            Covenant Compliance
            <DemoChip variant="partner-mock" label="Borrower Portal: live" detail="The /portal route is the borrower-facing companion that uploads compliance certificates straight into this dashboard." />
          </h2>
          <p className="text-sm text-slate-500">Covenant definitions, latest tests, and certificate intake across all deals.</p>
        </div>
        <div className="flex gap-2">
          <a href="/portal" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
            <ExternalLink className="w-4 h-4" />Open Borrower Portal
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {([['all', 'All Covenants', counts.all, 'bg-slate-900'],
           ['pass', 'Passing', counts.pass, 'bg-emerald-500'],
           ['warning', 'Watch', counts.warning, 'bg-amber-500'],
           ['fail', 'Breach', counts.fail, 'bg-red-500']] as const).map(([k, label, v, color]) => (
          <button key={k} onClick={() => setFilter(k as any)}
            className={cn('p-5 rounded-xl border text-left bg-white', filter === k ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:bg-slate-50')}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{v}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-200 text-sm font-medium text-slate-900 flex items-center justify-between">
            <span>Latest Tests</span>
            <span className="text-xs text-slate-500">{filtered.length} covenants</span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">Borrower</th>
                <th className="px-6 py-3 text-left">Covenant</th>
                <th className="px-6 py-3 text-left">Req'd</th>
                <th className="px-6 py-3 text-left">Actual</th>
                <th className="px-6 py-3 text-left">Cushion</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-700">{c.borrower}</td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900">{c.metric}</div>
                    <div className="text-[10px] text-slate-400">{c.frequency}</div>
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-600">{c.operator} {fmtNum(c.threshold, c.unit)}</td>
                  <td className={cn('px-6 py-3 font-mono font-medium',
                    c.latest_status === 'pass' && 'text-emerald-600',
                    c.latest_status === 'warning' && 'text-amber-600',
                    c.latest_status === 'fail' && 'text-red-600')}>
                    {c.latest_actual != null ? fmtNum(c.latest_actual, c.unit) : '—'}
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-600">{c.cushion_pct != null ? `${c.cushion_pct.toFixed(1)}%` : '—'}</td>
                  <td className="px-6 py-3"><StatusPill status={c.latest_status ?? 'pass'} /></td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => setRecordingFor(c)} className="text-xs text-indigo-600 font-medium hover:underline">Record Test</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Certificate Intake
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload a compliance certificate to extract covenant values automatically.
              <DemoChip variant={(globalThis as any).GEMINI_AVAILABLE ? 'preview' : 'partner-mock'} className="ml-2" label="LLM extract" detail="If GEMINI_API_KEY is set, the dashboard runs real PDF extraction via gemini-2.5-flash. Otherwise values are simulated within plausible ranges." />
            </p>
            <div className="space-y-2">
              {transactions.map(t => (
                <button key={t.id} onClick={() => setUploadingFor(t)} className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                  <div className="text-sm font-medium text-slate-900">{t.borrower}</div>
                  <div className="text-xs text-slate-500">{t.id}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 rounded-xl p-6 text-white">
            <h3 className="text-base font-semibold mb-2">Borrower Portal</h3>
            <p className="text-sm text-slate-300 mb-4">Share a portal link with the borrower's CFO. Quarterly compliance certificates upload directly and trigger covenant recomputation here.</p>
            <a href="/portal" target="_blank" rel="noreferrer" className="block text-center w-full py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100">
              Open Borrower Portal
            </a>
          </section>
        </div>
      </div>

      {recordingFor && <RecordTestModal covenant={recordingFor} onClose={() => { setRecordingFor(null); load(); }} />}
      {uploadingFor && <UploadCertModal transaction={uploadingFor} onClose={() => { setUploadingFor(null); load(); }} />}
    </div>
  );
}

function fmtNum(n: number, unit: string): string {
  if (unit === 'currency') return fmtCents(Math.round(n * 100));
  if (unit === 'percent') return `${n}%`;
  if (unit === 'months') return `${n} mo`;
  if (unit === 'ratio') return `${Number(n).toFixed(2)}x`;
  return String(n);
}

function StatusPill({ status }: { status: string }) {
  const map: any = {
    pass: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
    warning: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: AlertCircle },
    fail: { cls: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
  };
  const m = map[status] ?? map.pass;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize', m.cls)}>
      <m.Icon className="w-3 h-3" />{status}
    </span>
  );
}

function RecordTestModal({ covenant, onClose }: { covenant: Covenant; onClose: () => void }) {
  const [val, setVal] = useState(String(covenant.latest_actual ?? covenant.threshold));
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    await api.testCovenant(covenant.id, Number(val));
    setSaving(false);
    onClose();
  }
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Record Covenant Test</h3>
          <p className="text-sm text-slate-500 mt-1">{covenant.borrower} — {covenant.metric}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-sm bg-slate-50 p-3 rounded-lg">
            <div className="text-xs text-slate-500 uppercase mb-1">Required</div>
            <div className="font-mono font-medium">{covenant.operator} {fmtNum(covenant.threshold, covenant.unit)}</div>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wider block mb-1">Actual Value</span>
            <input type="number" step="any" value={val} onChange={e => setVal(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </label>
        </div>
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function UploadCertModal({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const [filename, setFilename] = useState('');
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'mapping' | 'validating' | 'done'>('idle');
  const [extracted, setExtracted] = useState<Record<string, number> | null>(null);

  async function go() {
    setPhase('parsing');
    await new Promise(r => setTimeout(r, 700));
    setPhase('mapping');
    await new Promise(r => setTimeout(r, 600));
    setPhase('validating');
    const res = await api.uploadCertificate({
      transaction_id: transaction.id,
      period_end: periodEnd,
      uploaded_by: 'compliance officer',
      filename: filename || 'compliance_cert.pdf',
    });
    setExtracted(res.extracted);
    setPhase('done');
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            Compliance Certificate Intake <DemoChip variant="preview" />
          </h3>
          <p className="text-sm text-slate-500 mt-1">{transaction.borrower} — {transaction.id}</p>
        </div>
        {phase === 'idle' ? (
          <div className="p-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wider block mb-1">Period End</span>
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </label>
            <label className="block border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30">
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <span className="text-sm text-slate-600">{filename || 'Drop or choose certificate PDF'}</span>
              <input type="file" className="hidden" onChange={e => setFilename(e.target.files?.[0]?.name ?? '')} />
            </label>
            <p className="text-xs text-slate-500">In production, the PDF is sent to LLM extraction (gemini-2.5-flash). Without an API key, values are generated within plausible ranges.</p>
          </div>
        ) : phase !== 'done' ? (
          <div className="p-6 space-y-4">
            {[
              ['parsing', 'Parsing certificate'],
              ['mapping', 'Mapping fields to covenants'],
              ['validating', 'Validating thresholds & recording tests'],
            ].map(([k, label]) => (
              <div key={k} className="flex items-center gap-3 text-sm">
                <div className={cn('w-4 h-4 rounded-full',
                  phase === k ? 'bg-indigo-500 animate-pulse' : ['parsing', 'mapping', 'validating'].indexOf(phase) > ['parsing', 'mapping', 'validating'].indexOf(k as any) ? 'bg-emerald-500' : 'bg-slate-200')} />
                <span className={phase === k ? 'text-slate-900 font-medium' : 'text-slate-500'}>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium text-sm">Extraction complete · covenant tests recorded</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              {Object.entries(extracted ?? {}).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-600">{k}</span>
                  <span className="font-mono font-medium text-slate-900">{Number(v).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
            {phase === 'done' ? 'Close' : 'Cancel'}
          </button>
          {phase === 'idle' && (
            <button onClick={go} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />Extract Values
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
