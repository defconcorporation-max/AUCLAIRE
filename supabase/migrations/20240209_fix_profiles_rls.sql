-- Allow Admins to view ALL profiles (fix for Affiliates List)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        (select role from public.profiles where id = auth.uid()) = 'admin'
    );
