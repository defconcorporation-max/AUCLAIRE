-- FIX INFINITE RECURSION IN RLS

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. Create a specific function to check admin status
-- SECURITY DEFINER means this function runs with the privileges of the creator (superuser/admin),
-- bypassing RLS checks. This breaks the recursion loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the policy using the safe function
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        public.is_admin()
    );

-- 4. Also ensure users can read their OWN profile (essential for is_admin to work if not using security definer, but good practice anyway)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
    );
