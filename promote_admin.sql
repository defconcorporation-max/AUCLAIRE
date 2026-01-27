-- Run this in your Supabase SQL Editor to make yourself an Admin
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'dorian2992@hotmail.fr'
);

-- Init Settings just in case
INSERT INTO public.settings (id, company_name) VALUES (1, 'Auclaire Jewelry') ON CONFLICT (id) DO NOTHING;
