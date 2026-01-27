-- FIX PERMISSIONS AND CONSTRAINTS

-- 1. Enable ON DELETE CASCADE for all Foreign Keys
-- This allows deleting a Client to automatically delete their Projects, 
-- and deleting a Project to automatically delete Invoices.
-- This fixes the "Can't delete anything" error due to dependencies.

ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_client_id_fkey;

ALTER TABLE projects
ADD CONSTRAINT projects_client_id_fkey
FOREIGN KEY (client_id) REFERENCES clients(id)
ON DELETE CASCADE;

ALTER TABLE invoices
DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;

ALTER TABLE invoices
ADD CONSTRAINT invoices_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id)
ON DELETE CASCADE;

-- 2. Ensure RLS Policies are truly Open for the Shared/Anon user
-- Drop existing policies to be safe and recreate them with full permissions.

-- Clients
DROP POLICY IF EXISTS "Hybrid Access Clients" ON clients;
CREATE POLICY "Hybrid Access Clients" ON clients FOR ALL USING (true) WITH CHECK (true);

-- Projects
DROP POLICY IF EXISTS "Hybrid Access Projects" ON projects;
CREATE POLICY "Hybrid Access Projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Invoices
DROP POLICY IF EXISTS "Hybrid Access Invoices" ON invoices;
CREATE POLICY "Hybrid Access Invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "Hybrid Access Profiles" ON profiles;
CREATE POLICY "Hybrid Access Profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- 3. Grant Permissions to Anonymous Role (just in case)
GRANT ALL ON clients TO anon;
GRANT ALL ON projects TO anon;
GRANT ALL ON invoices TO anon;
GRANT ALL ON profiles TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
