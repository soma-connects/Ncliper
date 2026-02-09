-- Add result_data column to jobs table
-- This will store the processed clips and metadata from the Python worker

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS result_data JSONB DEFAULT NULL;

-- Add index for faster user+status queries
CREATE INDEX IF NOT EXISTS idx_jobs_user_status 
ON jobs(user_id, status);

-- Add index for updated_at to optimize polling queries
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at 
ON jobs(updated_at DESC);

COMMENT ON COLUMN jobs.result_data IS 'Stores processed clip data and metadata after job completion. Format: {"clips": [...], "metadata": {...}}';
