import { useState } from 'react';
import { authService } from '../../services/api';
import cafeLogo from '../../assets/Clube do Café.png';
import './Login.css';

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

    if (!email) {
      setError('Por favor, digite seu e-mail');
      return;
    }

    if (!password) {
      setError('Por favor, digite sua senha');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      
      localStorage.setItem('userId', response.user.id);
      
      if (onSuccess) {
        // ✅ Passar o tipo de usuário
        onSuccess(response.user.id, response.user.tipo_user ?? 'ASSINANTE');
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError('Email ou senha incorretos');
      } else if (err.response?.status === 500) {
        setError('Erro no servidor. Tente novamente mais tarde.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1><img src={cafeLogo} alt="Clube do Café" className="logo-inline" /> Clube do Café</h1>
          <p>Entre para acessar sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button 
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Não tem uma conta?{' '}
            <button 
              type="button"
              onClick={onSwitchToRegister}
              className="link-button"
            >
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}