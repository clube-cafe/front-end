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
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [newUser, setNewUser] = useState({ nome: '', email: '', password: '', confirmPassword: '' });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newUser.nome.trim() || !newUser.email.trim() || !newUser.password) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (newUser.password.length < 6) {
      setFormError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setFormError('As senhas não coincidem.');
      return;
    }

    try {
      setFormLoading(true);
      await userService.createUser({
        nome: newUser.nome.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
      });
      setFormSuccess(`Cliente "${newUser.nome.trim()}" cadastrado com sucesso!`);
      setNewUser({ nome: '', email: '', password: '', confirmPassword: '' });
      await loadData();
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess('');
      }, 2000);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao cadastrar cliente.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
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
        <div className="section-header-row">
          <h2>👥 Gerenciar Usuários</h2>
          <button className="add-user-btn" onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}>
            <span className="btn-icon">+</span> Novo Cliente
          </button>
        </div>
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
                    <span className={`type-badge ${(user.tipo_user ?? 'ASSINANTE').toLowerCase()}`}>
                      {user.tipo_user ?? 'ASSINANTE'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(assinatura?.status)}`}>
                      {getStatusLabel(assinatura?.status)}
                    </span>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Novo Cliente */}
      {showForm && (
        <div className="user-form-modal">
          <div className="user-form-card">
            <div className="form-header">
              <h3>Cadastrar Novo Cliente</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser}>
              {formError && <div className="form-alert error">{formError}</div>}
              {formSuccess && <div className="form-alert success">{formSuccess}</div>}

              <div className="form-group">
                <label>Nome completo *</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                  disabled={formLoading}
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Ex: joao@email.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  disabled={formLoading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Senha *</label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    disabled={formLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar Senha *</label>
                  <input
                    type="password"
                    placeholder="Repita a senha"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)} disabled={formLoading}>
                  Cancelar
                </button>
                <button type="submit" className="submit-btn" disabled={formLoading}>
                  {formLoading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}