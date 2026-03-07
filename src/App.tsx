import { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import { authService } from './services/api';
import './App.css';

function App() {
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>(() => {
    return authService.isAuthenticated() ? 'dashboard' : 'login';
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return authService.isAuthenticated();
  });

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      if (authenticated) {
        setIsLoggedIn(true);
        setView('dashboard');
      } else {
        setIsLoggedIn(false);
        setView('login');
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setView('dashboard');
  };

  const handleRegisterSuccess = () => {
    setView('login');
  };

  const handleLogout = () => {
    authService.clearAuth(); 
    setIsLoggedIn(false);
    setView('login');
  };

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