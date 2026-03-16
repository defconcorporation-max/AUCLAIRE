-- Create project_chats table
create table if not exists project_chats (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  sender_name text not null,
  sender_role text not null,
  message text not null,
  channel text check (channel in ('internal', 'client')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table project_chats enable row level security;

-- Hybrid access (matching other tables in this project)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'project_chats' and policyname = 'Hybrid Access Chats'
    ) then
        create policy "Hybrid Access Chats" on project_chats for all using (true) with check (true);
    end if;
end
$$;
