-- Drop existing table and related objects
drop table if exists public.profiles cascade;

-- Create profiles table
create table public.profiles (
    id uuid primary key,
    email text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    full_name text,
    avatar_url text,
    constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using ( true );

create policy "Users can insert their own profile"
on public.profiles for insert
with check ( auth.uid() = id );

create policy "Users can update their own profile"
on public.profiles for update
using ( auth.uid() = id );

-- Create indexes
create index profiles_email_idx on public.profiles (email);
create index profiles_id_idx on public.profiles (id);

-- Set up Realtime
begin;
    drop publication if exists supabase_realtime;
    create publication supabase_realtime;
end;
alter publication supabase_realtime add table public.profiles;

-- Grant permissions
grant usage on schema public to postgres, anon, authenticated;
grant all on public.profiles to postgres, anon, authenticated;
grant usage on all sequences in schema public to postgres, anon, authenticated;

-- Refresh types
notify pgrst, 'reload schema'; 