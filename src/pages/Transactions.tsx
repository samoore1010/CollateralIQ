import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, FileCheck, AlertCircle, Clock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transactions } from '@/data/mockData';

export default function Transactions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Transaction Registry</h2>
          <p className="text-sm text-slate-500">Manage active deals and monitor UCC filing status.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by borrower, ID, or jurisdiction..." 
              className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Transaction ID</th>
                <th className="px-6 py-3 font-medium">Borrower</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Jurisdiction</th>
                <th className="px-6 py-3 font-medium">UCC Status</th>
                <th className="px-6 py-3 font-medium">Next Filing</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{trx.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{trx.borrower}</div>
                    <div className="text-xs text-slate-500">{trx.dealType}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">{trx.amount}</td>
                  <td className="px-6 py-4 text-slate-600">{trx.jurisdiction}</td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      trx.uccStatus === 'Perfected' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                      trx.uccStatus === 'Pending' && "bg-blue-50 text-blue-700 border-blue-200",
                      trx.uccStatus === 'Warning' && "bg-amber-50 text-amber-700 border-amber-200",
                    )}>
                      {trx.uccStatus === 'Perfected' && <FileCheck className="w-3 h-3" />}
                      {trx.uccStatus === 'Pending' && <Clock className="w-3 h-3" />}
                      {trx.uccStatus === 'Warning' && <AlertCircle className="w-3 h-3" />}
                      {trx.uccStatus}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{trx.nextFiling}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/transactions/${trx.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
