import { supabase } from '@/lib/supabase';

// ====== TYPES ======

export interface MarketingIdea {
    id: string;
    title: string;
    type: 'video' | 'photo' | 'reel' | 'story' | 'other';
    script?: string;
    inspiration_urls?: string[];
    notes?: string;
    status: 'draft' | 'scripted' | 'filming' | 'editing' | 'published';
    created_at: string;
    updated_at: string;
}

export interface MarketingCollaboration {
    id: string;
    name: string;
    type: 'influencer' | 'brand' | 'media' | 'other';
    avatar_url?: string;
    social_links?: { platform: string; url: string; username: string }[];
    partnership_details?: string;
    contact_email?: string;
    contact_phone?: string;
    status: 'prospect' | 'contacted' | 'negotiating' | 'active' | 'completed' | 'declined';
    notes?: string;
    follow_up_date?: string;
    reach_out_count: number;
    last_contacted_at?: string;
    created_at: string;
    updated_at: string;
}

export interface MarketingExecutionLog {
    id: string;
    date: string;
    task_id: string;
    status: 'completed' | 'skipped';
    notes?: string;
    metadata?: any;
    created_at: string;
}

export interface MarketingCampaign {
    id: string;
    name: string;
    description?: string;
    type: 'collaboration' | 'ad' | 'contest' | 'launch' | 'event' | 'other';
    status: 'idea' | 'planning' | 'active' | 'paused' | 'completed';
    start_date?: string;
    end_date?: string;
    budget?: number;
    results?: string;
    notes?: string;
    tasks?: { text: string; done: boolean }[];
    created_at: string;
    updated_at: string;
}

export interface MarketingAccount {
    id: string;
    platform: string;
    username: string;
    url: string;
    notes?: string;
    created_at: string;
}

export interface WebsiteTask {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
}

// ====== API ======

export const apiMarketing = {
    // --- IDEAS ---
    async getIdeas() {
        const { data, error } = await supabase
            .from('marketing_ideas')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as MarketingIdea[];
    },
    async createIdea(idea: Partial<MarketingIdea>) {
        const { data, error } = await supabase
            .from('marketing_ideas')
            .insert([{ ...idea, updated_at: new Date().toISOString() }])
            .select()
            .single();
        if (error) throw error;
        return data as MarketingIdea;
    },
    async updateIdea(id: string, updates: Partial<MarketingIdea>) {
        const { data, error } = await supabase
            .from('marketing_ideas')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as MarketingIdea;
    },
    async deleteIdea(id: string) {
        const { error } = await supabase.from('marketing_ideas').delete().eq('id', id);
        if (error) throw error;
    },

    // --- COLLABORATIONS ---
    async getCollaborations() {
        const { data, error } = await supabase
            .from('marketing_collaborations')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as MarketingCollaboration[];
    },
    async createCollaboration(collab: Partial<MarketingCollaboration>) {
        const { data, error } = await supabase
            .from('marketing_collaborations')
            .insert([{ ...collab, updated_at: new Date().toISOString() }])
            .select()
            .single();
        if (error) throw error;
        return data as MarketingCollaboration;
    },
    async updateCollaboration(id: string, updates: Partial<MarketingCollaboration>) {
        const { data, error } = await supabase
            .from('marketing_collaborations')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as MarketingCollaboration;
    },
    async deleteCollaboration(id: string) {
        const { error } = await supabase.from('marketing_collaborations').delete().eq('id', id);
        if (error) throw error;
    },

    // --- CAMPAIGNS ---
    async getCampaigns() {
        const { data, error } = await supabase
            .from('marketing_campaigns')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as MarketingCampaign[];
    },
    async createCampaign(campaign: Partial<MarketingCampaign>) {
        const { data, error } = await supabase
            .from('marketing_campaigns')
            .insert([{ ...campaign, updated_at: new Date().toISOString() }])
            .select()
            .single();
        if (error) throw error;
        return data as MarketingCampaign;
    },
    async updateCampaign(id: string, updates: Partial<MarketingCampaign>) {
        const { data, error } = await supabase
            .from('marketing_campaigns')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as MarketingCampaign;
    },
    async deleteCampaign(id: string) {
        const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
        if (error) throw error;
    },

    // --- ACCOUNTS ---
    async getAccounts() {
        const { data, error } = await supabase
            .from('marketing_accounts')
            .select('*')
            .order('platform', { ascending: true });
        if (error) throw error;
        return data as MarketingAccount[];
    },
    async createAccount(account: Partial<MarketingAccount>) {
        const { data, error } = await supabase
            .from('marketing_accounts')
            .insert([account])
            .select()
            .single();
        if (error) throw error;
        return data as MarketingAccount;
    },
    async updateAccount(id: string, updates: Partial<MarketingAccount>) {
        const { data, error } = await supabase
            .from('marketing_accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as MarketingAccount;
    },
    async deleteAccount(id: string) {
        const { error } = await supabase.from('marketing_accounts').delete().eq('id', id);
        if (error) throw error;
    },

    // --- WEBSITE TASKS ---
    async getWebsiteTasks() {
        const { data, error } = await supabase
            .from('website_tasks')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as WebsiteTask[];
    },
    async createWebsiteTask(task: Partial<WebsiteTask>) {
        const { data, error } = await supabase
            .from('website_tasks')
            .insert([{ ...task, updated_at: new Date().toISOString() }])
            .select()
            .single();
        if (error) throw error;
        return data as WebsiteTask;
    },
    async updateWebsiteTask(id: string, updates: Partial<WebsiteTask>) {
        const { data, error } = await supabase
            .from('website_tasks')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as WebsiteTask;
    },
    async deleteWebsiteTask(id: string) {
        const { error } = await supabase.from('website_tasks').delete().eq('id', id);
        if (error) throw error;
    },

    // --- EXECUTION LOGS ---
    async getExecutionLogs(date: string) {
        const { data, error } = await supabase
            .from('marketing_execution_logs')
            .select('*')
            .eq('date', date);
        if (error) throw error;
        return data as MarketingExecutionLog[];
    },
    async logTaskExecution(log: Partial<MarketingExecutionLog>) {
        const { data, error } = await supabase
            .from('marketing_execution_logs')
            .upsert([log], { onConflict: 'date,task_id' })
            .select()
            .single();
        if (error) throw error;
        return data as MarketingExecutionLog;
    },
};
