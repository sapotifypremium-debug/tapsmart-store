-- Run in Supabase SQL Editor (new project, separate from your NFC platform)
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  tiers jsonb not null default '[{"min":1,"max":15,"price":299},{"min":16,"max":30,"price":285},{"min":31,"max":50,"price":250},{"min":100,"max":100,"price":200}]',
  delivery_charge int check (delivery_charge >= 0),      -- NULL = not configured yet
  upi_id text not null default '',
  whatsapp_number text not null default '917977730026',
  instagram_url text not null default 'https://www.instagram.com/tapsmart.official/',
  updated_at timestamptz not null default now()
);
insert into settings (id) values (1) on conflict do nothing;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pin text not null,
  instagram text,
  notes text,
  quantity int not null check (quantity > 0),
  unit_price int not null,
  subtotal int not null,
  delivery_charge int not null,
  total int not null,
  utr text not null,
  status text not null default 'Pending'
    check (status in ('Pending','Payment Verified','Processing','Shipped','Delivered','Cancelled')),
  payment_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Lock both tables: only the server (service-role key) can touch them.
alter table settings enable row level security;
alter table orders enable row level security;
-- (no policies on purpose)
