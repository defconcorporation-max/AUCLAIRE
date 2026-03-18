import { useState, useEffect, useCallback } from 'react';

interface PendingAction {
    id: string;
    type: string;
    table: string;
    data: any;
    timestamp: number;
}

const QUEUE_KEY = 'auclaire_offline_queue';
const CACHE_KEY = 'auclaire_data_cache';

export function useOfflineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        updatePendingCount();
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const updatePendingCount = () => {
        try {
            const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            setPendingCount(queue.length);
        } catch { setPendingCount(0); }
    };

    const addToQueue = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
        try {
            const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            queue.push({ ...action, id: crypto.randomUUID(), timestamp: Date.now() });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            updatePendingCount();
        } catch (e) { console.error('Failed to queue action', e); }
    }, []);

    const getQueue = useCallback((): PendingAction[] => {
        try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
        catch { return []; }
    }, []);

    const clearQueue = useCallback(() => {
        localStorage.setItem(QUEUE_KEY, '[]');
        setPendingCount(0);
    }, []);

    const cacheData = useCallback((key: string, data: any) => {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            cache[key] = { data, cachedAt: Date.now() };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (e) { console.error('Cache write failed', e); }
    }, []);

    const getCachedData = useCallback((key: string, maxAgeMs: number = 3600000): any => {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            const entry = cache[key];
            if (entry && (Date.now() - entry.cachedAt) < maxAgeMs) return entry.data;
            return null;
        } catch { return null; }
    }, []);

    return { isOnline, pendingCount, isSyncing, setIsSyncing, addToQueue, getQueue, clearQueue, cacheData, getCachedData };
}
