import axios, { AxiosError } from 'axios';
import type { User, RegisterData, AuthResponse, UpdateProfileData, ChangePasswordData } from '@/types/user';
import type { Pagamento } from '@/types/payments';
import type { Assinatura, PlanoAssinatura } from '@/types/assinatura';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    if (response.data.token) localStorage.setItem('token', response.data.token);
    if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) localStorage.setItem('token', response.data.token);
    if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  logout: async (): Promise<void> => {
    try { await api.post('/auth/logout'); } catch (error) { console.error('Erro ao fazer logout no servidor:', error); }
    finally { localStorage.removeItem('token'); localStorage.removeItem('user'); }
  },

  getProfile: async (): Promise<User> => { const response = await api.get<User>('/auth/profile'); return response.data; },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await api.put<User>('/auth/profile', data);
    if (response.data) localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch (error) { console.error('Erro ao parsear user do localStorage:', error); return null; }
  },

  clearAuth: (): void => { localStorage.removeItem('token'); localStorage.removeItem('user'); },
};

export const userService = {
  getAllUsers: async (): Promise<User[]> => { const r = await api.get<User[]>('/auth/users'); return r.data; },
  getUserById: async (id: string): Promise<User> => { const r = await api.get<User>(`/auth/users/${id}`); return r.data; },
  createUser: async (data: { nome: string; email: string; password: string }): Promise<User> => {
    const r = await api.post<{ user: User }>('/auth/register', data); return r.data.user;
  },
  updateUser: async (id: string, userData: Partial<{ nome: string; email: string; tipo_user: 'ADMIN' | 'ASSINANTE' }>): Promise<User> => {
    const r = await api.put<User>(`/auth/users/${id}`, userData); return r.data;
  },
  deleteUser: async (id: string): Promise<void> => { await api.delete(`/auth/users/${id}`); },
  getUserByEmail: async (email: string): Promise<User | null> => {
    try { const users = await userService.getAllUsers(); return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null; }
    catch (error) { console.error('Erro ao buscar usuário por email:', error); return null; }
  },
};

export const pagamentoService = {
  getAllPagamentos: async (): Promise<Pagamento[]> => { const r = await api.get<Pagamento[]>('/pagamentos'); return r.data; },
  getPagamentoById: async (id: string): Promise<Pagamento> => { const r = await api.get<Pagamento>(`/pagamentos/${id}`); return r.data; },
  getPagamentosByUserId: async (userId: string): Promise<Pagamento[]> => { const r = await api.get<Pagamento[]>(`/pagamentos/user/${userId}`); return r.data; },
  getPagamentosByStatus: async (status: string): Promise<Pagamento[]> => { const r = await api.get<Pagamento[]>(`/pagamentos/status/${status}`); return r.data; },
  getPagamentosPendentes: async (): Promise<Pagamento[]> => { const r = await api.get<Pagamento[]>('/pagamentos/pendentes'); return r.data; },
  getPagamentosVencidos: async (): Promise<Pagamento[]> => { const r = await api.get<Pagamento[]>('/pagamentos/vencidos'); return r.data; },
  createPagamento: async (data: { user_id: string; valor: number; data_vencimento: string; descricao: string; status?: string }): Promise<Pagamento> => {
    const r = await api.post<Pagamento>('/pagamentos/criar', data); return r.data;
  },
  updateStatus: async (id: string, status: string): Promise<Pagamento> => {
    const r = await api.patch<Pagamento>(`/pagamentos/${id}/status`, { status }); return r.data;
  },
  registrarPagamentoCompleto: async (pagamento_id: string, forma_pagamento: string, observacao?: string): Promise<{ message: string; pagamento: Pagamento; assinaturaAtivada: boolean }> => {
    const r = await api.post('/pagamentos/registrar', { pagamento_id, forma_pagamento, observacao }); return r.data;
  },
  getTotalByUser: async (userId: string): Promise<{ total: number }> => { const r = await api.get<{ total: number }>(`/pagamentos/total/user/${userId}`); return r.data; },
  getTotalPendentes: async (): Promise<{ total: number }> => { const r = await api.get<{ total: number }>('/pagamentos/total/pendentes'); return r.data; },
  getTotalPendentesByUser: async (userId: string): Promise<{ total: number }> => { const r = await api.get<{ total: number }>(`/pagamentos/total/pendentes/${userId}`); return r.data; },
};

