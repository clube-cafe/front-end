import { useState, useEffect } from 'react';
import { userService, assinaturaService } from '../../services/api';
import type { User } from '../../types/user';
import type { Assinatura } from '../../types/assinatura';
import './AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, assinaturasData] = await Promise.all([
        userService.getAllUsers(),
        assinaturaService.getAllAssinaturas()
      ]);
      setUsers(usersData);
      setAssinaturas(assinaturasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserAssinatura = (userId: string) => {
    return assinaturas.find(a => a.user_id === userId && a.status !== 'CANCELADA');
  };

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return 'sem-assinatura';
    return status.toLowerCase();
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Sem Assinatura';
    const labels: { [key: string]: string } = {
      'ATIVA': 'Ativa',
      'PENDENTE': 'Pendente',
      'CANCELADA': 'Cancelada',
      'SUSPENSA': 'Suspensa'
    };
    return labels[status] || status;
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Carregando usuários...</div>;
  }

  return (
    <div className="admin-users-container">
      <div className="admin-section-header">
        <h2>👥 Gerenciar Usuários</h2>
        <div className="users-stats">
          <div className="stat-card">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total de Usuários</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {assinaturas.filter(a => a.status === 'ATIVA').length}
            </span>
            <span className="stat-label">Assinaturas Ativas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {assinaturas.filter(a => a.status === 'PENDENTE').length}
            </span>
            <span className="stat-label">Pendentes</span>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Status Assinatura</th>
              <th>Data Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const assinatura = getUserAssinatura(user.id);
              return (
                <tr key={user.id}>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`type-badge ${user.tipo_user.toLowerCase()}`}>
                      {user.tipo_user}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(assinatura?.status)}`}>
                      {getStatusLabel(assinatura?.status)}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}