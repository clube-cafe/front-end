import './AdminSidebar.css';

interface AdminSidebarProps {
  activeView: 'users' | 'subscriptions' | 'payments' | 'plans' | 'financeiro';
  setActiveView: (view: 'users' | 'subscriptions' | 'payments' | 'plans' | 'financeiro') => void;
  onLogout: () => void;
}

export default function AdminSidebar({ activeView, setActiveView, onLogout }: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>☕ Clube do Café</h2>
        <span className="admin-tag">Admin</span>
      </div>

      <nav className="admin-nav">
        <button
          className={`admin-nav-item ${activeView === 'users' ? 'active' : ''}`}
          onClick={() => setActiveView('users')}
        >
          <span className="nav-icon">👥</span>
          <span>Usuários</span>
        </button>

        <button
          className={`admin-nav-item ${activeView === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveView('subscriptions')}
        >
          <span className="nav-icon">📋</span>
          <span>Assinaturas</span>
        </button>

        <button
          className={`admin-nav-item ${activeView === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveView('payments')}
        >
          <span className="nav-icon">💰</span>
          <span>Pagamentos</span>
        </button>

        <button
          className={`admin-nav-item ${activeView === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveView('plans')}
        >
          <span className="nav-icon">📦</span>
          <span>Planos</span>
        </button>

        <button
          className={`admin-nav-item ${activeView === 'financeiro' ? 'active' : ''}`}
          onClick={() => setActiveView('financeiro')}
        >
          <span className="nav-icon">📊</span>
          <span>Financeiro</span>
        </button>
      </nav>

      <button className="admin-logout-btn" onClick={onLogout}>
        <span>🚪</span>
        Sair
      </button>
    </aside>
  );
}