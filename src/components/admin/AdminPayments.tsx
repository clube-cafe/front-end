import { useState, useEffect } from 'react';
import { pagamentoService, userService, pagamentoPendenteService } from '../../services/api';
import type { Pagamento, PagamentoPendente } from '../../types/payments';
import type { User } from '../../types/user';
import './AdminPayments.css';

export default function AdminPayments() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [pendentes, setPendentes] = useState<PagamentoPendente[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'realizados' | 'pendentes'>('realizados');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pagamentosData, pendentesData, usersData] = await Promise.all([
        pagamentoService.getAllPagamentos(),
        pagamentoPendenteService.getAllPagamentosPendentes(),
        userService.getAllUsers()
      ]);
      
      setPagamentos(pagamentosData);
      setPendentes(pendentesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'PENDENTE': 'Pendente',
      'ATRASADO': 'Atrasado',
      'PAGO': 'Pago',
      'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getTotalPagamentos = () => {
    return pagamentos.reduce((sum, p) => sum + p.valor, 0);
  };

  const getTotalPendentes = () => {
    return pendentes
      .filter(p => p.status === 'PENDENTE')
      .reduce((sum, p) => sum + p.valor, 0);
  };

  if (loading) {
    return <div className="loading">Carregando pagamentos...</div>;
  }

  return (
    <div className="admin-payments-container">
      <div className="admin-section-header">
        <h2>Gerenciar Pagamentos</h2>
        
        <div className="payments-stats">
          <div className="stat-card success">
            <span className="stat-value">{pagamentos.length}</span>
            <span className="stat-label">Pagamentos Realizados</span>
            <span className="stat-total">{formatCurrency(getTotalPagamentos())}</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-value">
              {pendentes.filter(p => p.status === 'PENDENTE').length}
            </span>
            <span className="stat-label">Pagamentos Pendentes</span>
            <span className="stat-total">{formatCurrency(getTotalPendentes())}</span>
          </div>
          <div className="stat-card danger">
            <span className="stat-value">
              {pendentes.filter(p => p.status === 'ATRASADO').length}
            </span>
            <span className="stat-label">Pagamentos Atrasados</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'realizados' ? 'active' : ''}`}
          onClick={() => setActiveTab('realizados')}
        >
          Pagamentos Realizados ({pagamentos.length})
        </button>
        <button
          className={`tab ${activeTab === 'pendentes' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendentes')}
        >
          Pagamentos Pendentes ({pendentes.length})
        </button>
      </div>

      {activeTab === 'realizados' ? (
        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Valor</th>
                <th>Forma de Pagamento</th>
                <th>Data do Pagamento</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map(pagamento => {
                const user = getUserById(pagamento.user_id);
                
                return (
                  <tr key={pagamento.id}>
                    <td>
                      <div className="user-info">
                        <strong>{user?.nome || 'Usuário não encontrado'}</strong>
                        <span className="user-email">{user?.email}</span>
                      </div>
                    </td>
                    <td className="value-cell">{formatCurrency(pagamento.valor)}</td>
                    <td>
                      <span className="payment-method">{pagamento.forma_pagamento}</span>
                    </td>
                    <td>{formatDateTime(pagamento.data_pagamento)}</td>
                    <td className="observation">{pagamento.observacao || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pagamentos.length === 0 && (
            <div className="no-data">
              <p>Nenhum pagamento realizado ainda.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data Vencimento</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map(pendente => {
                const user = getUserById(pendente.user_id);
                const isVencido = new Date(pendente.data_vencimento) < new Date();
                
                return (
                  <tr key={pendente.id} className={isVencido ? 'overdue' : ''}>
                    <td>
                      <div className="user-info">
                        <strong>{user?.nome || 'Usuário não encontrado'}</strong>
                        <span className="user-email">{user?.email}</span>
                      </div>
                    </td>
                    <td className="value-cell">{formatCurrency(pendente.valor)}</td>
                    <td>
                      <span className={`status-badge ${pendente.status.toLowerCase()}`}>
                        {getStatusLabel(pendente.status)}
                      </span>
                    </td>
                    <td>
                      {formatDate(pendente.data_vencimento)}
                      {isVencido && <span className="overdue-label"> (Vencido)</span>}
                    </td>
                    <td className="description">{pendente.descricao}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pendentes.length === 0 && (
            <div className="no-data">
              <p>Nenhum pagamento pendente.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}