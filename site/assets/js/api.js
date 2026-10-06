// The only file that talks to the backend. Pages call these functions and do
// not care whether the site is live (Supabase) or in demo mode (local JSON).
//
// Supabase is reached with plain fetch against its REST endpoints, so the
// storefront ships no SDK and has no build step.

import { CONFIG, isLive } from "./config.js";

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function headers() {
  const h = { apikey: CONFIG.supabaseAnonKey, "Content-Type": "application/json" };
  // Legacy anon keys are JWTs and go in Authorization too. The newer
  // sb_publishable_ keys are sent as apikey only.
  if (CONFIG.supabaseAnonKey.startsWith("eyJ")) h.Authorization = `Bearer ${CONFIG.supabaseAnonKey}`;
  return h;
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${CONFIG.supabaseUrl}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  } catch {
    throw new ApiError("network", "Could not reach the server. Check your connection and try again.");
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch { /* non-JSON error body */ }
  if (!res.ok) {
    const code = data?.error?.code || data?.message || data?.code || `http_${res.status}`;
    const message = data?.error?.message || data?.message || "Something went wrong. Try again.";
    throw new ApiError(String(code), String(message));
  }
  return data;
}

// ---- catalogue -------------------------------------------------------------
let productCache = null;

const PRODUCT_COLUMNS =
  "id,slug,title,subtitle,description,type,price_paise,compare_at_paise,currency,stock,requires_shipping," +
  "image_url,starts_at,duration_minutes,speaker,venue,details,tags,is_active,is_featured,sort_order,seller_id";

export async function getProducts() {
  if (productCache) return productCache;
  if (isLive()) {
    const [products, sellers] = await Promise.all([
      request(`/rest/v1/products?select=${PRODUCT_COLUMNS}&is_active=eq.true&order=sort_order.asc,created_at.desc`),
      request("/rest/v1/public_sellers?select=id,name,city,bio").catch(() => []),
    ]);
    // Listings run by partners carry the partner's public name, city and bio.
    const byId = new Map((sellers || []).map((s) => [s.id, s]));
    productCache = products.map((p) => {
      const s = p.seller_id ? byId.get(p.seller_id) : null;
      return s ? { ...p, seller_name: s.name, seller_city: s.city, seller_bio: s.bio } : p;
    });
  } else {
    const res = await fetch("data/products.json");
    if (!res.ok) throw new ApiError("catalogue", "The catalogue could not be loaded. Reload the page.");
    productCache = (await res.json()).filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }
  return productCache;
}

export async function getProduct(slug) {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) || null;
}

export async function getShippingRule() {
  if (!isLive()) return CONFIG.shipping;
  try {
    const rows = await request("/rest/v1/public_settings?select=value&key=eq.shipping");
    return rows?.[0]?.value || CONFIG.shipping;
  } catch {
    return CONFIG.shipping;
  }
}

// ---- visitor registration --------------------------------------------------
const REGISTER_ERRORS = {
  consent_required: "Tick the consent box to continue.",
  invalid_name: "Enter your full name.",
  invalid_email: "That email address does not look right. Check it and try again.",
  invalid_phone: "Enter your phone number with country code, digits only.",
  invalid_location: "Enter your city and country.",
  rate_limited: "Too many registrations from this network in the last hour. Try again later.",
};

export async function registerVisitor(form) {
  if (!isLive()) {
    // Demo mode: nothing leaves this browser.
    return { id: crypto.randomUUID(), demo: true };
  }
  try {
    const id = await request("/rest/v1/rpc/register_visitor", {
      method: "POST",
      body: JSON.stringify({
        p_full_name: form.full_name,
        p_email: form.email,
        p_phone: form.phone,
        p_city: form.city,
        p_country: form.country,
        p_region: form.region || null,
        p_postal_code: form.postal_code || null,
        p_latitude: form.latitude ?? null,
        p_longitude: form.longitude ?? null,
        p_consent: form.consent === true,
        p_consent_version: CONFIG.consentVersion,
        p_marketing_opt_in: form.marketing_opt_in === true,
        p_meta: form.meta || {},
      }),
    });
    return { id, demo: false };
  } catch (e) {
    const known = Object.keys(REGISTER_ERRORS).find((k) => `${e.code} ${e.message}`.includes(k));
    throw new ApiError(known || e.code, known ? REGISTER_ERRORS[known] : e.message);
  }
}

