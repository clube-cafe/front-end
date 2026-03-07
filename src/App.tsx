import { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/users/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { authService } from './services/api';
import './App.css';

function App() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'admin'>(() => {
    const user = authService.getCurrentUser();
    if (user) {
      return user.tipo_user === 'ADMIN' ? 'admin' : 'dashboard';
    }
    return 'login';
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return authService.isAuthenticated();
  });

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      
      if (authenticated && user) {
        setIsLoggedIn(true);
        setView(user.tipo_user === 'ADMIN' ? 'admin' : 'dashboard');
      } else {
        setIsLoggedIn(false);
        setView('login');
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userId: string, userType: 'ADMIN' | 'ASSINANTE') => {
    setIsLoggedIn(true);
    setView(userType === 'ADMIN' ? 'admin' : 'dashboard');
  };

  const handleRegisterSuccess = () => {
    setView('login');
  };

  const handleLogout = () => {
    authService.clearAuth();
    setIsLoggedIn(false);
    setView('login');
  };

  if (view === 'admin' && isLoggedIn) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (view === 'dashboard' && isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <>
      {view === 'login' ? (
        <Login 
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setView('register')}
        />
      ) : (
        <Register 
          onSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setView('login')}
        />
      )}
    </>
  );
}

export default App;