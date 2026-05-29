'use client';

import { useState, useEffect, useCallback } from 'react';
import { userService, assinaturaService } from '@/services/api';
import type { User } from '@/types/user';
import type { Assinatura } from '@/types/assinatura';
import { Alert, Badge, Button, Card, Input, Modal, Skeleton } from '@/components/ui';

const statusTone = (status?: string) => {
  if (!status) return 'neutral' as const;
  if (status === 'ATIVA') return 'success' as const;
  if (status === 'PENDENTE') return 'warning' as const;
  if (status === 'SUSPENSA') return 'neutral' as const;
  return 'danger' as const;
};

const statusLabel = (status?: string) => {
  if (!status) return 'Sem assinatura';
  const map: Record<string, string> = {
    ATIVA: 'Ativa',
    PENDENTE: 'Pendente',
    CANCELADA: 'Cancelada',
    SUSPENSA: 'Suspensa',
  };
  return map[status] || status;
};

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, assinaturasData] = await Promise.all([
        userService.getAllUsers(),
        assinaturaService.getAllAssinaturas(),
      ]);
      setUsers(usersData);
      setAssinaturas(assinaturasData);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');

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
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 1500);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Erro ao cadastrar cliente.');
    } finally {
      setFormLoading(false);
    }
  };

  const getUserAssinatura = (userId: string) =>
    assinaturas.find((a) => a.user_id === userId && a.status !== 'CANCELADA');

  const filteredUsers = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-ink">Usuários</h2>
          <p className="text-sm text-ink-soft">Cadastre e visualize todos os clientes</p>
        </div>
        <Button onClick={() => { setShowForm(true); setFormError(''); setFormSuccess(''); }}>
          + Novo cliente
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <StatCard label="Total" value={users.length} />
        <StatCard label="Ativas" value={assinaturas.filter((a) => a.status === 'ATIVA').length} tone="success" />
        <StatCard label="Pendentes" value={assinaturas.filter((a) => a.status === 'PENDENTE').length} tone="warning" />
      </div>

      <Input
        type="search"
        placeholder="Buscar por nome ou email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        leftIcon={<span aria-hidden="true">🔍</span>}
      />

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {filteredUsers.map((user) => {
          const assinatura = getUserAssinatura(user.id);
          return (
            <Card key={user.id} padding="md">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{user.nome}</p>
                  <p className="text-xs text-ink-soft truncate">{user.email}</p>
                </div>
                <Badge tone={user.tipo_user === 'ADMIN' ? 'accent' : 'neutral'}>
                  {user.tipo_user ?? 'ASSINANTE'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <Badge tone={statusTone(assinatura?.status)}>{statusLabel(assinatura?.status)}</Badge>
                <span className="text-ink-muted">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop table */}
      <Card padding="none" className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-warm-gray/60 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <Th>Nome</Th>
                <Th>Email</Th>
                <Th>Tipo</Th>
                <Th>Status</Th>
                <Th>Cadastro</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {filteredUsers.map((user) => {
                const assinatura = getUserAssinatura(user.id);
                return (
                  <tr key={user.id} className="hover:bg-warm-gray/30 transition-colors">
                    <Td className="font-medium text-ink">{user.nome}</Td>
                    <Td className="text-ink-soft">{user.email}</Td>
                    <Td>
                      <Badge tone={user.tipo_user === 'ADMIN' ? 'accent' : 'neutral'}>
                        {user.tipo_user ?? 'ASSINANTE'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(assinatura?.status)}>
                        {statusLabel(assinatura?.status)}
                      </Badge>
                    </Td>
                    <Td className="text-ink-muted">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredUsers.length === 0 && (
        <Card padding="lg" className="text-center text-sm text-ink-muted">
          Nenhum usuário encontrado
        </Card>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Cadastrar novo cliente"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button form="new-user-form" type="submit" loading={formLoading}>
              Cadastrar
            </Button>
          </>
        }
      >
        <form id="new-user-form" onSubmit={handleCreateUser} className="space-y-3">
          {formError && <Alert tone="error">{formError}</Alert>}
          {formSuccess && <Alert tone="success">{formSuccess}</Alert>}
          <Input
            label="Nome completo *"
            placeholder="Ex: João Silva"
            value={newUser.nome}
            onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
            disabled={formLoading}
          />
          <Input
            label="Email *"
            type="email"
            placeholder="cliente@email.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            disabled={formLoading}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Senha *"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              disabled={formLoading}
            />
            <Input
              label="Confirmar senha *"
              type="password"
              placeholder="Repita a senha"
              value={newUser.confirmPassword}
              onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
              disabled={formLoading}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'success' | 'warning' }) {
  const ring = tone === 'success' ? 'ring-success/20' : tone === 'warning' ? 'ring-accent/30' : 'ring-border';
  return (
    <Card padding="md" className={`ring-1 ${ring}`}>
      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">{label}</p>
      <p className="text-2xl font-bold text-ink mt-1">{value}</p>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th scope="col" className="px-4 py-3 text-left font-semibold">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
