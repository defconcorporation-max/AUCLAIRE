-- 1. Add email column to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill existing emails from auth.users
-- This works because you are running this as a dashboard admin/superuser
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.email IS NULL;

-- 3. Create or Update the trigger verification function
-- CAUTION: This assumes you have a standard 'handle_new_user' function.
-- If not, we create a specific one for email syncing to be safe and avoiding overwrites.

CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile exists, if so update email
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  -- If profile doesn't exist, the existing primary trigger should handle insertion, 
  -- but we can try to insert if missing (optional safety net)
  ELSE
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'client');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();

-- 5. Confirmation
SELECT count(*) as profiles_with_email FROM public.profiles WHERE email IS NOT NULL;
