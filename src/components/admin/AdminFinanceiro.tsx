'use client';

import { useState, useEffect, useCallback } from 'react';
import { pagamentoService, userService } from '@/services/api';
import { historicoService } from '@/services/api';
import type { Pagamento } from '@/types/payments';
import type { User } from '@/types/user';
import './AdminFinanceiro.css';

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

export default function AdminFinanceiro() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('historico');
  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros do histórico
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth());
  const [filtroAno, setFiltroAno] = useState<number>(new Date().getFullYear());

  // Form: registrar pagamento manual
  const [pagForm, setPagForm] = useState({
    user_id: '',
    pagamento_id: '',
    forma_pagamento: 'CAIXA',
    observacao: '',
  });
  const [pagUserPendentes, setPagUserPendentes] = useState<Pagamento[]>([]);
  const [pagLoading, setPagLoading] = useState(false);
  const [pagSuccess, setPagSuccess] = useState('');
  const [pagError, setPagError] = useState('');

  // Form: registrar compra (saída no histórico)
  const [compraForm, setCompraForm] = useState({
    user_id: '',
    valor: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
  });
  const [compraLoading, setCompraLoading] = useState(false);
  const [compraSuccess, setCompraSuccess] = useState('');
  const [compraError, setCompraError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [historicosData, pagamentosData, usersData] = await Promise.all([
        historicoService.getAllHistoricos(),
        pagamentoService.getAllPagamentos(),
        userService.getAllUsers(),
      ]);
      setHistoricos(historicosData);
      setPagamentos(pagamentosData);
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quando o admin seleciona um usuário no form de pagamento, buscar pendentes
  const handlePagUserChange = async (userId: string) => {
    setPagForm(prev => ({ ...prev, user_id: userId, pagamento_id: '' }));
    setPagUserPendentes([]);
    if (!userId) return;

    try {
      const userPags = await pagamentoService.getPagamentosByUserId(userId);
      setPagUserPendentes(userPags.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO'));
    } catch (error) {
      console.error('Erro ao buscar pagamentos do usuário:', error);
    }
  };

  // Registrar pagamento manual
  const handleRegistrarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setPagError('');
    setPagSuccess('');

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

  // Registrar compra (saída)
  const handleRegistrarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompraError('');
    setCompraSuccess('');

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
      setCompraForm({
        user_id: '',
        valor: '',
        descricao: '',
        data: new Date().toISOString().split('T')[0],
      });
      await loadData();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setCompraError(error.response?.data?.error || 'Erro ao registrar compra');
    } finally {
      setCompraLoading(false);
    }
  };

  const getUserById = (userId: string) => users.find(u => u.id === userId);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('pt-BR');

  // Filtragem do histórico por período e critérios
  const historicosDoPeriodo = historicos.filter(h => {
    const d = new Date(h.data);
    return d.getMonth() === filtroMes && d.getFullYear() === filtroAno;
  });

  const filteredHistoricos = historicosDoPeriodo.filter(h => {
    if (filtroTipo !== 'TODOS' && h.tipo !== filtroTipo) return false;
    if (filtroUsuario) {
      const user = getUserById(h.user_id);
      const search = filtroUsuario.toLowerCase();
      if (
        !user?.nome.toLowerCase().includes(search) &&
        !user?.email.toLowerCase().includes(search)
      )
        return false;
    }
    return true;
  });

  // Totais do período selecionado
  const totalEntradas = historicosDoPeriodo
    .filter(h => h.tipo === 'ENTRADA')
    .reduce((sum, h) => sum + h.valor, 0);
  const totalSaidas = historicosDoPeriodo
    .filter(h => h.tipo === 'SAIDA')
    .reduce((sum, h) => sum + h.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  // Anos disponíveis para o seletor
  const anosDisponiveis = Array.from(
    new Set(historicos.map(h => new Date(h.data).getFullYear()))
  ).sort((a, b) => b - a);
  if (!anosDisponiveis.includes(filtroAno)) {
    anosDisponiveis.push(filtroAno);
    anosDisponiveis.sort((a, b) => b - a);
  }

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  // Resumo mensal do ano selecionado
  const resumoMensal = meses.map((nomeMes, index) => {
    const doMes = historicos.filter(h => {
      const d = new Date(h.data);
      return d.getMonth() === index && d.getFullYear() === filtroAno;
    });
    const entradas = doMes.filter(h => h.tipo === 'ENTRADA').reduce((s, h) => s + h.valor, 0);
    const saidas = doMes.filter(h => h.tipo === 'SAIDA').reduce((s, h) => s + h.valor, 0);
    return { mes: nomeMes, index, entradas, saidas, saldo: entradas - saidas, registros: doMes.length };
  });

  const assinantes = users.filter(u => u.tipo_user === 'ASSINANTE' || !u.tipo_user);

  if (loading) {
    return <div className="loading">Carregando dados financeiros...</div>;
  }

  return (
    <div className="admin-financeiro-container">
      <div className="admin-section-header">
        <h2>💰 Gestão Financeira</h2>

        {/* Seletor de período */}
        <div className="periodo-selector">
          <div className="periodo-group">
            <label>Mês:</label>
            <select
              value={filtroMes}
              onChange={e => setFiltroMes(Number(e.target.value))}
            >
              {meses.map((nome, i) => (
                <option key={i} value={i}>{nome}</option>
              ))}
            </select>
          </div>
          <div className="periodo-group">
            <label>Ano:</label>
            <select
              value={filtroAno}
              onChange={e => setFiltroAno(Number(e.target.value))}
            >
              {anosDisponiveis.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <span className="periodo-label">
            📅 {meses[filtroMes]} {filtroAno}
          </span>
        </div>

        <div className="financeiro-stats">
          <div className="stat-card entrada">
            <span className="stat-icon">📈</span>
            <div>
              <span className="stat-value">{formatCurrency(totalEntradas)}</span>
              <span className="stat-label">Entradas em {meses[filtroMes]}</span>
            </div>
          </div>
          <div className="stat-card saida">
            <span className="stat-icon">📉</span>
            <div>
              <span className="stat-value">{formatCurrency(totalSaidas)}</span>
              <span className="stat-label">Saídas em {meses[filtroMes]}</span>
            </div>
          </div>
          <div className={`stat-card ${saldo >= 0 ? 'positivo' : 'negativo'}`}>
            <span className="stat-icon">💰</span>
            <div>
              <span className="stat-value">{formatCurrency(saldo)}</span>
              <span className="stat-label">Saldo de {meses[filtroMes]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="financeiro-tabs">
        <button
          className={`fin-tab ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          📋 Histórico Mensal
        </button>
        <button
          className={`fin-tab ${activeTab === 'resumo-anual' ? 'active' : ''}`}
          onClick={() => setActiveTab('resumo-anual')}
        >
          📊 Resumo Anual
        </button>
        <button
          className={`fin-tab ${activeTab === 'registrar-pagamento' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrar-pagamento')}
        >
          💳 Registrar Pagamento
        </button>
        <button
          className={`fin-tab ${activeTab === 'registrar-compra' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrar-compra')}
        >
          🛒 Registrar Compra
        </button>
      </div>

      {/* TAB: Histórico */}
      {activeTab === 'historico' && (
        <div className="tab-content">
          <div className="filtros-bar">
            <div className="filtro-group">
              <label>Tipo:</label>
              <select
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value as 'TODOS' | 'ENTRADA' | 'SAIDA')}
              >
                <option value="TODOS">Todos</option>
                <option value="ENTRADA">Entradas</option>
                <option value="SAIDA">Saídas</option>
              </select>
            </div>
            <div className="filtro-group">
              <label>Buscar usuário:</label>
              <input
                type="text"
                placeholder="Nome ou email..."
                value={filtroUsuario}
                onChange={e => setFiltroUsuario(e.target.value)}
              />
            </div>
            <span className="filtro-count">
              {filteredHistoricos.length} registro{filteredHistoricos.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="financeiro-table-container">
            <table className="financeiro-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Usuário</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistoricos.map(h => {
                  const user = getUserById(h.user_id);
                  return (
                    <tr key={h.id}>
                      <td>{formatDateTime(h.data)}</td>
                      <td>
                        <span className={`tipo-badge ${h.tipo.toLowerCase()}`}>
                          {h.tipo === 'ENTRADA' ? '📈 Entrada' : '📉 Saída'}
                        </span>
                      </td>
                      <td>
                        <div className="user-info">
                          <strong>{user?.nome || 'Desconhecido'}</strong>
                          <span className="user-email">{user?.email}</span>
                        </div>
                      </td>
                      <td className="description-cell">{h.descricao}</td>
                      <td className={`valor-cell ${h.tipo.toLowerCase()}`}>
                        {h.tipo === 'ENTRADA' ? '+' : '-'} {formatCurrency(h.valor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredHistoricos.length === 0 && (
              <div className="no-data">Nenhum registro encontrado.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Registrar Pagamento Manual */}
      {activeTab === 'resumo-anual' && (
        <div className="tab-content">
          <h3 className="resumo-titulo">📊 Resumo Mensal — {filtroAno}</h3>
          <div className="resumo-anual-table-container">
            <table className="financeiro-table resumo-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Entradas</th>
                  <th>Saídas</th>
                  <th>Saldo</th>
                  <th>Registros</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumoMensal.map(r => (
                  <tr key={r.index} className={r.registros === 0 ? 'mes-vazio' : ''}>
                    <td className="mes-nome">{r.mes}</td>
                    <td className="valor-cell entrada">{r.entradas > 0 ? `+ ${formatCurrency(r.entradas)}` : '-'}</td>
                    <td className="valor-cell saida">{r.saidas > 0 ? `- ${formatCurrency(r.saidas)}` : '-'}</td>
                    <td className={`valor-cell ${r.saldo >= 0 ? 'entrada' : 'saida'}`}>
                      {r.registros > 0 ? formatCurrency(r.saldo) : '-'}
                    </td>
                    <td className="registros-count">{r.registros}</td>
                    <td>
                      {r.registros > 0 && (
                        <button
                          className="btn-ver-mes"
                          onClick={() => {
                            setFiltroMes(r.index);
                            setActiveTab('historico');
                          }}
                        >
                          Ver detalhes →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="resumo-total-row">
                  <td><strong>Total {filtroAno}</strong></td>
                  <td className="valor-cell entrada">
                    <strong>+ {formatCurrency(resumoMensal.reduce((s, r) => s + r.entradas, 0))}</strong>
                  </td>
                  <td className="valor-cell saida">
                    <strong>- {formatCurrency(resumoMensal.reduce((s, r) => s + r.saidas, 0))}</strong>
                  </td>
                  <td className={`valor-cell ${resumoMensal.reduce((s, r) => s + r.saldo, 0) >= 0 ? 'entrada' : 'saida'}`}>
                    <strong>{formatCurrency(resumoMensal.reduce((s, r) => s + r.saldo, 0))}</strong>
                  </td>
                  <td className="registros-count">
                    <strong>{resumoMensal.reduce((s, r) => s + r.registros, 0)}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Registrar Pagamento Manual */}
      {activeTab === 'registrar-pagamento' && (
        <div className="tab-content">
          <div className="form-card">
            <h3>💳 Registrar Pagamento de Usuário</h3>
            <p className="form-description">
              Registre manualmente o pagamento de um usuário para uma pendência existente.
            </p>

            {pagSuccess && <div className="alert success">{pagSuccess}</div>}
            {pagError && <div className="alert error">{pagError}</div>}

            <form onSubmit={handleRegistrarPagamento} className="financeiro-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Usuário *</label>
                  <select
                    value={pagForm.user_id}
                    onChange={e => handlePagUserChange(e.target.value)}
                    required
                  >
                    <option value="">Selecione o usuário...</option>
                    {assinantes.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Pagamento Pendente *</label>
                  <select
                    value={pagForm.pagamento_id}
                    onChange={e => setPagForm(prev => ({ ...prev, pagamento_id: e.target.value }))}
                    required
                    disabled={!pagForm.user_id || pagUserPendentes.length === 0}
                  >
                    <option value="">
                      {!pagForm.user_id
                        ? 'Selecione um usuário primeiro'
                        : pagUserPendentes.length === 0
                          ? 'Nenhuma pendência encontrada'
                          : 'Selecione a pendência...'}
                    </option>
                    {pagUserPendentes.map(p => (
                      <option key={p.id} value={p.id}>
                        {formatCurrency(p.valor)} — {p.descricao} (venc. {formatDate(p.data_vencimento)})
                        {p.status === 'ATRASADO' ? ' ⚠️ ATRASADO' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Forma de Pagamento *</label>
                  <select
                    value={pagForm.forma_pagamento}
                    onChange={e => setPagForm(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                    required
                  >
                    <option value="CAIXA">💵 Dinheiro (Caixa)</option>
                    <option value="PIX">📱 PIX</option>
                    <option value="CARTAO">💳 Cartão</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Observação</label>
                  <input
                    type="text"
                    placeholder="Ex: Pagou em mãos na loja"
                    value={pagForm.observacao}
                    onChange={e => setPagForm(prev => ({ ...prev, observacao: e.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={pagLoading}>
                {pagLoading ? 'Registrando...' : 'Registrar Pagamento'}
              </button>
            </form>
          </div>

          {/* Resumo rápido de pendentes */}
          <div className="pendentes-resumo">
            <h4>⏳ Pagamentos Pendentes ({pagamentos.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO').length})</h4>
            <div className="pendentes-list">
              {pagamentos
                .filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO')
                .slice(0, 10)
                .map(p => {
                  const user = getUserById(p.user_id);
                  return (
                    <div key={p.id} className={`pendente-item ${p.status.toLowerCase()}`}>
                      <div className="pendente-info">
                        <strong>{user?.nome || 'Desconhecido'}</strong>
                        <span>{p.descricao}</span>
                      </div>
                      <div className="pendente-meta">
                        <span className={`status-badge small ${p.status.toLowerCase()}`}>
                          {p.status}
                        </span>
                        <span className="pendente-valor">{formatCurrency(p.valor)}</span>
                        <span className="pendente-venc">Venc: {formatDate(p.data_vencimento)}</span>
                      </div>
                    </div>
                  );
                })}
              {pagamentos.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO').length === 0 && (
                <div className="no-data small">Nenhum pagamento pendente 🎉</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Registrar Compra */}
      {activeTab === 'registrar-compra' && (
        <div className="tab-content">
          <div className="form-card">
            <h3>🛒 Registrar Compra de Item</h3>
            <p className="form-description">
              Registre a compra de um item (café, equipamento, etc.) como saída no fluxo de caixa.
            </p>

            {compraSuccess && <div className="alert success">{compraSuccess}</div>}
            {compraError && <div className="alert error">{compraError}</div>}

            <form onSubmit={handleRegistrarCompra} className="financeiro-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Usuário / Responsável *</label>
                  <select
                    value={compraForm.user_id}
                    onChange={e => setCompraForm(prev => ({ ...prev, user_id: e.target.value }))}
                    required
                  >
                    <option value="">Selecione...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    value={compraForm.data}
                    onChange={e => setCompraForm(prev => ({ ...prev, data: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={compraForm.valor}
                    onChange={e => setCompraForm(prev => ({ ...prev, valor: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descrição *</label>
                  <input
                    type="text"
                    placeholder="Ex: 10kg Café Arábica premium"
                    value={compraForm.descricao}
                    onChange={e => setCompraForm(prev => ({ ...prev, descricao: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit saida" disabled={compraLoading}>
                {compraLoading ? 'Registrando...' : 'Registrar Compra'}
              </button>
            </form>
          </div>

          {/* Últimas compras */}
          <div className="ultimas-compras">
            <h4>📦 Últimas Saídas</h4>
            <div className="compras-list">
              {historicos
                .filter(h => h.tipo === 'SAIDA')
                .slice(0, 8)
                .map(h => {
                  const user = getUserById(h.user_id);
                  return (
                    <div key={h.id} className="compra-item">
                      <div className="compra-info">
                        <strong>{h.descricao}</strong>
                        <span>{user?.nome} — {formatDate(h.data)}</span>
                      </div>
                      <span className="compra-valor">- {formatCurrency(h.valor)}</span>
                    </div>
                  );
                })}
              {historicos.filter(h => h.tipo === 'SAIDA').length === 0 && (
                <div className="no-data small">Nenhuma saída registrada.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
