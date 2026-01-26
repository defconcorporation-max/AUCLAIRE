// import { useAuth } from "@/context/AuthContext";

export interface ActivityLog {
    id: string;
    project_id?: string;
    user_id: string;
    user_name: string;
    action: 'status_change' | 'update' | 'create' | 'delete' | 'comment' | 'approval';
    details: string;
    created_at: string;
}

// MOCK STORE
let mockActivities: ActivityLog[] = [
    {
        id: '1',
        project_id: '1',
        user_id: '2',
        user_name: 'Admin User',
        action: 'create',
        details: 'Created project "Test Project"',
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
];

const LOCAL_STORAGE_KEY = 'auclaire_mock_activities';

const loadMockData = () => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        mockActivities = JSON.parse(stored);
    }
};

const saveMockData = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockActivities));
};

export const apiActivities = {
    async getAll() {
        loadMockData();
        return mockActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async getByProject(projectId: string) {
        loadMockData();
        return mockActivities
            .filter(a => a.project_id === projectId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async log(activity: Omit<ActivityLog, 'id' | 'created_at'>) {
        loadMockData();
        const newActivity: ActivityLog = {
            id: Math.random().toString(36).substring(7),
            created_at: new Date().toISOString(),
            ...activity
        };
        mockActivities.push(newActivity);
        saveMockData();
        return newActivity;
    }
};
