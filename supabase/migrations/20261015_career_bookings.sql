-- Career courses booked on Pryank's weekend evenings.
--   Weekend course: Saturday and Sunday of the same weekend, 1.5 hours each, same start time.
--   One-evening course: Saturday or Sunday, one 2-hour session.
--   Sessions run between 5 pm and 8 pm IST. Earliest booking: 24 hours ahead. Up to 8 weekends ahead.
-- A buyer picks a free slot, which is held for 30 minutes while they check out; once the hold is
-- attached to their order it is kept for 24 hours (UPI and WhatsApp payments are confirmed by hand),
-- and it becomes a confirmed booking when the order is paid. Busy times from Pryank's own Google
-- Calendar are copied into calendar_sync.busy by the career-slots edge function.

create table if not exists public.career_bookings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  order_id uuid,  -- the order this booking was paid with (no foreign key, so admins can still remove orders)
  topic text not null,
  status text not null default 'held' check (status in ('held', 'confirmed', 'cancelled')),
  hold_expires_at timestamptz not null default now() + interval '30 minutes',
  ip text,
  created_at timestamptz not null default now()
);
create table if not exists public.career_booking_sessions (
  booking_id uuid not null references public.career_bookings(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null
);
create index if not exists career_booking_sessions_time on public.career_booking_sessions (starts_at);
-- One row holding the latest copy of Pryank's busy times: [{"start": ISO, "end": ISO}, ...]
create table if not exists public.calendar_sync (
  id int primary key default 1 check (id = 1),
  busy jsonb not null default '[]'::jsonb,
  synced_at timestamptz,
  note text
);
insert into public.calendar_sync (id) values (1) on conflict do nothing;
alter table public.career_bookings enable row level security;
alter table public.career_booking_sessions enable row level security;
alter table public.calendar_sync enable row level security;
revoke all on public.career_bookings, public.career_booking_sessions, public.calendar_sync from anon, authenticated;

-- Which kind of course a product is: 'weekend' (2 x 90 min) or 'single' (1 x 120 min).
create or replace function public._career_kind(p_product public.products)
returns text language sql immutable as $$
  select case when 'career-weekend' = any(p_product.tags) then 'weekend'
              when 'career-single' = any(p_product.tags) then 'single' end
$$;

create or replace function public._career_topics()
returns text[] language sql immutable as $$
  select array['Careers in archaeology',
               'Careers with history: museums, heritage and research',
               'Study archaeology and heritage abroad']
$$;

-- True when nothing booked, held or busy overlaps [p_start, p_end).
create or replace function public._slot_free(p_start timestamptz, p_end timestamptz, p_ignore uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
           select 1 from public.career_booking_sessions s
             join public.career_bookings b on b.id = s.booking_id
            where s.starts_at < p_end and s.ends_at > p_start
              and b.id is distinct from p_ignore
              and (b.status = 'confirmed' or (b.status = 'held' and b.hold_expires_at > now())))
     and not exists (
           select 1 from public.calendar_sync c, jsonb_array_elements(c.busy) e
            where c.id = 1 and (e->>'start')::timestamptz < p_end and (e->>'end')::timestamptz > p_start)
$$;

-- The sessions a booking starting at p_start would occupy, or none if p_start is not a valid start.
create or replace function public._career_sessions(p_kind text, p_start timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language plpgsql stable as $$
declare
  v_local timestamp := p_start at time zone 'Asia/Kolkata';
  v_dow int := extract(isodow from v_local);
  v_time time := v_local::time;
begin
  if p_start < now() + interval '24 hours' or p_start > now() + interval '57 days' then return; end if;
  if extract(minute from v_time)::int not in (0, 30) or extract(second from v_time) <> 0 then return; end if;
  if p_kind = 'single' then
    if v_dow not in (6, 7) or v_time < time '17:00' or v_time > time '18:00' then return; end if;
    return query select p_start, p_start + interval '120 minutes';
  elsif p_kind = 'weekend' then
    if v_dow <> 6 or v_time < time '17:00' or v_time > time '18:30' then return; end if;
    return query select p_start, p_start + interval '90 minutes'
           union all select p_start + interval '1 day', p_start + interval '1 day' + interval '90 minutes';
  end if;
end $$;

-- Free slots for a career-course product, grouped by date. Public.
create or replace function public.career_slots(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_product public.products;
  v_kind text;
  v_out jsonb := '[]'::jsonb;
  v_day date;
  v_times jsonb;
  v_start timestamptz;
  v_ok boolean;
  t time;
begin
  select * into v_product from public.products where slug = p_slug and is_active;
  v_kind := public._career_kind(v_product);
  if v_kind is null then return jsonb_build_object('ok', false); end if;
  for v_day in select d::date from generate_series((now() at time zone 'Asia/Kolkata')::date, (now() at time zone 'Asia/Kolkata')::date + 56, interval '1 day') d
  loop
    continue when extract(isodow from v_day) not in (6, 7);
    continue when v_kind = 'weekend' and extract(isodow from v_day) <> 6;
    v_times := '[]'::jsonb;
    for t in select x::time from generate_series(timestamp '2000-01-01 17:00', case when v_kind = 'single' then timestamp '2000-01-01 18:00' else timestamp '2000-01-01 18:30' end, interval '30 minutes') x
    loop
      v_start := (v_day + t) at time zone 'Asia/Kolkata';
      select count(*) > 0 and bool_and(public._slot_free(s.starts_at, s.ends_at)) into v_ok from public._career_sessions(v_kind, v_start) s;
      if v_ok then v_times := v_times || to_jsonb(to_char(t, 'HH24:MI')); end if;
    end loop;
    if jsonb_array_length(v_times) > 0 then
      v_out := v_out || jsonb_build_object('date', to_char(v_day, 'YYYY-MM-DD'), 'times', v_times);
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'kind', v_kind, 'minutes', case when v_kind = 'single' then 120 else 90 end,
                            'topics', to_jsonb(public._career_topics()), 'days', v_out,
                            'calendar_synced_at', (select synced_at from public.calendar_sync where id = 1));
end $$;

-- Hold a slot for 30 minutes. Public. p_start is the first session's start (ISO timestamp).
create or replace function public.career_hold(p_slug text, p_start timestamptz, p_topic text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_product public.products;
  v_kind text;
  v_id uuid;
  v_ip text;
  v_headers json;
  s record;
  v_n int := 0;
begin
  select * into v_product from public.products where slug = p_slug and is_active;
  v_kind := public._career_kind(v_product);
  if v_kind is null then return jsonb_build_object('ok', false, 'error', 'not_bookable'); end if;
  if p_topic is null or not (p_topic = any(public._career_topics())) then return jsonb_build_object('ok', false, 'error', 'topic'); end if;
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then v_headers := null;
  end;
  v_ip := nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), '');
  if v_ip is not null and (select count(*) from public.career_bookings where ip = v_ip and status = 'held' and hold_expires_at > now() and order_id is null) >= 3 then
    return jsonb_build_object('ok', false, 'error', 'too_many_holds');
  end if;
  -- One booking decision at a time, so two buyers cannot take the same slot.
  perform pg_advisory_xact_lock(hashtext('career_bookings'));
  for s in select * from public._career_sessions(v_kind, p_start) loop
    v_n := v_n + 1;
    if not public._slot_free(s.starts_at, s.ends_at) then return jsonb_build_object('ok', false, 'error', 'taken'); end if;
  end loop;
  if v_n = 0 then return jsonb_build_object('ok', false, 'error', 'invalid_time'); end if;
  insert into public.career_bookings (product_id, topic, ip) values (v_product.id, p_topic, v_ip) returning id into v_id;
  insert into public.career_booking_sessions (booking_id, starts_at, ends_at)
    select v_id, x.starts_at, x.ends_at from public._career_sessions(v_kind, p_start) x;
  return jsonb_build_object('ok', true, 'hold', v_id, 'expires_at', now() + interval '30 minutes');
end $$;

-- Tie a hold to the buyer's order. Called by checkout right after the order is created. Public, but needs the order's access token.
create or replace function public.career_attach(p_hold uuid, p_order_id uuid, p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  v_order public.orders;
  v_b public.career_bookings;
  s record;
begin
  select * into v_order from public.orders where id = p_order_id and access_token = p_token;
  if v_order.id is null then return jsonb_build_object('ok', false, 'error', 'order'); end if;
  perform pg_advisory_xact_lock(hashtext('career_bookings'));
  select * into v_b from public.career_bookings where id = p_hold for update;
  if v_b.id is null or v_b.status = 'cancelled' then return jsonb_build_object('ok', false, 'error', 'hold'); end if;
  if v_b.order_id is not null and v_b.order_id <> p_order_id then return jsonb_build_object('ok', false, 'error', 'hold'); end if;
  if not exists (select 1 from public.order_items where order_id = p_order_id and product_id = v_b.product_id) then
    return jsonb_build_object('ok', false, 'error', 'product');
  end if;
  -- An expired hold can still be used if nobody has taken the time since.
  if v_b.status = 'held' and v_b.hold_expires_at <= now() then
    for s in select * from public.career_booking_sessions where booking_id = v_b.id loop
      if not public._slot_free(s.starts_at, s.ends_at, v_b.id) then
        update public.career_bookings set status = 'cancelled' where id = v_b.id;
        return jsonb_build_object('ok', false, 'error', 'taken');
      end if;
    end loop;
  end if;
  update public.career_bookings
     set order_id = p_order_id,
         status = case when v_order.status in ('paid', 'fulfilled') then 'confirmed' else status end,
         hold_expires_at = greatest(hold_expires_at, now() + interval '24 hours')
   where id = v_b.id;
  return jsonb_build_object('ok', true);
end $$;

-- The booked sessions for an order, for the order page. Public, needs the access token.
create or replace function public.career_booking_for_order(p_order_id uuid, p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'topic', b.topic, 'status', b.status, 'product', p.title,
           'sessions', (select jsonb_agg(jsonb_build_object('starts_at', s.starts_at, 'ends_at', s.ends_at) order by s.starts_at)
                          from public.career_booking_sessions s where s.booking_id = b.id))), '[]'::jsonb)
    from public.career_bookings b
    join public.orders o on o.id = b.order_id and o.access_token = p_token
    join public.products p on p.id = b.product_id
   where b.order_id = p_order_id and b.status <> 'cancelled'
