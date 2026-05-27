import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Box, 
  TrendingUp, 
  Users, 
  Globe, 
  Activity,
  Tag,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { assetDetails } from '@/data/mockData';

export default function CollateralDetails() {
  const { id } = useParams();
  const assetData = assetDetails[id || 'AST-001'] || assetDetails['AST-001'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link to="/transactions/TRX-2024-001" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Transaction
        </Link>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative h-64 bg-slate-100">
            <img 
              src="https://picsum.photos/seed/cnc/1200/400" 
              alt={assetData.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500 text-white shadow-sm">
                {assetData.status}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-24">
              <h1 className="text-2xl font-bold text-white mb-2">{assetData.name}</h1>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <span className="flex items-center gap-1"><Box className="w-4 h-4" /> {assetData.category}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {assetData.location}</span>
                <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> ID: {id || assetData.id}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Est. Market Value</p>
              <p className="text-2xl font-bold text-slate-900">{assetData.value}</p>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Liquidation Value</p>
              <p className="text-2xl font-bold text-amber-600">{assetData.liquidationValue}</p>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Original Cost</p>
              <p className="text-xl font-semibold text-slate-700">{assetData.originalCost}</p>
            </div>
            <div className="pt-4 md:pt-0 md:pl-6 flex items-center">
              <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                List for Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Specs */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Asset Summary */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Asset Summary</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              {assetData.description}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Manufacturer</span>
                <span className="font-medium text-slate-900">{assetData.manufacturer}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Year</span>
                <span className="font-medium text-slate-900">{assetData.year}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Serial Number</span>
                <span className="font-mono font-medium text-slate-900">{assetData.serialNumber}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Condition</span>
                <span className="font-medium text-emerald-600">{assetData.condition}</span>
              </div>
            </div>
          </section>

          {/* Valuation Analysis */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Valuation Analysis & Comps
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">Sale Price</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetData.comps.map((comp, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{comp.model}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{comp.price}</td>
                      <td className="px-4 py-3 text-slate-500">{comp.date}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {comp.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Market Demand Chart */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Regional Market Demand
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetData.marketDemand}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="demand" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} name="Demand Score (0-100)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right Column: Buyers & Actions */}
        <div className="space-y-6">
          {/* Liquidity Profile */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Liquidity Profile
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Market Liquidity</span>
                  <span className="font-medium text-emerald-600">High</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Est. Time to Sell</span>
                  <span className="font-medium text-slate-900">14-30 Days</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* Potential Buyers */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Target Buyers
            </h2>
            <div className="space-y-3">
              {assetData.potentialBuyers.map((buyer, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{buyer.name}</p>
                    <p className="text-xs text-slate-500">{buyer.type}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
                    {buyer.match}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
              View All 12 Matches
            </button>
          </section>

          {/* Location Map Placeholder */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                Location
              </h2>
            </div>
            <div className="h-48 bg-slate-100 relative flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Map View Placeholder</p>
                <p className="text-xs text-slate-400">{assetData.location}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
