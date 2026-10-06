// Browser-side state: who the visitor is and what is in their cart.
// Both live in localStorage so they survive page loads and return visits.

const VISITOR_KEY = "th_visitor_v1";
const CART_KEY = "th_cart_v1";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage full: state lasts for this page only */
  }
}

// ---- visitor ---------------------------------------------------------------
export function getVisitor() {
  const v = read(VISITOR_KEY, null);
  return v && v.id && v.email ? v : null;
}

export function setVisitor(visitor) {
  write(VISITOR_KEY, { ...visitor, saved_at: new Date().toISOString() });
  document.dispatchEvent(new CustomEvent("th:visitor", { detail: visitor }));
}

export function clearVisitor() {
  try {
    localStorage.removeItem(VISITOR_KEY);
  } catch { /* nothing to clear */ }
}

// ---- cart ------------------------------------------------------------------
// Stored as [{ id, qty }]. Prices are never stored; they are always looked up
// from the current catalogue so a stale cart cannot show an old price.
export function getCart() {
  const c = read(CART_KEY, []);
  return Array.isArray(c) ? c.filter((l) => l && l.id && Number.isInteger(l.qty) && l.qty > 0) : [];
}

function saveCart(cart) {
  write(CART_KEY, cart);
  document.dispatchEvent(new CustomEvent("th:cart", { detail: cart }));
}

export const MAX_QTY = 10;

export function addToCart(id, qty = 1, limit = MAX_QTY) {
  const cart = getCart();
  const line = cart.find((l) => l.id === id);
  const cap = Math.max(1, Math.min(MAX_QTY, limit ?? MAX_QTY));
  if (line) line.qty = Math.min(cap, line.qty + qty);
  else cart.push({ id, qty: Math.min(cap, qty) });
  saveCart(cart);
  return cart;
}

export function setQty(id, qty) {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter((l) => l.id !== id);
  else cart = cart.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l));
  saveCart(cart);
  return cart;
}

export function removeFromCart(id) {
  return setQty(id, 0);
}

export function clearCart() {
  saveCart([]);
}

export function cartCount() {
  return getCart().reduce((n, l) => n + l.qty, 0);
}
