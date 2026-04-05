-- ============================================
-- MARKETING & ADMIN MODULE - Database Migration
-- ============================================

-- 1. MARKETING IDEAS
CREATE TABLE IF NOT EXISTS public.marketing_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'video' CHECK (type IN ('video', 'photo', 'reel', 'story', 'other')),
    script TEXT,
    inspiration_urls JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scripted', 'filming', 'editing', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MARKETING COLLABORATIONS
CREATE TABLE IF NOT EXISTS public.marketing_collaborations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'influencer' CHECK (type IN ('influencer', 'brand', 'media', 'other')),
    avatar_url TEXT,
    social_links JSONB DEFAULT '[]'::jsonb,
    partnership_details TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'contacted', 'negotiating', 'active', 'completed', 'declined')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MARKETING CAMPAIGNS (Roadmap)
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'other' CHECK (type IN ('collaboration', 'ad', 'contest', 'launch', 'event', 'other')),
    status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'planning', 'active', 'paused', 'completed')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    budget NUMERIC(10, 2) DEFAULT 0,
    results TEXT,
    notes TEXT,
    tasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MARKETING ACCOUNTS (Social Media)
CREATE TABLE IF NOT EXISTS public.marketing_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL,
    username TEXT NOT NULL,
    url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. WEBSITE TASKS
CREATE TABLE IF NOT EXISTS public.website_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE RLS
ALTER TABLE public.marketing_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_tasks ENABLE ROW LEVEL SECURITY;

-- HYBRID POLICIES (matching project pattern)
CREATE POLICY "Hybrid Access marketing_ideas" ON public.marketing_ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Hybrid Access marketing_collaborations" ON public.marketing_collaborations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Hybrid Access marketing_campaigns" ON public.marketing_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Hybrid Access marketing_accounts" ON public.marketing_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Hybrid Access website_tasks" ON public.website_tasks FOR ALL USING (true) WITH CHECK (true);
