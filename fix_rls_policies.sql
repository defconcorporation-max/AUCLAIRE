-- Fix for permissive RLS policies (USING true / WITH CHECK true)
-- This script replaces open policies with proper role-based access control.

-- 1. Profiles (Ensure users can only update their own profile)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 2. Projects (Restrict access to owners, admins, and secretaries)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can do anything" ON projects; -- Cleaning up potential loose policies
CREATE POLICY "Users can view their own projects or as staff" 
ON projects FOR SELECT TO authenticated 
USING (
  auth.uid() = client_id OR 
  auth.uid() = sales_agent_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  )
);

CREATE POLICY "Staff can manage projects" 
ON projects FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  )
);

-- 3. Catalog Tree (Staff only for write, All authenticated for read)
ALTER TABLE catalog_tree ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON catalog_tree;
CREATE POLICY "Catalog is viewable by all authenticated" 
ON catalog_tree FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage catalog" 
ON catalog_tree FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  )
);

-- 4. Invoices (Restrict to client or staff)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices or as staff" 
ON invoices FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = invoices.project_id AND (p.client_id = auth.uid() OR p.sales_agent_id = auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'secretary')
  )
);
