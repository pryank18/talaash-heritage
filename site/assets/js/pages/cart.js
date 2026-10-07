import { CONFIG } from "../config.js";
import { getProducts, getShippingRule } from "../api.js";
import { getCart, setQty, removeFromCart, MAX_QTY } from "../store.js";
import { $, esc, money, productArt, shippingFor, typeLine } from "../ui.js";

const root = $("#cart-root");

/** Join the stored cart with the live catalogue; drop anything that has disappeared. */
export async function pricedCart() {
  const [products, rule] = await Promise.all([getProducts(), getShippingRule()]);
  const lines = [];
  for (const l of getCart()) {
    const p = products.find((x) => x.id === l.id);
    if (!p) { removeFromCart(l.id); continue; }
    const max = Math.min(MAX_QTY, p.stock ?? MAX_QTY);
    if (max <= 0) { lines.push({ p, qty: l.qty, max, soldOut: true, total: 0 }); continue; }
    const qty = Math.min(l.qty, max);
    if (qty !== l.qty) setQty(l.id, qty);
    lines.push({ p, qty, max, soldOut: false, total: p.price_paise * qty });
  }
  const buyable = lines.filter((l) => !l.soldOut);
  const subtotal = buyable.reduce((n, l) => n + l.total, 0);
  const needsShipping = buyable.some((l) => l.p.requires_shipping);
  const shipping = shippingFor(subtotal, needsShipping, rule);
  return { lines, buyable, subtotal, needsShipping, shipping, total: subtotal + shipping, rule };
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
            ({ p, qty, max, soldOut, total }) => `
          <li class="line" data-line="${esc(p.id)}">
            <div class="line-art">${productArt(p)}</div>
            <div>
              <a class="line-title" href="product.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a>
              <div class="small muted">${esc(typeLine(p))}</div>
              <div class="line-controls">
                ${
                  soldOut
                    ? `<strong>No longer available</strong>`
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
        </dl>
        ${freeGap > 0 ? `<p class="small muted">Add ${money(freeGap)} more for free delivery.</p>` : ""}
        ${
          CONFIG.sampleNotice
            ? `<p class="note">Bookings open soon. These listings are examples and cannot be ordered yet.</p>`
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
