// Shared by the three payment functions. Secrets come from Supabase function
// secrets (Dashboard > Edge Functions > Secrets), never from the website.
//
//   RAZORPAY_KEY_ID          rzp_test_... or rzp_live_...  (public, sent to the browser)
//   RAZORPAY_KEY_SECRET      the matching secret            (server only)
//   RAZORPAY_WEBHOOK_SECRET  the secret you type when adding the webhook
//   SITE_ORIGIN              https://talaash-heritage.pages.dev (comma-separate several)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
// to every function automatically.

export const env = (name: string): string => {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing_secret: ${name}`);
  return v;
};

const allowed = () =>
  (Deno.env.get("SITE_ORIGIN") || "https://talaash-heritage.pages.dev")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const list = allowed();
  const ok = list.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : list[0],
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json" },
  });
}

export const fail = (req: Request, status: number, code: string, message: string) =>
  json(req, status, { error: { code, message } });

// ---- crypto ----------------------------------------------------------------
const enc = new TextEncoder();

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time comparison, so a forged signature cannot be guessed byte by byte.
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---- Razorpay API ----------------------------------------------------------
export async function razorpay(path: string, init: RequestInit = {}) {
  const auth = btoa(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`);
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`razorpay_${res.status}: ${data?.error?.description || "request failed"}`);
  return data;
}

// ---- database (service role: bypasses row security, server only) -----------
export async function db(path: string, init: RequestInit = {}) {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${env("SUPABASE_URL")}${path}`, {
    ...init,
    headers: {
      apikey: key,
      ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`db_${res.status}: ${data?.message || text}`);
  return data;
}

/** Calls a database function as the service role. */
export const rpc = (name: string, args: Record<string, unknown>) =>
  db(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(args) });

/**
 * Marks an order paid once Razorpay has confirmed the money. Called by both
 * verify-payment (the buyer's browser) and the webhook (Razorpay's server).
 * The payment is fetched from Razorpay itself, so the amount and order cannot
 * be faked by whoever calls us. The database function mark_order_paid locks
 * the order, ignores a second call, and reduces the seats left.
 */
export async function settle(razorpayOrderId: string, paymentId: string) {
  let payment = await razorpay(`/payments/${encodeURIComponent(paymentId)}`);
  if (payment.order_id !== razorpayOrderId) throw new Error("mismatch: payment belongs to another order");
  if (payment.status === "authorized") {
    // Auto-capture is the Razorpay default. If it is off, capture here.
    payment = await razorpay(`/payments/${encodeURIComponent(paymentId)}/capture`, {
      method: "POST",
      body: JSON.stringify({ amount: payment.amount, currency: payment.currency }),
    });
  }
  if (payment.status !== "captured") return { paid: false, status: payment.status };

  const rows = await db(
    `/rest/v1/orders?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&select=id,total_paise`,
    { method: "GET" },
  );
  const order = rows?.[0];
  if (!order) throw new Error("order_not_found");
  if (Number(order.total_paise) !== Number(payment.amount)) throw new Error("mismatch: amount");
  const status = await rpc("mark_order_paid", { p_order_id: order.id, p_razorpay_payment_id: paymentId });
  return { paid: true, order_id: order.id, status };
}

/** Keeps every webhook Razorpay sends, once (event_id is unique). */
export async function logEvent(eventId: string | null, type: string, orderId: string | null, payload: unknown) {
  await db(`/rest/v1/payment_events${eventId ? "?on_conflict=event_id" : ""}`, {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ provider: "razorpay", event_type: type, event_id: eventId, order_id: orderId, payload }),
  }).catch((e) => console.error("payment_events", e));
}
