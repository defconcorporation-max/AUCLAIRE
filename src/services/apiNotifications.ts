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
    async getAll() {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) {
            console.warn("Using Mock Data for Notifications");
            loadMockData();
            return [...mockNotifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return data as Notification[];
    },

    async getUnreadCount() {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (error) {
            loadMockData();
            return mockNotifications.filter(n => !n.is_read).length;
        }
        return count || 0;
    },

    async markAllRead() {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false); // Updates all unread

        if (error) {
            loadMockData();
            mockNotifications = mockNotifications.map(n => ({ ...n, is_read: true }));
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
