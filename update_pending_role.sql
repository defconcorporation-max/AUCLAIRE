-- 1. Update the Check Constraint to allow 'pending'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manufacturer', 'client', 'sales_agent', 'pending'));

-- 2. Update the Trigger Function to default to 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'pending');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
