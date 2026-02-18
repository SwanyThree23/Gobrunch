import React from 'react';
import { useToast } from './use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-in',
            toast.variant === 'destructive'
              ? 'bg-destructive text-destructive-foreground border-destructive'
              : toast.variant === 'success'
                ? 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800'
                : 'bg-card text-card-foreground'
          )}
        >
          <div className="flex-1">
            {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
            {toast.description && (
              <p className="text-sm opacity-90 mt-1">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
