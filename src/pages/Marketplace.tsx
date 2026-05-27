import React from 'react';
import { ShoppingBag, Users, MessageSquare, ExternalLink, Check } from 'lucide-react';

const listings = [
  {
    id: 'LST-8842',
    asset: '2022 Haas VF-4SS CNC Vertical Machining Center',
    price: '$85,000',
    bids: 3,
    highestBid: '$78,500',
    daysListed: 12,
    status: 'Active',
    interestedBuyers: [
      { name: 'Precision Machining Co.', match: '98%' },
      { name: 'Texas Industrial Supply', match: '85%' },
    ]
  },
  {
    id: 'LST-8845',
    asset: 'Commercial Real Estate - Warehouse B',
    price: '$2,400,000',
    bids: 1,
    highestBid: '$2,100,000',
    daysListed: 45,
    status: 'Active',
    interestedBuyers: [
      { name: 'Logistics REIT Partners', match: '95%' },
    ]
  },
  {
    id: 'LST-8810',
    asset: 'Fleet of 12 Delivery Vans',
    price: '$450,000',
    bids: 0,
    highestBid: '-',
    daysListed: 2,
    status: 'Pending Review',
    interestedBuyers: []
  }
];

const buyers = [
  { name: 'Global Manufacturing Inc.', type: 'Strategic Buyer', interest: ['Industrial Equipment', 'Robotics'], budget: '$5M+' },
  { name: 'Asset Liquidation Partners', type: 'Liquidator', interest: ['Inventory', 'Vehicles'], budget: '$2M' },
  { name: 'Tech Ventures Capital', type: 'PE / VC', interest: ['IP', 'Patents'], budget: '$10M+' },
];

export default function Marketplace() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Disposition Marketplace</h2>
          <p className="text-sm text-slate-500">Manage asset sales and connect with qualified buyers.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <ShoppingBag className="w-4 h-4" />
          Create New Listing
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Listings */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-semibold text-slate-900">Active Listings</h3>
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{listing.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{listing.status}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900">{listing.asset}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{listing.price}</p>
                    <p className="text-xs text-slate-500">Asking Price</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-slate-100 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Highest Bid</p>
                    <p className="font-medium text-slate-900">{listing.highestBid}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Bids</p>
                    <p className="font-medium text-slate-900">{listing.bids}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Time Listed</p>
                    <p className="font-medium text-slate-900">{listing.daysListed} days</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Matched Buyers</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.interestedBuyers.map((buyer, i) => (
                      <div key={i} className="flex items-center gap-2 pl-2 pr-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                        <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                          {buyer.match}
                        </div>
                        <span className="text-sm text-indigo-900">{buyer.name}</span>
                      </div>
                    ))}
                    {listing.interestedBuyers.length === 0 && (
                      <span className="text-sm text-slate-400 italic">No matches yet</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="flex-1 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Manage Listing
                  </button>
                  <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                    View Bids
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer Network */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Buyer Network</h3>
            <button className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {buyers.map((buyer, i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-slate-900 text-sm">{buyer.name}</h4>
                    <p className="text-xs text-slate-500">{buyer.type}</p>
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {buyer.interest.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Budget:</span> {buyer.budget}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-900 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-semibold text-lg mb-2">Expand Your Reach</h3>
              <p className="text-indigo-200 text-sm mb-4">Connect with 500+ verified institutional buyers looking for unique collateral.</p>
              <button className="w-full py-2 bg-white text-indigo-900 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
                Invite Buyers
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
