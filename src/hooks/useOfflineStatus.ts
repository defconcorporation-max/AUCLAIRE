import { useState, useEffect, useCallback } from 'react';

interface PendingAction {
    id: string;
    type: string;
    table: string;
    data: unknown;
    timestamp: number;
}

const QUEUE_KEY = 'auclaire_offline_queue';
const CACHE_KEY = 'auclaire_data_cache';
type CacheEntry = { data: unknown; cachedAt: number };
type CacheStore = Record<string, CacheEntry>;

function parseJson<T>(raw: string | null, fallback: T): T {
    try {
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function readPendingQueueLength(): number {
    return parseJson<PendingAction[]>(localStorage.getItem(QUEUE_KEY), []).length;
}

export function useOfflineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(readPendingQueueLength);
    const [isSyncing, setIsSyncing] = useState(false);

    const updatePendingCount = useCallback(() => {
        setPendingCount(readPendingQueueLength());
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const addToQueue = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
        try {
            const queue = parseJson<PendingAction[]>(localStorage.getItem(QUEUE_KEY), []);
            queue.push({ ...action, id: crypto.randomUUID(), timestamp: Date.now() });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            updatePendingCount();
        } catch (e) { console.error('Failed to queue action', e); }
    }, [updatePendingCount]);

    const getQueue = useCallback((): PendingAction[] => {
        return parseJson<PendingAction[]>(localStorage.getItem(QUEUE_KEY), []);
    }, []);

    const clearQueue = useCallback(() => {
        localStorage.setItem(QUEUE_KEY, '[]');
        setPendingCount(0);
    }, []);

    const cacheData = useCallback((key: string, data: unknown) => {
        try {
            const cache = parseJson<CacheStore>(localStorage.getItem(CACHE_KEY), {});
            cache[key] = { data, cachedAt: Date.now() };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (e) { console.error('Cache write failed', e); }
    }, []);

    const getCachedData = useCallback((key: string, maxAgeMs: number = 3600000): unknown => {
        const cache = parseJson<CacheStore>(localStorage.getItem(CACHE_KEY), {});
        const entry = cache[key];
        if (entry && (Date.now() - entry.cachedAt) < maxAgeMs) return entry.data;
        return null;
    }, []);

    return { isOnline, pendingCount, isSyncing, setIsSyncing, addToQueue, getQueue, clearQueue, cacheData, getCachedData };
}
