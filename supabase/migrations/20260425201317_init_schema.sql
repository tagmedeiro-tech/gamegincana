-- Table para perfis de usuário
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  role text default 'participant',
  "groupId" text,
  "totalPoints" integer default 0,
  achievements jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table para grupos/tribos
create table groups (
  id text primary key,
  name text not null,
  "leaderId" uuid references auth.users on delete set null,
  "totalPoints" integer default 0,
  "memberCount" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table para atividades/tarefas
create table activities (
  id text primary key,
  title text not null,
  description text,
  points integer not null,
  category text,
  type text,
  status text default 'active',
  "updatedAt" timestamp with time zone default timezone('utc'::text, now())
);

-- Table para mensagens do chat
create table messages (
  id uuid default gen_random_uuid() primary key,
  "groupId" text references groups(id) on delete cascade,
  "senderId" uuid references auth.users on delete cascade,
  "senderName" text not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table para configurações do app
create table config (
  key text primary key,
  value jsonb not null
);

-- Ativar Realtime para as tabelas necessárias
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table config;

-- Exemplo de configuração inicial do app
insert into config (key, value) values ('app', '{
  "primaryColor": "#FBBF24",
  "appName": "TRIBO IDE",
  "churchName": "Igreja do Evangelho",
  "logoType": "landmark"
}'::jsonb);
