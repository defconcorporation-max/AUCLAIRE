import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Subscribes to Supabase Realtime changes on key tables
 * and automatically invalidates the corresponding React Query caches.
 * This gives all users live updates without manual polling.
 */
export function useRealtimeSync() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Channel for all important table changes
        const channel = supabase
            .channel('realtime-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                queryClient.invalidateQueries({ queryKey: ['projects'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
                queryClient.invalidateQueries({ queryKey: ['expenses'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
                queryClient.invalidateQueries({ queryKey: ['activities_all'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
                queryClient.invalidateQueries({ queryKey: ['clients'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                queryClient.invalidateQueries({ queryKey: ['users'] });
                queryClient.invalidateQueries({ queryKey: ['profiles'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
}
