'use client';

import { Button, Modal } from '@/components/ui';

interface ConfirmModalProps {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'confirm' | 'danger' | 'success';
  alertMode?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmModal({
  title,
  message,
  icon,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'confirm',
  alertMode = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleClose = () => {
    if (alertMode) onConfirm();
    else onCancel?.();
  };

  const buttonVariant = variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary';

  return (
    <Modal
      open
      onClose={handleClose}
      size="sm"
      footer={
        <>
          {!alertMode && (
            <Button variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button variant={buttonVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-center">
        {icon && (
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warm-gray text-2xl"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
        <p className="text-sm text-ink-soft">{message}</p>
      </div>
    </Modal>
  );
}
