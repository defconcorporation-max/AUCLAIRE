import { useToast } from './use-toast';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function Toaster() {
    const { toasts, dismiss } = useToast();

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto flex items-start gap-3 p-4 pr-8 rounded-lg border shadow-lg transition-all animate-in slide-in-from-right-full w-[350px]
                        ${toast.variant === 'destructive' ? 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-900 dark:text-red-200' :
                            toast.variant === 'success' ? 'bg-green-50 dark:bg-green-950/40 border-green-200 text-green-900 dark:text-green-200' :
                                'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'}
                    `}
                >
                    <div className="mt-0.5 shrink-0">
                        {toast.variant === 'destructive' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {toast.variant === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {(!toast.variant || toast.variant === 'default') && <Info className="w-5 h-5 text-luxury-gold" />}
                    </div>
                    <div className="grid gap-1">
                        {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
                        {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
                    </div>
                    <button
                        onClick={() => dismiss(toast.id)}
                        className="absolute right-2 top-2 p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
