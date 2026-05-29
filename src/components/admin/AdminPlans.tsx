'use client';

import { useState, useEffect, useCallback } from 'react';
import { planoService } from '@/services/api';
import type { PlanoAssinatura } from '@/types/assinatura';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Alert, Badge, Button, Card, Input, Modal, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

type Periodicidade = PlanoAssinatura['periodicidade'];

const periodLabel: Record<string, string> = {
  MENSAL: 'Mensal', TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual',
};
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function AdminPlans() {
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', descricao: '', valor: '', periodicidade: 'MENSAL', ativo: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; plano: PlanoAssinatura | null }>({ show: false, plano: null });

  const loadPlanos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await planoService.getAllPlanos();
      setPlanos(data);
    } catch (e) {
      console.error('Erro ao carregar planos:', e);
      setError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPlanos(); }, [loadPlanos]);

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', valor: '', periodicidade: 'MENSAL', ativo: true });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

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
      await planoService.createPlano({
        nome: formData.nome,
        descricao: formData.descricao,
        valor: valorNumerico,
        periodicidade: formData.periodicidade as Periodicidade,
        ativo: formData.ativo,
      });
      setSuccess('Plano criado com sucesso!');
      resetForm();
      loadPlanos();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Erro ao salvar plano');
    }
  };

  const confirmToggleAtivo = async () => {
    const plano = confirmModal.plano;
    setConfirmModal({ show: false, plano: null });
    if (!plano) return;
    const novoStatus = !plano.ativo;
    try {
      await planoService.updatePlano(plano.id, { ativo: novoStatus });
      setSuccess(`Plano ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
      loadPlanos();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || `Erro ao ${novoStatus ? 'ativar' : 'desativar'} plano`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-ink">Planos</h2>
          <p className="text-sm text-ink-soft">Crie, ative e desative planos de assinatura</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Novo plano</Button>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <Stat label="Total" value={planos.length} />
        <Stat label="Ativos" value={planos.filter((p) => p.ativo).length} tone="success" />
        <Stat label="Inativos" value={planos.filter((p) => !p.ativo).length} tone="neutral" />
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {planos.map((plano) => (
          <Card
            key={plano.id}
            padding="lg"
            className={cn('flex flex-col', !plano.ativo && 'opacity-60')}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-ink">{plano.nome}</h3>
              <Badge tone={plano.ativo ? 'success' : 'neutral'}>
                {plano.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            {plano.descricao && (
              <p className="text-sm text-ink-soft mb-3">{plano.descricao}</p>
            )}

            <div className="flex items-end gap-1 mb-4">
              <span className="text-2xl font-bold text-secondary">{fmtCurrency(plano.valor)}</span>
              <span className="text-xs text-ink-muted mb-1">/ {periodLabel[plano.periodicidade]}</span>
            </div>

            <div className="mt-auto">
              <Button
                variant={plano.ativo ? 'secondary' : 'success'}
                onClick={() => setConfirmModal({ show: true, plano })}
                fullWidth
                size="sm"
              >
                {plano.ativo ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {planos.length === 0 && (
        <Card padding="lg" className="text-center text-sm text-ink-muted">
          Nenhum plano cadastrado. Clique em &quot;Novo plano&quot; para começar.
        </Card>
      )}

      <Modal
        open={showForm}
        onClose={resetForm}
        title="Criar novo plano"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>Cancelar</Button>
            <Button form="plan-form" type="submit">Criar plano</Button>
          </>
        }
      >
        <form id="plan-form" onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Nome do plano *"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Ex: Plano Básico"
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft" htmlFor="plano-descricao">
              Descrição
            </label>
            <textarea
              id="plano-descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do plano"
              rows={3}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary resize-y"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Valor (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="35.00"
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-soft" htmlFor="periodicidade">
                Periodicidade *
              </label>
              <select
                id="periodicidade"
                value={formData.periodicidade}
                onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value })}
                className="h-11 rounded-lg border border-border bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                required
              >
                <option value="MENSAL">Mensal</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            />
            <span className="text-sm text-ink-soft">Plano ativo (visível para assinantes)</span>
          </label>
        </form>
      </Modal>

      {confirmModal.show && confirmModal.plano && (
        <ConfirmModal
          icon={confirmModal.plano.ativo ? '⏸️' : '▶️'}
          title={confirmModal.plano.ativo ? 'Desativar plano' : 'Ativar plano'}
          message={`Tem certeza que deseja ${confirmModal.plano.ativo ? 'desativar' : 'ativar'} o plano "${confirmModal.plano.nome}"?`}
          confirmText={confirmModal.plano.ativo ? 'Desativar' : 'Ativar'}
          cancelText="Cancelar"
          variant={confirmModal.plano.ativo ? 'danger' : 'success'}
          onConfirm={confirmToggleAtivo}
          onCancel={() => setConfirmModal({ show: false, plano: null })}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'success' | 'warning' }) {
  const ring = tone === 'success' ? 'ring-success/20' : tone === 'warning' ? 'ring-accent/30' : 'ring-border';
  return (
    <Card padding="md" className={`ring-1 ${ring}`}>
      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">{label}</p>
      <p className="text-2xl font-bold text-ink mt-1">{value}</p>
    </Card>
  );
}
