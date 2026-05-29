'use client';

import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminUsers from './AdminUsers';
import AdminSubscriptions from './AdminSubscriptions';
import AdminPayments from './AdminPayments';
import AdminPlans from './AdminPlans';
import AdminFinanceiro from './AdminFinanceiro';
import { authService } from '@/services/api';
import { MenuButton } from '@/components/ui';

interface AdminDashboardProps { onLogout: () => void; }
type AdminView = 'users' | 'subscriptions' | 'payments' | 'plans' | 'financeiro';

const viewTitle: Record<AdminView, string> = {
  users: 'Usuários',
  subscriptions: 'Assinaturas',
  payments: 'Pagamentos',
  plans: 'Planos',
  financeiro: 'Financeiro',
};

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<AdminView>('users');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = authService.getCurrentUser();
  const adminName = currentUser?.nome || 'Administrador';

  return (
    <div className="min-h-screen flex bg-cream">
      <AdminSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-soft bg-white/90 backdrop-blur px-4 py-3 md:px-8 md:py-4">
          <MenuButton open={mobileMenuOpen} onClick={() => setMobileMenuOpen((v) => !v)} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-ink-muted">Painel administrativo</p>
            <h1 className="text-base md:text-lg font-semibold text-ink truncate">
              {viewTitle[activeView]}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-ink-soft">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-secondary font-semibold text-xs"
              aria-hidden="true"
            >
              {adminName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate max-w-[140px]">{adminName}</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 overflow-x-hidden">
          {activeView === 'users' && <AdminUsers />}
          {activeView === 'subscriptions' && <AdminSubscriptions />}
          {activeView === 'payments' && <AdminPayments />}
          {activeView === 'plans' && <AdminPlans />}
          {activeView === 'financeiro' && <AdminFinanceiro />}
        </main>
      </div>
    </div>
  );
}
