'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { assinaturaService, planoService, pagamentoService } from '@/services/api';
import type { Assinatura, PlanoAssinatura } from '@/types/assinatura';
import { authService } from '@/services/api';
import PaymentModal from './PaymentModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Alert, Badge, Button, Card, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

interface SubscriptionProps {
  onAssinaturaChange?: () => void;
  showFormOnLoad?: boolean;
}

const periodLabel: Record<string, string> = {
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

const statusLabel: Record<string, string> = {
  ATIVA: 'Ativa',
  CANCELADA: 'Cancelada',
  SUSPENSA: 'Suspensa',
  PENDENTE: 'Pendente',
};

const statusTone = (status: string) => {
  if (status === 'ATIVA') return 'success' as const;
  if (status === 'PENDENTE') return 'warning' as const;
  if (status === 'SUSPENSA') return 'neutral' as const;
  return 'danger' as const;
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

export default function Subscription({ onAssinaturaChange, showFormOnLoad = false }: SubscriptionProps) {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(showFormOnLoad);
  const [formData, setFormData] = useState({ plano_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; id: string }>({ show: false, id: '' });
  const [pendingPayment, setPendingPayment] = useState<{ id: string; valor: number } | null>(null);

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;

  const loadAssinaturas = useCallback(async () => {
    try {
      const response = await api.get<Assinatura[]>(`/assinaturas/user/${userId}`);
      const ordenadas = response.data.sort((a, b) => {
        const prio: Record<string, number> = { ATIVA: 1, PENDENTE: 2, SUSPENSA: 3, CANCELADA: 4 };
        return (prio[a.status] || 5) - (prio[b.status] || 5);
      });
      setAssinaturas(ordenadas);
    } catch (e) {
      console.error('Erro ao carregar assinaturas:', e);
    }
  }, [userId]);

  const loadPlanos = useCallback(async () => {
    try {
      const data = await planoService.getAllPlanos();
      setPlanos(data);
    } catch (e) {
      console.error('Erro ao carregar planos:', e);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadAssinaturas(), loadPlanos()]);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [loadAssinaturas, loadPlanos]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (assinaturas.some((a) => a.status === 'ATIVA')) {
      setError('Você já possui uma assinatura ativa. Cancele-a antes de criar uma nova.');
      return;
    }
    if (!formData.plano_id) {
      setError('Por favor, selecione um plano');
      return;
    }

    try {
      setLoading(true);
      const response = (await assinaturaService.createAssinatura({
        user_id: userId!,
        plano_id: formData.plano_id,
      })) as unknown as { pagamento?: { id: string; valor: number } };

      if (response.pagamento) {
        setPendingPayment({ id: response.pagamento.id, valor: response.pagamento.valor });
        setShowPaymentModal(true);
        setShowForm(false);
      } else {
        setError('Erro: Pagamento não foi criado');
      }
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
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
      const pagamentos = await pagamentoService.getPagamentosByUserId(userId!);
      const pendente = pagamentos.find(
        (p) => p.status === 'PENDENTE' && p.assinatura_id === assinatura.id
      );

      if (!pendente) {
        setError('Pagamento pendente não encontrado. Entre em contato com o suporte.');
        return;
      }

      setPendingPayment({ id: pendente.id, valor: pendente.valor });
      setShowPaymentModal(true);
    } catch (err) {
      console.error('Erro ao buscar pagamento:', err);
      setError('Erro ao buscar pagamento pendente');
    }
  };

  const handleCancelar = (id: string) => setConfirmModal({ show: true, id });

  const confirmCancelar = async () => {
    const id = confirmModal.id;
    setConfirmModal({ show: false, id: '' });
    try {
      await assinaturaService.cancelarAssinatura(id);
      setSuccess('Assinatura cancelada com sucesso!');
      loadAssinaturas();
      onAssinaturaChange?.();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Erro ao cancelar assinatura');
    }
  };

  const getPlanoById = (id: string) => planos.find((p) => p.id === id);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const hasActiveOrPending = assinaturas.some((a) => a.status === 'ATIVA' || a.status === 'PENDENTE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-ink">Minhas assinaturas</h2>
          <p className="text-sm text-ink-soft">Gerencie suas assinaturas e pagamentos</p>
        </div>
        <Button
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => setShowForm(!showForm)}
          disabled={hasActiveOrPending}
        >
          {showForm ? '✕ Cancelar' : '+ Nova assinatura'}
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      {showForm && (
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-ink mb-1">Escolha seu plano</h3>
          <p className="text-sm text-ink-soft mb-5">Toque em um plano para selecioná-lo</p>

          {planos.length === 0 ? (
            <p className="text-center text-sm text-ink-muted py-8">
              Nenhum plano disponível no momento.
            </p>
          ) : (
            <>
              <div
                role="radiogroup"
                aria-label="Planos disponíveis"
                className="grid gap-3 sm:grid-cols-2"
              >
                {planos.map((plano) => {
                  const selected = formData.plano_id === plano.id;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={plano.id}
                      onClick={() => setFormData({ ...formData, plano_id: plano.id })}
                      className={cn(
                        'relative text-left rounded-xl border-2 p-4 transition-all',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary',
                        selected
                          ? 'border-secondary bg-secondary/5 shadow-md'
                          : 'border-border-soft bg-white hover:border-secondary/50 hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-ink">{plano.nome}</h4>
                          {plano.descricao && (
                            <p className="text-xs text-ink-soft mt-0.5">{plano.descricao}</p>
                          )}
                        </div>
                        {selected && (
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-white text-xs font-bold"
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-end gap-1">
                        <span className="text-2xl font-bold text-secondary">{fmtCurrency(plano.valor)}</span>
                        <span className="text-xs text-ink-muted mb-1">
                          / {periodLabel[plano.periodicidade]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="mt-5">
                <Button type="submit" disabled={!formData.plano_id} loading={loading} fullWidth size="lg">
                  Confirmar assinatura
                </Button>
              </form>
            </>
          )}
        </Card>
      )}

      <div className="space-y-3">
        {assinaturas.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="text-3xl mb-2" aria-hidden="true">📋</div>
            <h3 className="font-semibold text-ink mb-1">Nenhuma assinatura</h3>
            <p className="text-sm text-ink-soft">
              Clique em &quot;Nova assinatura&quot; para começar
            </p>
          </Card>
        ) : (
          assinaturas.map((assinatura) => {
            const plano = getPlanoById(assinatura.plano_id);
            return (
              <Card key={assinatura.id} padding="md">
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink">{plano?.nome || 'Plano não encontrado'}</h3>
                    {plano?.descricao && (
                      <p className="text-xs text-ink-soft mt-0.5">{plano.descricao}</p>
                    )}
                  </div>
                  <Badge tone={statusTone(assinatura.status)}>{statusLabel[assinatura.status]}</Badge>
                </div>

                {plano && (
                  <div className="flex items-end gap-1 mb-3">
                    <span className="text-xl font-bold text-secondary">{fmtCurrency(plano.valor)}</span>
                    <span className="text-xs text-ink-muted mb-0.5">
                      / {periodLabel[plano.periodicidade]}
                    </span>
                  </div>
                )}

                <dl className="grid gap-1 text-xs text-ink-soft mb-4 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-ink-muted">Início</dt>
                    <dd>{fmtDate(assinatura.data_inicio)}</dd>
                  </div>
                  {plano && (
                    <div>
                      <dt className="font-medium text-ink-muted">Periodicidade</dt>
                      <dd>{periodLabel[plano.periodicidade]}</dd>
                    </div>
                  )}
                </dl>

                <div className="flex gap-2 flex-wrap">
                  {assinatura.status === 'PENDENTE' && (
                    <Button
                      onClick={() => handlePayPendingSubscription(assinatura)}
                      size="sm"
                    >
                      💳 Pagar
                    </Button>
                  )}
                  {assinatura.status === 'ATIVA' && (
                    <Button
                      variant="danger"
                      onClick={() => handleCancelar(assinatura.id)}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
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

      {confirmModal.show && (
        <ConfirmModal
          icon="⚠️"
          title="Cancelar assinatura"
          message="Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita."
          confirmText="Sim, cancelar"
          cancelText="Não, manter"
          variant="danger"
          onConfirm={confirmCancelar}
          onCancel={() => setConfirmModal({ show: false, id: '' })}
        />
      )}
    </div>
  );
}
