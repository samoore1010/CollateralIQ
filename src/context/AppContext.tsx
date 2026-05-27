import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Role } from '@/types';

interface AppContextValue {
  role: Role;
  setRole: (r: Role) => void;
  demoMode: boolean;
  setDemoMode: (b: boolean) => void;
  actorName: string;
  settings: Record<string, string>;
}

const Ctx = createContext<AppContextValue | null>(null);

const ROLE_NAMES: Record<Role, string> = {
  originator: 'Jamie Park',
  pm: 'Alex Morgan',
  workout: 'Dana Reyes',
  legal: 'Priya Shah',
  compliance: 'Marcus Lee',
  borrower: 'Elena Rostova',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('ciq.role') as Role) || 'pm');
  const [demoMode, setDemoMode] = useState<boolean>(() => localStorage.getItem('ciq.demo') !== 'off');
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => { localStorage.setItem('ciq.role', role); }, [role]);
  useEffect(() => { localStorage.setItem('ciq.demo', demoMode ? 'on' : 'off'); }, [demoMode]);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  return (
    <Ctx.Provider value={{ role, setRole, demoMode, setDemoMode, actorName: ROLE_NAMES[role], settings }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

export const ROLE_LABELS: Record<Role, string> = {
  originator: 'Originator',
  pm: 'Portfolio Manager',
  workout: 'Workout / Special Sit.',
  legal: 'Legal & Filings',
  compliance: 'Compliance Officer',
  borrower: 'Borrower (Portal)',
};
