import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, DollarSign, MapPin, Box, ArrowRight } from 'lucide-react';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Asset } from '@/types';

const CATS = ['All Assets', 'Industrial Equipment', 'Real Estate', 'Intellectual Property', 'Inventory', 'Vehicles', 'Aircraft', 'Healthcare Equipment'];

export default function Collateral() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [cat, setCat] = useState('All Assets');
  useEffect(() => { api.collateral().then(setAssets); }, []);
  const filtered = cat === 'All Assets' ? assets : assets.filter(a => a.category === cat);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Collateral Vault</h2>
          <p className="text-sm text-slate-500">All secured assets typed by Article 9 category and tracked across deals.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"><Filter className="w-4 h-4" />Filter</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"><Box className="w-4 h-4" />Add Asset</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border ${cat === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(a => (
          <div key={a.id} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              <img src={a.image} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${a.status === 'Secured' ? 'bg-emerald-500/90 text-white' : a.status === 'sold' ? 'bg-slate-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>{a.status}</span>
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
                {a.borrower && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{a.borrower}</span>}
              </div>
              <div className="space-y-1 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /><span className="font-medium text-slate-900">{fmtCents(a.liquidation_value_cents)}</span><span className="text-xs text-slate-400">liquidation</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /><span>{a.location}</span></div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Link to={`/collateral/${a.id}`} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 text-center">View Details</Link>
                <Link to={`/disposition/${a.id}`} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2">List for Sale <ArrowRight className="w-3 h-3" /></Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 flex items-center gap-1">
        Valuations refreshed from comp feed <DemoChip variant="partner-mock" label="Comps: mock" /> · location & condition synced from collateral managers.
      </p>
    </div>
  );
}
