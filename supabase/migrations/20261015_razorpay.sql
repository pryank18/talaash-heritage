-- Razorpay: run once in Supabase > SQL Editor. Safe to run again.
-- Adds the columns the payment functions write to, and makes sure an order
-- may be placed with payment_method 'razorpay'.

alter table public.orders add column if not exists razorpay_order_id   text;
alter table public.orders add column if not exists razorpay_payment_id text;
alter table public.orders add column if not exists paid_at            timestamptz;

create unique index if not exists orders_razorpay_order_id_key
  on public.orders (razorpay_order_id) where razorpay_order_id is not null;

-- Make sure 'razorpay' is an allowed payment method, whether the column is
-- an enum or text guarded by a CHECK constraint.
do $$
declare c record; t text; dropped boolean := false;
begin
  select udt_name into t from information_schema.columns
   where table_schema = 'public' and table_name = 'orders' and column_name = 'payment_method';
  if exists (select 1 from pg_type where typname = t and typtype = 'e') then
    execute format('alter type %I add value if not exists %L', t, 'razorpay');
    return;
  end if;
  for c in
    select conname, pg_get_constraintdef(oid) as def
    from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%payment_method%'
      and pg_get_constraintdef(oid) not ilike '%razorpay%'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
    raise notice 'Replaced % (%)', c.conname, c.def;
    dropped := true;
  end loop;
  if dropped then
    alter table public.orders add constraint orders_payment_method_razorpay_check
      check (payment_method in ('upi', 'whatsapp', 'razorpay'));
  end if;
end $$;

-- Final check. Every line should say OK. If the last one says CHECK, the
-- create_order function itself refuses 'razorpay': send its text to Claude
-- (run: select pg_get_functiondef('public.create_order'::regproc);).
select 'orders.razorpay_order_id' as item,
       case when exists (select 1 from information_schema.columns
                         where table_schema='public' and table_name='orders' and column_name='razorpay_order_id')
            then 'OK' else 'MISSING' end as result
union all
select 'orders.status accepts paid',
       case when exists (select 1 from information_schema.columns
                         where table_schema='public' and table_name='orders' and column_name='status')
            then 'OK' else 'MISSING' end
union all
select 'create_order mentions razorpay',
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                         where n.nspname='public' and p.proname='create_order' and p.prosrc ilike '%razorpay%')
            then 'OK'
            when exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                         where n.nspname='public' and p.proname='create_order' and p.prosrc ilike '%payment_method%in%')
            then 'CHECK'
            else 'OK' end;
