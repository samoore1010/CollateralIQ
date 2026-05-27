import React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign,
  ArrowUpRight,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';

const exposureData = [
  { name: 'Industrial', value: 35, color: '#4F46E5' }, // Indigo 600
  { name: 'Technology', value: 25, color: '#0EA5E9' }, // Sky 500
  { name: 'Healthcare', value: 20, color: '#10B981' }, // Emerald 500
  { name: 'Logistics', value: 15, color: '#F59E0B' }, // Amber 500
  { name: 'Other', value: 5, color: '#64748B' }, // Slate 500
];

const covenantHealthData = [
  { name: 'Pass', value: 18, color: '#10B981' },
  { name: 'Watch', value: 4, color: '#F59E0B' },
  { name: 'Fail', value: 2, color: '#EF4444' },
];

const StatCard = ({ title, value, change, icon: Icon, trend }: { title: string, value: string, change: string, icon: any, trend: 'up' | 'down' | 'neutral' }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
      </div>
      <div className="p-2 bg-slate-50 rounded-lg">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
        {change}
      </span>
      <span className="text-slate-400 ml-2">vs last month</span>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Secured Exposure" 
          value="$142.5M" 
          change="+12.5%" 
          icon={DollarSign} 
          trend="up" 
        />
        <StatCard 
          title="Active Transactions" 
          value="24" 
          change="+2" 
          icon={TrendingUp} 
          trend="up" 
        />
        <StatCard 
          title="UCC Compliance Alerts" 
          value="3" 
          change="-1" 
          icon={AlertTriangle} 
          trend="down" 
        />
        <StatCard 
          title="Collateral Sold (YTD)" 
          value="$8.2M" 
          change="+4.3%" 
          icon={CheckCircle2} 
          trend="up" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area - Split into Exposure and Health */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Exposure Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              Portfolio Exposure
            </h3>
            <p className="text-sm text-slate-500 mb-6">Breakdown by Industry Sector</p>
            
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={exposureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {exposureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-xs text-slate-400 font-medium uppercase">Total</p>
                <p className="text-xl font-bold text-slate-900">100%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {exposureData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                  <span className="ml-auto font-medium text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Health Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Credit Health
            </h3>
            <p className="text-sm text-slate-500 mb-6">Aggregate Covenant Status</p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={covenantHealthData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 14, fontWeight: 500 }} width={60} />
                  <RechartsTooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {covenantHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Covenants Tracked</span>
                <span className="font-bold text-slate-900">24</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-slate-500">Passing Rate</span>
                <span className="font-bold text-emerald-600">75%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Activity / Alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Priority Alerts
          </h3>
          <div className="space-y-4">
            {[
              { title: 'UCC Filing Expiring', desc: 'Project Alpha - 30 days remaining', type: 'warning', time: '2h ago' },
              { title: 'Covenant Breach', desc: 'TechFlow Inc - Debt Service Ratio', type: 'critical', time: '5h ago' },
              { title: 'New Lien Detected', desc: 'Subordinate lien filed on Asset #442', type: 'info', time: '1d ago' },
              { title: 'Perfection Complete', desc: 'Solaris Merger - Filing #2991', type: 'success', time: '2d ago' },
              { title: 'Insurance Lapsed', desc: 'Warehouse B - Policy Expired', type: 'critical', time: '2d ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className={cn(
                  "mt-1.5 w-2.5 h-2.5 rounded-full shrink-0",
                  item.type === 'warning' && "bg-amber-500",
                  item.type === 'critical' && "bg-red-500",
                  item.type === 'info' && "bg-blue-500",
                  item.type === 'success' && "bg-emerald-500",
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-slate-900 truncate">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
}

