-- Applied 15 Oct 2026 (migration "no_sales_after_start").
-- A dated listing (a course batch, a walk) cannot be bought once it has started.
create or replace function public.order_item_not_started() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.products p where p.id = new.product_id and p.starts_at is not null and p.starts_at <= now()) then
    raise exception 'unavailable' using errcode = '22023';
  end if;
  return new;
end $$;
revoke all on function public.order_item_not_started() from public, anon, authenticated;
create trigger order_item_not_started before insert on public.order_items
for each row execute function public.order_item_not_started();
