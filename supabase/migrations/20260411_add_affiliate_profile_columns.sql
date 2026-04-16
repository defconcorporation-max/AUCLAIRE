-- Migration adding missing affiliate profile columns and leads references

-- 1. Missing columns on profiles for the RBAC system and commission structure
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS participant_type TEXT CHECK (participant_type IN ('affiliate', 'ambassador', 'seller')),
ADD COLUMN IF NOT EXISTS affiliate_status TEXT CHECK (affiliate_status IN ('pending', 'active', 'rejected')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS affiliate_level TEXT CHECK (affiliate_level IN ('starter', 'confirmed', 'elite', 'partner')) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS commission_type TEXT CHECK (commission_type IN ('percent', 'fixed')) DEFAULT 'percent';

-- 2. Missing columns on leads for affiliate tracking
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS affiliate_source TEXT;
