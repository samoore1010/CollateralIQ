import React, { useState } from 'react';
import { Info, Beaker, Plug, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'sandbox' | 'simulated' | 'partner-mock' | 'preview';

const META: Record<Variant, { label: string; tone: string; icon: React.ComponentType<any>; explain: string }> = {
  sandbox: {
    label: 'Sandbox',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Beaker,
    explain: 'Backed by a sandboxed filing gateway. In production this routes to a registered filer (CSC Global / Wolters Kluwer) with real Secretary of State APIs.',
  },
  simulated: {
    label: 'Simulated',
    tone: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Info,
    explain: 'Behavior simulated for the demo. In production this signal originates from continuous UCC monitoring services and configured webhooks.',
  },
  'partner-mock': {
    label: 'Partner: Mock',
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Plug,
    explain: 'In production this is provided by a partner integration. Currently rendering mock data.',
  },
  preview: {
    label: 'Preview',
    tone: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Eye,
    explain: 'Heuristic preview — production version uses model-driven scoring trained on completed dispositions.',
  },
};

export function DemoChip({ variant = 'simulated', label, detail, className }: { variant?: Variant; label?: string; detail?: string; className?: string }) {
  const m = META[variant];
  const Icon = m.icon;
  const [open, setOpen] = useState(false);
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-help relative', m.tone, className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Icon className="w-2.5 h-2.5" />
      {label ?? m.label}
      {open && (
        <span className="absolute z-30 top-full left-0 mt-2 w-72 p-3 bg-slate-900 text-white rounded-lg shadow-lg text-[11px] font-normal leading-snug pointer-events-none">
          {detail ?? m.explain}
        </span>
      )}
    </span>
  );
}

export function DemoBanner({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-8 py-2 flex items-center gap-2 text-xs text-amber-800">
      <Beaker className="w-3.5 h-3.5" />
      <span className="font-medium">Demo Mode</span>
      <span className="text-amber-700">
        — UCC filings route to a sandbox gateway, buyer network is mocked, and external feeds are simulated. Hover any
        <span className="inline-block mx-1 align-middle"><DemoChip variant="sandbox" /></span>
        chip for details.
      </span>
      {children}
    </div>
  );
}
