'use client';

import { useState } from 'react';
import { authService } from '@/services/api';
import Image from 'next/image';
import './Register.css';

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
      if (message?.includes('Email já cadastrado') || message?.includes('email já está registrado')) setError('Este email já está cadastrado. Faça login ou use outro email.');
      else setError(message || 'Erro ao criar usuário. Tente novamente.');
    } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) return (
    <div className="success-container">
      <div className="success-icon">✓</div>
      <h2>Cadastro realizado com sucesso!</h2>
      <p>Bem-vindo ao Clube do Café <Image src="/logo.png" alt="" width={20} height={20} className="logo-inline" /></p>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1><Image src="/logo.png" alt="Clube do Café" width={40} height={40} className="logo-inline" /> Clube do Café</h1>
          <h2>Criar Conta</h2>
          <p>Junte-se ao nosso clube exclusivo de café</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group"><label htmlFor="nome">Nome Completo</label><input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} placeholder="Digite seu nome" required disabled={loading} minLength={3} autoComplete="name" /></div>
          <div className="form-group"><label htmlFor="email">E-mail</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" required disabled={loading} autoComplete="email" /></div>
          <div className="form-group"><label htmlFor="password">Senha</label><input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required disabled={loading} minLength={6} autoComplete="new-password" /></div>
          <div className="form-group"><label htmlFor="confirmPassword">Confirmar Senha</label><input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Digite a senha novamente" required disabled={loading} minLength={6} autoComplete="new-password" /></div>
          <button type="submit" className="submit-button" disabled={loading}>{loading ? 'Criando conta...' : 'Criar Conta'}</button>
        </form>
        <div className="auth-footer"><p>Já tem uma conta?{' '}<button type="button" onClick={onSwitchToLogin} className="link-button">Fazer login</button></p></div>
      </div>
    </div>
  );
}
