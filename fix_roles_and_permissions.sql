-- 1. DROP the restrictive check constraint on roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. ADD a new, more inclusive check constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manufacturer', 'client', 'sales_agent', 'pending', 'affiliate'));

-- 3. UPDATE the handle_new_user function to respect metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, affiliate_status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'pending'), -- Default to 'pending' if no role provided
    COALESCE(new.raw_user_meta_data->>'affiliate_status', 'pending') -- Capture affiliate status
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. UPDATE EXISTING USERS (Optional cleanup)
-- Ensure any existing 'pending' users are not blocked by old constraints (handled by step 1 & 2)
