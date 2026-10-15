-- Accept the help panel's events (help_open, help_question) in public.track().
-- Same function as before; only the list of allowed events changes. Grants are kept by create or replace.
CREATE OR REPLACE FUNCTION public.track(p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_headers json;
  v_ip text;
  v_event text := p->>'event';
begin
  if jsonb_typeof(p) <> 'object' or v_event is null then return; end if;
  if v_event not in ('page_view','enquiry_whatsapp','enquiry_email','call_click','social_click','outbound_click','learn_to_programme','add_to_cart','begin_checkout','purchase','finder_result','help_open','help_question') then return; end if;
  if coalesce(p->>'visitor', '') !~ '^[a-z0-9]{8,40}$' or coalesce(p->>'session', '') !~ '^[a-z0-9]{8,40}$' then return; end if;
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then v_headers := null;
  end;
  v_ip := nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), '');
  -- At most 300 events per address in ten minutes.
  if v_ip is not null and (select count(*) from public.site_events where ip = v_ip and created_at > now() - interval '10 minutes') >= 300 then
    return;
  end if;
  insert into public.site_events (visitor, session, event, path, label, value_paise, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing, device, lang, ip)
  values (
    p->>'visitor', p->>'session', v_event,
    left(coalesce(nullif(p->>'path', ''), '/'), 300),
    left(nullif(p->>'label', ''), 200),
    case when coalesce(p->>'value', '') ~ '^[0-9]{1,9}$' and (p->>'value')::bigint <= 100000000 then (p->>'value')::integer end,
    left(nullif(p->>'referrer', ''), 200),
    left(nullif(p->>'utm_source', ''), 120), left(nullif(p->>'utm_medium', ''), 120), left(nullif(p->>'utm_campaign', ''), 120),
    left(nullif(p->>'utm_content', ''), 120), left(nullif(p->>'utm_term', ''), 120),
    left(nullif(p->>'landing', ''), 300),
    case when p->>'device' in ('mobile','tablet','desktop') then p->>'device' end,
    case when p->>'lang' in ('en','hi') then p->>'lang' end,
    v_ip
  );
end $function$;

-- Traffic report: help panel opens and the questions opened most.
CREATE OR REPLACE FUNCTION public.admin_traffic(p_passcode text, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_from timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
begin
  if not public._is_admin(p_passcode) then return jsonb_build_object('ok', false); end if;
  return (
    with ev as (
      select * from public.site_events where created_at >= v_from
    ),
    sess as (
      -- One row per visit, credited to the source it arrived from.
      select session,
        coalesce(min(utm_source) filter (where utm_source is not null), min(referrer) filter (where referrer is not null), 'direct') as source,
        coalesce(min(utm_medium) filter (where utm_medium is not null), case when min(referrer) is not null then 'referral' else 'none' end) as medium,
        min(utm_campaign) filter (where utm_campaign is not null) as campaign,
        count(*) filter (where event = 'page_view') as views,
        count(*) filter (where event in ('enquiry_whatsapp','enquiry_email','call_click')) as enquiries,
        count(*) filter (where event = 'add_to_cart') as carts,
        count(*) filter (where event = 'purchase') as purchases,
        coalesce(sum(value_paise) filter (where event = 'purchase'), 0) as revenue
      from ev group by session
    )
    select jsonb_build_object(
      'ok', true,
      'days', greatest(1, least(coalesce(p_days, 30), 365)),
      'totals', (select jsonb_build_object(
          'visitors', count(distinct visitor),
          'visits', count(distinct session),
          'page_views', count(*) filter (where event = 'page_view'),
          'enquiries', count(*) filter (where event in ('enquiry_whatsapp','enquiry_email','call_click')),
          'whatsapp', count(*) filter (where event = 'enquiry_whatsapp'),
          'email', count(*) filter (where event = 'enquiry_email'),
          'calls', count(*) filter (where event = 'call_click'),
          'guide_to_programme', count(*) filter (where event = 'learn_to_programme'),
          'add_to_cart', count(*) filter (where event = 'add_to_cart'),
          'checkouts', count(*) filter (where event = 'begin_checkout'),
          'purchases', count(*) filter (where event = 'purchase'),
          'revenue_paise', coalesce(sum(value_paise) filter (where event = 'purchase'), 0),
          'help_opens', count(*) filter (where event = 'help_open')) from ev),
      'help_questions', coalesce((select jsonb_agg(q order by (q->>'count')::int desc) from (
          select jsonb_build_object('question', label, 'count', count(*)) q
          from ev where event = 'help_question' and label is not null group by label order by count(*) desc limit 20) x), '[]'::jsonb),
      'by_day', coalesce((select jsonb_agg(d order by d->>'day') from (
          select jsonb_build_object('day', to_char(created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD'),
            'visitors', count(distinct visitor), 'views', count(*) filter (where event = 'page_view'),
            'enquiries', count(*) filter (where event in ('enquiry_whatsapp','enquiry_email','call_click'))) d
          from ev group by to_char(created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD')) x), '[]'::jsonb),
      'sources', coalesce((select jsonb_agg(s order by (s->>'visits')::int desc) from (
          select jsonb_build_object('source', source, 'medium', medium, 'campaign', campaign, 'visits', count(*),
            'views', sum(views), 'enquiries', sum(enquiries), 'carts', sum(carts), 'purchases', sum(purchases), 'revenue_paise', sum(revenue)) s
          from sess group by source, medium, campaign order by count(*) desc limit 40) x), '[]'::jsonb),
      'pages', coalesce((select jsonb_agg(pg order by (pg->>'views')::int desc) from (
          select jsonb_build_object('path', path, 'views', count(*) filter (where event = 'page_view'),
            'enquiries', count(*) filter (where event in ('enquiry_whatsapp','enquiry_email','call_click')),
            'to_programmes', count(*) filter (where event = 'learn_to_programme')) pg
          from ev group by path order by count(*) filter (where event = 'page_view') desc limit 50) x), '[]'::jsonb),
      'devices', coalesce((select jsonb_object_agg(coalesce(device, 'unknown'), n) from (select device, count(distinct session) n from ev where event = 'page_view' group by device) x), '{}'::jsonb)
    )
  );
end $function$;

-- The table's own check on event names, widened to match.
alter table public.site_events
  drop constraint site_events_event_check,
  add constraint site_events_event_check check (event = any (array['page_view','enquiry_whatsapp','enquiry_email','call_click','social_click','outbound_click','learn_to_programme','add_to_cart','begin_checkout','purchase','finder_result','help_open','help_question']));
