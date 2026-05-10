-- Table para logs de pontuação
create table point_logs (
  id uuid default gen_random_uuid() primary key,
  "groupId" text references groups(id) on delete cascade,
  "userId" uuid references auth.users on delete set null,
  points integer not null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar realtime para point_logs
alter publication supabase_realtime add table point_logs;

-- Permissões RLS
alter table point_logs enable row level security;

create policy "Point logs are viewable by everyone" 
on point_logs for select using (true);

create policy "Point logs can be inserted by admins and leaders" 
on point_logs for insert with check (
  exists (
    select 1 from profiles 
    where id = auth.uid() 
    and (role = 'admin' or role = 'leader')
  )
);
