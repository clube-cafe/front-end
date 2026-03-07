export interface PlanoAssinatura {
    id: string;
    nome: string;
    descricao?: string;
    valor: number;
    periodicidade: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
    ativo: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface Assinatura {
    id: string;
    user_id: string;
    plano_id: string;
    data_inicio: string;
    status: 'ATIVA' | 'CANCELADA' | 'SUSPENSA';
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  }
  
  export interface CreateAssinaturaDTO {
    user_id: string;
    plano_id: string;
  }
  
  export interface CancelarAssinaturaDTO {
    motivo?: string;
  }
  
  export interface CancelarAssinaturaResponse {
    message: string;
    resultado: {
      assinatura_id: string;
      status: string;
      pendencias_canceladas: number;
      valor_pendente_cancelado: number;
    };
  }