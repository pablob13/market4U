-- =============================================
-- Market4U — Schema de Base de Datos (Supabase)
-- =============================================
-- Instrucciones:
-- 1. Ve a tu proyecto en supabase.com
-- 2. Abre el SQL Editor
-- 3. Pega este script completo y ejecuta con "Run"
-- =============================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLA: stores (Supermercados)
-- =============================================
create table if not exists stores (
  id         text primary key,
  name       text not null,
  logo       text,
  color      text,
  bg_color   text,
  base_url   text,
  created_at timestamptz default now()
);

-- Insertar los supermercados base
insert into stores (id, name, logo, color, bg_color, base_url) values
  ('walmart',      'Walmart',       'W',  '#ffffff', '#0071ce', 'https://www.walmart.com.mx'),
  ('soriana',      'Soriana',       'S',  '#ffffff', '#e32726', 'https://www.soriana.com'),
  ('chedraui',     'Chedraui',      'C',  '#ffffff', '#f37021', 'https://www.superc.com'),
  ('amazon',       'Amazon Súper',  'A',  '#000000', '#ff9900', 'https://www.amazon.com.mx'),
  ('mercadolibre', 'Mercado Libre', 'ML', '#2d3277', '#ffe600', 'https://www.mercadolibre.com.mx')
on conflict (id) do nothing;

-- =============================================
-- TABLA: products (Catálogo de Productos)
-- =============================================
create table if not exists products (
  id          uuid primary key default uuid_generate_v4(),
  ml_id       text unique,                    -- ID de Mercado Libre
  barcode     text,                           -- Código de barras EAN/UPC
  title       text not null,
  category    text not null default 'General',
  description text,
  image_url   text,
  brand       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Índice para búsqueda full-text
create index if not exists products_title_idx on products using gin(to_tsvector('spanish', title));

-- =============================================
-- TABLA: price_history (Historial de Precios)
-- =============================================
create table if not exists price_history (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references products(id) on delete cascade,
  store_id    text references stores(id),
  price       numeric(10,2) not null,
  shipping    numeric(10,2) default 49,
  in_stock    boolean default true,
  source_url  text,
  scraped_at  timestamptz default now()
);

-- Vista para obtener precio más reciente por tienda
create or replace view current_prices as
select distinct on (product_id, store_id)
  product_id,
  store_id,
  price,
  shipping,
  in_stock,
  source_url,
  scraped_at
from price_history
order by product_id, store_id, scraped_at desc;

-- =============================================
-- TABLA: saved_lists (Listas Guardadas del Usuario)
-- =============================================
create table if not exists saved_lists (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  items       jsonb not null default '[]',   -- [{product_id, quantity}]
  created_at  timestamptz default now()
);

-- Row Level Security: cada usuario solo ve sus listas
alter table saved_lists enable row level security;
create policy "Users see own lists" on saved_lists
  for all using (auth.uid() = user_id);

-- =============================================
-- TABLA: addresses (Direcciones de Envío)
-- =============================================
create table if not exists addresses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  alias       text not null,
  street      text not null,
  colonia     text,
  cp          text,
  city        text default 'Ciudad de México',
  notes       text,
  is_default  boolean default false,
  created_at  timestamptz default now()
);

alter table addresses enable row level security;
create policy "Users see own addresses" on addresses
  for all using (auth.uid() = user_id);

-- =============================================
-- TABLA: price_alerts (Alertas de Precio)
-- =============================================
create table if not exists price_alerts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,
  product_id    uuid references products(id) on delete cascade,
  target_price  numeric(10,2) not null,
  notify_promo  boolean default false,
  is_active     boolean default true,
  triggered_at  timestamptz,
  created_at    timestamptz default now()
);

alter table price_alerts enable row level security;
create policy "Users see own alerts" on price_alerts
  for all using (auth.uid() = user_id);

-- =============================================
-- TABLA: user_profiles (Datos Extra del Usuario)
-- =============================================
create table if not exists user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  is_premium    boolean default false,
  premium_until timestamptz,
  preferred_stores text[] default '{}',
  created_at    timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "Users see own profile" on user_profiles
  for all using (auth.uid() = id);

-- Auto-crear perfil cuando se registra un usuario
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
