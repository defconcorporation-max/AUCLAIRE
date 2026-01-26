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

-- RLS POLICIES (Row Level Security)
-- ENABLE RLS but allow PUBLIC access for "Shared Password" mode
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table invoices enable row level security;

-- DROP OLD POLICIES to avoid conflicts
drop policy if exists "Admins can do everything" on projects;
drop policy if exists "Sales Agents can view their projects" on projects;
drop policy if exists "Manufacturers can view production projects" on projects;
drop policy if exists "Manufacturers can update production projects" on projects;
drop policy if exists "Clients can view their own project" on projects;

-- NEW PUBLIC POLICIES (Allows Anon/Public access)
-- WARNING: This makes your DB public to anyone with the Anon Key.
-- Required because you want to use a shared password without real Auth.

create policy "Public Access Projects"
  on projects for all
  using ( true )
  with check ( true );

create policy "Public Access Clients"
  on clients for all
  using ( true )
  with check ( true );

create policy "Public Access Invoices"
  on invoices for all
  using ( true )
  with check ( true );

create policy "Public Access Profiles"
  on profiles for all
  using ( true )
  with check ( true );
