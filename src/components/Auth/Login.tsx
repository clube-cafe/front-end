'use client';

import { useState } from 'react';
import Image from 'next/image';
import { authService } from '@/services/api';
import { Alert, Button, Input } from '@/components/ui';

interface LoginProps {
  onSuccess?: (userId: string, userType: 'ADMIN' | 'ASSINANTE') => void;
  onSwitchToRegister?: () => void;
}

export default function Login({ onSuccess, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Por favor, digite seu e-mail'); return; }
    if (!password) { setError('Por favor, digite sua senha'); return; }
    setError(''); setLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('userId', response.user.id);
      if (onSuccess) onSuccess(response.user.id, response.user.tipo_user ?? 'ASSINANTE');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 400 || error.response?.status === 401) setError('Email ou senha incorretos');
      else if (error.response?.status === 429) setError('Muitas tentativas. Tente novamente em alguns minutos.');
      else if (error.response?.status === 500) setError('Erro no servidor. Tente novamente mais tarde.');
      else setError('Erro ao fazer login. Tente novamente.');
    } finally { setLoading(false); }
  };

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
            <p className="text-white/80 text-sm">Entre para acessar sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col gap-5" noValidate>
            {error && <Alert tone="error">{error}</Alert>}

            <Input
              label="E-mail"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              autoComplete="email"
              required
              autoFocus
            />

            <Input
              label="Senha"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
              required
            />

            <Button type="submit" loading={loading} fullWidth size="lg">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="border-t border-border-soft bg-warm-gray/30 px-8 py-5 text-center text-sm text-ink-soft">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold text-secondary hover:text-secondary-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary rounded"
            >
              Criar conta
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Gestão de assinaturas do clube de café
        </p>
      </div>
    </main>
  );
}
