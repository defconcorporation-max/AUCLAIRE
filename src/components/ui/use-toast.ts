import { useState, useCallback, useEffect } from 'react';

export type ToastProps = {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
};

let memoryState: ToastProps[] = [];
let listeners: Array<(state: ToastProps[]) => void> = [];

export const toast = (props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...props, id };
    memoryState = [...memoryState, newToast];
    listeners.forEach(listener => listener(memoryState));

    setTimeout(() => {
        memoryState = memoryState.filter(t => t.id !== id);
        listeners.forEach(listener => listener(memoryState));
    }, 5000);
};

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastProps[]>(memoryState);

    useEffect(() => {
        listeners.push(setToasts);
        return () => {
            listeners = listeners.filter(l => l !== setToasts);
        };
    }, []);

    const dismiss = useCallback((id: string) => {
        memoryState = memoryState.filter(t => t.id !== id);
        listeners.forEach(listener => listener(memoryState));
    }, []);

    return { toasts, dismiss };
};