// ---- orders ----------------------------------------------------------------
const ORDER_ERRORS = {
  bad_payment_method: "Choose how you want to pay.",
  bad_name: "Enter your full name.",
  bad_email: "Enter a valid email address.",
  bad_phone: "Enter a valid phone number with country code.",
  empty_cart: "Your cart is empty.",
  too_many_lines: "Too many different items in one order. Split it into two.",
  bad_item: "Something in your cart is not valid. Remove it and add it again.",
  unavailable: "One of the items is no longer available. Go back to your cart to update it.",
  bad_address: "Enter the full delivery address, including PIN code.",
  bad_pin: "Enter a valid 6-digit PIN code.",
  no_shipping: "We deliver physical items within India only.",
  rate_limited: "Too many orders from this network in the last hour. Try again later or message us on WhatsApp.",
  bad_reference: "That does not look like a UPI reference. It is the 12-digit number in your payment receipt.",
  order_not_found: "This order can no longer be updated. Message us if you have paid.",
};

function friendly(e) {
  const text = `${e.code} ${e.message}`;
  const sold = text.match(/out_of_stock: (.+)$/);
  if (sold) return new ApiError("out_of_stock", `"${sold[1]}" is sold out or has fewer places left than you asked for. Update your cart.`);
  const known = Object.keys(ORDER_ERRORS).find((k) => text.includes(k));
  return known ? new ApiError(known, ORDER_ERRORS[known]) : e;
}

export async function createOrder(payload) {
  if (isLive()) {
    // Card payments need a server to talk to Razorpay. UPI and WhatsApp orders
    // are created by a database function, so they work with no server at all.
    if (payload.payment_method === "razorpay") {
      return request("/functions/v1/create-order", { method: "POST", body: JSON.stringify(payload) });
    }
    try {
      return await request("/rest/v1/rpc/create_order", {
        method: "POST",
        body: JSON.stringify({
          p_payment_method: payload.payment_method,
          p_customer: payload.customer,
          p_items: payload.items,
          p_shipping_address: payload.shipping_address,
          p_visitor_id: /^[0-9a-f-]{36}$/i.test(payload.visitor_id || "") ? payload.visitor_id : null,
        }),
      });
    } catch (e) {
      throw friendly(e);
    }
  }
  // Demo mode: price the cart locally so the flow can be clicked through.
  const products = await getProducts();
  let subtotal = 0;
  let needsShipping = false;
  const items = payload.items.map((it) => {
    const p = products.find((x) => x.id === it.product_id);
    subtotal += p.price_paise * it.quantity;
    needsShipping = needsShipping || p.requires_shipping;
    return { title: p.title, type: p.type, quantity: it.quantity, unit_price_paise: p.price_paise, line_total_paise: p.price_paise * it.quantity };
  });
  const rule = CONFIG.shipping;
  const shipping = needsShipping && subtotal < rule.free_above_paise ? rule.flat_paise : 0;
  const order = {
    order_id: crypto.randomUUID(),
    order_number: `DEMO-${String(Date.now()).slice(-5)}`,
    access_token: "demo",
    subtotal_paise: subtotal,
    shipping_paise: shipping,
    total_paise: subtotal + shipping,
    currency: "INR",
    payment_method: payload.payment_method,
    demo: true,
  };
  sessionStorage.setItem(
    `th_demo_order_${order.order_id}`,
    JSON.stringify({
      id: order.order_id,
      order_number: order.order_number,
      status: payload.payment_method === "razorpay" ? "paid" : "pending",
      reference_submitted: false,
      payment_method: payload.payment_method,
      customer_name: payload.customer.name,
      subtotal_paise: subtotal,
      shipping_paise: shipping,
      total_paise: subtotal + shipping,
      has_shipping: needsShipping,
      created_at: new Date().toISOString(),
      items,
      demo: true,
    }),
  );
  return order;
}

