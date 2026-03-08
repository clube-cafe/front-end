import { useState, useEffect } from 'react';
import api, { assinaturaService, planoService, pagamentoService } from '../../services/api';
import type { Assinatura, PlanoAssinatura } from '../../types/assinatura';
import './Subscription.css';
import { authService } from '../../services/api';
import PaymentModal from './PaymentModal';

interface SubscriptionProps {
  onAssinaturaChange?: () => void;
}

export default function Subscription({ onAssinaturaChange }: SubscriptionProps) {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    plano_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    id: string;
    valor: number;
  } | null>(null);

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAssinaturas(),
        loadPlanos()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadAssinaturas = async () => {
    try {
      const response = await api.get(`/assinaturas/user/${userId}`);
      
      const assinaturasOrdenadas = response.data.sort((a: Assinatura, b: Assinatura) => {
        const prioridade: { [key: string]: number } = {
          'ATIVA': 1,
          'PENDENTE': 2,
          'SUSPENSA': 3,
          'CANCELADA': 4
        };
        
        return (prioridade[a.status] || 5) - (prioridade[b.status] || 5);
      });
      
      setAssinaturas(assinaturasOrdenadas);
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    }
  };

  const loadPlanos = async () => {
    try {
      const data = await planoService.getAllPlanos();
      setPlanos(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    const assinaturasAtivas = assinaturas.filter(a => a.status === 'ATIVA');
    if (assinaturasAtivas.length > 0) {
      setError('Você já possui uma assinatura ativa. Cancele-a antes de criar uma nova.');
      return;
    }
  
    if (!formData.plano_id) {
      setError('Por favor, selecione um plano');
      return;
    }
  
    try {
      setLoading(true);
      
      const response: any = await assinaturaService.createAssinatura({
        user_id: userId!,
        plano_id: formData.plano_id
      });
  
      console.log('Resposta da API:', response);
  
      if (response.pagamento) {
        setPendingPayment({
          id: response.pagamento.id,
          valor: response.pagamento.valor
        });
        
        setShowPaymentModal(true);
        setShowForm(false);
      } else {
        setError('Erro: Pagamento não foi criado');
      }
    } catch (err: any) {
      console.error('Erro ao criar assinatura:', err);
      setError(err.response?.data?.message || 'Erro ao criar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPendingPayment(null);
    setSuccess('Pagamento confirmado! Assinatura ativada.');
    setFormData({ plano_id: '' });
    loadAssinaturas();
    onAssinaturaChange?.();
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPendingPayment(null);
    loadAssinaturas();
  };

  const handlePayPendingSubscription = async (assinatura: Assinatura) => {
    try {
      setError('');
      
      // Buscar pagamentos do usuário
      const pagamentos = await pagamentoService.getPagamentosByUserId(userId!);
      
      console.log('Pagamentos encontrados:', pagamentos);
      console.log('Procurando pagamento pendente para assinatura:', assinatura.id);
      
      const pagamentoPendente = pagamentos.find(p => 
        p.status === 'PENDENTE' && 
        p.assinatura_id === assinatura.id 
      );
      
      if (!pagamentoPendente) {
        console.error('Nenhum pagamento pendente encontrado.');
        console.error('Assinatura ID procurado:', assinatura.id);
        console.error('Pagamentos disponíveis:', pagamentos);
        setError('Pagamento pendente não encontrado. Entre em contato com o suporte.');
        return;
      }
      
      console.log('Pagamento pendente encontrado:', pagamentoPendente);
      
      setPendingPayment({
        id: pagamentoPendente.id,
        valor: pagamentoPendente.valor
      });
      
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error('Erro ao buscar pagamento:', err);
      setError('Erro ao buscar pagamento pendente');
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) return;

    try {
      await assinaturaService.cancelarAssinatura(id);
      setSuccess('Assinatura cancelada com sucesso!');
      loadAssinaturas();
      onAssinaturaChange?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cancelar assinatura');
    }
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

  const getPeriodicidadeLabel = (periodicidade: string) => {
    const labels: { [key: string]: string } = {
      'MENSAL': 'Mensal',
      'TRIMESTRAL': 'Trimestral',
      'SEMESTRAL': 'Semestral',
      'ANUAL': 'Anual'
    };
    return labels[periodicidade] || periodicidade;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'ATIVA': 'Ativa',
      'CANCELADA': 'Cancelada',
      'SUSPENSA': 'Suspensa',
      'PENDENTE': 'Pendente'
    };
    return labels[status] || status;
  };

  const getPlanoById = (plano_id: string) => {
    return planos.find(p => p.id === plano_id);
  };

  if (loading) {
    return <div className="loading">Carregando assinaturas...</div>;
  }

  const hasActiveOrPending = assinaturas.some(a => a.status === 'ATIVA' || a.status === 'PENDENTE');

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <h2>Minhas Assinaturas</h2>
        <button 
          className="new-subscription-btn"
          onClick={() => setShowForm(!showForm)}
          disabled={hasActiveOrPending}
        >
          {showForm ? '✕ Cancelar' : '+ Nova Assinatura'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="subscription-form-card">
          <h3>Escolha seu Plano</h3>
          
          <div className="planos-grid">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className={`plano-card ${formData.plano_id === plano.id ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, plano_id: plano.id })}
              >
                <div className="plano-header">
                  <h4>{plano.nome}</h4>
                  {plano.descricao && (
                    <p className="plano-description">{plano.descricao}</p>
                  )}
                </div>
                <div className="plano-price">
                  <span className="price-value">{formatCurrency(plano.valor)}</span>
                  <span className="price-period">/{getPeriodicidadeLabel(plano.periodicidade)}</span>
                </div>
                <div className="plano-periodicidade">
                  Cobrança {getPeriodicidadeLabel(plano.periodicidade)}
                </div>
                {formData.plano_id === plano.id && (
                  <div className="selected-badge">✓ Selecionado</div>
                )}
              </div>
            ))}
          </div>

          {planos.length === 0 && (
            <div className="no-planos">
              <p>Nenhum plano disponível no momento.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="subscription-form">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={!formData.plano_id || loading}
            >
              {loading ? 'Processando...' : 'Confirmar Assinatura'}
            </button>
          </form>
        </div>
      )}

      <div className="subscriptions-list">
        {assinaturas.length === 0 ? (
          <div className="no-data">
            <h3>📋 Nenhuma assinatura encontrada</h3>
            <p>Clique em "Nova Assinatura" para começar</p>
          </div>
        ) : (
          assinaturas.map((assinatura) => {
            const plano = getPlanoById(assinatura.plano_id);
            return (
              <div key={assinatura.id} className="subscription-card">
                <div className="subscription-header-info">
                  <div className="subscription-title">
                    <h3>{plano?.nome || 'Plano não encontrado'}</h3>
                    {plano?.descricao && (
                      <p className="subscription-description">{plano.descricao}</p>
                    )}
                  </div>
                  <span className={`status-badge ${assinatura.status.toLowerCase()}`}>
                    {getStatusLabel(assinatura.status)}
                  </span>
                </div>

                <div className="subscription-value">
                  {plano && formatCurrency(plano.valor)}
                  <span className="periodicidade">
                    /{plano && getPeriodicidadeLabel(plano.periodicidade)}
                  </span>
                </div>

                <div className="subscription-details">
                  <div className="detail-item">
                    <span className="detail-label">📅 Início:</span>
                    <span className="detail-value">{formatDate(assinatura.data_inicio)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">🔄 Periodicidade:</span>
                    <span className="detail-value">
                      {plano && getPeriodicidadeLabel(plano.periodicidade)}
                    </span>
                  </div>
                </div>

                <div className="subscription-actions">
                  {assinatura.status === 'PENDENTE' && (
                    <button 
                      className="pay-btn"
                      onClick={() => handlePayPendingSubscription(assinatura)}
                    >
                      💳 Pagar Assinatura
                    </button>
                  )}
                  
                  {assinatura.status === 'ATIVA' && (
                    <button 
                      className="delete-btn"
                      onClick={() => handleCancelar(assinatura.id)}
                    >
                      🗑️ Cancelar Assinatura
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showPaymentModal && pendingPayment && (
        <PaymentModal
          pagamentoId={pendingPayment.id}
          valor={pendingPayment.valor}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}