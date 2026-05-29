'use client';

import { useState, useEffect, useCallback } from 'react';
import { pagamentoService } from '@/services/api';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Alert, Button, Modal } from '@/components/ui';

interface PaymentModalProps {
  pagamentoId: string;
  valor: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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
      const mockPixCode = `00020126580014br.gov.bcb.pix0136${pagamentoId}520400005303986540${valor.toFixed(
        2
      )}5802BR5925CLUBE DO CAFE6009SAO PAULO62070503***6304`;
      setPixCopiaECola(mockPixCode);
      setQrCodeData(
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockPixCode)}`
      );
    } catch {
      setError('Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  }, [pagamentoId, valor]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    setShowCopiedAlert(true);
  };

  const executePayment = async () => {
    setShowConfirmPayment(false);
    try {
      setLoading(true);
      await pagamentoService.registrarPagamentoCompleto(pagamentoId, 'PIX', 'Pagamento via QR Code');
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erro ao confirmar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open
        onClose={onCancel}
        title="Pagamento via PIX"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={() => setShowConfirmPayment(true)}
              disabled={loading}
            >
              ✓ Já paguei
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}

          <div className="text-center bg-warm-gray/50 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
              Valor a pagar
            </p>
            <p className="text-3xl font-bold text-secondary mt-1">{fmtCurrency(valor)}</p>
          </div>

          {loading && !qrCodeData ? (
            <div className="flex items-center justify-center py-8" aria-live="polite">
              <span
                className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent"
                aria-hidden="true"
              />
              <span className="ml-3 text-sm text-ink-soft">Gerando QR Code...</span>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">Escaneie o QR Code</h3>
                <div className="flex justify-center bg-white border-2 border-border-soft rounded-xl p-4">
                  {qrCodeData && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrCodeData}
                      alt="QR Code para pagamento PIX"
                      className="h-56 w-56 object-contain"
                    />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">PIX Copia e Cola</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pixCopiaECola}
                    readOnly
                    aria-label="Código PIX copia e cola"
                    className="flex-1 min-w-0 rounded-lg border border-border bg-warm-gray/40 px-3 py-2 text-xs font-mono text-ink-soft focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                  <Button variant="secondary" size="sm" onClick={handleCopyPix}>
                    📋 Copiar
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-secondary/5 border border-secondary/20 p-4">
                <h4 className="text-sm font-semibold text-secondary-dark mb-2">
                  Como pagar
                </h4>
                <ol className="text-xs text-ink-soft space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar via PIX</li>
                  <li>Escaneie o QR Code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                  <li>Clique em &quot;Já paguei&quot; abaixo</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </Modal>

      {showConfirmPayment && (
        <ConfirmModal
          icon="💳"
          title="Confirmar pagamento"
          message="Confirmar que o pagamento foi realizado?"
          confirmText="Sim, já paguei"
          cancelText="Voltar"
          variant="success"
          onConfirm={executePayment}
          onCancel={() => setShowConfirmPayment(false)}
        />
      )}
      {showCopiedAlert && (
        <ConfirmModal
          icon="✅"
          title="Copiado!"
          message="Código PIX copiado para a área de transferência."
          confirmText="OK"
          variant="success"
          alertMode
          onConfirm={() => setShowCopiedAlert(false)}
        />
      )}
    </>
  );
}