export async function submitPaymentReference(orderId, token, reference) {
  const ref = String(reference || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{6,35}$/.test(ref)) throw new ApiError("bad_reference", ORDER_ERRORS.bad_reference);
  if (!isLive() || token === "demo") {
    const key = `th_demo_order_${orderId}`;
    const order = JSON.parse(sessionStorage.getItem(key) || "null");
    if (order) sessionStorage.setItem(key, JSON.stringify({ ...order, reference_submitted: true }));
    return true;
  }
  try {
    return await request("/rest/v1/rpc/submit_payment_reference", {
      method: "POST",
      body: JSON.stringify({ p_order_id: orderId, p_token: token, p_reference: ref }),
    });
  } catch (e) {
    throw friendly(e);
  }
}

export async function verifyPayment(payload) {
  return request("/functions/v1/verify-payment", { method: "POST", body: JSON.stringify(payload) });
}

export async function getOrder(orderId, token) {
  if (!isLive() || token === "demo") {
    const raw = sessionStorage.getItem(`th_demo_order_${orderId}`);
    return raw ? JSON.parse(raw) : null;
  }
  return request("/rest/v1/rpc/get_order_public", {
    method: "POST",
    body: JSON.stringify({ p_order_id: orderId, p_token: token }),
  });
}

// ---- owner admin and partner functions -------------------------------------
// Database errors raised with a short code are turned into plain sentences here.
const RPC_ERRORS = {
  locked_out: "Too many wrong attempts from this network. Wait an hour and try again.",
  terms_required: "Tick the box to accept the partner terms.",
  invalid_name: "Enter your name or your organisation's name.",
  invalid_email: "Enter a valid email address.",
  invalid_phone: "Enter your phone number with country code.",
  invalid_location: "Enter your city.",
  offering_short: "Tell us a little more about what you want to offer, at least a couple of sentences.",
  invalid_upi: "That UPI ID does not look right. It should look like name@bank.",
  weak_password: "Choose a password of at least 10 characters.",
  already_applied: "There is already an application with this email. Sign in on the partner page instead.",
  rate_limited: "Too many attempts from this network today. Try again tomorrow or write to us.",
  not_approved: "Your partner account is not approved yet, so you cannot add listings.",
  too_many_listings: "You have reached 50 listings. Write to us if you need more.",
  forbidden: "You can only change your own listings.",
  bad_title: "Give the listing a title of at least three letters.",
  bad_type: "Choose what kind of listing this is.",
  bad_number: "One of the numbers or the date is not valid. Check price, seats, length and date.",
  bad_price: "Enter the price in rupees.",
  bad_stock: "Seats must be a whole number, or empty for unlimited.",
  bad_image: "The photo link must start with https://",
  bad_link: "The joining or booking link must start with https://",
  bad_slug: "The link name needs at least three letters or numbers.",
  slug_taken: "Another listing already uses that link name. Change the link name.",
  unknown_seller: "That partner no longer exists.",
  order_not_found: "That order no longer exists.",
};

export async function rpc(name, args) {
  if (!isLive()) throw new ApiError("demo", "This needs the live database. Connect Supabase first (see docs/SETUP.md).");
  try {
    return await request(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
  } catch (e) {
    const text = `${e.code} ${e.message}`;
    const known = Object.keys(RPC_ERRORS).find((k) => text.includes(k));
    if (known) throw new ApiError(known, RPC_ERRORS[known]);
    throw e;
  }
}
