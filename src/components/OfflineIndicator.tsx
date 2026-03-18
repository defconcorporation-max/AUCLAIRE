import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export function OfflineIndicator() {
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
                    await supabase.from(action.table).update(action.data.updates).eq('id', action.data.id);
                } else if (action.type === 'delete') {
                    await supabase.from(action.table).delete().eq('id', action.data.id);
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
                title: `${synced} action${synced > 1 ? 's' : ''} synchronisée${synced > 1 ? 's' : ''}`,
                description: failed > 0 ? `${failed} échouée(s)` : undefined,
            });
        }
    };

    if (isOnline && pendingCount === 0) {
        return (
            <div className="flex items-center gap-1.5 text-green-500/60" title="En ligne">
                <Cloud className="w-3.5 h-3.5" />
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Hors ligne</span>
                {pendingCount > 0 && (
                    <span className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded text-[10px] font-bold">{pendingCount}</span>
                )}
            </div>
        );
    }

    if (pendingCount > 0) {
        return (
            <button
                onClick={syncPending}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium">{isSyncing ? 'Sync...' : `${pendingCount} en attente`}</span>
            </button>
        );
    }

    return null;
}
