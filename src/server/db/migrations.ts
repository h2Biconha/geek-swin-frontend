/**
 * Migrações do banco (Postgres). Só ADICIONE novas entradas no fim; nunca edite uma que já rodou.
 * Rodam sozinhas no primeiro acesso (DB_AUTO_MIGRATE) ou com `npm run db:migrate`.
 */
export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_init",
    sql: `
create table if not exists inventory (
  product_slug text not null,
  size text not null,
  stock integer check (stock is null or stock >= 0),      -- null = produção sob demanda (sem limite físico)
  reserved integer not null default 0 check (reserved >= 0),
  sold integer not null default 0 check (sold >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_slug, size)
);

-- tiragem numerada de peças de drop (o número da peça sai de "sold")
create table if not exists editions (
  product_slug text primary key,
  cap integer not null check (cap >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  sold integer not null default 0 check (sold >= 0)
);

create sequence if not exists order_seq start 1;

create table if not exists customers (
  id text primary key,
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  access_hash text not null,
  idempotency_key text unique,
  status text not null check (status in ('pending','paid','shipped','delivered','expired','canceled','refunded','needs_review')),
  email text not null,
  customer jsonb not null,
  address jsonb not null,
  shipping jsonb not null,
  subtotal_cents integer not null,
  shipping_cents integer not null,
  discount_cents integer not null,
  total_cents integer not null,
  coupon text,
  payment_method text not null check (payment_method in ('pix','card')),
  installments integer not null default 1,
  provider text not null,
  provider_ref text,
  payment_data jsonb,
  presale boolean not null default false,
  ships_from date,
  reserved_until timestamptz,
  tracking_code text,
  note text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists orders_email_idx on orders (email);
create index if not exists orders_pending_idx on orders (status, reserved_until);

create table if not exists order_items (
  order_id text not null references orders(id) on delete cascade,
  product_slug text not null,
  size text not null,
  qty integer not null check (qty > 0),
  unit_cents integer not null,
  name text not null,
  edition_from integer,
  edition_to integer,
  primary key (order_id, product_slug, size)
);

-- registro de notificações do gateway (idempotência e auditoria)
create table if not exists payment_events (
  id bigserial primary key,
  provider text not null,
  event_key text not null unique,
  order_id text,
  status text,
  received_at timestamptz not null default now()
);

create table if not exists coupons (
  code text primary key,
  kind text not null check (kind in ('percent','fixed')),
  value integer not null check (value > 0),              -- percent: 1..100 · fixed: centavos
  min_subtotal_cents integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer,
  uses integer not null default 0,
  active boolean not null default true
);

create table if not exists subscribers (
  email text not null,
  source text not null,
  product_slug text,
  size text,
  whatsapp text,
  consent_at timestamptz not null,
  consent_text text not null,
  unsubscribe_hash text not null,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (email, source)
);

create table if not exists login_tokens (
  token_hash text primary key,
  email text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists sessions (
  id_hash text primary key,
  customer_id text not null references customers(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  key text not null,
  bucket timestamptz not null,
  count integer not null default 0,
  primary key (key, bucket)
);
`,
  },
  {
    id: "002_kits_alertas",
    sql: `
-- linhas do pedido: a mesma peça/tamanho pode vir avulsa e dentro de um kit (chave passa a ser a linha)
alter table order_items add column if not exists line integer;
-- kit: slug do kit (catalog.json > bundles) · kit_id: instância do kit no pedido · discount_cents: desconto de kit rateado na linha
alter table order_items add column if not exists kit text;
alter table order_items add column if not exists kit_id text;
alter table order_items add column if not exists discount_cents integer not null default 0;
update order_items oi set line = n.rn
  from (select order_id, product_slug, size, row_number() over (partition by order_id order by product_slug, size) as rn from order_items) n
  where oi.order_id = n.order_id and oi.product_slug = n.product_slug and oi.size = n.size and oi.line is null;
alter table order_items drop constraint if exists order_items_pkey;
alter table order_items alter column line set not null;
alter table order_items add primary key (order_id, line);

-- composição do desconto do pedido (auditoria): kit, benefício, cupom, Pix
alter table orders add column if not exists discount_detail jsonb;

-- "avise-me quando voltar": um pedido de aviso por e-mail + peça + tamanho
create table if not exists stock_alerts (
  email text not null,
  product_slug text not null,
  size text not null default '',
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  primary key (email, product_slug, size)
);
create index if not exists stock_alerts_pending_idx on stock_alerts (product_slug, size) where notified_at is null;
`,
  },
];
