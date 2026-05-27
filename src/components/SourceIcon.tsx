import React, { useState } from 'react';
import { Info, FileText, Database, Building2, Globe, User, Beaker } from 'lucide-react';
import type { SourceAttribution } from '@/types';

const ICONS: Record<string, any> = {
  sec_edgar: FileText,
  csc: Database,
  wolters_kluwer: Database,
  uspto: Globe,
  manual_entry: User,
  borrower_portal: User,
  simulated: Beaker,
};

const LABELS: Record<string, string> = {
  sec_edgar: 'SEC EDGAR',
  csc: 'CSC Filing Gateway',
  wolters_kluwer: 'Wolters Kluwer iLien',
  uspto: 'USPTO',
  manual_entry: 'Manual entry',
  borrower_portal: 'Borrower portal',
  simulated: 'Simulated',
};

export function SourceIcon({ attributions }: { attributions: SourceAttribution[] }) {
  const [open, setOpen] = useState(false);
  if (!attributions || attributions.length === 0) return null;
  const primary = attributions[0];
  const Icon = ICONS[primary.source_type] ?? Info;

  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Icon className="w-3 h-3 text-slate-400 hover:text-indigo-500 ml-1" />
      {open && (
        <span className="absolute z-40 top-full left-0 mt-2 w-80 p-3 bg-slate-900 text-white rounded-lg shadow-lg text-[11px] font-normal leading-snug pointer-events-auto">
          <div className="font-semibold text-white mb-2 flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> Source attribution{attributions.length > 1 ? `s (${attributions.length})` : ''}
          </div>
          {attributions.map(a => (
            <div key={a.id} className="border-t border-slate-700 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-block px-1.5 py-0.5 rounded bg-slate-700 text-[10px] uppercase tracking-wider">{LABELS[a.source_type] ?? a.source_type}</span>
                {a.field_path && <span className="text-slate-400 font-mono text-[10px]">{a.field_path}</span>}
              </div>
              {a.source_reference && (
                a.source_reference.startsWith('http')
                  ? <a href={a.source_reference} target="_blank" rel="noreferrer" className="block text-indigo-300 underline mt-1 break-all">{a.source_reference}</a>
                  : <div className="text-slate-300 mt-1 break-all">{a.source_reference}</div>
              )}
              {a.notes && <div className="text-slate-400 mt-1">{a.notes}</div>}
              <div className="text-slate-500 mt-1 text-[10px]">Retrieved {new Date(a.retrieved_at).toLocaleDateString()}</div>
            </div>
          ))}
        </span>
      )}
    </span>
  );
}

/** Returns attributions for one entity from the full transaction attribution list. */
export function findAttributions(
  list: SourceAttribution[] | undefined,
  entityType: SourceAttribution['entity_type'],
  entityId: string,
  fieldPath?: string,
): SourceAttribution[] {
  if (!list) return [];
  return list.filter(a => a.entity_type === entityType && a.entity_id === entityId && (fieldPath ? a.field_path === fieldPath : true));
}
