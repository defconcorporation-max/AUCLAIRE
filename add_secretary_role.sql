-- 1. DROP the existing role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. ADD the updated check constraint including 'secretary'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manufacturer', 'client', 'sales_agent', 'pending', 'affiliate', 'secretary'));

-- 3. Ensure the handle_new_user function can handle the 'secretary' role
-- (The existing function using COALESCE is already flexible, but good to keep in mind)
