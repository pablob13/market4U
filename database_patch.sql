-- =====================================================================
-- Market4U — Parche de Base de Datos (Supabase)
-- =====================================================================
-- Instrucciones:
-- 1. Ve a tu proyecto en supabase.com
-- 2. Abre el SQL Editor
-- 3. Crea una nueva consulta (New Query)
-- 4. Pega este script completo y haz clic en "Run"
-- =====================================================================

-- 1. CREAR TABLA: categories (Categorías Estructuradas)
create table if not exists categories (
  id          text primary key,
  name        text not null,
  parent_id   text references categories(id) on delete cascade,
  icon        text,
  created_at  timestamptz default now()
);

-- Insertar categorías base
insert into categories (id, name, parent_id, icon) values
  ('supermercado', 'Supermercado', null, 'shopping_cart'),
  ('lacteos-y-huevos', 'Lácteos y Huevos', 'supermercado', 'egg'),
  ('frutas-y-verduras', 'Frutas y Verduras', 'supermercado', 'eco'),
  ('bebidas', 'Bebidas', 'supermercado', 'local_drink'),
  ('despensa', 'Despensa', 'supermercado', 'kitchen'),
  ('limpieza', 'Limpieza', 'supermercado', 'cleaning_services'),
  ('higiene-y-belleza', 'Higiene y Belleza', 'supermercado', 'face')
on conflict (id) do nothing;

-- 2. AGREGAR COLUMNA DE CATEGORÍA A PRODUCTS (Sin borrar la tabla)
alter table products 
add column if not exists category_id text references categories(id) on delete set null;

-- 3. CREAR TABLA: list_items (Normalización de las listas de compra)
create table if not exists list_items (
  id          uuid primary key default uuid_generate_v4(),
  list_id     uuid references saved_lists(id) on delete cascade,
  product_id  uuid references products(id) on delete cascade,
  quantity    integer not null default 1 check (quantity > 0),
  created_at  timestamptz default now(),
  unique (list_id, product_id)
);

alter table list_items enable row level security;

-- Política de RLS para list_items: el usuario solo ve/modifica items de sus propias listas
drop policy if exists "Users manage own list items" on list_items;
create policy "Users manage own list items" on list_items
  for all using (
    exists (
      select 1 from saved_lists
      where saved_lists.id = list_items.list_id
      and saved_lists.user_id = auth.uid()
    )
  );

-- 4. MIGRAR DATOS EXISTENTES (De JSONB a tabla relacional)
do $$
declare
  list_row record;
  item_val jsonb;
begin
  if exists (select 1 from information_schema.columns where table_name='saved_lists' and column_name='items') then
    for list_row in select id, items from saved_lists loop
      for item_val in select jsonb_array_elements(list_row.items) loop
        -- Verificar si el product_id existe en products
        if exists (select 1 from products where id = (item_val->>'product_id')::uuid) then
          insert into list_items (list_id, product_id, quantity)
          values (list_row.id, (item_val->>'product_id')::uuid, coalesce((item_val->>'quantity')::integer, 1))
          on conflict (list_id, product_id) do nothing;
        end if;
      end loop;
    end loop;
    
    -- Opcional: Eliminar la columna items de saved_lists una vez migrada
    -- alter table saved_lists drop column items;
  end if;
end;
$$;

-- 5. CREAR TABLA: product_favorites (Favoritos de los usuarios)
create table if not exists product_favorites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  product_id  uuid references products(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (user_id, product_id)
);

alter table product_favorites enable row level security;

drop policy if exists "Users manage own favorites" on product_favorites;
create policy "Users manage own favorites" on product_favorites
  for all using (auth.uid() = user_id);

-- 6. CREAR TABLA: user_searches (Historial de Búsquedas y Tendencias)
create table if not exists user_searches (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,
  query         text not null,
  results_count integer default 0,
  searched_at   timestamptz default now()
);

alter table user_searches enable row level security;

drop policy if exists "Users see own searches" on user_searches;
create policy "Users see own searches" on user_searches
  for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users insert own searches" on user_searches;
create policy "Users insert own searches" on user_searches
  for insert with check (auth.uid() = user_id or user_id is null);
