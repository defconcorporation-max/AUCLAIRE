-- Add payment_history JSONB column to invoices table
-- Stores an array of payment entries: [{id, amount, date, note}]
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]'::jsonb;
