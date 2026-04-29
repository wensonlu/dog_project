-- ============================================
-- Migration: Add missing columns to dogs table
-- 
-- This migration adds the status and updated_at columns
-- that the MCP (Model Context Protocol) requires.
--
-- How to run:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy-paste this entire SQL file
-- 4. Click "Run" button
-- ============================================

-- Step 1: Add status column with constraint
-- This column tracks the adoption status of each dog
ALTER TABLE public.dogs
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' 
  CHECK (status IN ('available', 'adopted', 'pending', 'urgent'));

-- Step 2: Add updated_at column for tracking modifications
-- Useful for sorting and auditing
ALTER TABLE public.dogs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Create index on status for faster queries
-- This speeds up filtering by status in the MCP tools
CREATE INDEX IF NOT EXISTS idx_dogs_status ON public.dogs(status);

-- Step 4: Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_dogs_updated_at ON public.dogs(updated_at);

-- Step 5: Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_dogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to call the function on UPDATE
DROP TRIGGER IF EXISTS trigger_update_dogs_updated_at ON public.dogs;
CREATE TRIGGER trigger_update_dogs_updated_at
BEFORE UPDATE ON public.dogs
FOR EACH ROW
EXECUTE FUNCTION public.update_dogs_updated_at();

-- ============================================
-- Verification
-- ============================================
-- After running this migration, you can verify with:
-- SELECT id, name, status, created_at, updated_at FROM public.dogs LIMIT 5;
