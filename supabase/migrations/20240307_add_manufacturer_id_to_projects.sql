-- Add manufacturer_id to projects table
-- This allows assigning specific manufacturers to specific projects

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_projects_manufacturer_id ON public.projects(manufacturer_id);

-- Allow manufacturers to read their own assigned projects
-- (Admin already has full access via existing policy)
DROP POLICY IF EXISTS "Manufacturers can view assigned projects" ON public.projects;
CREATE POLICY "Manufacturers can view assigned projects" ON public.projects
    FOR SELECT USING (
        manufacturer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
