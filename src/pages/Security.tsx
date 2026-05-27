import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, FileSearch, KeyRound, Activity, Globe, Building2 } from 'lucide-react';
import { api } from '@/api';
import { DemoChip } from '@/components/DemoChip';
import { useApp, ROLE_LABELS } from '@/context/AppContext';
import type { AuditEntry, Role } from '@/types';

const PERMS: Array<{ feature: string; roles: Role[] }> = [
  { feature: 'View Dashboard / Portfolio', roles: ['originator', 'pm', 'workout', 'legal', 'compliance'] },
  { feature: 'View Transaction Details', roles: ['originator', 'pm', 'workout', 'legal', 'compliance'] },
  { feature: 'Create / Submit UCC Filings', roles: ['legal'] },
  { feature: 'File Continuations', roles: ['legal', 'compliance'] },
  { feature: 'Record Covenant Tests', roles: ['pm', 'compliance'] },
  { feature: 'Receive Compliance Certificates', roles: ['pm', 'compliance'] },
  { feature: 'Begin Article 9 Disposition', roles: ['workout', 'legal'] },
  { feature: 'Finalize Sale & §9-615 Accounting', roles: ['workout', 'legal'] },
  { feature: 'View MNPI / Borrower Financials', roles: ['pm', 'workout', 'compliance'] },
  { feature: 'Audit Log Export', roles: ['compliance'] },
];

export default function Security() {
  const { settings } = useApp();
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [tab, setTab] = useState<'posture' | 'audit' | 'permissions'>('posture');
  useEffect(() => { api.audit().then(setAudit); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          Security, Compliance & Audit
          <DemoChip variant="partner-mock" label="Compliance posture" />
        </h2>
        <p className="text-sm text-slate-500">Controls, audit trail, and access posture across the platform.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[['posture', 'Compliance Posture'], ['audit', 'Audit Log'], ['permissions', 'Role Permissions']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium ${tab === k ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{l}</button>
        ))}
      </div>

      {tab === 'posture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card icon={ShieldCheck} title="SOC 2 Type II" value={settings.soc2_status ?? '—'} note="Report available under NDA. Audit firm: Prescient Assurance." />
          <Card icon={Lock} title="MNPI Information Wall" value="Active · 3 walled groups" note="Originators walled from Workout team; Compliance has bi-directional view with audit trail." />
          <Card icon={KeyRound} title="Authentication" value="SSO (SAML) + MFA enforced" note="Okta-compatible. Session timeout 60 min." />
          <Card icon={Globe} title="Data Residency" value="US-East (primary), US-West (DR)" note="EU residency available on Enterprise tier." />
          <Card icon={Building2} title="Filing Partner" value={settings.filing_partner ?? 'CSC Global (Sandbox)'} note="Production routes UCC filings through CSC or Wolters Kluwer with direct SOS connections." />
          <Card icon={Activity} title="Buyer Network Partner" value={settings.buyer_network_partner ?? 'BidConnect (Demo)'} note="Verified institutional buyer network with active mandate intake." />
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <FileSearch className="w-4 h-4" />Tamper-evident audit log
            </div>
            <span className="text-xs text-slate-500">{audit.length} most recent events</span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Actor</th>
                <th className="px-6 py-3 text-left">Action</th>
                <th className="px-6 py-3 text-left">Entity</th>
                <th className="px-6 py-3 text-left">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audit.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No audit events yet. Perform actions in the workflow pages to populate the log.</td></tr>
              )}
              {audit.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-xs text-slate-500 font-mono">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-6 py-3 text-xs">
                    <div className="font-medium text-slate-900">{a.actor_name}</div>
                    <div className="text-slate-500 capitalize">{a.actor_role}</div>
                  </td>
                  <td className="px-6 py-3 text-xs font-mono text-indigo-700">{a.action}</td>
                  <td className="px-6 py-3 text-xs">
                    <div className="text-slate-700">{a.entity_type}</div>
                    <div className="text-slate-400 font-mono text-[10px]">{a.entity_id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-600">{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">Capability</th>
                {(Object.keys(ROLE_LABELS) as Role[]).filter(r => r !== 'borrower').map(r => (
                  <th key={r} className="px-6 py-3 text-center">{ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMS.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-900">{p.feature}</td>
                  {(Object.keys(ROLE_LABELS) as Role[]).filter(r => r !== 'borrower').map(r => (
                    <td key={r} className="px-6 py-3 text-center">
                      {p.roles.includes(r) ? <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> : <span className="inline-block w-2 h-2 rounded-full bg-slate-200" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ icon: Icon, title, value, note }: { icon: any; title: string; value: string; note: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center"><Icon className="w-5 h-5 text-indigo-600" /></div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="text-sm font-medium text-slate-900 mb-2">{value}</div>
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  );
}
