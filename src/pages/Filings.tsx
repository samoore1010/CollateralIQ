import React, { useEffect, useState } from 'react';
import { FileCheck, FilePlus, RefreshCw, X, Clock, AlertTriangle, Calendar, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Filing, Transaction, FilingType } from '@/types';

const TYPE_LABEL: Record<FilingType, string> = {
  'UCC-1': 'UCC-1 Initial Financing Statement',
  'UCC-3-amendment': 'UCC-3 Amendment',
  'UCC-3-continuation': 'UCC-3 Continuation',
  'UCC-3-assignment': 'UCC-3 Assignment',
  'UCC-3-termination': 'UCC-3 Termination',
};

export default function Filings() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<'all' | 'draft' | 'queued' | 'confirmed' | 'calendar'>('all');
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = () => { api.filings().then(setFilings); api.transactions().then(setTransactions); };
  useEffect(load, []);

  const counts = {
    all: filings.length,
    draft: filings.filter(f => f.status === 'draft').length,
    queued: filings.filter(f => f.status === 'queued').length,
    confirmed: filings.filter(f => f.status === 'confirmed').length,
  };

  const continuationsDue = filings
    .filter(f => f.continuation_window_open && f.status === 'confirmed')
    .sort((a, b) => (a.continuation_window_open ?? '').localeCompare(b.continuation_window_open ?? ''));

  const filtered = tab === 'all' ? filings
    : tab === 'calendar' ? continuationsDue
    : filings.filter(f => f.status === tab);

  async function submit(id: string) {
    setSubmitting(id);
    await new Promise(r => setTimeout(r, 1100));
    await api.submitFiling(id);
    setSubmitting(null);
    load();
  }
  async function continueFiling(id: string) {
    await api.continueFiling(id);
    load();
  }
  async function terminate(id: string) {
    if (!confirm('File a UCC-3 termination?')) return;
    await api.terminateFiling(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
            UCC Filing Workflow
            <DemoChip variant="sandbox" label="Filing Gateway: CSC (Sandbox)" detail="In production, filings route directly to CSC Global or Wolters Kluwer for submission to the relevant Secretary of State. Sandbox returns synthetic file numbers and confirmation timing." />
          </h2>
          <p className="text-sm text-slate-500">Prepare, file, and continue UCC-1 / UCC-3 records across all jurisdictions.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <FilePlus className="w-4 h-4" />New Filing
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { k: 'all', label: 'All Filings', v: counts.all, Icon: FileCheck },
          { k: 'draft', label: 'Drafts', v: counts.draft, Icon: FilePlus },
          { k: 'queued', label: 'In-Flight', v: counts.queued, Icon: Clock },
          { k: 'confirmed', label: 'Perfected', v: counts.confirmed, Icon: ShieldCheck },
        ].map(c => (
          <button key={c.k} onClick={() => setTab(c.k as any)}
            className={cn('p-5 rounded-xl border text-left', tab === c.k ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white hover:bg-slate-50')}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{c.label}</span>
              <c.Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{c.v}</div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 text-sm">
          {(['all', 'draft', 'queued', 'confirmed', 'calendar'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-3 -mb-px border-b-2 capitalize',
              tab === t ? 'border-indigo-600 text-indigo-700 font-medium' : 'border-transparent text-slate-500 hover:text-slate-900')}>
              {t === 'calendar' ? <><Calendar className="w-3 h-3 inline mr-1" />Continuation Calendar</> : t}
            </button>
          ))}
        </div>

        {tab !== 'calendar' ? (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Type</th>
                <th className="px-6 py-3 text-left font-medium">Borrower / Debtor</th>
                <th className="px-6 py-3 text-left font-medium">Jurisdiction</th>
                <th className="px-6 py-3 text-left font-medium">File Number</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
                <th className="px-6 py-3 text-left font-medium">Lapse</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{f.filing_type}</div>
                    <div className="text-xs text-slate-500">{TYPE_LABEL[f.filing_type]}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{f.borrower}</div>
                    <div className="text-xs text-slate-500">{f.debtor_name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{f.jurisdiction}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{f.file_number ?? '—'}</td>
                  <td className="px-6 py-4"><StatusPill status={f.status} /></td>
                  <td className="px-6 py-4 text-xs">
                    {f.lapse_date ? (
                      <div>
                        <div className="text-slate-700">{f.lapse_date}</div>
                        {f.continuation_window_open && <div className="text-amber-600 text-[10px]">Window: {f.continuation_window_open}</div>}
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2 text-xs">
                      {f.status === 'draft' || f.status === 'queued' ? (
                        <button onClick={() => submit(f.id)} disabled={submitting === f.id} className="px-3 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50">
                          {submitting === f.id ? 'Submitting…' : 'Submit to Gateway'}
                        </button>
                      ) : null}
                      {f.status === 'confirmed' && (
                        <>
                          <button onClick={() => continueFiling(f.id)} className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50"><RefreshCw className="w-3 h-3 inline mr-1" />Continue</button>
                          <button onClick={() => terminate(f.id)} className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50"><X className="w-3 h-3 inline mr-1" />Terminate</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">No filings in this tab.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <ContinuationCalendar items={continuationsDue} onContinue={continueFiling} />
        )}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
          <span>Submissions route through <span className="font-medium text-slate-700">CSC Filing Gateway</span> <DemoChip variant="sandbox" />. Returned file numbers are synthetic.</span>
          <span>UCC-1 lapse is 5 years; continuation window opens 6 months prior.</span>
        </div>
      </div>

      {showNew && <NewFilingModal transactions={transactions} onClose={() => { setShowNew(false); load(); }} />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: any = {
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    queued: 'bg-blue-50 text-blue-700 border-blue-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    filed: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    lapsed: 'bg-red-50 text-red-700 border-red-200',
  };
  return <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium border capitalize', map[status])}>{status}</span>;
}

function ContinuationCalendar({ items, onContinue }: { items: Filing[]; onContinue: (id: string) => void }) {
  const today = new Date();
  const buckets: Record<string, Filing[]> = { 'Next 30 days': [], 'Next 90 days': [], 'Next 12 months': [], Later: [] };
  for (const f of items) {
    if (!f.continuation_window_open) continue;
    const d = new Date(f.continuation_window_open);
    const days = Math.floor((d.getTime() - today.getTime()) / 86_400_000);
    if (days <= 30) buckets['Next 30 days'].push(f);
    else if (days <= 90) buckets['Next 90 days'].push(f);
    else if (days <= 365) buckets['Next 12 months'].push(f);
    else buckets['Later'].push(f);
  }
  return (
    <div className="p-6 space-y-6">
      {Object.entries(buckets).map(([bucket, list]) => (
        <div key={bucket}>
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-2">
            {bucket}
            {bucket === 'Next 30 days' && list.length > 0 && <span className="text-red-600 normal-case font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> action required</span>}
          </h3>
          {list.length === 0 ? <p className="text-xs text-slate-400">Nothing in this window.</p> : (
            <div className="space-y-2">
              {list.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">{f.borrower} · {f.jurisdiction}</div>
                    <div className="text-xs text-slate-500">File #{f.file_number} · lapses {f.lapse_date} · window opens {f.continuation_window_open}</div>
                  </div>
                  <button onClick={() => onContinue(f.id)} className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center gap-1">
                    File Continuation <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NewFilingModal({ transactions, onClose }: { transactions: Transaction[]; onClose: () => void }) {
  const [form, setForm] = useState({
    transaction_id: transactions[0]?.id ?? '',
    filing_type: 'UCC-1' as FilingType,
    jurisdiction: transactions[0]?.jurisdiction ?? '',
    debtor_name: transactions[0]?.borrower ?? '',
    debtor_address: '',
    secured_party: 'CollateralIQ Capital LLC',
    secured_party_address: '200 Park Ave, New York NY',
    collateral_description: 'All assets of debtor, now owned or hereafter acquired',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    const tx = transactions.find(t => t.id === form.transaction_id);
    if (tx) setForm(f => ({ ...f, jurisdiction: tx.jurisdiction, debtor_name: tx.borrower }));
  }, [form.transaction_id]);

  async function save(submit: boolean) {
    setSaving(true);
    const res = await api.createFiling(form);
    if (submit) await api.submitFiling(res.id);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            New UCC Filing
            <DemoChip variant="sandbox" />
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Transaction">
            <select className="input" value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })}>
              {transactions.map(t => <option key={t.id} value={t.id}>{t.id} — {t.borrower}</option>)}
            </select>
          </Field>
          <Field label="Filing Type">
            <select className="input" value={form.filing_type} onChange={e => setForm({ ...form, filing_type: e.target.value as FilingType })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Jurisdiction"><input className="input" value={form.jurisdiction} onChange={e => setForm({ ...form, jurisdiction: e.target.value })} /></Field>
            <Field label="Debtor Name"><input className="input" value={form.debtor_name} onChange={e => setForm({ ...form, debtor_name: e.target.value })} /></Field>
          </div>
          <Field label="Debtor Address"><input className="input" value={form.debtor_address} onChange={e => setForm({ ...form, debtor_address: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Secured Party"><input className="input" value={form.secured_party} onChange={e => setForm({ ...form, secured_party: e.target.value })} /></Field>
            <Field label="Secured Party Address"><input className="input" value={form.secured_party_address} onChange={e => setForm({ ...form, secured_party_address: e.target.value })} /></Field>
          </div>
          <Field label="Collateral Description">
            <textarea rows={3} className="input" value={form.collateral_description} onChange={e => setForm({ ...form, collateral_description: e.target.value })} />
          </Field>
        </div>
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={() => save(false)} disabled={saving} className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50">Save as Draft</button>
          <button onClick={() => save(true)} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Submitting…' : 'Save & Submit'}
          </button>
        </div>
      </div>
      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid rgb(226 232 240); border-radius: 0.5rem; font-size: 0.875rem; background: white; }`}</style>
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
