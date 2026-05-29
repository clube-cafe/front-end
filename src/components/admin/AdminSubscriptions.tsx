'use client';

import { useState, useEffect, useCallback } from 'react';
import { assinaturaService, planoService, userService } from '@/services/api';
import type { Assinatura, PlanoAssinatura } from '@/types/assinatura';
import type { User } from '@/types/user';
import { Badge, Card, Skeleton } from '@/components/ui';

const periodLabel: Record<string, string> = {
  MENSAL: 'Mensal', TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual',
};
const statusLabel: Record<string, string> = {
  ATIVA: 'Ativa', PENDENTE: 'Pendente', CANCELADA: 'Cancelada', SUSPENSA: 'Suspensa',
};
const statusTone = (s: string) =>
  s === 'ATIVA' ? 'success' as const
  : s === 'PENDENTE' ? 'warning' as const
  : s === 'SUSPENSA' ? 'neutral' as const
  : 'danger' as const;
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

export default function AdminSubscriptions() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [a, p, u] = await Promise.all([
        assinaturaService.getAllAssinaturas(),
        planoService.getAllPlanos(),
        userService.getAllUsers(),
      ]);
      const prio: Record<string, number> = { ATIVA: 1, PENDENTE: 2, SUSPENSA: 3, CANCELADA: 4 };
      setAssinaturas(a.sort((x, y) => (prio[x.status] || 5) - (prio[y.status] || 5)));
      setPlanos(p);
      setUsers(u);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getPlano = (id: string) => planos.find((p) => p.id === id);
  const getUser = (id: string) => users.find((u) => u.id === id);

  const filtered = filterStatus === 'ALL' ? assinaturas : assinaturas.filter((a) => a.status === filterStatus);
  const stats = {
    total: assinaturas.length,
    ativas: assinaturas.filter((a) => a.status === 'ATIVA').length,
    pendentes: assinaturas.filter((a) => a.status === 'PENDENTE').length,
    canceladas: assinaturas.filter((a) => a.status === 'CANCELADA').length,
  };

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
        <h2 className="text-xl font-bold text-ink">Assinaturas</h2>
        <p className="text-sm text-ink-soft">Visão consolidada de todas as assinaturas</p>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Ativas" value={stats.ativas} tone="success" />
        <Stat label="Pendentes" value={stats.pendentes} tone="warning" />
        <Stat label="Canceladas" value={stats.canceladas} tone="danger" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <label htmlFor="filter-status" className="text-sm font-medium text-ink-soft">
          Filtrar por status:
        </label>
        <select
          id="filter-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
        >
          <option value="ALL">Todos</option>
          <option value="ATIVA">Ativas</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="SUSPENSA">Suspensas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
        <span className="ml-auto text-xs text-ink-muted">{filtered.length} registro(s)</span>
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.map((a) => {
          const plano = getPlano(a.plano_id);
          const user = getUser(a.user_id);
          return (
            <Card key={a.id} padding="md">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{user?.nome || '—'}</p>
                  <p className="text-xs text-ink-soft truncate">{user?.email}</p>
                </div>
                <Badge tone={statusTone(a.status)}>{statusLabel[a.status]}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{plano?.nome || '—'}</span>
                <span className="font-semibold text-secondary">
                  {plano ? fmtCurrency(plano.valor) : '—'}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Desde {fmtDate(a.data_inicio)} · {plano ? periodLabel[plano.periodicidade] : '—'}
              </p>
            </Card>
          );
        })}
      </div>

      <Card padding="none" className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-warm-gray/60 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <Th>Usuário</Th><Th>Plano</Th><Th>Valor</Th><Th>Status</Th><Th>Início</Th><Th>Periodicidade</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {filtered.map((a) => {
                const plano = getPlano(a.plano_id);
                const user = getUser(a.user_id);
                return (
                  <tr key={a.id} className="hover:bg-warm-gray/30 transition-colors">
                    <Td>
                      <div className="font-medium text-ink">{user?.nome || '—'}</div>
                      <div className="text-xs text-ink-muted">{user?.email}</div>
                    </Td>
                    <Td>{plano?.nome || '—'}</Td>
                    <Td className="font-semibold text-secondary">
                      {plano ? fmtCurrency(plano.valor) : '—'}
                    </Td>
                    <Td><Badge tone={statusTone(a.status)}>{statusLabel[a.status]}</Badge></Td>
                    <Td className="text-ink-muted">{fmtDate(a.data_inicio)}</Td>
                    <Td className="text-ink-muted">{plano ? periodLabel[plano.periodicidade] : '—'}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filtered.length === 0 && (
        <Card padding="lg" className="text-center text-sm text-ink-muted">
          Nenhuma assinatura encontrada com esse filtro.
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const ring =
    tone === 'success' ? 'ring-success/20' : tone === 'warning' ? 'ring-accent/30' : tone === 'danger' ? 'ring-maroon/20' : 'ring-border';
  return (
    <Card padding="md" className={`ring-1 ${ring}`}>
      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">{label}</p>
      <p className="text-2xl font-bold text-ink mt-1">{value}</p>
    </Card>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th scope="col" className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
