import axios, { AxiosError } from 'axios';
import type { User, RegisterData, AuthResponse, UpdateProfileData, ChangePasswordData } from '../types/user';
import type { Pagamento } from '../types/payments';
import type { Assinatura, PlanoAssinatura } from '../types/assinatura';

const api = axios.create({
  baseURL: 'http://127.0.0.1:3000',
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await api.put<User>('/auth/profile', data);
    
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Erro ao parsear user do localStorage:', error);
      return null;
    }
  },

  clearAuth: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/auth/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/auth/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<{
    nome: string;
    email: string;
    tipo_user: 'ADMIN' | 'ASSINANTE';
  }>): Promise<User> => {
    const response = await api.put<User>(`/auth/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/auth/users/${id}`);
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    try {
      const users = await userService.getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user || null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }
  },
};

export const pagamentoService = {
  getAllPagamentos: async (): Promise<Pagamento[]> => {
    const response = await api.get<Pagamento[]>('/pagamentos');
    return response.data;
  },

  getPagamentoById: async (id: string): Promise<Pagamento> => {
    const response = await api.get<Pagamento>(`/pagamentos/${id}`);
    return response.data;
  },

  getPagamentosByUserId: async (userId: string): Promise<Pagamento[]> => {
    const response = await api.get<Pagamento[]>(`/pagamentos/user/${userId}`);
    return response.data;
  },

  getPagamentosByStatus: async (status: string): Promise<Pagamento[]> => {
    const response = await api.get<Pagamento[]>(`/pagamentos/status/${status}`);
    return response.data;
  },

  getPagamentosPendentes: async (): Promise<Pagamento[]> => {
    const response = await api.get<Pagamento[]>('/pagamentos/pendentes');
    return response.data;
  },

  getPagamentosVencidos: async (): Promise<Pagamento[]> => {
    const response = await api.get<Pagamento[]>('/pagamentos/vencidos');
    return response.data;
  },

  createPagamento: async (data: {
    user_id: string;
    valor: number;
    data_vencimento: string;
    descricao: string;
    status?: string;
  }): Promise<Pagamento> => {
    const response = await api.post<Pagamento>('/pagamentos/criar', data);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Pagamento> => {
    const response = await api.patch<Pagamento>(`/pagamentos/${id}/status`, { status });
    return response.data;
  },

  registrarPagamentoCompleto: async (
    pagamento_id: string,
    forma_pagamento: string,
    observacao?: string
  ): Promise<{
    message: string;
    pagamento: Pagamento;
    assinaturaAtivada: boolean;
  }> => {
    const response = await api.post('/pagamentos/registrar', {
      pagamento_id,
      forma_pagamento,
      observacao,
    });
    return response.data;
  },

  getTotalByUser: async (userId: string): Promise<{ total: number }> => {
    const response = await api.get<{ total: number }>(`/pagamentos/total/user/${userId}`);
    return response.data;
  },

  getTotalPendentes: async (): Promise<{ total: number }> => {
    const response = await api.get<{ total: number }>('/pagamentos/total/pendentes');
    return response.data;
  },

  getTotalPendentesByUser: async (userId: string): Promise<{ total: number }> => {
    const response = await api.get<{ total: number }>(`/pagamentos/total/pendentes/${userId}`);
    return response.data;
  },
};

export const assinaturaService = {
  getAllAssinaturas: async (): Promise<Assinatura[]> => {
    const response = await api.get<Assinatura[]>('/assinaturas');
    return response.data;
  },

  getAssinaturaById: async (id: string): Promise<Assinatura> => {
    const response = await api.get<Assinatura>(`/assinaturas/${id}`);
    return response.data;
  },

  getAssinaturasByUserId: async (userId: string): Promise<Assinatura[]> => {
    const response = await api.get<Assinatura[]>(`/assinaturas/user/${userId}`);
    return response.data;
  },

  createAssinatura: async (data: {
    user_id: string;
    plano_id: string;
  }): Promise<Assinatura> => {
    const response = await api.post<Assinatura>('/assinaturas', data);
    return response.data;
  },

  createAssinaturaComPendencias: async (data: {
    user_id: string;
    plano_id: string;
    dia_vencimento?: number;
  }): Promise<{
    assinatura: Assinatura;
    pendencias_geradas: number;
    pendencias: Array<{
      valor: number;
      data_vencimento: string;
      descricao: string;
    }>;
  }> => {
    const response = await api.post('/assinaturas/com-pendencias', data);
    return response.data;
  },

  updateAssinatura: async (id: string, data: {
    plano_id?: string;
    data_inicio?: string;
  }): Promise<Assinatura> => {
    const response = await api.put<Assinatura>(`/assinaturas/${id}`, data);
    return response.data;
  },

  deleteAssinatura: async (id: string): Promise<void> => {
    await api.delete(`/assinaturas/${id}`);
  },

  cancelarAssinatura: async (id: string, motivo?: string): Promise<{
    message: string;
    resultado: {
      assinatura_id: string;
      status: string;
      pendencias_canceladas: number;
      valor_pendente_cancelado: number;
    };
  }> => {
    const response = await api.post(`/assinaturas/${id}/cancelar`, { motivo });
    return response.data;
  },
};

export const planoService = {
  getAllPlanos: async (): Promise<PlanoAssinatura[]> => {
    const response = await api.get('/planos');
    return response.data;
  },

  getPlanosAtivos: async (): Promise<PlanoAssinatura[]> => {
    const response = await api.get('/planos/ativos');
    return response.data;
  },

  getPlanoById: async (id: string): Promise<PlanoAssinatura> => {
    const response = await api.get(`/planos/${id}`);
    return response.data;
  },

  // ✅ ADICIONAR ESTES MÉTODOS:
  createPlano: async (data: {
    nome: string;
    descricao: string;
    valor: number;
    periodicidade: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
    ativo: boolean;
  }): Promise<PlanoAssinatura> => {
    const response = await api.post('/planos', data);
    return response.data;
  },

  updatePlano: async (id: string, data: {
    nome?: string;
    descricao?: string;
    valor?: number;
    periodicidade?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
    ativo?: boolean;
  }): Promise<PlanoAssinatura> => {
    const response = await api.put(`/planos/${id}`, data);
    return response.data;
  },

  deletePlano: async (id: string): Promise<void> => {
    await api.delete(`/planos/${id}`);
  },
};

export interface Historico {
  id: string;
  user_id: string;
  tipo: 'ENTRADA' | 'SAIDA';
  valor: number;
  data: string;
  descricao: string;
  createdAt?: string;
  updatedAt?: string;
}

export const historicoService = {
  getAllHistoricos: async (): Promise<Historico[]> => {
    const response = await api.get<Historico[]>('/historicos');
    return response.data;
  },

  getHistoricoById: async (id: string): Promise<Historico> => {
    const response = await api.get<Historico>(`/historicos/${id}`);
    return response.data;
  },

  getHistoricosByTipo: async (tipo: 'ENTRADA' | 'SAIDA'): Promise<Historico[]> => {
    const response = await api.get<Historico[]>(`/historicos/tipo/${tipo}`);
    return response.data;
  },

  createHistorico: async (data: {
    user_id: string;
    tipo: 'ENTRADA' | 'SAIDA';
    valor: number;
    data: string;
    descricao: string;
  }): Promise<Historico> => {
    const response = await api.post<Historico>('/historicos', data);
    return response.data;
  },

  getTotalEntradas: async (): Promise<{ total: number }> => {
    const response = await api.get<{ total: number }>('/historicos/total/entradas');
    return response.data;
  },

  getTotalSaidas: async (): Promise<{ total: number }> => {
    const response = await api.get<{ total: number }>('/historicos/total/saidas');
    return response.data;
  },

  getSaldo: async (): Promise<{ saldo: number }> => {
    const response = await api.get<{ saldo: number }>('/historicos/saldo');
    return response.data;
  },

  deleteHistorico: async (id: string): Promise<void> => {
    await api.delete(`/historicos/${id}`);
  },
};

export default api;