# Manual Database Migration Steps

Since `psql` is not available in PowerShell, please run this SQL manually in the Supabase SQL editor:

## Steps:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the following SQL:

```sql
-- Add result_data column to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS result_data JSONB DEFAULT NULL;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_user_status 
ON jobs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_jobs_updated_at 
ON jobs(updated_at DESC);

-- Add column comment
COMMENT ON COLUMN jobs.result_data IS 'Stores processed clip data and metadata. Format: {"clips": [...], "metadata": {...}}';
```

6. Click "Run" button
7. You should see "Success. No rows returned"

## Verification:

Check that the column was added:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'result_data';
```

Should return:
```
column_name  | data_type
-------------+-----------
result_data  | jsonb
```

**Done!** The database is now ready for the integrated pipeline.