export const assinaturaService = {
  getAllAssinaturas: async (): Promise<Assinatura[]> => { const r = await api.get<Assinatura[]>('/assinaturas'); return r.data; },
  getAssinaturaById: async (id: string): Promise<Assinatura> => { const r = await api.get<Assinatura>(`/assinaturas/${id}`); return r.data; },
  getAssinaturasByUserId: async (userId: string): Promise<Assinatura[]> => { const r = await api.get<Assinatura[]>(`/assinaturas/user/${userId}`); return r.data; },
  createAssinatura: async (data: { user_id: string; plano_id: string }): Promise<Assinatura> => {
    const r = await api.post<Assinatura>('/assinaturas', data); return r.data;
  },
  createAssinaturaComPendencias: async (data: { user_id: string; plano_id: string; dia_vencimento?: number }): Promise<{ assinatura: Assinatura; pendencias_geradas: number; pendencias: Array<{ valor: number; data_vencimento: string; descricao: string }> }> => {
    const r = await api.post('/assinaturas/com-pendencias', data); return r.data;
  },
  updateAssinatura: async (id: string, data: { plano_id?: string; data_inicio?: string }): Promise<Assinatura> => {
    const r = await api.put<Assinatura>(`/assinaturas/${id}`, data); return r.data;
  },
  deleteAssinatura: async (id: string): Promise<void> => { await api.delete(`/assinaturas/${id}`); },
  cancelarAssinatura: async (id: string, motivo?: string): Promise<{ message: string; resultado: { assinatura_id: string; status: string; pendencias_canceladas: number; valor_pendente_cancelado: number } }> => {
    const r = await api.post(`/assinaturas/${id}/cancelar`, { motivo }); return r.data;
  },
};

export const planoService = {
  getAllPlanos: async (): Promise<PlanoAssinatura[]> => { const r = await api.get('/planos'); return r.data; },
  getPlanosAtivos: async (): Promise<PlanoAssinatura[]> => { const r = await api.get('/planos/ativos'); return r.data; },
  getPlanoById: async (id: string): Promise<PlanoAssinatura> => { const r = await api.get(`/planos/${id}`); return r.data; },
  createPlano: async (data: { nome: string; descricao: string; valor: number; periodicidade: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'; ativo: boolean }): Promise<PlanoAssinatura> => {
    const r = await api.post('/planos', data); return r.data;
  },
  updatePlano: async (id: string, data: { nome?: string; descricao?: string; valor?: number; periodicidade?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'; ativo?: boolean }): Promise<PlanoAssinatura> => {
    const r = await api.put(`/planos/${id}`, data); return r.data;
  },
  deletePlano: async (id: string): Promise<void> => { await api.delete(`/planos/${id}`); },
};

export interface Historico {
  id: string; user_id: string; tipo: 'ENTRADA' | 'SAIDA'; valor: number; data: string; descricao: string; createdAt?: string; updatedAt?: string;
}

export const historicoService = {
  getAllHistoricos: async (): Promise<Historico[]> => { const r = await api.get<Historico[]>('/historicos'); return r.data; },
  getHistoricoById: async (id: string): Promise<Historico> => { const r = await api.get<Historico>(`/historicos/${id}`); return r.data; },
  getHistoricosByTipo: async (tipo: 'ENTRADA' | 'SAIDA'): Promise<Historico[]> => { const r = await api.get<Historico[]>(`/historicos/tipo/${tipo}`); return r.data; },
  createHistorico: async (data: { user_id: string; tipo: 'ENTRADA' | 'SAIDA'; valor: number; data: string; descricao: string }): Promise<Historico> => {
    const r = await api.post<Historico>('/historicos', data); return r.data;
  },
  getTotalEntradas: async (): Promise<{ total: number }> => { const r = await api.get<{ total: number }>('/historicos/total/entradas'); return r.data; },
  getTotalSaidas: async (): Promise<{ total: number }> => { const r = await api.get<{ total: number }>('/historicos/total/saidas'); return r.data; },
  getSaldo: async (): Promise<{ saldo: number }> => { const r = await api.get<{ saldo: number }>('/historicos/saldo'); return r.data; },
  deleteHistorico: async (id: string): Promise<void> => { await api.delete(`/historicos/${id}`); },
};

export default api;
