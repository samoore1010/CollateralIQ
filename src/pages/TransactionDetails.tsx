import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle, 
  Info, 
  ArrowDown, 
  FileText, 
  Users, 
  Gavel, 
  Calendar,
  DollarSign,
  Briefcase,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  ArrowRight,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { transactionDetails } from '@/data/mockData';

export default function TransactionDetails() {
  const { id } = useParams();
  const transactionData = transactionDetails[id || 'TRX-2024-001'] || transactionDetails['TRX-2024-001'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link to="/transactions" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Registry
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{transactionData.borrower}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{id || transactionData.id}</span>
              <span>•</span>
              <span>{transactionData.dealType}</span>
              <span>•</span>
              <span>{transactionData.jurisdiction}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{transactionData.amount}</div>
            <div className="text-sm text-emerald-600 font-medium flex items-center justify-end gap-1">
              <Shield className="w-3 h-3" />
              Perfected
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats / Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {transactionData.mechanics.map((mech, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{mech.label}</p>
            <p className="font-semibold text-slate-900">{mech.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Lien Priority & Collateral */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Covenants Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Covenant Compliance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Metric</th>
                    <th className="px-6 py-3 font-medium">Requirement</th>
                    <th className="px-6 py-3 font-medium">Actual</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactionData.covenants.map((cov, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{cov.metric}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{cov.required}</td>
                      <td className={cn("px-6 py-4 font-mono font-medium", 
                        cov.status === 'pass' && "text-emerald-600",
                        cov.status === 'warning' && "text-amber-600",
                        cov.status === 'fail' && "text-red-600",
                      )}>
                        {cov.actual}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          cov.status === 'pass' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          cov.status === 'warning' && "bg-amber-50 text-amber-700 border-amber-200",
                          cov.status === 'fail' && "bg-red-50 text-red-700 border-red-200",
                        )}>
                          {cov.status === 'pass' && <CheckCircle2 className="w-3 h-3" />}
                          {cov.status === 'warning' && <AlertCircle className="w-3 h-3" />}
                          {cov.status === 'fail' && <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{cov.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 capitalize">{cov.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Key Collateral Assets */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-600" />
              Key Collateral Assets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transactionData.collateralAssets.map((asset) => (
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
                      <Link to={`/collateral/${asset.id}`} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center">
                        View Details
                      </Link>
                      <button className="flex-1 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                        List <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Lien Priority Section */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ArrowDown className="w-5 h-5 text-indigo-600" />
                Lien Priority Stack
              </h2>
              <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                Visualized
              </span>
            </div>
            
            <div className="p-8 bg-slate-50/50">
              <div className="flex flex-col items-center relative">
                {/* Waterfall Guide */}
                <div className="absolute left-4 top-4 bottom-4 w-1 bg-slate-200 rounded-full flex flex-col justify-between py-8 hidden sm:flex">
                    <div className="absolute -left-2 top-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider -rotate-90 origin-bottom-left translate-y-full">Senior</div>
                    <div className="absolute -left-2 bottom-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider -rotate-90 origin-top-left">Junior</div>
                </div>

                <div className="w-full max-w-2xl space-y-3 sm:pl-12">
                  {transactionData.lienStack.map((lien, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "relative p-5 rounded-lg border transition-all hover:shadow-md",
                        lien.holder.includes('CollateralIQ') 
                          ? "bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500/20 z-10" 
                          : "bg-white border-slate-200 text-slate-600 grayscale-[0.3]"
                      )}
                    >
                      {index < transactionData.lienStack.length - 1 && (
                        <div className="absolute left-8 -bottom-4 w-0.5 h-4 bg-slate-300 z-0 hidden sm:block"></div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5",
                            lien.holder.includes('CollateralIQ') ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {lien.position}
                          </span>
                          <div>
                            <h3 className={cn("font-semibold text-sm", lien.holder.includes('CollateralIQ') ? "text-indigo-900" : "text-slate-900")}>
                              {lien.holder}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">{lien.type} • {lien.collateral}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pl-9 sm:pl-0">
                          <div className="text-right">
                            <p className="font-mono font-medium text-sm text-slate-900">{lien.amount}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{lien.filingDate}</p>
                          </div>
                          {lien.status === 'Perfected' && (
                            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-amber-50 border-t border-amber-100 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Priority Note:</span> Equipment Leasing Co. holds a PMSI in specific CNC machines which supercedes your blanket lien for those specific assets only.
              </p>
            </div>
          </section>

          {/* Rights & Obligations */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-indigo-600" />
                Security Agreement Rights & Obligations
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {transactionData.rights.map((right, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                  <div className={cn(
                    "mt-1 w-2 h-2 rounded-full shrink-0",
                    right.status === 'active' ? "bg-emerald-500" : "bg-amber-500"
                  )} />
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">{right.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{right.description}</p>
                  </div>
                  {right.status === 'pending' && (
                    <span className="ml-auto text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Pending Action</span>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
              <button className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                View Full Security Agreement <FileText className="w-3 h-3" />
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Key Contacts & Info */}
        <div className="space-y-6">
          {/* Key Contacts */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Key Contacts
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {transactionData.contacts.map((contact, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium text-xs">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                    <p className="text-xs text-slate-500">{contact.role} • {contact.firm}</p>
                    <a href={`mailto:${contact.email}`} className="text-xs text-indigo-600 hover:underline mt-0.5 block">
                      {contact.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Key Dates */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Critical Dates
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Closing Date</span>
                <span className="text-sm font-medium text-slate-900">{transactionData.closingDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Maturity Date</span>
                <span className="text-sm font-medium text-slate-900">{transactionData.maturityDate}</span>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Next UCC Continuation</span>
                  <span className="text-sm font-medium text-amber-600">2028-05-15</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right">Window opens 6 months prior</p>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-slate-900 rounded-xl shadow-sm text-white p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Actions
            </h2>
            <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-left flex items-center justify-between">
                Generate Payoff Letter <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
              <button className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-left flex items-center justify-between">
                File UCC Amendment <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
              <button className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors text-left flex items-center justify-between shadow-lg shadow-indigo-900/50">
                Release Collateral <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
