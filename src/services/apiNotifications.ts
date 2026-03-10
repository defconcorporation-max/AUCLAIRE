import { supabase } from "@/lib/supabase";
import { toast } from '@/components/ui/use-toast';

export interface Notification {
    id: string;
    user_id: string; // The user receiving the notification
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string; // Where to go when clicked
    is_read: boolean;
    created_at: string;
}

export const apiNotifications = {
    async getAll(userId?: string, role?: string) {
        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (role === 'admin' && userId) {
            query = query.in('user_id', [userId, 'admin', '1']);
        } else if (role === 'admin') {
            query = query.in('user_id', ['admin', '1']);
        } else if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            toast({ title: 'Error fetching notifications', description: error.message, variant: 'destructive' });
            throw error;
        }
        return data as Notification[];
    },

    async getUnreadCount(userId?: string, role?: string) {
        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (role === 'admin' && userId) {
            query = query.in('user_id', [userId, 'admin', '1']);
        } else if (role === 'admin') {
            query = query.in('user_id', ['admin', '1']);
        } else if (userId) {
            query = query.eq('user_id', userId);
        }

        const { count, error } = await query;

        if (error) {
            throw error;
        }
        return count || 0;
    },

    async markAllRead(userId?: string, role?: string) {
        let query = supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false); // Updates all unread

        if (role === 'admin' && userId) {
            query = query.in('user_id', [userId, 'admin', '1']);
        } else if (role === 'admin') {
            query = query.in('user_id', ['admin', '1']);
        } else if (userId) {
            query = query.eq('user_id', userId);
        }

        const { error } = await query;

        if (error) {
            toast({ title: 'Error updating notifications', description: error.message, variant: 'destructive' });
            throw error;
        }
        return true;
    },

    async create(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
        const { data, error } = await supabase.from('notifications').insert(notification).select().single();

        if (error) {
            console.error("Error creating notification", error);
            throw error;
        }
        return data;
    }
};
