-- Add ai_summary column to info_items table
ALTER TABLE public.info_items 
ADD COLUMN IF NOT EXISTS ai_summary TEXT;
