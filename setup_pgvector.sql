-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the embeddings table
create table if not exists public.embeddings (
  id uuid default gen_random_uuid() primary key,
  clip_id uuid references public.clips(id) on delete cascade not null,
  embedding vector(768), -- Gemini text-embedding-004 uses 768 dimensions
  transcript_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure the transcript_text column exists (in case the table was created previously without it)
alter table public.embeddings add column if not exists transcript_text text;

-- Enable RLS
alter table public.embeddings enable row level security;

-- Allow users to view embeddings for their clips via the project relationship
drop policy if exists "Users can view embeddings for their clips" on public.embeddings;
create policy "Users can view embeddings for their clips"
  on public.embeddings for select
  using (
    exists (
      select 1 from public.clips
      join public.projects on clips.project_id = projects.id
      where clips.id = embeddings.clip_id
      and projects.user_id = auth.uid()::text
    )
  );

-- Create an index for faster vector search (HNSW is recommended for better recall/performance than IVFFlat)
create index on public.embeddings using hnsw (embedding vector_cosine_ops);

-- Create a function to search for clips based on a text embedding
-- This function will be called via Supabase RPC from our Next.js API
create or replace function match_clips (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id text -- pass user ID to ensure they only search their own clips
)
returns table (
  id uuid,
  clip_id uuid,
  project_id uuid,
  clip_title text,
  video_url text,
  transcript_text text,
  similarity float
)
language sql stable
as $$
  select
    e.id,
    e.clip_id,
    c.project_id,
    c.title as clip_title,
    c.video_url as video_url,
    e.transcript_text,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  join public.clips c on e.clip_id = c.id
  join public.projects p on c.project_id = p.id
  where p.user_id = p_user_id
  and 1 - (e.embedding <=> query_embedding) > match_threshold
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
