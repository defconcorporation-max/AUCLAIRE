-- CRM Schema for Auclaire App
-- Run this in your Supabase SQL Editor

-- 1. Create LEADS table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost')),
    source TEXT DEFAULT 'manual' CHECK (source IN ('facebook', 'website', 'manual')),
    value NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    fb_leadgen_id TEXT UNIQUE -- To prevent duplicate webhook inserts
);

-- 2. Create CALLS/INTERACTIONS table
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('incoming', 'outgoing')),
    duration_seconds INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'missed', 'voicemail', 'failed')),
    recording_url TEXT,
    notes TEXT,
    twilio_call_sid TEXT UNIQUE
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Leads
DROP POLICY IF EXISTS "Admins and Sales can do everything on leads" ON public.leads;
CREATE POLICY "Admins and Sales can do everything on leads" ON public.leads
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
      )
    );

-- RLS Policies for Calls
DROP POLICY IF EXISTS "Admins and Sales can do everything on calls" ON public.calls;
CREATE POLICY "Admins and Sales can do everything on calls" ON public.calls
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
      )
    );

-- Create Realtime publications (Ignore errors if already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'leads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'calls'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
    END IF;
END $$;
