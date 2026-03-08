import './ConfirmModal.css';

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
  onCancel
}: ConfirmModalProps) {
  return (
    <div className="confirm-modal-overlay" onClick={alertMode ? onConfirm : onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        {icon && <div className="confirm-modal-icon">{icon}</div>}
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={`confirm-modal-actions ${alertMode ? 'alert-mode' : ''}`}>
          {!alertMode && (
            <button className="confirm-modal-btn cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button className={`confirm-modal-btn ${variant}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
