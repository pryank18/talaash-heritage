import { CONFIG } from "../config.js";
import { getProducts, getShippingRule } from "../api.js";
import { getCart, setQty, removeFromCart, MAX_QTY } from "../store.js";
import { $, esc, isRequest, isSoon, money, needsSlot, productArt, productHref, shippingFor, typeLine } from "../ui.js";
import { getHold, slotLabel } from "../booking.js";

const root = $("#cart-root");

/** Join the stored cart with the live catalogue; drop anything that has disappeared. */
export async function pricedCart() {
  const [products, rule] = await Promise.all([getProducts({ requireDatabase: true, includeUnlisted: true }), getShippingRule()]);
  const lines = [];
  for (const l of getCart()) {
    const p = products.find((x) => x.id === l.id);
    // Programmes on request and things not yet on sale are never sold through the cart.
    if (!p || isRequest(p) || isSoon(p)) { removeFromCart(l.id); continue; }
    // A booked course is one booking: one learner, one time.
    const max = needsSlot(p) ? 1 : Math.min(MAX_QTY, p.stock ?? MAX_QTY);
    if (max <= 0) { lines.push({ p, qty: l.qty, max, soldOut: true, total: 0 }); continue; }
    const qty = Math.min(l.qty, max);
    if (qty !== l.qty) setQty(l.id, qty);
    const hold = needsSlot(p) ? getHold(p.id) : null;
    lines.push({ p, qty, max, soldOut: false, total: p.price_paise * qty, hold, missingSlot: needsSlot(p) && !hold });
  }
  const buyable = lines.filter((l) => !l.soldOut);
  const missingSlot = buyable.find((l) => l.missingSlot) || null;
  const subtotal = buyable.reduce((n, l) => n + l.total, 0);
  const needsShipping = buyable.some((l) => l.p.requires_shipping);
  const shipping = shippingFor(subtotal, needsShipping, rule);
  // GST already inside the price, shown as a break-up (details.gst_pct on the listing, e.g. 18).
  const gst = buyable.reduce((n, l) => {
    const pct = Number(l.p.details?.gst_pct) || 0;
    return n + (pct ? Math.round((l.total * pct) / (100 + pct)) : 0);
  }, 0);
  return { lines, buyable, subtotal, needsShipping, shipping, total: subtotal + shipping, gst, rule, missingSlot };
}

async function render() {
  let cart;
  try {
    cart = await pricedCart();
  } catch (e) {
    root.innerHTML = `<p class="form-error">${esc(e.message)}</p>`;
    return;
  }
  if (!cart.lines.length) {
    root.innerHTML = `<div class="empty"><h2>Your cart is empty</h2><p>Pick a lecture, a walk or something for your desk.</p><a class="btn btn-primary" href="shop.html">Browse the shop</a></div>`;
    return;
  }
  const freeGap = cart.needsShipping && cart.shipping > 0 && cart.rule.free_above_paise ? cart.rule.free_above_paise - cart.subtotal : 0;

  root.innerHTML = `
    <div class="layout-2">
      <ul class="lines">
        ${cart.lines
          .map(
            ({ p, qty, max, soldOut, total, hold, missingSlot }) => `
          <li class="line" data-line="${esc(p.id)}">
            <div class="line-art">${productArt(p)}</div>
            <div>
              <a class="line-title" href="product.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a>
              <div class="small muted">${esc(typeLine(p))}</div>
              ${hold ? `<div class="small"><strong>${esc(slotLabel(hold.kind, hold.start))}</strong><br>${esc(hold.topic)} · <a href="${esc(productHref(p))}">Change</a></div>` : ""}
              ${missingSlot ? `<div class="small"><a href="${esc(productHref(p))}"><strong>Choose a date and time</strong></a></div>` : ""}
              <div class="line-controls">
                ${
                  soldOut
                    ? `<strong>No longer available</strong>`
                    : needsSlot(p)
                    ? ""
                    : `<div class="qty" role="group" aria-label="Quantity of ${esc(p.title)}">
                         <button type="button" data-step="-1" aria-label="Decrease">−</button>
                         <output>${qty}</output>
                         <button type="button" data-step="1" aria-label="Increase" ${qty >= max ? "disabled" : ""}>+</button>
                       </div>`
                }
                <button class="btn-plain small" type="button" data-remove>Remove</button>
              </div>
            </div>
            <div class="line-total">${soldOut ? "" : money(total)}</div>
          </li>`,
          )
          .join("")}
      </ul>
      <aside class="summary" aria-label="Order summary">
        <h2>Summary</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>${money(cart.subtotal)}</dd></div>
          ${cart.needsShipping ? `<div><dt>Delivery in India</dt><dd>${cart.shipping ? money(cart.shipping) : "Free"}</dd></div>` : ""}
          <div class="total"><dt>Total</dt><dd>${money(cart.total)}</dd></div>
          ${cart.gst ? `<div class="gst-line"><dt>Includes GST</dt><dd>${money(cart.gst)}</dd></div>` : ""}
        </dl>
        ${freeGap > 0 ? `<p class="small muted">Add ${money(freeGap)} more for free delivery.</p>` : ""}
        ${
          CONFIG.sampleNotice
            ? `<p class="note">Bookings open soon. These listings are examples and cannot be ordered yet.</p>`
            : cart.missingSlot
            ? `<a class="btn btn-primary btn-block" href="${esc(productHref(cart.missingSlot.p))}">Choose a date and time first</a>`
            : cart.buyable.length
            ? `<a class="btn btn-primary btn-block" href="checkout.html">Go to checkout</a>`
            : `<p class="form-error">Nothing in your cart can be ordered right now.</p>`
        }
        <p class="small muted" style="margin:0.9rem 0 0">Prices include all taxes. Lecture and course links appear on your order page as soon as payment goes through.</p>
      </aside>
    </div>`;
}

if (root) {
  root.addEventListener("click", (e) => {
    const line = e.target.closest("[data-line]");
    if (!line) return;
    const id = line.dataset.line;
    if (e.target.closest("[data-remove]")) { removeFromCart(id); render(); return; }
    const step = e.target.closest("[data-step]");
    if (step) {
      const current = getCart().find((l) => l.id === id)?.qty || 0;
      setQty(id, current + Number(step.dataset.step));
      render();
    }
  });
  render();
}
