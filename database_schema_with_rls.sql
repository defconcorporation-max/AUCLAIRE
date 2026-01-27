-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Users)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role text check (role in ('admin', 'manufacturer', 'client', 'sales_agent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CLIENTS
create table if not exists clients (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PROJECTS
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text check (status in ('designing', '3d_model', 'design_ready', 'design_modification', 'approved_for_production', 'production', 'delivery', 'completed')) default 'designing',
  
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
create table if not exists invoices (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id),
  amount numeric not null,
  status text check (status in ('draft', 'sent', 'partial', 'paid', 'void')) default 'draft',
  amount_paid numeric default 0,
  stripe_payment_link text,
  due_date date,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- FORCE ENABLE RLS
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table invoices enable row level security;

-- DROP OLD POLICIES
drop policy if exists "Admins can do everything" on projects;
drop policy if exists "Public Access Projects" on projects;
drop policy if exists "Authenticated Users All Access Projects" on projects;
drop policy if exists "Public Access Clients" on clients;
drop policy if exists "Authenticated Users All Access Clients" on clients;
drop policy if exists "Public Access Invoices" on invoices;
drop policy if exists "Authenticated Users All Access Invoices" on invoices;
drop policy if exists "Public Access Profiles" on profiles;
drop policy if exists "Authenticated Users All Access Profiles" on profiles;

-- NEW HYBRID POLICIES (Public Access)
-- Allows both Authenticated Users AND Anon Users (Shared Code) to read/write.
-- Essential for "Shared Code" mode to access data on secondary devices.

create policy "Hybrid Access Projects"
  on projects for all
  using ( true )
  with check ( true );

create policy "Hybrid Access Clients"
  on clients for all
  using ( true )
  with check ( true );

create policy "Hybrid Access Invoices"
  on invoices for all
  using ( true )
  with check ( true );

create policy "Hybrid Access Profiles"
  on profiles for all
  using ( true )
  with check ( true );

-- AUTO PROFILE CREATION TRIGGER (Keep this for registered users)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
