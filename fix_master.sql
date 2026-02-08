-- ===========================================
-- MASTER FIX FOR AFFILIATE SYSTEM
-- ===========================================

-- 1. ADD Affiliate columns to PROFILES (if missing)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS affiliate_status text DEFAULT 'pending' CHECK (affiliate_status IN ('pending', 'active', 'rejected')),
ADD COLUMN IF NOT EXISTS affiliate_level text DEFAULT 'starter' CHECK (affiliate_level IN ('starter', 'confirmed', 'elite', 'partner')),
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS commission_type text DEFAULT 'percent' CHECK (commission_type IN ('percent', 'fixed'));

-- 2. ADD Affiliate columns to PROJECTS (CRITICAL)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS affiliate_commission_rate numeric,
ADD COLUMN IF NOT EXISTS affiliate_commission_type text;

-- 3. FIX ROLE CONSTRAINTS (Allow 'affiliate', 'pending')
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manufacturer', 'client', 'sales_agent', 'pending', 'affiliate'));

-- 4. FIX POLICIES
-- Ensure Affiliates can see their assigned projects
CREATE POLICY "Affiliates can view assigned projects"
ON projects FOR SELECT
USING (auth.uid() = affiliate_id);

-- 5. FIX NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, affiliate_status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'pending'),
    COALESCE(new.raw_user_meta_data->>'affiliate_status', 'pending')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
