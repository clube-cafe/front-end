'use client';

import { useEffect, useState } from 'react';
import Login from '@/components/Auth/Login';
import Register from '@/components/Auth/Register';
import Dashboard from '@/components/users/Dashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { authService } from '@/services/api';

type View = 'login' | 'register' | 'dashboard' | 'admin';

export default function Home() {
  const [view, setView] = useState<View>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (authService.isAuthenticated() && user) {
      setIsLoggedIn(true);
      setView(user.tipo_user === 'ADMIN' ? 'admin' : 'dashboard');
    }
    setHydrated(true);
  }, []);

  const handleLoginSuccess = (_userId: string, userType: 'ADMIN' | 'ASSINANTE') => {
    setIsLoggedIn(true); setView(userType === 'ADMIN' ? 'admin' : 'dashboard');
  };
  const handleRegisterSuccess = () => setView('login');
  const handleLogout = () => { authService.clearAuth(); setIsLoggedIn(false); setView('login'); };

  if (!hydrated) return null;

  if (view === 'admin' && isLoggedIn) return <AdminDashboard onLogout={handleLogout} />;
  if (view === 'dashboard' && isLoggedIn) return <Dashboard onLogout={handleLogout} />;

  return view === 'login'
    ? <Login onSuccess={handleLoginSuccess} onSwitchToRegister={() => setView('register')} />
    : <Register onSuccess={handleRegisterSuccess} onSwitchToLogin={() => setView('login')} />;
}
