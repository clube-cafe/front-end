import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Subscription from './Subscription';
import { assinaturaService, authService, planoService } from '../../services/api';
import type { Assinatura, PlanoAssinatura } from '../../types/assinatura';
import './Dashboard.css';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeView, setActiveView] = useState<'home' | 'subscription'>('home');
  const [loading, setLoading] = useState(true);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  
  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.nome || 'Usuário';
  const userId = currentUser?.id;

  useEffect(() => {
    if (activeView === 'home' && userId) {
      loadData();
    }
  }, [activeView, userId]);

  const loadData = async () => {
    if (!userId) {
      console.log('Aguardando userId...');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [assinaturasData, planosData] = await Promise.all([
        assinaturaService.getAssinaturasByUserId(userId),
        planoService.getAllPlanos()
      ]);
      
      setAssinaturas(assinaturasData);
      setPlanos(planosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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

  const getAssinaturaAtiva = () => {
    return assinaturas.find(a => a.status === 'ATIVA');
  };

  const getAssinaturaPendente = () => {
    return assinaturas.find(a => a.status === 'PENDENTE');
  };

  const getPlanoById = (planoId: string) => {
    return planos.find(p => p.id === planoId);
  };

  const assinaturaAtiva = getAssinaturaAtiva();
  const assinaturaPendente = getAssinaturaPendente();
  const planoAtual = assinaturaAtiva ? getPlanoById(assinaturaAtiva.plano_id) : null;
  const planoPendente = assinaturaPendente ? getPlanoById(assinaturaPendente.plano_id) : null;

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        onLogout={onLogout}
      />
      
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Seja bem-vindo(a),</h1>
          <h2>{userName}</h2>
        </header>

        {activeView === 'home' && (
          <>
            {loading ? (
              <div className="loading">Carregando...</div>
            ) : (
              <div className="home-section">
                {/* Assinatura Ativa */}
                {assinaturaAtiva && planoAtual ? (
                  <div className="subscription-overview">
                    <div className="subscription-header-overview">
                      <h3>📋 Sua Assinatura</h3>
                      <span className="status-badge active">Ativa</span>
                    </div>
                    
                    <div className="subscription-info">
                      <div className="subscription-plan-name">
                        <strong>{planoAtual.nome}</strong>
                      </div>
                      {planoAtual.descricao && (
                        <div className="subscription-plan-description">
                          {planoAtual.descricao}
                        </div>
                      )}
                      <div className="subscription-value">
                        {formatCurrency(planoAtual.valor)}
                        <span className="subscription-period">
                          /{getPeriodicidadeLabel(planoAtual.periodicidade)}
                        </span>
                      </div>
                      <div className="subscription-start-date">
                        Assinante desde {formatDate(assinaturaAtiva.data_inicio)}
                      </div>
                    </div>

                    <button 
                      className="manage-subscription-btn"
                      onClick={() => setActiveView('subscription')}
                    >
                      Gerenciar Assinatura
                    </button>
                  </div>
                ) : assinaturaPendente && planoPendente ? (
                  /* Assinatura Pendente */
                  <div className="subscription-overview pending">
                    <div className="subscription-header-overview">
                      <h3>⏳ Assinatura Pendente</h3>
                      <span className="status-badge pending">Aguardando Pagamento</span>
                    </div>
                    
                    <div className="subscription-info">
                      <div className="subscription-plan-name">
                        <strong>{planoPendente.nome}</strong>
                      </div>
                      {planoPendente.descricao && (
                        <div className="subscription-plan-description">
                          {planoPendente.descricao}
                        </div>
                      )}
                      <div className="subscription-value">
                        {formatCurrency(planoPendente.valor)}
                        <span className="subscription-period">
                          /{getPeriodicidadeLabel(planoPendente.periodicidade)}
                        </span>
                      </div>
                    </div>

                    <button 
                      className="pay-subscription-btn"
                      onClick={() => setActiveView('subscription')}
                    >
                      💳 Pagar Agora
                    </button>
                  </div>
                ) : (
                  /* Sem Assinatura */
                  <div className="no-subscription">
                    <div className="no-subscription-icon">📋</div>
                    <h3>Você ainda não possui uma assinatura</h3>
                    <p>Assine agora e tenha acesso a todos os benefícios!</p>
                    <button 
                      className="subscribe-now-btn"
                      onClick={() => setActiveView('subscription')}
                    >
                      Ver Planos Disponíveis
                    </button>
                  </div>
                )}

                <div className="useful-links">
                  <h3>Links úteis</h3>
                  <div className="links-grid">
                    <button className="link-btn">
                      <span>💬</span> CHAT
                    </button>
                    <button className="link-btn">
                      <span>📘</span> FACEBOOK
                    </button>
                    <button className="link-btn">
                      <span>📷</span> INSTAGRAM
                    </button>
                    <button className="link-btn">
                      <span>🌐</span> SITE
                    </button>
                    <button className="link-btn">
                      <span>📄</span> CONTRATOS
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeView === 'subscription' && <Subscription onAssinaturaChange={loadData} />}
      </div>
    </div>
  );
}