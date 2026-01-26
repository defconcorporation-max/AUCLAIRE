-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text check (role in ('admin', 'manufacturer', 'client', 'sales_agent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CLIENTS
create table clients (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PROJECTS
create table projects (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text check (status in ('designing', '3d_model', 'design_ready', 'design_modification', 'production', 'delivery', 'completed')) default 'designing',
  
  client_id uuid references clients(id),
  sales_agent_id uuid references auth.users(id),
  
  budget numeric, -- Sale Price
  deadline timestamp with time zone,
  
  -- JSONB for flexible stage data
  stage_details jsonb default '{}'::jsonb,
  financials jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. INVOICES
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id),
  amount numeric not null,
  status text check (status in ('draft', 'sent', 'paid', 'overdue')) default 'draft',
  due_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Row Level Security)
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table invoices enable row level security;

-- POLICIES

-- Admin: Full Access
create policy "Admins can do everything"
  on projects for all
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- Sales Agent: Access their own projects + read all clients
create policy "Sales Agents can view their projects"
  on projects for select
  using ( auth.uid() = sales_agent_id or auth.uid() in (select id from profiles where role = 'admin') );

-- Manufacturer: Read/Update only necessary fields (Handled via API logic usually, but row access:)
create policy "Manufacturers can view production projects"
  on projects for select
  using ( auth.uid() in (select id from profiles where role = 'manufacturer') );

create policy "Manufacturers can update production projects"
  on projects for update
  using ( auth.uid() in (select id from profiles where role = 'manufacturer') );

-- Client: Read OWN project only
create policy "Clients can view their own project"
  on projects for select
  using ( 
    auth.uid() in (select id from profiles where role = 'client') 
    AND 
    client_id in (select id from clients where email = (select email from auth.users where id = auth.uid()))
  );
