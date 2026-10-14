// POST /functions/v1/create-order
// Called by checkout.js when the buyer chooses card, netbanking or UPI through
// Razorpay. The order itself is created by the same database function the UPI
// and WhatsApp orders use (create_order), so prices, seats and the rate limit
// are checked in one place. This function then opens a Razorpay order for the
// exact total the database calculated, never a figure from the browser.

import { cors, env, fail, json, db, razorpay } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return fail(req, 405, "method", "Use POST.");

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return fail(req, 400, "bad_request", "The order could not be read.");
  }
  const visitor = String(payload.visitor_id || "");

  // 1. Create the order as the public would, passing the buyer's own IP on so
  //    the per-network rate limit still applies to them, not to this server.
  const anon = env("SUPABASE_ANON_KEY");
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "";
  const res = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/create_order`, {
    method: "POST",
    headers: {
      apikey: anon,
      ...(anon.startsWith("eyJ") ? { Authorization: `Bearer ${anon}` } : {}),
      "Content-Type": "application/json",
      ...(ip ? { "x-forwarded-for": ip } : {}),
    },
    body: JSON.stringify({
      p_payment_method: "razorpay",
      p_customer: payload.customer,
      p_items: payload.items,
      p_shipping_address: payload.shipping_address ?? null,
      p_visitor_id: /^[0-9a-f-]{36}$/i.test(visitor) ? visitor : null,
    }),
  });
  const order = await res.json().catch(() => null);
  if (!res.ok || !order?.order_id) {
    // Pass database errors (out_of_stock, rate_limited, bad_pin...) through
    // unchanged; api.js turns them into plain sentences.
    return json(req, res.status || 500, order || { error: { code: "order_failed", message: "The order could not be created." } });
  }

  // 2. Open a Razorpay order for the database's total.
  try {
    const rzp = await razorpay("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: Number(order.total_paise),
        currency: order.currency || "INR",
        receipt: String(order.order_number).slice(0, 40),
        notes: { order_id: order.order_id, order_number: order.order_number },
      }),
    });
    await db(`/rest/v1/orders?id=eq.${order.order_id}`, {
      method: "PATCH",
      body: JSON.stringify({ razorpay_order_id: rzp.id }),
    });
    return json(req, 200, { ...order, razorpay_order_id: rzp.id, razorpay_key_id: env("RAZORPAY_KEY_ID") });
  } catch (e) {
    console.error("create-order", order.order_number, e);
    return fail(
      req,
      502,
      "gateway",
      `Your order ${order.order_number} is saved, but the payment window could not be opened. Try again in a minute, or choose UPI or WhatsApp.`,
    );
  }
});
