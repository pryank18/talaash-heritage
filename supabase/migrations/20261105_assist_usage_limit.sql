-- Daily limits for the site assistant (functions/api/assist.ts). Holds a hash that changes daily, never a question.
create table if not exists public.assist_usage (
  day date not null,
  visitor text not null,
  replies integer not null default 0,
  primary key (day, visitor)
);
alter table public.assist_usage enable row level security;

create or replace function public.assist_take(p_visitor text, p_visitor_cap integer default 20, p_site_cap integer default 100)
returns boolean language plpgsql security definer set search_path to '' as $$
declare
  today date := (now() at time zone 'utc')::date;
  mine integer;
  total integer;
begin
  if p_visitor is null or char_length(p_visitor) > 32 then return false; end if;
  p_visitor_cap := least(greatest(p_visitor_cap, 1), 20);
  p_site_cap := least(greatest(p_site_cap, 1), 100);
  perform pg_advisory_xact_lock(hashtext('assist_usage'));
  delete from public.assist_usage where day < today;
  select coalesce(sum(replies), 0) into total from public.assist_usage where day = today;
  if total >= p_site_cap then return false; end if;
  select replies into mine from public.assist_usage where day = today and visitor = p_visitor;
  if coalesce(mine, 0) >= p_visitor_cap then return false; end if;
  insert into public.assist_usage (day, visitor, replies) values (today, p_visitor, 1)
  on conflict (day, visitor) do update set replies = public.assist_usage.replies + 1;
  return true;
end;
$$;
revoke all on function public.assist_take(text, integer, integer) from public;
grant execute on function public.assist_take(text, integer, integer) to anon;
