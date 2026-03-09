import { supabase } from "@/lib/supabase";

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

// MOCK STORE (Fallback)
let mockNotifications: Notification[] = [
    {
        id: '1',
        user_id: '1', // Admin
        title: 'Welcome!',
        message: 'Welcome to your new CRM Dashboard. (Mock)',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
    }
];

const LOCAL_STORAGE_KEY = 'auclaire_mock_notifications';

const loadMockData = () => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        mockNotifications = JSON.parse(stored);
    }
};

const saveMockData = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockNotifications));
};

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

        if (error || !data) {
            console.warn("Using Mock Data for Notifications");
            loadMockData();
            let filtered = mockNotifications;
            if (role === 'admin' && userId) {
                filtered = filtered.filter(n => n.user_id === userId || n.user_id === 'admin' || n.user_id === '1');
            } else if (role === 'admin') {
                filtered = filtered.filter(n => n.user_id === 'admin' || n.user_id === '1');
            } else if (userId) {
                filtered = filtered.filter(n => n.user_id === userId);
            }
            return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
            loadMockData();
            let filtered = mockNotifications.filter(n => !n.is_read);
            if (role === 'admin' && userId) {
                filtered = filtered.filter(n => n.user_id === userId || n.user_id === 'admin' || n.user_id === '1');
            } else if (role === 'admin') {
                filtered = filtered.filter(n => n.user_id === 'admin' || n.user_id === '1');
            } else if (userId) {
                filtered = filtered.filter(n => n.user_id === userId);
            }
            return filtered.length;
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
            loadMockData();
            mockNotifications = mockNotifications.map(n => {
                if (!n.is_read) {
                    if (role === 'admin' && (n.user_id === userId || n.user_id === 'admin' || n.user_id === '1')) return { ...n, is_read: true };
                    if (role !== 'admin' && userId && n.user_id === userId) return { ...n, is_read: true };
                }
                return n;
            });
            saveMockData();
            return true;
        }
        return true;
    },

    async create(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
        const { data, error } = await supabase.from('notifications').insert(notification).select().single();

        if (error) {
            console.warn("Using Mock Create for Notification");
            loadMockData(); // Ensure fresh
            const newNotification: Notification = {
                id: Math.random().toString(36).substring(7),
                created_at: new Date().toISOString(),
                is_read: false,
                ...notification
            };
            mockNotifications.push(newNotification);
            saveMockData();
            return newNotification;
        }
        return data;
    }
};
