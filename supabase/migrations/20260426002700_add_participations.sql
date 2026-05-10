-- Table para participações em atividades
create table participations (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references auth.users on delete cascade,
  "groupId" text references groups(id) on delete cascade,
  "activityId" text references activities(id) on delete cascade,
  status text default 'pending',
  "pointsEarned" integer default 0,
  "proofUrl" text,
  "adminNote" text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar realtime
alter publication supabase_realtime add table participations;

-- RLS
alter table participations enable row level security;

create policy "Participations are viewable by the user and admins/leaders" 
on participations for select using (
  auth.uid() = "userId" or 
  exists (
    select 1 from profiles 
    where id = auth.uid() 
    and (role = 'admin' or role = 'leader')
  )
);

create policy "Users can insert their own participations" 
on participations for insert with check (auth.uid() = "userId");

create policy "Admins and leaders can update status" 
on participations for update using (
  exists (
    select 1 from profiles 
    where id = auth.uid() 
    and (role = 'admin' or role = 'leader')
  )
);
