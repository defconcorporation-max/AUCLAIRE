-- Migration adding monthly_goal column to profiles table
-- This allows admins to define personal sales targets for affiliates

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_goal NUMERIC(10, 2) DEFAULT 50000;