$$;

-- Payment confirms the booking; cancelling the order frees the time.
create or replace function public._career_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('paid', 'fulfilled') and old.status is distinct from new.status then
    update public.career_bookings set status = 'confirmed' where order_id = new.id and status = 'held';
  elsif new.status = 'cancelled' and old.status is distinct from new.status then
    update public.career_bookings set status = 'cancelled' where order_id = new.id;
  end if;
  return new;
end $$;
create or replace trigger career_order_status after update of status on public.orders
  for each row execute function public._career_order_status();

-- Upcoming bookings for the admin page.
create or replace function public.admin_career_bookings(p_passcode text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public._is_admin(p_passcode) then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'bookings', coalesce((
    select jsonb_agg(x order by x->>'first') from (
      select jsonb_build_object(
        'id', b.id, 'status', b.status, 'topic', b.topic, 'product', p.title,
        'order_number', o.order_number, 'order_status', o.status, 'customer', o.customer_name,
        'email', o.customer_email, 'phone', o.customer_phone,
        'first', min(s.starts_at),
        'sessions', jsonb_agg(jsonb_build_object('starts_at', s.starts_at, 'ends_at', s.ends_at) order by s.starts_at)) x
        from public.career_bookings b
        join public.career_booking_sessions s on s.booking_id = b.id
        join public.products p on p.id = b.product_id
        left join public.orders o on o.id = b.order_id
       where b.order_id is not null and b.status <> 'cancelled'
       group by b.id, p.title, o.order_number, o.status, o.customer_name, o.customer_email, o.customer_phone
      having max(s.ends_at) > now() - interval '1 day') y(x)), '[]'::jsonb),
    'calendar_synced_at', (select synced_at from public.calendar_sync where id = 1));
