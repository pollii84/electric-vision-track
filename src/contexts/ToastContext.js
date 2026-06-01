'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext();

const TOAST_DURATION = 4000;
const MAX_TOASTS = 5;

let toastIdCounter = 0;

function getToastIcon(type) {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    default: return 'ℹ';
  }
}

function Toast({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, TOAST_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`ev-toast ev-toast--${toast.type} ${isExiting ? 'ev-toast--exiting' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <span className="ev-toast__icon" aria-hidden="true">
        {getToastIcon(toast.type)}
      </span>
      <span className="ev-toast__message">{toast.message}</span>
      <button
        className="ev-toast__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="ev-toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}

      <style jsx>{`
        .ev-toast-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: 400px;
          width: calc(100% - 2rem);
          pointer-events: none;
        }
      `}</style>

      <style jsx global>{`
        .ev-toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md, 12px);
          background: var(--clr-bg-elevated, #1e1e2e);
          border: 1px solid var(--clr-border, #333);
          color: var(--clr-text, #fff);
          font-size: 0.875rem;
          line-height: 1.4;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          pointer-events: all;
          animation: ev-toast-enter 0.3s ease-out;
          backdrop-filter: blur(12px);
        }

        .ev-toast--exiting {
          animation: ev-toast-exit 0.3s ease-in forwards;
        }

        .ev-toast--success {
          border-left: 4px solid var(--clr-success, #22c55e);
        }
        .ev-toast--success .ev-toast__icon {
          color: var(--clr-success, #22c55e);
        }

        .ev-toast--error {
          border-left: 4px solid var(--clr-danger, #ef4444);
        }
        .ev-toast--error .ev-toast__icon {
          color: var(--clr-danger, #ef4444);
        }

        .ev-toast--warning {
          border-left: 4px solid var(--clr-accent, #f59e0b);
        }
        .ev-toast--warning .ev-toast__icon {
          color: var(--clr-accent, #f59e0b);
        }

        .ev-toast--info {
          border-left: 4px solid var(--clr-primary, #3b82f6);
        }
        .ev-toast--info .ev-toast__icon {
          color: var(--clr-primary, #3b82f6);
        }

        .ev-toast__icon {
          flex-shrink: 0;
          font-size: 1.125rem;
          font-weight: 700;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ev-toast__message {
          flex: 1;
          min-width: 0;
        }

        .ev-toast__dismiss {
          flex-shrink: 0;
          background: none;
          border: none;
          color: var(--clr-text-muted, #888);
          cursor: pointer;
          padding: 0.25rem;
          font-size: 0.75rem;
          line-height: 1;
          border-radius: var(--radius-sm, 8px);
          transition: color 0.2s, background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
        }

        .ev-toast__dismiss:hover {
          color: var(--clr-text, #fff);
          background: rgba(255, 255, 255, 0.1);
        }

        @keyframes ev-toast-enter {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes ev-toast-exit {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
        }

        @media (max-width: 480px) {
          .ev-toast-container {
            top: auto;
            bottom: 1rem;
            right: 0.5rem;
            left: 0.5rem;
            width: auto;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastIdCounter;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      // Keep only the most recent MAX_TOASTS
      if (next.length > MAX_TOASTS) {
        return next.slice(next.length - MAX_TOASTS);
      }
      return next;
    });
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export { ToastContext };
