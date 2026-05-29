'use client';

import { useState, useEffect, useCallback } from 'react';
import { pagamentoService, userService, historicoService } from '@/services/api';
import type { Pagamento } from '@/types/payments';
import type { User } from '@/types/user';
import { Alert, Badge, Button, Card, Input, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

interface Historico {
  id: string;
  user_id: string;
  tipo: 'ENTRADA' | 'SAIDA';
  valor: number;
  data: string;
  descricao: string;
  createdAt?: string;
  updatedAt?: string;
}

type ActiveTab = 'historico' | 'resumo-anual' | 'registrar-pagamento' | 'registrar-compra';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');
const fmtDateTime = (s: string) => new Date(s).toLocaleString('pt-BR');

export default function AdminFinanceiro() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('historico');
  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth());
  const [filtroAno, setFiltroAno] = useState<number>(new Date().getFullYear());

  const [pagForm, setPagForm] = useState({ user_id: '', pagamento_id: '', forma_pagamento: 'CAIXA', observacao: '' });
  const [pagUserPendentes, setPagUserPendentes] = useState<Pagamento[]>([]);
  const [pagLoading, setPagLoading] = useState(false);
  const [pagSuccess, setPagSuccess] = useState('');
  const [pagError, setPagError] = useState('');

  const [compraForm, setCompraForm] = useState({
    user_id: '', valor: '', descricao: '', data: new Date().toISOString().split('T')[0],
  });
  const [compraLoading, setCompraLoading] = useState(false);
  const [compraSuccess, setCompraSuccess] = useState('');
  const [compraError, setCompraError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [h, p, u] = await Promise.all([
        historicoService.getAllHistoricos(),
        pagamentoService.getAllPagamentos(),
        userService.getAllUsers(),
      ]);
      setHistoricos(h);
      setPagamentos(p);
      setUsers(u);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePagUserChange = async (userId: string) => {
    setPagForm((prev) => ({ ...prev, user_id: userId, pagamento_id: '' }));
    setPagUserPendentes([]);
    if (!userId) return;
    try {
      const userPags = await pagamentoService.getPagamentosByUserId(userId);
      setPagUserPendentes(userPags.filter((p) => p.status === 'PENDENTE' || p.status === 'ATRASADO'));
    } catch (e) {
      console.error('Erro ao buscar pagamentos do usuário:', e);
    }
  };

  const handleRegistrarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setPagError(''); setPagSuccess('');

    if (!pagForm.pagamento_id) {
      setPagError('Selecione um pagamento pendente');
      return;
    }

    try {
      setPagLoading(true);
      await pagamentoService.registrarPagamentoCompleto(
        pagForm.pagamento_id,
        pagForm.forma_pagamento,
        pagForm.observacao || undefined
      );
      setPagSuccess('Pagamento registrado com sucesso!');
      setPagForm({ user_id: '', pagamento_id: '', forma_pagamento: 'CAIXA', observacao: '' });
      setPagUserPendentes([]);
      await loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setPagError(error.response?.data?.error || 'Erro ao registrar pagamento');
    } finally {
      setPagLoading(false);
    }
  };

  const handleRegistrarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompraError(''); setCompraSuccess('');

    if (!compraForm.user_id || !compraForm.valor || !compraForm.descricao) {
      setCompraError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setCompraLoading(true);
      await historicoService.createHistorico({
        user_id: compraForm.user_id,
        tipo: 'SAIDA',
        valor: parseFloat(compraForm.valor),
        data: compraForm.data,
        descricao: compraForm.descricao,
      });
      setCompraSuccess('Compra registrada com sucesso!');
      setCompraForm({ user_id: '', valor: '', descricao: '', data: new Date().toISOString().split('T')[0] });
      await loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setCompraError(error.response?.data?.error || 'Erro ao registrar compra');
    } finally {
      setCompraLoading(false);
    }
  };

  const getUserById = (userId: string) => users.find((u) => u.id === userId);

  const historicosDoPeriodo = historicos.filter((h) => {
    const d = new Date(h.data);
    return d.getMonth() === filtroMes && d.getFullYear() === filtroAno;
  });

  const filteredHistoricos = historicosDoPeriodo.filter((h) => {
    if (filtroTipo !== 'TODOS' && h.tipo !== filtroTipo) return false;
    if (filtroUsuario) {
      const user = getUserById(h.user_id);
      const search = filtroUsuario.toLowerCase();
      if (!user?.nome.toLowerCase().includes(search) && !user?.email.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  const totalEntradas = historicosDoPeriodo.filter((h) => h.tipo === 'ENTRADA').reduce((s, h) => s + h.valor, 0);
  const totalSaidas = historicosDoPeriodo.filter((h) => h.tipo === 'SAIDA').reduce((s, h) => s + h.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const anosDisponiveis = Array.from(new Set(historicos.map((h) => new Date(h.data).getFullYear()))).sort((a, b) => b - a);
  if (!anosDisponiveis.includes(filtroAno)) {
    anosDisponiveis.push(filtroAno);
    anosDisponiveis.sort((a, b) => b - a);
  }

  const resumoMensal = meses.map((nomeMes, index) => {
    const doMes = historicos.filter((h) => {
      const d = new Date(h.data);
      return d.getMonth() === index && d.getFullYear() === filtroAno;
    });
    const entradas = doMes.filter((h) => h.tipo === 'ENTRADA').reduce((s, h) => s + h.valor, 0);
    const saidas = doMes.filter((h) => h.tipo === 'SAIDA').reduce((s, h) => s + h.valor, 0);
    return { mes: nomeMes, index, entradas, saidas, saldo: entradas - saidas, registros: doMes.length };
  });

  const assinantes = users.filter((u) => u.tipo_user === 'ASSINANTE' || !u.tipo_user);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'historico', label: 'Histórico mensal', icon: '📋' },
    { id: 'resumo-anual', label: 'Resumo anual', icon: '📊' },
    { id: 'registrar-pagamento', label: 'Registrar pagamento', icon: '💳' },
    { id: 'registrar-compra', label: 'Registrar compra', icon: '🛒' },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-ink">Gestão financeira</h2>
        <p className="text-sm text-ink-soft">Entradas, saídas e fluxo de caixa</p>
      </div>

      <Card padding="md">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-mes" className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Mês</label>
            <select
              id="filtro-mes"
              value={filtroMes}
              onChange={(e) => setFiltroMes(Number(e.target.value))}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            >
              {meses.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-ano" className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Ano</label>
            <select
              id="filtro-ano"
              value={filtroAno}
              onChange={(e) => setFiltroAno(Number(e.target.value))}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            >
              {anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <span className="ml-auto text-sm font-medium text-ink-soft">
            📅 {meses[filtroMes]} {filtroAno}
          </span>
        </div>

        <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
          <StatLine icon="📈" label={`Entradas em ${meses[filtroMes]}`} value={fmtCurrency(totalEntradas)} tone="success" />
          <StatLine icon="📉" label={`Saídas em ${meses[filtroMes]}`} value={fmtCurrency(totalSaidas)} tone="danger" />
          <StatLine icon="💰" label={`Saldo de ${meses[filtroMes]}`} value={fmtCurrency(saldo)} tone={saldo >= 0 ? 'success' : 'danger'} />
        </div>
      </Card>

      <div role="tablist" aria-label="Seções financeiras" className="flex gap-1 p-1 bg-white rounded-xl border border-border-soft overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary',
              activeTab === t.id ? 'bg-secondary text-white shadow-sm' : 'text-ink-soft hover:text-primary'
            )}
          >
            <span aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'historico' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Filtrar por tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'TODOS' | 'ENTRADA' | 'SAIDA')}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saídas</option>
            </select>
            <Input
              type="search"
              placeholder="Buscar por nome ou email..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              leftIcon={<span aria-hidden="true">🔍</span>}
              className="flex-1 min-w-[200px]"
            />
            <span className="self-center text-xs text-ink-muted whitespace-nowrap">
              {filteredHistoricos.length} registro(s)
            </span>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-warm-gray/60 text-xs uppercase tracking-wider text-ink-muted">
                  <tr><Th>Data</Th><Th>Tipo</Th><Th>Usuário</Th><Th>Descrição</Th><Th>Valor</Th></tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {filteredHistoricos.map((h) => {
                    const user = getUserById(h.user_id);
                    return (
                      <tr key={h.id} className="hover:bg-warm-gray/30 transition-colors">
                        <Td className="text-ink-muted whitespace-nowrap">{fmtDateTime(h.data)}</Td>
                        <Td>
                          <Badge tone={h.tipo === 'ENTRADA' ? 'success' : 'danger'}>
                            {h.tipo === 'ENTRADA' ? '📈 Entrada' : '📉 Saída'}
                          </Badge>
                        </Td>
                        <Td>
                          <div className="font-medium text-ink">{user?.nome || '—'}</div>
                          <div className="text-xs text-ink-muted">{user?.email}</div>
                        </Td>
                        <Td className="text-ink-soft">{h.descricao}</Td>
                        <Td className={cn('font-semibold', h.tipo === 'ENTRADA' ? 'text-success' : 'text-maroon')}>
                          {h.tipo === 'ENTRADA' ? '+ ' : '- '}{fmtCurrency(h.valor)}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredHistoricos.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">Nenhum registro encontrado.</p>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'resumo-anual' && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-border-soft">
            <h3 className="font-semibold text-ink">Resumo mensal de {filtroAno}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warm-gray/60 text-xs uppercase tracking-wider text-ink-muted">
                <tr><Th>Mês</Th><Th>Entradas</Th><Th>Saídas</Th><Th>Saldo</Th><Th>Registros</Th><Th></Th></tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {resumoMensal.map((r) => (
                  <tr key={r.index} className={cn(r.registros === 0 && 'text-ink-muted')}>
                    <Td className="font-medium">{r.mes}</Td>
                    <Td className={r.entradas > 0 ? 'text-success font-medium' : ''}>{r.entradas > 0 ? `+ ${fmtCurrency(r.entradas)}` : '—'}</Td>
                    <Td className={r.saidas > 0 ? 'text-maroon font-medium' : ''}>{r.saidas > 0 ? `- ${fmtCurrency(r.saidas)}` : '—'}</Td>
                    <Td className={cn('font-semibold', r.registros > 0 && (r.saldo >= 0 ? 'text-success' : 'text-maroon'))}>
                      {r.registros > 0 ? fmtCurrency(r.saldo) : '—'}
                    </Td>
                    <Td>{r.registros}</Td>
                    <Td>
                      {r.registros > 0 && (
                        <button
                          type="button"
                          onClick={() => { setFiltroMes(r.index); setActiveTab('historico'); }}
                          className="text-xs font-semibold text-secondary hover:text-secondary-dark underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary rounded"
                        >
                          Ver detalhes →
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-warm-gray/60 font-semibold">
                <tr>
                  <Td>Total {filtroAno}</Td>
                  <Td className="text-success">+ {fmtCurrency(resumoMensal.reduce((s, r) => s + r.entradas, 0))}</Td>
                  <Td className="text-maroon">- {fmtCurrency(resumoMensal.reduce((s, r) => s + r.saidas, 0))}</Td>
                  <Td className={resumoMensal.reduce((s, r) => s + r.saldo, 0) >= 0 ? 'text-success' : 'text-maroon'}>
                    {fmtCurrency(resumoMensal.reduce((s, r) => s + r.saldo, 0))}
                  </Td>
                  <Td>{resumoMensal.reduce((s, r) => s + r.registros, 0)}</Td>
                  <Td></Td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'registrar-pagamento' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card padding="lg" className="lg:col-span-2">
            <h3 className="font-semibold text-ink mb-1">Registrar pagamento de usuário</h3>
            <p className="text-sm text-ink-soft mb-5">
              Registre manualmente o pagamento de uma pendência existente.
            </p>

            {pagSuccess && <Alert tone="success" className="mb-4">{pagSuccess}</Alert>}
            {pagError && <Alert tone="error" className="mb-4">{pagError}</Alert>}

            <form onSubmit={handleRegistrarPagamento} className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pag-user" className="text-sm font-medium text-ink-soft">Usuário *</label>
                <select
                  id="pag-user"
                  value={pagForm.user_id}
                  onChange={(e) => handlePagUserChange(e.target.value)}
                  required
                  className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                >
                  <option value="">Selecione o usuário...</option>
                  {assinantes.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pag-pendencia" className="text-sm font-medium text-ink-soft">Pagamento pendente *</label>
                <select
                  id="pag-pendencia"
                  value={pagForm.pagamento_id}
                  onChange={(e) => setPagForm((prev) => ({ ...prev, pagamento_id: e.target.value }))}
                  required
                  disabled={!pagForm.user_id || pagUserPendentes.length === 0}
                  className="h-11 rounded-lg border border-border bg-white px-3 text-sm disabled:bg-warm-gray disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                >
                  <option value="">
                    {!pagForm.user_id
                      ? 'Selecione um usuário primeiro'
                      : pagUserPendentes.length === 0
                        ? 'Nenhuma pendência encontrada'
                        : 'Selecione a pendência...'}
                  </option>
                  {pagUserPendentes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {fmtCurrency(p.valor)} — {p.descricao} (venc. {fmtDate(p.data_vencimento)})
                      {p.status === 'ATRASADO' ? ' ⚠️ ATRASADO' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pag-forma" className="text-sm font-medium text-ink-soft">Forma de pagamento *</label>
                  <select
                    id="pag-forma"
                    value={pagForm.forma_pagamento}
                    onChange={(e) => setPagForm((prev) => ({ ...prev, forma_pagamento: e.target.value }))}
                    required
                    className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                  >
                    <option value="CAIXA">💵 Dinheiro (Caixa)</option>
                    <option value="PIX">📱 PIX</option>
                    <option value="CARTAO">💳 Cartão</option>
                  </select>
                </div>
                <Input
                  label="Observação"
                  placeholder="Ex: Pagou em mãos na loja"
                  value={pagForm.observacao}
                  onChange={(e) => setPagForm((prev) => ({ ...prev, observacao: e.target.value }))}
                />
              </div>

              <Button type="submit" loading={pagLoading} fullWidth>
                Registrar pagamento
              </Button>
            </form>
          </Card>

          <Card padding="md">
            <h4 className="font-semibold text-ink mb-3 text-sm">
              ⏳ Pendentes ({pagamentos.filter((p) => p.status === 'PENDENTE' || p.status === 'ATRASADO').length})
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pagamentos
                .filter((p) => p.status === 'PENDENTE' || p.status === 'ATRASADO')
                .slice(0, 10)
                .map((p) => {
                  const user = getUserById(p.user_id);
                  return (
                    <div key={p.id} className={cn(
                      'rounded-lg border p-3 text-xs',
                      p.status === 'ATRASADO' ? 'border-maroon/30 bg-maroon/5' : 'border-border-soft'
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-ink truncate">{user?.nome || '—'}</p>
                        <Badge tone={p.status === 'ATRASADO' ? 'danger' : 'warning'}>{p.status}</Badge>
                      </div>
                      <p className="text-ink-soft truncate">{p.descricao}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-ink-muted">Venc {fmtDate(p.data_vencimento)}</span>
                        <span className="font-semibold text-secondary">{fmtCurrency(p.valor)}</span>
                      </div>
                    </div>
                  );
                })}
              {pagamentos.filter((p) => p.status === 'PENDENTE' || p.status === 'ATRASADO').length === 0 && (
                <p className="text-center text-sm text-ink-muted py-4">Nenhum pendente 🎉</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'registrar-compra' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card padding="lg" className="lg:col-span-2">
            <h3 className="font-semibold text-ink mb-1">Registrar compra</h3>
            <p className="text-sm text-ink-soft mb-5">
              Registre a compra de um item como saída no fluxo de caixa.
            </p>

            {compraSuccess && <Alert tone="success" className="mb-4">{compraSuccess}</Alert>}
            {compraError && <Alert tone="error" className="mb-4">{compraError}</Alert>}

            <form onSubmit={handleRegistrarCompra} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="compra-user" className="text-sm font-medium text-ink-soft">Responsável *</label>
                  <select
                    id="compra-user"
                    value={compraForm.user_id}
                    onChange={(e) => setCompraForm((prev) => ({ ...prev, user_id: e.target.value }))}
                    required
                    className="h-11 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                  >
                    <option value="">Selecione...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Data *"
                  type="date"
                  value={compraForm.data}
                  onChange={(e) => setCompraForm((prev) => ({ ...prev, data: e.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Valor (R$) *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={compraForm.valor}
                  onChange={(e) => setCompraForm((prev) => ({ ...prev, valor: e.target.value }))}
                  required
                />
                <Input
                  label="Descrição *"
                  placeholder="Ex: 10kg Café Arábica premium"
                  value={compraForm.descricao}
                  onChange={(e) => setCompraForm((prev) => ({ ...prev, descricao: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" variant="danger" loading={compraLoading} fullWidth>
                Registrar compra
              </Button>
            </form>
          </Card>

          <Card padding="md">
            <h4 className="font-semibold text-ink mb-3 text-sm">📦 Últimas saídas</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historicos
                .filter((h) => h.tipo === 'SAIDA')
                .slice(0, 8)
                .map((h) => {
                  const user = getUserById(h.user_id);
                  return (
                    <div key={h.id} className="rounded-lg border border-border-soft p-3 text-xs">
                      <p className="font-semibold text-ink truncate">{h.descricao}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-ink-muted truncate">{user?.nome} · {fmtDate(h.data)}</span>
                        <span className="font-semibold text-maroon">- {fmtCurrency(h.valor)}</span>
                      </div>
                    </div>
                  );
                })}
              {historicos.filter((h) => h.tipo === 'SAIDA').length === 0 && (
                <p className="text-center text-sm text-ink-muted py-4">Nenhuma saída registrada.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatLine({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: 'success' | 'danger' }) {
  const color = tone === 'success' ? 'text-success' : 'text-maroon';
  return (
    <div className="flex items-center gap-3 rounded-xl bg-warm-gray/40 p-3">
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className={`text-lg font-bold ${color} truncate`}>{value}</p>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th scope="col" className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
