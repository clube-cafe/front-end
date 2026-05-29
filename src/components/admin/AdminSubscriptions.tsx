'use client';

import { useState, useEffect, useCallback } from 'react';
import { assinaturaService, planoService, userService } from '@/services/api';
import type { Assinatura, PlanoAssinatura } from '@/types/assinatura';
import type { User } from '@/types/user';
import './AdminSubscriptions.css';

export default function AdminSubscriptions() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assinaturasData, planosData, usersData] = await Promise.all([
        assinaturaService.getAllAssinaturas(),
        planoService.getAllPlanos(),
        userService.getAllUsers()
      ]);

      const assinaturasOrdenadas = assinaturasData.sort((a, b) => {
        const prioridade: { [key: string]: number } = {
          'ATIVA': 1,
          'PENDENTE': 2,
          'SUSPENSA': 3,
          'CANCELADA': 4
        };
        return (prioridade[a.status] || 5) - (prioridade[b.status] || 5);
      });

      setAssinaturas(assinaturasOrdenadas);
      setPlanos(planosData);
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

  const getPlanoById = (planoId: string) => {
    return planos.find(p => p.id === planoId);
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

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'ATIVA': 'Ativa',
      'PENDENTE': 'Pendente',
      'CANCELADA': 'Cancelada',
      'SUSPENSA': 'Suspensa'
    };
    return labels[status] || status;
  };

  const getPeriodicidadeLabel = (periodicidade: string) => {
    const labels: { [key: string]: string } = {
      'MENSAL': 'Mensal',
      'TRIMESTRAL': 'Trimestral',
      'SEMESTRAL': 'Semestral',
      'ANUAL': 'Anual'
    };
    return labels[periodicidade] || periodicidade;
  };

  const filteredAssinaturas = filterStatus === 'ALL' 
    ? assinaturas 
    : assinaturas.filter(a => a.status === filterStatus);

  const stats = {
    total: assinaturas.length,
    ativas: assinaturas.filter(a => a.status === 'ATIVA').length,
    pendentes: assinaturas.filter(a => a.status === 'PENDENTE').length,
    canceladas: assinaturas.filter(a => a.status === 'CANCELADA').length
  };

  if (loading) {
    return <div className="loading">Carregando assinaturas...</div>;
  }

  return (
    <div className="admin-subscriptions-container">
      <div className="admin-section-header">
        <h2>Gerenciar Assinaturas</h2>
        
        <div className="subscriptions-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card active">
            <span className="stat-value">{stats.ativas}</span>
            <span className="stat-label">Ativas</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-value">{stats.pendentes}</span>
            <span className="stat-label">Pendentes</span>
          </div>
          <div className="stat-card canceled">
            <span className="stat-value">{stats.canceladas}</span>
            <span className="stat-label">Canceladas</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <label>Filtrar por status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">Todos</option>
          <option value="ATIVA">Ativas</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="SUSPENSA">Suspensas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
      </div>

      <div className="subscriptions-table-container">
        <table className="subscriptions-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Plano</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data Início</th>
              <th>Periodicidade</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssinaturas.map(assinatura => {
              const plano = getPlanoById(assinatura.plano_id);
              const user = getUserById(assinatura.user_id);
              
              return (
                <tr key={assinatura.id}>
                  <td>
                    <div className="user-info">
                      <strong>{user?.nome || 'Usuário não encontrado'}</strong>
                      <span className="user-email">{user?.email}</span>
                    </div>
                  </td>
                  <td>{plano?.nome || 'Plano não encontrado'}</td>
                  <td className="value-cell">
                    {plano && formatCurrency(plano.valor)}
                  </td>
                  <td>
                    <span className={`status-badge ${assinatura.status.toLowerCase()}`}>
                      {getStatusLabel(assinatura.status)}
                    </span>
                  </td>
                  <td>{formatDate(assinatura.data_inicio)}</td>
                  <td>{plano && getPeriodicidadeLabel(plano.periodicidade)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAssinaturas.length === 0 && (
          <div className="no-data">
            <p>Nenhuma assinatura encontrada com este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
}