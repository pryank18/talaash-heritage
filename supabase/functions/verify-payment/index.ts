// POST /functions/v1/verify-payment
// Called by checkout.js the moment Razorpay's window reports success. It checks
// Razorpay's signature, then confirms the payment with Razorpay directly before
// marking the order paid. The webhook does the same independently, so an order
// is confirmed even if the buyer closes the tab before this call.

import { cors, env, fail, json, hmacHex, safeEqual, settle } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return fail(req, 405, "method", "Use POST.");

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "bad_request", "The payment details could not be read.");
  }
  const { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = body;
  if (!oid || !pid || !sig) return fail(req, 400, "bad_request", "Payment details are missing.");

  const expected = await hmacHex(env("RAZORPAY_KEY_SECRET"), `${oid}|${pid}`);
  if (!safeEqual(expected, sig)) return fail(req, 400, "bad_signature", "The payment could not be verified.");

  try {
    const result = await settle(oid, pid);
    return json(req, 200, result);
  } catch (e) {
    console.error("verify-payment", oid, pid, e);
    return fail(req, 500, "verify_failed", "We could not confirm the payment yet. If money left your account, the order will update within minutes.");
  }
});
