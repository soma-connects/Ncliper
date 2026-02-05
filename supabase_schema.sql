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
