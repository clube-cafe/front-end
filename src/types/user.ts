export interface User {
  id: string;
  nome: string;
  email: string;
  tipo_user?: 'ADMIN' | 'ASSINANTE';
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileData {
  nome?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}