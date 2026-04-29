-- Migration: Add status column to dogs table
-- This adds the missing status column that the MCP requires

-- Add status column if it doesn't exist
ALTER TABLE dogs
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'adopted', 'pending', 'urgent'));

-- Add updated_at column if it doesn't exist
ALTER TABLE dogs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_dogs_status ON dogs(status);

-- Create a trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_dogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_dogs_updated_at ON dogs;
CREATE TRIGGER trigger_update_dogs_updated_at
BEFORE UPDATE ON dogs
FOR EACH ROW
EXECUTE FUNCTION update_dogs_updated_at();
