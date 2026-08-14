import React from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { X, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useOrganiser();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
          {toast.type === 'error' && <AlertCircle size={18} style={{ color: '#ef4444' }} />}
          {toast.type === 'warning' && <AlertCircle size={18} style={{ color: '#f59e0b' }} />}
          {(!toast.type || toast.type === 'info') && <Info size={18} style={{ color: '#3b82f6' }} />}

          <span style={{ flex: 1 }}>{toast.message}</span>

          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction!();
                removeToast(toast.id);
              }}
              className="undo-btn"
            >
              Undo
            </button>
          )}

          <button onClick={() => removeToast(toast.id)} className="btn-icon" style={{ width: 24, height: 24 }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
