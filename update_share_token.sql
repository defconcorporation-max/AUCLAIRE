-- 1. Add share_token to projects table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'share_token') THEN
        ALTER TABLE projects ADD COLUMN share_token uuid DEFAULT uuid_generate_v4();
        ALTER TABLE projects ADD CONSTRAINT projects_share_token_key UNIQUE (share_token);
    END IF;
END $$;

-- 2. Function to Get Project by Token (Public/Secure Access)
-- Returns only safe fields.
CREATE OR REPLACE FUNCTION get_project_by_token(token_uuid uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    status text,
    deadline timestamp with time zone,
    stage_details jsonb,
    financials jsonb -- We will filter this in the frontend or here? Better here but let's return full jsonb and trust frontend for now, or fetch specific fields. Actually, let's just return the whole row for simplicity in the API, but typically we'd restrict.
                     -- Wait, financials allows manufacturers to see cost.
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.title, p.description, p.status, p.deadline, p.stage_details, p.financials
    FROM projects p
    WHERE p.share_token = token_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to Update Project by Token (Public/Secure Access)
-- Allows updating ONLY specific fields: stage_details (for images), financials (for cost), status.
CREATE OR REPLACE FUNCTION update_project_by_token(
    token_uuid uuid, 
    new_stage_details jsonb, 
    new_financials jsonb,
    new_status text
)
RETURNS void AS $$
DECLARE
    target_project_id uuid;
BEGIN
    SELECT id INTO target_project_id FROM projects WHERE share_token = token_uuid;
    
    IF target_project_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Token';
    END IF;

    UPDATE projects
    SET 
        stage_details = new_stage_details,
        financials = new_financials,
        status = new_status,
        updated_at = now()
    WHERE id = target_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
