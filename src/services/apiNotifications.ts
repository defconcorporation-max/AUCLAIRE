// import { supabase } from "@/lib/supabase"; // Commented out until real backend integration

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

// MOCK STORE
let mockNotifications: Notification[] = [
    {
        id: '1',
        user_id: '1', // Admin
        title: 'Welcome!',
        message: 'Welcome to your new CRM Dashboard.',
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
        loadMockData();
        // In real app: await supabase.from('notifications').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
        return [...mockNotifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async getUnreadCount() {
        loadMockData();
        return mockNotifications.filter(n => !n.is_read).length;
    },

    async markAllRead() {
        loadMockData();
        mockNotifications = mockNotifications.map(n => ({ ...n, is_read: true }));
        saveMockData();
        return true;
    },

    async create(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
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
};
