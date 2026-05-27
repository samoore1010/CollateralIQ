import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Package, ShoppingBag, Layers, Bell, Search, User,
  FileCheck, ClipboardCheck, Gavel, BarChart3, ShieldCheck, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoBanner } from '@/components/DemoChip';
import { useApp, ROLE_LABELS } from '@/context/AppContext';
import type { Role } from '@/types';

const NAV: Array<{ section: string; items: Array<{ icon: any; label: string; to: string; roles?: Role[] }> }> = [
  {
    section: 'Platform',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
      { icon: FileText, label: 'Transactions', to: '/transactions' },
      { icon: Package, label: 'Collateral Vault', to: '/collateral' },
    ],
  },
  {
    section: 'Workflow',
    items: [
      { icon: FileCheck, label: 'UCC Filings', to: '/filings', roles: ['legal', 'pm', 'compliance', 'workout'] },
      { icon: ClipboardCheck, label: 'Compliance', to: '/compliance', roles: ['pm', 'compliance', 'legal'] },
      { icon: Gavel, label: 'Disposition', to: '/disposition', roles: ['workout', 'pm', 'legal'] },
    ],
  },
  {
    section: 'Market',
    items: [
      { icon: ShoppingBag, label: 'Marketplace', to: '/marketplace' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { icon: BarChart3, label: 'Intelligence', to: '/intelligence' },
      { icon: ShieldCheck, label: 'Security & Audit', to: '/security' },
    ],
  },
];

function SidebarItem({ icon: Icon, label, to }: { icon: any; label: string; to: string; [k: string]: any }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        )
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const location = useLocation();
  const { role, setRole, demoMode, actorName } = useApp();
  const [roleOpen, setRoleOpen] = React.useState(false);

  const getPageTitle = () => {
    const path = location.pathname.split('/').filter(Boolean)[0];
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      transactions: 'Transactions & UCC',
      collateral: 'Collateral Vault',
      filings: 'UCC Filing Workflow',
      compliance: 'Covenant Compliance',
      disposition: 'Article 9 Disposition',
      marketplace: 'Disposition Marketplace',
      intelligence: 'Portfolio Intelligence',
      security: 'Security & Audit',
    };
    return map[path] ?? 'Dashboard';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {demoMode && <DemoBanner />}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">CollateralIQ</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV.map(group => (
              <div key={group.section}>
                <div className="px-3 py-2 mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {group.section}
                </div>
                {group.items
                  .filter(it => !it.roles || it.roles.includes(role))
                  .map(({ roles: _r, ...it }) => <SidebarItem key={it.to} {...it} />)}
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 relative">
            <button
              onClick={() => setRoleOpen(o => !o)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-50 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{actorName}</p>
                <p className="text-xs text-slate-500 truncate">{ROLE_LABELS[role]}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {roleOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-20">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">Switch role (demo)</div>
                {(Object.keys(ROLE_LABELS) as Role[]).filter(r => r !== 'borrower').map(r => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setRoleOpen(false); }}
                    className={cn('w-full text-left px-3 py-2 text-sm hover:bg-slate-50', r === role && 'bg-indigo-50 text-indigo-700 font-medium')}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
                <a href="/portal" className="block px-3 py-2 text-sm hover:bg-slate-50 border-t border-slate-100 text-indigo-600">
                  Borrower Portal →
                </a>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            <h1 className="text-xl font-semibold text-slate-900">{getPageTitle()}</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transactions, assets…"
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
              </div>
              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
