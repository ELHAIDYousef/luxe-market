import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Icon from './Icon';

interface Toast { id: number; message: string; type: 'success'|'error'|'info'; icon?: string; }
interface ToastCtx { show: (msg: string, type?: Toast['type'], icon?: string) => void; }

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast['type'] = 'success', icon?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  const ICON: Record<Toast['type'], string> = {
    success: 'check_circle', error: 'error', info: 'info'
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.icon ?? ICON[t.type]} size={20} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};
