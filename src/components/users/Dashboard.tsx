'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Subscription from './Subscription';
import { assinaturaService, authService, planoService } from '@/services/api';
import type { Assinatura, PlanoAssinatura } from '@/types/assinatura';
import { Badge, Button, Card, MenuButton, Skeleton } from '@/components/ui';

interface DashboardProps {
  onLogout: () => void;
}

const periodLabel: Record<string, string> = {
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeView, setActiveView] = useState<'home' | 'subscription'>('home');
  const [showPlansOnLoad, setShowPlansOnLoad] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.nome || 'Usuário';
  const userId = currentUser?.id;

  const loadData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      const [assinaturasData, planosData] = await Promise.all([
        assinaturaService.getAssinaturasByUserId(userId),
        planoService.getAllPlanos(),
      ]);
      setAssinaturas(assinaturasData);
      setPlanos(planosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeView === 'home' && userId) loadData();
  }, [activeView, userId, loadData]);

  const assinaturaAtiva = assinaturas.find((a) => a.status === 'ATIVA');
  const assinaturaPendente = assinaturas.find((a) => a.status === 'PENDENTE');
  const planoAtual = assinaturaAtiva ? planos.find((p) => p.id === assinaturaAtiva.plano_id) : null;
  const planoPendente = assinaturaPendente ? planos.find((p) => p.id === assinaturaPendente.plano_id) : null;

  return (
    <div className="min-h-screen flex bg-cream">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-soft bg-white/90 backdrop-blur px-4 py-3 md:px-8 md:py-5">
          <MenuButton open={mobileMenuOpen} onClick={() => setMobileMenuOpen((v) => !v)} />
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">Seja bem-vindo(a),</p>
            <h1 className="text-base md:text-lg font-semibold text-ink truncate">{userName}</h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-5xl w-full mx-auto">
          {activeView === 'home' && (
            <>
              {loading ? (
                <HomeSkeleton />
              ) : assinaturaAtiva && planoAtual ? (
                <Card padding="lg">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">Sua assinatura</p>
                      <h2 className="text-2xl font-bold text-ink mt-1">{planoAtual.nome}</h2>
                      {planoAtual.descricao && (
                        <p className="text-sm text-ink-soft mt-1">{planoAtual.descricao}</p>
                      )}
                    </div>
                    <Badge tone="success">Ativa</Badge>
                  </div>

                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-secondary">{fmtCurrency(planoAtual.valor)}</span>
                    <span className="text-sm text-ink-muted mb-1">/ {periodLabel[planoAtual.periodicidade]}</span>
                  </div>
                  <p className="text-sm text-ink-muted mb-6">
                    Assinante desde {fmtDate(assinaturaAtiva.data_inicio)}
                  </p>

                  <Button onClick={() => setActiveView('subscription')} fullWidth>
                    Gerenciar Assinatura
                  </Button>
                </Card>
              ) : assinaturaPendente && planoPendente ? (
                <Card padding="lg" className="border-warning/40">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
                        Assinatura pendente
                      </p>
                      <h2 className="text-2xl font-bold text-ink mt-1">{planoPendente.nome}</h2>
                      {planoPendente.descricao && (
                        <p className="text-sm text-ink-soft mt-1">{planoPendente.descricao}</p>
                      )}
                    </div>
                    <Badge tone="warning">Aguardando pagamento</Badge>
                  </div>

                  <div className="flex items-end gap-2 mb-6">
                    <span className="text-3xl font-bold text-accent-dark">{fmtCurrency(planoPendente.valor)}</span>
                    <span className="text-sm text-ink-muted mb-1">/ {periodLabel[planoPendente.periodicidade]}</span>
                  </div>

                  <Button onClick={() => setActiveView('subscription')} fullWidth size="lg">
                    💳 Pagar agora
                  </Button>
                </Card>
              ) : (
                <Card padding="lg" className="text-center">
                  <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-gray text-3xl"
                    aria-hidden="true"
                  >
                    📋
                  </div>
                  <h2 className="text-xl font-semibold text-ink mb-2">
                    Você ainda não possui uma assinatura
                  </h2>
                  <p className="text-sm text-ink-soft mb-6">
                    Assine agora e tenha acesso a todos os benefícios.
                  </p>
                  <Button
                    onClick={() => { setShowPlansOnLoad(true); setActiveView('subscription'); }}
                    size="lg"
                  >
                    Ver planos disponíveis
                  </Button>
                </Card>
              )}
            </>
          )}

          {activeView === 'subscription' && (
            <Subscription onAssinaturaChange={loadData} showFormOnLoad={showPlansOnLoad} />
          )}
        </main>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <Card padding="lg">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-4" />
      <Skeleton className="h-9 w-32 mb-2" />
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </Card>
  );
}
