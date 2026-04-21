-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 8. SERVICES (Company offerings)
create table if not exists services (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    default_price numeric default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE RLS
alter table services enable row level security;

-- HYBRID POLICIES FOR SERVICES
-- Allows reading and writing. Adjust policy if strictly needed.
create policy "Hybrid Access Services"
  on services for all
  using ( true )
  with check ( true );

-- Insert some default dummy services
insert into services (name, description, default_price) values 
('Design Sur Mesure 3D', 'Création d''un modèle 3D exclusif pour validation client.', 150),
('Polissage & Rhodiage', 'Remise à neuf d''un bijou existant avec bain de rhodium.', 75)
on conflict do nothing;
