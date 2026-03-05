-- Fix RLS for expenses table: open access like other tables
-- (The expense table was accidentally created with restrictive admin-only policies)

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Admins can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Affiliates can view own payouts" ON public.expenses;
DROP POLICY IF EXISTS "Hybrid Access Expenses" ON public.expenses;

-- Create open hybrid policy (same as clients, projects, invoices)
CREATE POLICY "Hybrid Access Expenses"
  ON public.expenses FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions to anonymous role
GRANT ALL ON public.expenses TO anon;
GRANT ALL ON public.expenses TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
