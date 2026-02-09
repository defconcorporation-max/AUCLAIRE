-- Add Affiliate Columns to Projects Table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS affiliate_commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS affiliate_commission_type TEXT CHECK (affiliate_commission_type IN ('fixed', 'percent')) DEFAULT 'percent';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_projects_affiliate_id ON public.projects(affiliate_id);
