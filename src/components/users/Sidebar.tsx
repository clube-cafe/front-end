import cafeLogo from '../../assets/Clube do Café.png';
import './Sidebar.css';

interface SidebarProps {
  activeView: 'home' | 'subscription';
  setActiveView: (view: 'home' | 'subscription') => void;
  onLogout: () => void;
}

export default function Sidebar({ activeView, setActiveView, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1><img src={cafeLogo} alt="Clube do Café" className="logo-inline" /> Clube do Café</h1>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
          onClick={() => setActiveView('home')}
        >
          <span className="nav-icon">🏠</span>
          <span>Início</span>
        </button>

        <button 
          className={`nav-item ${activeView === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveView('subscription')}
        >
          <span className="nav-icon">📋</span>
          <span>Assinatura</span>
        </button>
      </nav>

      <button className="logout-btn" onClick={onLogout}>
        <span>Sair</span>
      </button>
    </aside>
  );
}