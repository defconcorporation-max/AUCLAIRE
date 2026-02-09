-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category TEXT NOT NULL CHECK (category IN ('commission', 'operational', 'material', 'marketing', 'salary', 'software', 'other')),
    description TEXT,
    amount NUMERIC NOT NULL,
    recipient_id UUID REFERENCES public.profiles(id), -- Who got paid (if applicable)
    project_id UUID REFERENCES public.projects(id), -- Linked project (if applicable)
    status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all expenses" ON public.expenses
    FOR SELECT USING (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert expenses" ON public.expenses
    FOR INSERT WITH CHECK (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update expenses" ON public.expenses
    FOR UPDATE USING (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete expenses" ON public.expenses
    FOR DELETE USING (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Affiliates can view their own payouts
CREATE POLICY "Affiliates can view own payouts" ON public.expenses
    FOR SELECT USING (
        auth.uid() = recipient_id
    );
