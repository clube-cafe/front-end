'use client';

import { useState, useEffect, useCallback } from 'react';
import { pagamentoService } from '@/services/api';
import './PaymentModal.css';
import ConfirmModal from '@/components/common/ConfirmModal';

interface PaymentModalProps { pagamentoId: string; valor: number; onSuccess: () => void; onCancel: () => void; }

export default function PaymentModal({ pagamentoId, valor, onSuccess, onCancel }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [pixCopiaECola, setPixCopiaECola] = useState('');
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);

  const generateQRCode = useCallback(async () => {
    try {
      setLoading(true);
      const mockPixCode = `00020126580014br.gov.bcb.pix0136${pagamentoId}520400005303986540${valor.toFixed(2)}5802BR5925CLUBE DO CAFE6009SAO PAULO62070503***6304`;
      setPixCopiaECola(mockPixCode);
      setQrCodeData(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPixCode)}`);
    } catch { setError('Erro ao gerar QR Code'); }
    finally { setLoading(false); }
  }, [pagamentoId, valor]);

  useEffect(() => { generateQRCode(); }, [generateQRCode]);

  const handleCopyPix = () => { navigator.clipboard.writeText(pixCopiaECola); setShowCopiedAlert(true); };

  const executePayment = async () => {
    setShowConfirmPayment(false);
    try {
      setLoading(true);
      await pagamentoService.registrarPagamentoCompleto(pagamentoId, 'PIX', 'Pagamento via QR Code');
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Erro ao confirmar pagamento:', err);
      setError(error.response?.data?.message || 'Erro ao confirmar pagamento');
    } finally { setLoading(false); }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-header"><h2>💳 Pagamento PIX</h2><button className="close-btn" onClick={onCancel}>✕</button></div>
        {error && <div className="error-message">{error}</div>}
        <div className="payment-content">
          <div className="payment-value"><span className="label">Valor a pagar:</span><span className="value">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}</span></div>
          {loading ? <div className="loading">Gerando QR Code...</div> : (
            <>
              <div className="qr-code-section"><h3>Escaneie o QR Code</h3>{qrCodeData && <img src={qrCodeData} alt="QR Code PIX" className="qr-code-image" />}</div>
              <div className="pix-copy-section"><h3>PIX Copia e Cola</h3><div className="pix-code-container"><input type="text" value={pixCopiaECola} readOnly className="pix-code-input" /><button onClick={handleCopyPix} className="copy-btn">📋 Copiar</button></div></div>
              <div className="payment-instructions"><h4>📱 Como pagar:</h4><ol><li>Abra o app do seu banco</li><li>Escolha pagar via PIX</li><li>Escaneie o QR Code ou cole o código</li><li>Confirme o pagamento</li><li>Clique em &quot;Já paguei&quot; abaixo</li></ol></div>
              <div className="payment-actions"><button onClick={() => setShowConfirmPayment(true)} className="confirm-btn" disabled={loading}>✓ Já paguei</button><button onClick={onCancel} className="cancel-btn" disabled={loading}>Cancelar</button></div>
            </>
          )}
        </div>
        {showConfirmPayment && <ConfirmModal icon="💳" title="Confirmar Pagamento" message="Confirmar que o pagamento foi realizado?" confirmText="Sim, já paguei" cancelText="Voltar" variant="success" onConfirm={executePayment} onCancel={() => setShowConfirmPayment(false)} />}
        {showCopiedAlert && <ConfirmModal icon="✅" title="Copiado!" message="Código PIX copiado para a área de transferência." confirmText="OK" variant="success" alertMode onConfirm={() => setShowCopiedAlert(false)} />}
      </div>
    </div>
  );
}
