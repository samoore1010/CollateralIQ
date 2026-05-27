import React, { useEffect, useState } from 'react';
import { Layers, Upload, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Transaction } from '@/types';

export default function BorrowerPortal() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'mapping' | 'validating' | 'done'>('idle');
  const [result, setResult] = useState<{ extracted: Record<string, number>; source: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api.transactions().then(ts => {
      setTransactions(ts);
      setSelectedId(ts[0]?.id ?? '');
    });
  }, []);

  useEffect(() => {
    if (selectedId) api.certificates(selectedId).then(setHistory);
  }, [selectedId, phase]);

  const selected = transactions.find(t => t.id === selectedId);

  async function submit() {
    setPhase('parsing'); await new Promise(r => setTimeout(r, 700));
    setPhase('mapping'); await new Promise(r => setTimeout(r, 600));
    setPhase('validating');
    const res = await api.uploadCertificate({
      transaction_id: selectedId,
      period_end: periodEnd,
      uploaded_by: 'Borrower CFO',
      filename: filename || 'compliance_cert.pdf',
      content_base64: content ?? undefined,
    });
    setResult(res);
    setPhase('done');
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFilename(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(',');
      setContent(idx >= 0 ? result.slice(idx + 1) : null);
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Layers className="w-5 h-5 text-white" /></div>
            <div>
              <div className="font-bold text-slate-900">CollateralIQ · Borrower Portal</div>
              <div className="text-xs text-slate-500">Secure compliance certificate submission</div>
            </div>
          </div>
          <DemoChip variant="partner-mock" label="Sandbox tenant" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-8">
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-bold text-slate-900">Submit Compliance Certificate</h1>
          <p className="text-sm text-slate-500 mt-1">Upload your quarterly compliance certificate. The lender's covenant tests update automatically.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wider block mb-1">Loan / Transaction</span>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                {transactions.map(t => <option key={t.id} value={t.id}>{t.borrower} — {t.id}</option>)}
              </select>
              {selected && <div className="text-xs text-slate-500 mt-1">{selected.deal_type} · {fmtCents(selected.amount_cents)}</div>}
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wider block mb-1">Period End</span>
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </label>
          </div>

          <label className="mt-4 block border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <span className="text-sm text-slate-600">{filename || 'Drop PDF or choose a file'}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={onFile} />
            <p className="text-[10px] text-slate-400 mt-2">Files are encrypted in transit and at rest.</p>
          </label>

          {phase === 'idle' && (
            <button onClick={submit} disabled={!selectedId} className="mt-4 w-full py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Submit Certificate
            </button>
          )}

          {phase !== 'idle' && phase !== 'done' && (
            <div className="mt-4 bg-slate-50 rounded-lg p-4 space-y-2">
              {[
                ['parsing', 'Parsing certificate PDF'],
                ['mapping', 'Mapping fields to covenants'],
                ['validating', 'Validating thresholds & posting tests'],
              ].map(([k, label]) => (
                <div key={k} className="flex items-center gap-3 text-sm">
                  <div className={cn('w-3 h-3 rounded-full', phase === k ? 'bg-indigo-500 animate-pulse' : ['parsing', 'mapping', 'validating'].indexOf(phase) > ['parsing', 'mapping', 'validating'].indexOf(k as any) ? 'bg-emerald-500' : 'bg-slate-200')} />
                  <span className={phase === k ? 'text-slate-900 font-medium' : 'text-slate-500'}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {phase === 'done' && result && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Submission complete · lender's covenant tests updated · source: {result.source}
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-2 text-sm">
                {Object.entries(result.extracted).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-600">{k}</span>
                    <span className="font-mono font-medium text-slate-900">{Number(v).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setPhase('idle'); setResult(null); setFilename(''); setContent(null); }} className="text-sm text-indigo-600 font-medium hover:underline">Submit another →</button>
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Submission History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {history.length === 0 && <div className="p-6 text-sm text-slate-400">No submissions yet for this loan.</div>}
            {history.map(h => (
              <div key={h.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">{h.filename}</div>
                  <div className="text-xs text-slate-500">Period end {h.period_end} · uploaded {new Date(h.uploaded_at).toLocaleString()}</div>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">{h.status}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-slate-400 text-center">
          Confidential. Submitted documents and extracted values are visible only to authorized personnel at the lender, subject to the security agreement. <DemoChip variant="partner-mock" label="MNPI controlled" />
        </p>
      </main>
    </div>
  );
}
