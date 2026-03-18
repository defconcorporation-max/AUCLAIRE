-- Add jewelry_type to projects (optional, for analytics and project type selector)
-- Run this in Supabase SQL Editor if you see: "Could not find the 'jewelry_type' column of 'projects' in the schema cache"

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS jewelry_type text;

COMMENT ON COLUMN public.projects.jewelry_type IS 'Type de bijou: Bague, Bracelet, Collier, Pendentif, Boucles d''oreilles, Chevalière, Alliance, Autre';
