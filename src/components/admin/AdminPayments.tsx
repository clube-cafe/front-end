'use client';

import { useState, useEffect, useCallback } from 'react';
import { pagamentoService, userService } from '@/services/api';
import type { Pagamento } from '@/types/payments';
import type { User } from '@/types/user';
import { Badge, Card, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

const statusLabel: Record<string, string> = {
  PENDENTE: 'Pendente', ATRASADO: 'Atrasado', PAGO: 'Pago', CANCELADO: 'Cancelado',
};
const statusTone = (s: string) =>
  s === 'PAGO' ? 'success' as const
  : s === 'ATRASADO' ? 'danger' as const
  : s === 'PENDENTE' ? 'warning' as const
  : 'neutral' as const;
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');
const fmtDateTime = (s: string) => new Date(s).toLocaleString('pt-BR');

export default function AdminPayments() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'realizados' | 'pendentes'>('realizados');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [p, u] = await Promise.all([
        pagamentoService.getAllPagamentos(),
        userService.getAllUsers(),
      ]);
      setPagamentos(p);
      setUsers(u);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const realizados = pagamentos.filter((p) => p.status === 'PAGO');
  const pendentes = pagamentos.filter((p) => p.status === 'PENDENTE' || p.status === 'ATRASADO');
  const totalRealizados = realizados.reduce((s, p) => s + p.valor, 0);
  const totalPendentes = pendentes.filter((p) => p.status === 'PENDENTE').reduce((s, p) => s + p.valor, 0);
  const atrasados = pendentes.filter((p) => p.status === 'ATRASADO').length;
  const getUser = (id: string) => users.find((u) => u.id === id);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-ink">Pagamentos</h2>
        <p className="text-sm text-ink-soft">Realizados e pendentes</p>
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <Stat label="Realizados" value={realizados.length} sub={fmtCurrency(totalRealizados)} tone="success" />
        <Stat label="Pendentes" value={pendentes.filter((p) => p.status === 'PENDENTE').length} sub={fmtCurrency(totalPendentes)} tone="warning" />
        <Stat label="Atrasados" value={atrasados} tone="danger" />
      </div>

      <div role="tablist" aria-label="Filtrar pagamentos" className="flex gap-1 p-1 bg-white rounded-xl border border-border-soft w-fit">
        {(['realizados', 'pendentes'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={activeTab === t}
            onClick={() => setActiveTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary',
              activeTab === t ? 'bg-secondary text-white shadow-sm' : 'text-ink-soft hover:text-primary'
            )}
          >
            {t === 'realizados' ? `Realizados (${realizados.length})` : `Pendentes (${pendentes.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'realizados' ? (
        <RealizadosTable items={realizados} getUser={getUser} />
      ) : (
        <PendentesTable items={pendentes} getUser={getUser} />
      )}
    </div>
  );
}

function RealizadosTable({ items, getUser }: { items: Pagamento[]; getUser: (id: string) => User | undefined }) {
  if (items.length === 0) {
    return <Card padding="lg" className="text-center text-sm text-ink-muted">Nenhum pagamento realizado ainda.</Card>;
  }
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {items.map((p) => {
          const user = getUser(p.user_id);
          return (
            <Card key={p.id} padding="md">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{user?.nome || '—'}</p>
                  <p className="text-xs text-ink-soft truncate">{user?.email}</p>
                </div>
                <span className="font-bold text-success">{fmtCurrency(p.valor)}</span>
              </div>
              <div className="text-xs text-ink-muted">
                {p.forma_pagamento || '—'} · {p.data_pagamento ? fmtDateTime(p.data_pagamento) : '—'}
              </div>
            </Card>
          );
        })}
      </div>
      <Card padding="none" className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-warm-gray/60 text-xs uppercase tracking-wider text-ink-muted">
              <tr><Th>Usuário</Th><Th>Valor</Th><Th>Forma</Th><Th>Data</Th><Th>Observação</Th></tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {items.map((p) => {
                const user = getUser(p.user_id);
                return (
                  <tr key={p.id} className="hover:bg-warm-gray/30 transition-colors">
                    <Td>
                      <div className="font-medium text-ink">{user?.nome || '—'}</div>
                      <div className="text-xs text-ink-muted">{user?.email}</div>
                    </Td>
                    <Td className="font-semibold text-success">{fmtCurrency(p.valor)}</Td>
                    <Td>{p.forma_pagamento || '—'}</Td>
                    <Td className="text-ink-muted">
                      {p.data_pagamento ? fmtDateTime(p.data_pagamento) : '—'}
                    </Td>
                    <Td className="text-ink-soft">{p.observacao || '—'}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function PendentesTable({ items, getUser }: { items: Pagamento[]; getUser: (id: string) => User | undefined }) {
  if (items.length === 0) {
    return <Card padding="lg" className="text-center text-sm text-ink-muted">Nenhum pagamento pendente.</Card>;
  }
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {items.map((p) => {
          const user = getUser(p.user_id);
          const vencido = new Date(p.data_vencimento) < new Date();
          return (
            <Card key={p.id} padding="md" className={vencido ? 'ring-1 ring-maroon/30' : ''}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{user?.nome || '—'}</p>
                  <p className="text-xs text-ink-soft truncate">{user?.email}</p>
                </div>
                <Badge tone={statusTone(p.status)}>{statusLabel[p.status]}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{p.descricao}</span>
                <span className="font-bold text-secondary">{fmtCurrency(p.valor)}</span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Vence em {fmtDate(p.data_vencimento)}
                {vencido && <span className="text-maroon font-medium"> · vencido</span>}
              </p>
            </Card>
          );
        })}
      </div>
      <Card padding="none" className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-warm-gray/60 text-xs uppercase tracking-wider text-ink-muted">
              <tr><Th>Usuário</Th><Th>Valor</Th><Th>Status</Th><Th>Vencimento</Th><Th>Descrição</Th></tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {items.map((p) => {
                const user = getUser(p.user_id);
                const vencido = new Date(p.data_vencimento) < new Date();
                return (
                  <tr key={p.id} className={cn('hover:bg-warm-gray/30 transition-colors', vencido && 'bg-maroon/5')}>
                    <Td>
                      <div className="font-medium text-ink">{user?.nome || '—'}</div>
                      <div className="text-xs text-ink-muted">{user?.email}</div>
                    </Td>
                    <Td className="font-semibold text-secondary">{fmtCurrency(p.valor)}</Td>
                    <Td><Badge tone={statusTone(p.status)}>{statusLabel[p.status]}</Badge></Td>
                    <Td className="text-ink-muted">
                      {fmtDate(p.data_vencimento)}
                      {vencido && <span className="ml-1 text-maroon text-xs font-medium">vencido</span>}
                    </Td>
                    <Td className="text-ink-soft">{p.descricao}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Stat({ label, value, sub, tone = 'neutral' }: { label: string; value: number; sub?: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const ring =
    tone === 'success' ? 'ring-success/20' : tone === 'warning' ? 'ring-accent/30' : tone === 'danger' ? 'ring-maroon/20' : 'ring-border';
  return (
    <Card padding="md" className={`ring-1 ${ring}`}>
      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">{label}</p>
      <p className="text-2xl font-bold text-ink mt-1">{value}</p>
      {sub && <p className="text-sm text-ink-soft mt-1">{sub}</p>}
    </Card>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th scope="col" className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
