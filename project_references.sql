-- 1. Create a sequence for project reference numbers
CREATE SEQUENCE IF NOT EXISTS public.project_ref_seq START 1;

-- 2. Add the column to the projects table (if it doesn't exist)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reference_number VARCHAR(20) UNIQUE;

-- 3. Create a function to auto-assign the reference number
CREATE OR REPLACE FUNCTION public.set_project_reference_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
        NEW.reference_number := 'PRJ-' || LPAD(nextval('public.project_ref_seq')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger on the projects table
DROP TRIGGER IF EXISTS trigger_set_project_reference_number ON public.projects;
CREATE TRIGGER trigger_set_project_reference_number
    BEFORE INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.set_project_reference_number();

-- 5. Backfill existing projects with reference numbers
-- This will assign PRJ-001, PRJ-002 etc. to existing projects that don't have one
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM public.projects WHERE reference_number IS NULL ORDER BY created_at ASC
    LOOP
        UPDATE public.projects
        SET reference_number = 'PRJ-' || LPAD(nextval('public.project_ref_seq')::TEXT, 3, '0')
        WHERE id = project_record.id;
    END LOOP;
END;
$$;
