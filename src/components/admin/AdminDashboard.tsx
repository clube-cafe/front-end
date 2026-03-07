import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminUsers from './AdminUsers';
import AdminSubscriptions from './AdminSubscriptions';
import AdminPayments from './AdminPayments';
import AdminPlans from './AdminPlans';
import { authService } from '../../services/api';
import './AdminDashboard.css';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminView = 'users' | 'subscriptions' | 'payments' | 'plans';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<AdminView>('users');
  
  const currentUser = authService.getCurrentUser();
  const adminName = currentUser?.nome || 'Administrador';

  return (
    <div className="admin-dashboard-container">
      <AdminSidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
      />
      
      <div className="admin-content">
        <header className="admin-header">
          <h1>Painel Administrativo</h1>
          <div className="admin-user-info">
            <span>👤 {adminName}</span>
            <span className="admin-badge">ADMIN</span>
          </div>
        </header>

        <div className="admin-main-content">
          {activeView === 'users' && <AdminUsers />}
          {activeView === 'subscriptions' && <AdminSubscriptions />}
          {activeView === 'payments' && <AdminPayments />}
          {activeView === 'plans' && <AdminPlans />} 
        </div>
      </div>
    </div>
  );
}