CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'other',
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    rating INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');
