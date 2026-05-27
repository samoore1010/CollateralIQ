import React, { useState } from 'react';
import { Search, Filter, Tag, DollarSign, MapPin, Box, ArrowRight } from 'lucide-react';
import { assets } from '@/data/mockData';

export default function Collateral() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Collateral Vault</h2>
          <p className="text-sm text-slate-500">Visual database of all secured assets across current portfolio.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Box className="w-4 h-4" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All Assets', 'Industrial Equipment', 'Real Estate', 'Intellectual Property', 'Inventory', 'Vehicles'].map((cat) => (
          <button 
            key={cat}
            className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              <img 
                src={asset.image} 
                alt={asset.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                  asset.status === 'Secured' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
                }`}>
                  {asset.status}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  {asset.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">{asset.id}</span>
              </div>
              
              <h3 className="font-semibold text-slate-900 mb-4 line-clamp-2 min-h-[3rem]">
                {asset.name}
              </h3>
              
              <div className="space-y-2 text-sm text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900">{asset.value}</span>
                  <span className="text-xs text-slate-400">(Est. Liquidation)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{asset.location}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  List for Sale <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
