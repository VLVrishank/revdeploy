create table public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  url text not null,
  image_url text,
  published_at timestamp with time zone not null,
  source text,
  created_at timestamp with time zone default now() not null
);

-- Add RLS policies as needed
alter table public.news enable row level security;
create policy "Allow public read access" on public.news for select using (true);
create policy "Allow authenticated insert" on public.news for insert with check (auth.role() = 'authenticated');

create table public.settings (
  key text primary key,
  value jsonb not null
);

-- Add RLS policies
alter table public.settings enable row level security;
create policy "Allow public read access" on public.settings for select using (true);
create policy "Allow authenticated insert/update" on public.settings for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated update" on public.settings for update using (auth.role() = 'authenticated');