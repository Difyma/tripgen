-- Create users table
create table if not exists public.users (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up row level security
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own data" on public.users
    for select using (auth.uid() = id);

create policy "Users can update their own data" on public.users
    for update using (auth.uid() = id);

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email);
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 