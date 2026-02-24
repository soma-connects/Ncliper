-- Enable pgvector extension
create extension if not exists vector;

-- Create Projects Table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id text not null, -- Stores the Clerk User ID
  title text not null,
  video_url text not null,
  thumbnail_url text,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  metadata jsonb
);

-- Create Clips Table
create table public.clips (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  start_time float not null,
  end_time float not null,
  video_url text,
  virality_score float,
  transcript_segment jsonb
);

-- Create Embeddings Table
create table public.embeddings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  clip_id uuid references public.clips(id) on delete cascade not null unique,
  embedding vector(768),
  description text,
  metadata jsonb,
  transcript_text text
);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.clips enable row level security;

-- Create Policies (Simple auth check for now)
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid()::text = user_id); -- Note: This assumes we sync Clerk ID to auth.uid() or pass it in query. 
  -- For purely Clerk Client-side, we might just filter by column if not using Supabase Auth completely.
  -- BUT standard practice with Clerk+Supabase is using Custom Claims (JWT).
  -- For now, let's assume we will pass the user_id in the query or use the metadata helper.

-- Index for performance
create index projects_user_id_idx on public.projects(user_id);
create index clips_project_id_idx on public.clips(project_id);
create index embeddings_clip_id_idx on public.embeddings(clip_id);

-- Create vector search index on embeddings table
create index on public.embeddings using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Drop the existing function first if it exists because we changed the return type
drop function if exists match_clips(vector, double precision, integer, text);

-- Create RPC function for semantic matching
create or replace function match_clips (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  user_uid text
)
returns table (
  id uuid,
  project_id uuid,
  title text,
  start_time float,
  end_time float,
  video_url text,
  virality_score float,
  transcript_segment jsonb,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.project_id,
    c.title,
    c.start_time,
    c.end_time,
    c.video_url,
    c.virality_score,
    c.transcript_segment,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.embeddings e
  join public.clips c on e.clip_id = c.id
  join public.projects p on p.id = c.project_id
  where 1 - (e.embedding <=> query_embedding) > match_threshold
    and p.user_id = user_uid
  order by e.embedding <=> query_embedding
  limit match_count;
$$;

-- Create RPC function to calculate user balance securely
create or replace function get_user_balance(user_uid text)
returns int
language sql stable
as $$
  select coalesce(sum(amount), 0)::int
  from public.credit_ledger
  where user_id = user_uid;
$$;
