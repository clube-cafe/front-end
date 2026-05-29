'use client';

import { useState } from 'react';
import Login from '@/components/Auth/Login';
import Register from '@/components/Auth/Register';
import Dashboard from '@/components/users/Dashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { authService } from '@/services/api';

export default function Home() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'admin'>(() => {
    const user = authService.getCurrentUser();
    if (user) return user.tipo_user === 'ADMIN' ? 'admin' : 'dashboard';
    return 'login';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());

  const handleLoginSuccess = (_userId: string, userType: 'ADMIN' | 'ASSINANTE') => {
    setIsLoggedIn(true); setView(userType === 'ADMIN' ? 'admin' : 'dashboard');
  };
  const handleRegisterSuccess = () => setView('login');
  const handleLogout = () => { authService.clearAuth(); setIsLoggedIn(false); setView('login'); };

  if (view === 'admin' && isLoggedIn) return <AdminDashboard onLogout={handleLogout} />;
  if (view === 'dashboard' && isLoggedIn) return <Dashboard onLogout={handleLogout} />;

  return view === 'login'
    ? <Login onSuccess={handleLoginSuccess} onSwitchToRegister={() => setView('register')} />
    : <Register onSuccess={handleRegisterSuccess} onSwitchToLogin={() => setView('login')} />;
}
