// POST /functions/v1/razorpay-webhook
// Razorpay calls this from its own servers. Set it up in the Razorpay
// Dashboard > Accounts & Settings > Webhooks with the events payment.captured
// and order.paid, and the same secret as RAZORPAY_WEBHOOK_SECRET.

import { env, hmacHex, safeEqual, settle } from "../_shared/razorpay.ts";

const reply = (status: number, text: string) => new Response(text, { status });

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, "Use POST");

  const raw = await req.text(); // the signature covers the exact bytes sent
  const sig = req.headers.get("x-razorpay-signature") || "";
  const expected = await hmacHex(env("RAZORPAY_WEBHOOK_SECRET"), raw);
  if (!safeEqual(expected, sig)) return reply(401, "bad signature");

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return reply(400, "bad json");
  }

  const payment = event?.payload?.payment?.entity;
  if (!["payment.captured", "order.paid"].includes(event?.event) || !payment?.order_id) {
    return reply(200, "ignored"); // other events are acknowledged so Razorpay stops retrying
  }

  try {
    await settle(payment.order_id, payment.id);
    return reply(200, "ok");
  } catch (e) {
    console.error("webhook", event.event, payment.order_id, e);
    // A 500 makes Razorpay retry later, which is what we want for a
    // temporary failure. An order that is not ours is acknowledged.
    return String(e).includes("order_not_found") ? reply(200, "unknown order") : reply(500, "retry");
  }
});
