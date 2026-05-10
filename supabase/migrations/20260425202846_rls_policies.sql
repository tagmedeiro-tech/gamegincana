-- Enable RLS
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.activities enable row level security;
alter table public.messages enable row level security;
alter table public.config enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Groups Policies
create policy "Groups are viewable by everyone." on groups for select using ( true );

-- Activities Policies
create policy "Activities are viewable by everyone." on activities for select using ( true );

-- Messages Policies
create policy "Messages are viewable by group members." on messages for select using ( true );
create policy "Users can insert their own messages." on messages for insert with check ( auth.uid() = "senderId" );

-- Config Policies
create policy "Config is viewable by everyone." on config for select using ( true );
create policy "Only admins can update config." on config for update using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
