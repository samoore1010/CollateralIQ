import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FileCheck, AlertCircle, Clock, Plus, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Transaction } from '@/types';

const statusStyle = (s: string) => {
  if (s === 'confirmed') return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Perfected', Icon: FileCheck };
  if (s === 'queued' || s === 'filed') return { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Pending', Icon: Clock };
  if (s === 'draft') return { cls: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Draft', Icon: FileEdit };
  return { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Warning', Icon: AlertCircle };
};

export default function Transactions() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => { api.transactions().then(setRows); }, []);
  const filtered = rows.filter(r =>
    !q || r.borrower.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()) || (r.jurisdiction || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Transaction Registry</h2>
          <p className="text-sm text-slate-500">All secured-credit deals across the portfolio with live UCC status and lien priority context.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="w-4 h-4" />Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" />New Deal
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} type="text" placeholder="Search by borrower, ID, or jurisdiction…"
              className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <span className="text-xs text-slate-500">{filtered.length} of {rows.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Transaction</th>
                <th className="px-6 py-3 font-medium">Borrower</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Structure</th>
                <th className="px-6 py-3 font-medium">Jurisdiction</th>
                <th className="px-6 py-3 font-medium">UCC Status</th>
                <th className="px-6 py-3 font-medium">Next Continuation</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map(t => {
                const s = statusStyle(t.ucc_status ?? 'draft');
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{t.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{t.borrower}</div>
                      <div className="text-xs text-slate-500">{t.deal_type}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-900">{fmtCents(t.amount_cents)}</td>
                    <td className="px-6 py-4 text-xs">
                      <div className="text-slate-700 capitalize">{(t.intercreditor_tranche || '').replace('-', ' ')}</div>
                      <div className="text-slate-500">{t.our_share_pct}% via {t.agent_firm}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{t.jurisdiction}</td>
                    <td className="px-6 py-4">
                      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', s.cls)}>
                        <s.Icon className="w-3 h-3" />
                        {s.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {t.next_continuation ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/transactions/${t.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">View Details</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 flex items-center gap-2">
          UCC status synced from filing gateway <DemoChip variant="sandbox" /> · continuation calendar tracks the 6-month window automatically.
        </div>
      </div>
    </div>
  );
}
