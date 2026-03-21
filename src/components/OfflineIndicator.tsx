import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export function OfflineIndicator() {
    const { t } = useTranslation();
    const { isOnline, pendingCount, isSyncing, setIsSyncing, getQueue, clearQueue } = useOfflineStatus();

    const syncPending = async () => {
        const queue = getQueue();
        if (queue.length === 0) return;

        setIsSyncing(true);
        let synced = 0;
        let failed = 0;

        for (const action of queue) {
            try {
                if (action.type === 'insert') {
                    await supabase.from(action.table).insert(action.data);
                } else if (action.type === 'update') {
                    const payload = action.data as { updates: Record<string, unknown>; id: string };
                    await supabase.from(action.table).update(payload.updates).eq('id', payload.id);
                } else if (action.type === 'delete') {
                    const payload = action.data as { id: string };
                    await supabase.from(action.table).delete().eq('id', payload.id);
                }
                synced++;
            } catch (e) {
                console.error('Sync failed for action', action, e);
                failed++;
            }
        }

        clearQueue();
        setIsSyncing(false);

        if (synced > 0) {
            toast({
                title: t('offline.synced', { count: synced }),
                description: failed > 0 ? t('offline.failed', { count: failed }) : undefined,
            });
        }
    };

    if (isOnline && pendingCount === 0) {
        return (
            <div className="flex items-center gap-1.5 text-green-500/60" title={t('offline.onlineTooltip')}>
                <Cloud className="w-3.5 h-3.5" />
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{t('offline.offline')}</span>
                {pendingCount > 0 && (
                    <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded text-[10px] font-bold">{pendingCount}</span>
                )}
            </div>
        );
    }

    if (pendingCount > 0) {
        return (
            <button
                type="button"
                onClick={syncPending}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium">
                    {isSyncing ? t('offline.syncing') : t('offline.pending', { count: pendingCount })}
                </span>
            </button>
        );
    }

    return null;
}
