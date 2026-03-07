export interface PagamentoPendente {
  id: string;
  user_id: string;
  assinatura_id?: string; 
  valor: number;
  data_vencimento: string;
  descricao: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Pagamento {
  id: string;
  user_id: string;
  pagamento_pendente_id?: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  observacao?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePagamentoPendenteDTO {
  user_id: string;
  valor: number;
  data_vencimento: string;
  descricao: string;
  status?: string;
  assinatura_id?: string;
}

export interface CreatePagamentoDTO {
  user_id: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  observacao?: string;
  pagamento_pendente_id?: string;
}

export interface UpdatePagamentoPendenteStatusDTO {
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
}