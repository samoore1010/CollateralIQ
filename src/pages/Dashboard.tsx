import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, CheckCircle2, DollarSign, PieChart as PieChartIcon, Activity, Zap,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import { api, fmtCents } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import type { Transaction, Alert } from '@/types';

const SECTOR_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#64748B', '#A855F7', '#EC4899', '#14B8A6'];

const StatCard = ({ title, value, change, icon: Icon, trend, chip }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {chip}
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className="p-2 bg-slate-50 rounded-lg"><Icon className="w-5 h-5 text-slate-600" /></div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}>{change}</span>
      <span className="text-slate-400 ml-2">vs last month</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [intel, setIntel] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const load = () => {
    api.transactions().then(setTransactions);
    api.alerts().then(setAlerts);
    api.intelligence().then(setIntel);
  };
  useEffect(() => { load(); }, []);

  const total = transactions.reduce((s, t) => s + t.amount_cents, 0);
  const active = transactions.length;
  const uccAlerts = alerts.filter(a => ['ucc_lapse', 'jurisdiction_change'].includes(a.type) && !a.acked).length;
  const breaches = alerts.filter(a => a.type === 'covenant_breach' && !a.acked).length;
  const exposureData = (intel?.exposureBySector ?? []).map((s: any, i: number) => ({
    name: s.sector || 'Other',
    value: Math.round((s.amount / total) * 100),
    color: SECTOR_COLORS[i % SECTOR_COLORS.length],
  })).filter((d: any) => d.value > 0);
  const ch = intel?.covenantHealth ?? { pass: 0, watch: 0, fail: 0 };
  const covenantHealthData = [
    { name: 'Pass', value: ch.pass, color: '#10B981' },
    { name: 'Watch', value: ch.watch, color: '#F59E0B' },
    { name: 'Fail', value: ch.fail, color: '#EF4444' },
  ];
  const totalCov = ch.pass + ch.watch + ch.fail;

  async function simulate() {
    setSimulating(true);
    const kinds = ['new_subordinate', 'jurisdiction_change', 'ucc_lapse'];
    const tx = transactions[Math.floor(Math.random() * transactions.length)];
    await api.simulateAlert(kinds[Math.floor(Math.random() * kinds.length)], tx?.id, tx?.borrower);
    load();
    setTimeout(() => setSimulating(false), 600);
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Secured Exposure" value={fmtCents(total)} change={`${transactions.length} active deals`} icon={DollarSign} trend="up" />
        <StatCard title="Active Transactions" value={active} change="+2 this quarter" icon={TrendingUp} trend="up" />
        <StatCard title="UCC Compliance Alerts" value={uccAlerts} change={uccAlerts > 0 ? 'Action required' : 'All clear'} icon={AlertTriangle} trend={uccAlerts > 0 ? 'down' : 'up'} chip={<DemoChip variant="simulated" label="Live monitor" detail="In production: continuous UCC monitoring via CSC/WK across all jurisdictions where you have debtors." />} />
        <StatCard title="Active Covenant Breaches" value={breaches} change={breaches > 0 ? 'Watch closely' : 'Stable'} icon={CheckCircle2} trend={breaches > 0 ? 'down' : 'up'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              Portfolio Exposure
            </h3>
            <p className="text-sm text-slate-500 mb-6">Breakdown by Collateral Type</p>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={exposureData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {exposureData.map((entry: any, index: number) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-xs text-slate-400 font-medium uppercase">Total</p>
                <p className="text-xl font-bold text-slate-900">{fmtCents(total)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              {exposureData.slice(0, 6).map((item: any) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}</span>
                  <span className="ml-auto font-medium text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Covenant Health
            </h3>
            <p className="text-sm text-slate-500 mb-6">Latest test across all deals</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={covenantHealthData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 14, fontWeight: 500 }} width={60} />
                  <RechartsTooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {covenantHealthData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Covenants Tracked</span>
                <span className="font-bold text-slate-900">{totalCov}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-slate-500">Passing Rate</span>
                <span className="font-bold text-emerald-600">{totalCov ? Math.round((ch.pass / totalCov) * 100) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Priority Alerts
            </h3>
            <button onClick={simulate} disabled={simulating} className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">
              <Zap className="w-3 h-3" />
              {simulating ? 'Pushing…' : 'Simulate'}
            </button>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 6).map(a => (
              <Link key={a.id} to={a.transaction_id ? `/transactions/${a.transaction_id}` : '/dashboard'} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className={cn('mt-1.5 w-2.5 h-2.5 rounded-full shrink-0',
                  a.severity === 'warning' && 'bg-amber-500',
                  a.severity === 'critical' && 'bg-red-500',
                  a.severity === 'info' && 'bg-blue-500',
                  a.severity === 'success' && 'bg-emerald-500')} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-slate-900 truncate">{a.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-400 flex items-center gap-1">
            Alert sources: <DemoChip variant="simulated" /> CSC/WK monitoring · insurance lapse feed · borrower portal events.
          </p>
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
