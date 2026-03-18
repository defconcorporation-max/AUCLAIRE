import { supabase } from '@/lib/supabase';

export interface ChatMessage {
    id: string;
    project_id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    message: string;
    channel: 'internal' | 'client';
    created_at: string;
}

export const apiChats = {
    async getByProject(projectId: string, channel: 'internal' | 'client') {
        const { data, error } = await supabase
            .from('project_chats')
            .select('*')
            .eq('project_id', projectId)
            .eq('channel', channel)
            .order('created_at', { ascending: true });

        if (error) {
            console.error(`Error fetching ${channel} chat:`, error);
            return [];
        }

        return data as ChatMessage[];
    },

    async getLatestPerProject(): Promise<Record<string, string>> {
        const { data, error } = await supabase
            .from('project_chats')
            .select('project_id, created_at')
            .eq('channel', 'internal')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching latest messages:', error);
            return {};
        }

        const latest: Record<string, string> = {};
        for (const msg of data) {
            if (!latest[msg.project_id]) {
                latest[msg.project_id] = msg.created_at;
            }
        }
        return latest;
    },

    async send(message: Omit<ChatMessage, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('project_chats')
            .insert(message)
            .select()
            .single();

        if (error) {
            console.error("Error sending message:", error);
            throw error;
        }

        return data as ChatMessage;
    }
};
