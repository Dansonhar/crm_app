import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  error: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  info: 'border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-400',
};

const variantIcons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      idCounter += 1;
      const id = `toast-${idCounter}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => removeToast(id), 3800);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((toast) => {
          const Icon = variantIcons[toast.variant];
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-2.5 rounded-xl border bg-white p-3.5 shadow-xl dark:bg-surface-900',
                variantStyles[toast.variant],
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
