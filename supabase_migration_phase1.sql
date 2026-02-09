-- Jobs table for tracking async video processing
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed')) DEFAULT 'queued' NOT NULL,
  settings JSONB,
  result_url TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ
);

-- Credit ledger for audit trail and balance tracking
CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Positive for grants, negative for usage
  transaction_type TEXT CHECK (transaction_type IN ('PURCHASE', 'SUBSCRIPTION_GRANT', 'USAGE', 'BONUS', 'REFUND')) NOT NULL,
  description TEXT,
  related_job_id UUID REFERENCES public.jobs(id),
  metadata JSONB
);

-- Vector embeddings for semantic search (requires pgvector extension)
CREATE TABLE public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  clip_id UUID REFERENCES public.clips(id) ON DELETE CASCADE NOT NULL,
  embedding vector(768), -- text-embedding-004 dimension
  description TEXT,
  metadata JSONB
);

-- Enable RLS on new tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Policies for jobs (users can only see their own jobs)
CREATE POLICY "Users can view their own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policies for credit ledger (read-only for users)
CREATE POLICY "Users can view their own credit history"
  ON public.credit_ledger FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policies for embeddings (through clip ownership)
CREATE POLICY "Users can view embeddings for their clips"
  ON public.embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clips c
      JOIN public.projects p ON c.project_id = p.id
      WHERE c.id = embeddings.clip_id
      AND p.user_id = auth.uid()::text
    )
  );

-- Indexes for performance
CREATE INDEX jobs_user_id_idx ON public.jobs(user_id);
CREATE INDEX jobs_status_idx ON public.jobs(status);
CREATE INDEX jobs_created_at_idx ON public.jobs(created_at DESC);

CREATE INDEX credit_ledger_user_id_idx ON public.credit_ledger(user_id);
CREATE INDEX credit_ledger_created_at_idx ON public.credit_ledger(created_at DESC);

-- Vector similarity index (using IVFFlat algorithm)
CREATE INDEX embeddings_vector_idx ON public.embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get user credit balance
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM public.credit_ledger
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;
