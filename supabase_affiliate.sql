-- Add Affiliate columns to Profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS affiliate_status text DEFAULT 'pending' CHECK (affiliate_status IN ('pending', 'active', 'rejected')),
ADD COLUMN IF NOT EXISTS affiliate_level text DEFAULT 'starter' CHECK (affiliate_level IN ('starter', 'confirmed', 'elite', 'partner')),
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS commission_type text DEFAULT 'percent' CHECK (commission_type IN ('percent', 'fixed'));

-- Add Affiliate columns to Projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS affiliate_commission_rate numeric,
ADD COLUMN IF NOT EXISTS affiliate_commission_type text;

-- Policy Updates (if RLS is enabled)
-- Ensure Affiliates can view their own profile (usually covered by "Users can view own profile")
-- ensure Affiliates can view projects where affiliate_id = auth.uid()

CREATE POLICY "Affiliates can view assigned projects"
ON projects FOR SELECT
USING (auth.uid() = affiliate_id);
