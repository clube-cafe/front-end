import { useState, useEffect } from 'react';
import { planoService } from '../../services/api';
import type { PlanoAssinatura } from '../../types/assinatura';
import './AdminPlans.css';

export default function AdminPlans() {
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanoAssinatura | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor: '',
    periodicidade: 'MENSAL',
    ativo: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      setLoading(true);
      const data = await planoService.getAllPlanos();
      setPlanos(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nome || !formData.valor) {
      setError('Nome e valor são obrigatórios');
      return;
    }

    const valorNumerico = parseFloat(formData.valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setError('Valor deve ser um número positivo');
      return;
    }

    try {
      if (editingPlan) {
        // Atualizar plano existente
        await planoService.updatePlano(editingPlan.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          valor: valorNumerico,
          periodicidade: formData.periodicidade as any,
          ativo: formData.ativo
        });
        setSuccess('Plano atualizado com sucesso!');
      } else {
        // Criar novo plano
        await planoService.createPlano({
          nome: formData.nome,
          descricao: formData.descricao,
          valor: valorNumerico,
          periodicidade: formData.periodicidade as any,
          ativo: formData.ativo
        });
        setSuccess('Plano criado com sucesso!');
      }

      resetForm();
      loadPlanos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar plano');
    }
  };

  const handleEdit = (plano: PlanoAssinatura) => {
    setEditingPlan(plano);
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao || '',
      valor: plano.valor.toString(),
      periodicidade: plano.periodicidade,
      ativo: plano.ativo
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${nome}"?`)) return;

    try {
      await planoService.deletePlano(id);
      setSuccess('Plano deletado com sucesso!');
      loadPlanos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao deletar plano');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      valor: '',
      periodicidade: 'MENSAL',
      ativo: true
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  if (loading) {
    return <div className="loading">Carregando planos...</div>;
  }

  return (
    <div className="admin-plans-container">
      <div className="admin-section-header">
        <h2>Gerenciar Planos</h2>
        
        <div className="plans-stats">
          <div className="stat-card">
            <span className="stat-value">{planos.length}</span>
            <span className="stat-label">Total de Planos</span>
          </div>
          <div className="stat-card active">
            <span className="stat-value">{planos.filter(p => p.ativo).length}</span>
            <span className="stat-label">Planos Ativos</span>
          </div>
          <div className="stat-card inactive">
            <span className="stat-value">{planos.filter(p => !p.ativo).length}</span>
            <span className="stat-label">Planos Inativos</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="action-bar">
        <button 
          className="create-plan-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          ➕ Novo Plano
        </button>
      </div>

      {showForm && (
        <div className="plan-form-modal">
          <div className="plan-form-card">
            <div className="form-header">
              <h3>{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</h3>
              <button className="close-btn" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nome">Nome do Plano *</label>
                <input
                  type="text"
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Plano Básico"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do plano"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="valor">Valor (R$) *</label>
                  <input
                    type="number"
                    id="valor"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="35.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="periodicidade">Periodicidade *</label>
                  <select
                    id="periodicidade"
                    value={formData.periodicidade}
                    onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value })}
                    required
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  <span>Plano ativo (visível para assinantes)</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="submit-btn">
                  {editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="plans-grid">
        {planos.map(plano => (
          <div key={plano.id} className={`plan-card ${!plano.ativo ? 'inactive' : ''}`}>
            <div className="plan-card-header">
              <h3>{plano.nome}</h3>
              {!plano.ativo && <span className="inactive-badge">Inativo</span>}
            </div>

            {plano.descricao && (
              <p className="plan-description">{plano.descricao}</p>
            )}

            <div className="plan-price">
              <span className="price-value">{formatCurrency(plano.valor)}</span>
              <span className="price-period">/{getPeriodicidadeLabel(plano.periodicidade)}</span>
            </div>

            <div className="plan-info">
              <div className="info-item">
                <span className="info-label">Periodicidade:</span>
                <span className="info-value">{getPeriodicidadeLabel(plano.periodicidade)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className={`info-value ${plano.ativo ? 'active' : 'inactive'}`}>
                  {plano.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="plan-actions">
              <button 
                className="edit-btn"
                onClick={() => handleEdit(plano)}
              >
                Editar
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(plano.id, plano.nome)}
              >
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>

      {planos.length === 0 && (
        <div className="no-data">
          <p>Nenhum plano cadastrado. Clique em "Novo Plano" para começar.</p>
        </div>
      )}
    </div>
  );
}