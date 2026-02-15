-- Create jobs table for async video processing
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    settings JSONB,
    result_data JSONB,
    error TEXT
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
    ON jobs
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own jobs
CREATE POLICY "Users can create own jobs"
    ON jobs
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Policy: Service role can update any job (for worker)
CREATE POLICY "Service role can update jobs"
    ON jobs
    FOR UPDATE
    USING (true);

COMMENT ON TABLE jobs IS 'Async video processing jobs for Modal worker';
