export interface Pagamento {
  id: string;
  user_id: string;
  assinatura_id?: string;
  valor: number;
  data_vencimento: string;
  descricao: string;
  status: 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'CANCELADO';
  forma_pagamento?: string;
  data_pagamento?: string;
  observacao?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreatePagamentoDTO {
  user_id: string;
  valor: number;
  data_vencimento: string;
  descricao: string;
  status?: string;
  assinatura_id?: string;
}

export interface RegistrarPagamentoDTO {
  pagamento_id: string;
  forma_pagamento: string;
  observacao?: string;
}

export interface UpdatePagamentoStatusDTO {
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
}