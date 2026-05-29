'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

type View = 'users' | 'subscriptions' | 'payments' | 'plans' | 'financeiro';

interface AdminSidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const items: { id: View; label: string; icon: string }[] = [
  { id: 'users', label: 'Usuários', icon: '👥' },
  { id: 'subscriptions', label: 'Assinaturas', icon: '📋' },
  { id: 'payments', label: 'Pagamentos', icon: '💰' },
  { id: 'plans', label: 'Planos', icon: '📦' },
  { id: 'financeiro', label: 'Financeiro', icon: '📊' },
];

export default function AdminSidebar({ activeView, setActiveView, onLogout, mobileOpen, onMobileClose }: AdminSidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

  const handleSelect = (view: View) => {
    setActiveView(view);
    onMobileClose?.();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-border-soft shadow-lg transition-transform md:relative md:translate-x-0 md:shadow-none flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        aria-label="Navegação do administrador"
      >
        <div className="gradient-primary px-6 py-6 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={32} height={32} className="object-contain" />
            <h1 className="text-lg font-bold text-white tracking-tight">Clube do Café</h1>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white uppercase tracking-wider">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {items.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors text-left',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary',
                  active
                    ? 'bg-secondary/10 text-secondary-dark'
                    : 'text-ink-soft hover:bg-warm-gray hover:text-primary'
                )}
              >
                <span aria-hidden="true" className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border-soft p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-maroon/10 hover:text-maroon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            <span aria-hidden="true">↪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
