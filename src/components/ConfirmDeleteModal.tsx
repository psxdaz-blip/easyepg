// ConfirmDeleteModal.tsx — reusable confirmation dialog for destructive actions

import React from 'react';

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="confirm-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-modal__title">{title}</h2>
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button className="btn btn--ghost" onClick={onCancel} aria-label="Cancel">
            Cancel
          </button>
          <button className="btn btn--danger" onClick={onConfirm} aria-label={confirmLabel}>
            {confirmLabel}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .confirm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 24px;
        }
        .confirm-modal {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 32px;
          max-width: 420px;
          width: 100%;
        }
        .confirm-modal__title {
          font-size: 22px;
          font-weight: 600;
          color: #1A1A1A;
          margin: 0 0 8px;
        }
        .confirm-modal__message {
          font-size: 16px;
          color: #5F6368;
          margin: 0 0 24px;
          line-height: 1.5;
        }
        .confirm-modal__actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
      ` }} />
    </div>
  );
};

export default ConfirmDeleteModal;
