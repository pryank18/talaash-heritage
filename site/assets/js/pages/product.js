import { getProduct } from "../api.js";
import { CONFIG } from "../config.js";
import { addToCart, getCart, MAX_QTY } from "../store.js";
import { $, esc, formatDuration, formatWhen, priceHtml, productArt, stockFlag, toast, typeLabel } from "../ui.js";

const root = $("#product-root");
const slug = new URLSearchParams(location.search).get("slug");

function specRows(p) {
  const rows = [];
  if (p.starts_at) rows.push([p.type === "course" ? "Starts" : "When", formatWhen(p.starts_at)]);
  if (p.duration_minutes) rows.push([p.type === "course" ? "Each session" : "Length", formatDuration(p.duration_minutes)]);
  if (p.venue) rows.push(["Where", p.venue]);
  if (p.seller_name) rows.push(["Offered by", [p.seller_name, p.seller_city].filter(Boolean).join(", ")]);
  if (p.speaker) rows.push(["Taught by", p.speaker]);
  for (const [k, v] of Object.entries(p.details || {})) rows.push([k, v]);
  if (p.requires_shipping) rows.push(["Delivery", "Shipped within India. Delivery charge is shown in your cart."]);
  return rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
}

async function render() {
  let p = null;
  try {
    p = slug ? await getProduct(slug) : null;
  } catch (e) {
    root.innerHTML = `<div class="empty"><h1>The catalogue did not load</h1><p>${esc(e.message)}</p></div>`;
    return;
  }
  if (!p) {
    root.innerHTML = `<div class="empty"><h1>This item is not in the shop</h1><p>It may have been removed, or the link is incomplete. <a href="shop.html">Browse everything we have</a>.</p></div>`;
    return;
  }

  document.title = `${p.title} | Talaash Heritage`;
  $('meta[name="description"]')?.setAttribute("content", p.subtitle || p.title);

  const flag = stockFlag(p);
  const inCart = getCart().find((l) => l.id === p.id)?.qty || 0;
  const max = Math.min(MAX_QTY, p.stock ?? MAX_QTY);
  const unit = p.requires_shipping ? "Quantity" : p.type === "counselling" ? "Sessions" : p.type === "recording" ? "Copies" : "Seats";

  root.innerHTML = `
    <p class="crumbs"><a href="shop.html">Shop</a> / ${esc(typeLabel(p.type))}</p>
    <div class="product">
      <div class="product-art">${productArt(p)}</div>
      <div>
        <h1>${esc(p.title)}</h1>
        ${p.subtitle ? `<p class="product-sub">${esc(p.subtitle)}</p>` : ""}
        <p class="product-price">${priceHtml(p)}</p>
        ${flag ? `<p><strong>${esc(flag.text)}</strong></p>` : ""}
        ${
          CONFIG.sampleNotice
            ? `<p class="note">Bookings open soon. This listing is an example while the site is being set up.</p><a class="btn btn-outline" href="contact.html">Contact us</a>`
            : flag?.soldOut
            ? `<p class="muted">Write to us and we will tell you when it is back.</p><a class="btn btn-outline" href="contact.html">Contact us</a>`
            : `<div class="buy-row">
                 <span class="small muted">${unit}</span>
                 <div class="qty" role="group" aria-label="${unit}">
                   <button type="button" data-dec aria-label="Decrease">−</button>
                   <output data-qty aria-live="polite">1</output>
                   <button type="button" data-inc aria-label="Increase">+</button>
                 </div>
                 <button class="btn btn-primary" type="button" data-buy>Add to cart</button>
               </div>
               <p class="small muted" data-incart>${inCart ? `${inCart} already in your cart. <a href="cart.html">View cart</a>` : ""}</p>`
        }
        <div class="prose">${(p.description || "").split(/\n{2,}/).map((para) => `<p>${esc(para)}</p>`).join("")}</div>
        ${
          p.seller_name
            ? `<div class="partner-note"><p><strong>Run by ${esc(p.seller_name)}</strong>, an independent partner of Talaash Heritage.${p.seller_bio ? ` ${esc(p.seller_bio)}` : ""}</p><p class="small muted">You book and pay through Talaash Heritage, and our <a href="shipping-returns.html">refund policy</a> applies.</p></div>`
            : ""
        }
        <dl class="spec">${specRows(p)}</dl>
      </div>
    </div>`;

  if (flag?.soldOut || CONFIG.sampleNotice) return;
  let qty = 1;
  const out = $("[data-qty]", root);
  const dec = $("[data-dec]", root);
  const inc = $("[data-inc]", root);
  const sync = () => {
    out.textContent = String(qty);
    dec.disabled = qty <= 1;
    inc.disabled = qty >= max;
  };
  dec.addEventListener("click", () => { qty = Math.max(1, qty - 1); sync(); });
  inc.addEventListener("click", () => { qty = Math.min(max, qty + 1); sync(); });
  sync();

  $("[data-buy]", root).addEventListener("click", () => {
    addToCart(p.id, qty, max);
    const now = getCart().find((l) => l.id === p.id)?.qty || qty;
    $("[data-incart]", root).innerHTML = `${now} in your cart. <a href="cart.html">View cart</a>`;
    toast("Added to cart", { href: "cart.html", label: "View cart" });
  });
}

render();