end $$;

-- Replace the copy of Pryank's busy times. Service role only (the career-slots edge function).
create or replace function public.calendar_busy_replace(p_busy jsonb, p_note text)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  update public.calendar_sync
     set busy = coalesce((select jsonb_agg(jsonb_build_object('start', (e->>'start')::timestamptz, 'end', (e->>'end')::timestamptz))
                            from jsonb_array_elements(coalesce(p_busy, '[]'::jsonb)) e
                           where (e->>'end')::timestamptz > (e->>'start')::timestamptz), '[]'::jsonb),
         synced_at = now(), note = left(p_note, 300)
   where id = 1;
end $$;

revoke all on function public.career_slots(text), public.career_hold(text, timestamptz, text), public.career_attach(uuid, uuid, text),
  public.career_booking_for_order(uuid, text), public.admin_career_bookings(text), public.calendar_busy_replace(jsonb, text),
  public._slot_free(timestamptz, timestamptz, uuid), public._career_sessions(text, timestamptz), public._career_order_status()
  from public, anon, authenticated;
grant execute on function public.career_slots(text), public.career_hold(text, timestamptz, text), public.career_attach(uuid, uuid, text),
  public.career_booking_for_order(uuid, text), public.admin_career_bookings(text) to anon, authenticated;
grant execute on function public.calendar_busy_replace(jsonb, text) to service_role;

-- Applied as career_attach_allow_retry: a buyer who closed the payment window and pressed pay again has
-- a new order; the hold moves to it unless the earlier order was paid. (Live definition is the current one.)
