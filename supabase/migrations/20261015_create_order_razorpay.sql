-- The orders table, mark_order_paid and payment_events were built for Razorpay
-- from the start; only create_order refused 'razorpay'. This lets the
-- create-order edge function (service role) create Razorpay orders, while the
-- public can still only create 'upi' and 'whatsapp' ones. Safe to run again.
do $mig$
declare d text;
begin
  select pg_get_functiondef('public.create_order(text,jsonb,jsonb,jsonb,uuid)'::regprocedure) into d;
  if position('razorpay' in d) > 0 then return; end if;
  d := replace(d,
    $a$if p_payment_method is null or p_payment_method not in ('upi', 'whatsapp') then$a$,
    $b$-- 'razorpay' orders may only be created by the create-order edge function (service role).
  if p_payment_method is null
     or not (p_payment_method in ('upi', 'whatsapp')
             or (p_payment_method = 'razorpay'
                 and (coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'role', '') = 'service_role'
                      or current_setting('role', true) = 'service_role'))) then$b$);
  if position('razorpay' in d) = 0 then raise exception 'create_order text not as expected'; end if;
  execute d;
end
$mig$;
