-- Migration to add priority column to projects table
-- This allows projects to be flagged as 'rush'

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('normal', 'rush')) DEFAULT 'normal';
