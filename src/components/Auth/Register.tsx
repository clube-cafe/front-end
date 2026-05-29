'use client';

import { useState } from 'react';
import Image from 'next/image';
import { authService } from '@/services/api';
import { Alert, Button, Input } from '@/components/ui';

interface RegisterProps { onSuccess?: () => void; onSwitchToLogin?: () => void; }

export default function Register({ onSuccess, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({ nome: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (formData.password !== confirmPassword) { setError('As senhas não coincidem'); return; }
    if (formData.password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      await authService.register({ nome: formData.nome, email: formData.email, password: formData.password });
      setSuccess(true); setTimeout(() => { if (onSuccess) onSuccess(); }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message;
      if (message?.includes('Email já cadastrado') || message?.includes('email já está registrado')) {
        setError('Este email já está cadastrado. Faça login ou use outro email.');
      } else {
        setError(message || 'Erro ao criar usuário. Tente novamente.');
      }
    } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4 py-12">
        <div
          role="status"
          aria-live="polite"
          className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-border-soft px-8 py-12 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success text-4xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">Cadastro realizado!</h2>
          <p className="text-ink-soft flex items-center justify-center gap-2">
            Bem-vindo ao Clube do Café
            <Image src="/logo.png" alt="" width={20} height={20} className="object-contain" />
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4 py-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white shadow-xl border border-border-soft overflow-hidden">
          <div className="gradient-primary px-8 pt-10 pb-8 text-center">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Image src="/logo.png" alt="" width={48} height={48} className="object-contain" />
              <h1 className="text-2xl font-bold text-white tracking-tight">Clube do Café</h1>
            </div>
            <p className="text-white/80 text-sm">Crie sua conta e junte-se ao clube</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 flex flex-col gap-4" noValidate>
            {error && <Alert tone="error">{error}</Alert>}

            <Input
              label="Nome completo"
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Seu nome"
              required
              disabled={loading}
              minLength={3}
              autoComplete="name"
              autoFocus
            />

            <Input
              label="E-mail"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
              disabled={loading}
              autoComplete="email"
            />

            <Input
              label="Senha"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              hint="Use ao menos 6 caracteres"
              required
              disabled={loading}
              minLength={6}
              autoComplete="new-password"
            />

            <Input
              label="Confirmar senha"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              disabled={loading}
              minLength={6}
              autoComplete="new-password"
            />

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>

          <div className="border-t border-border-soft bg-warm-gray/30 px-8 py-5 text-center text-sm text-ink-soft">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-secondary hover:text-secondary-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary rounded"
            >
              Fazer login
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
