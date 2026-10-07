import { getProduct } from "../api.js";
import { CONFIG } from "../config.js";
import { addToCart, getCart, MAX_QTY } from "../store.js";
import { t } from "../i18n.js";
import { $, esc, formatDuration, formatWhen, isRequest, isSoon, kindLabel, priceHtml, productArt, requestLinks, stockFlag, toast } from "../ui.js";

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
  if (p.requires_shipping && !isSoon(p)) rows.push(["Delivery", "Shipped within India. Delivery charge is shown in your cart."]);
  return rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
}

/** Shown in place of the cart for programmes we run on request. */
function requestPanel(p) {
  const links = requestLinks(p);
  const tags = p.tags || [];
  const counselling = tags.includes("counselling");
  const travels = tags.includes("tour") || tags.includes("field");
  const how = counselling
    ? "Share what you would like to discuss and when you are available. We confirm a time and the fee before you commit."
    : travels
    ? "Send your preferred dates, group size and starting point. We prepare a day-by-day itinerary and a quotation, and revise both until they suit you. The suggested group size is a guide, not a requirement."
    : "Send your preferred dates, group size and location. We adapt the length, level and language, and prepare a quotation. The suggested group size is a guide, not a requirement.";
  return `<div class="request">
      <p><strong>${counselling ? "Scheduled at a time that suits you." : "Arranged for your group."}</strong> ${how}</p>
      <div class="buy-row">
        <a class="btn btn-primary" href="${esc(links.whatsapp)}" target="_blank" rel="noopener">${counselling ? "Request a session on WhatsApp" : "Request on WhatsApp"}</a>
        <a class="btn btn-outline" href="${esc(links.email)}">Request by email</a>
      </div>
      <p class="small muted">${counselling ? "No payment is taken until you confirm the session." : "No payment is taken until you approve the plan."} <a href="about.html#questions">Common questions</a></p>
    </div>`;
}

/** Shown for things that are listed but not ready to sell. */
function soonPanel(p) {
  const links = requestLinks(p);
  return `<div class="request">
      <p><strong>Coming soon.</strong> Register your interest and we will let you know as soon as it is available.</p>
      <div class="buy-row">
        <a class="btn btn-primary" href="${esc(links.whatsapp)}" target="_blank" rel="noopener">Notify me on WhatsApp</a>
        <a class="btn btn-outline" href="${esc(links.email)}">Notify me by email</a>
      </div>
    </div>`;
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
    root.innerHTML = `<div class="empty"><h1>This listing is not available</h1><p>It may have been withdrawn, or the link may be incomplete. <a href="shop.html">Browse everything we have</a>.</p></div>`;
    return;
  }

  document.title = `${p.title} | Talaash Heritage`;
  $('meta[name="description"]')?.setAttribute("content", p.subtitle || p.title);

  const request = isRequest(p);
  const soon = isSoon(p);
  const flag = request || soon ? null : stockFlag(p);
  const inCart = getCart().find((l) => l.id === p.id)?.qty || 0;
  const max = Math.min(MAX_QTY, p.stock ?? MAX_QTY);
  const unit = p.requires_shipping ? "Quantity" : p.type === "counselling" ? "Sessions" : p.type === "recording" ? "Copies" : "Seats";

  root.innerHTML = `
    <p class="crumbs"><a href="shop.html">Everything we offer</a> / ${esc(t(kindLabel(p)))}</p>
    <div class="product">
      <div class="product-art">${productArt(p, "(min-width: 760px) 50vw, 100vw")}</div>
      <div>
        <h1>${esc(p.title)}</h1>
        ${p.subtitle ? `<p class="product-sub">${esc(p.subtitle)}</p>` : ""}
        <p class="product-price">${request ? "On request" : soon ? "Coming soon" : priceHtml(p)}</p>
        ${flag ? `<p><strong>${esc(flag.text)}</strong></p>` : ""}
        ${
          request
            ? requestPanel(p)
            : soon
            ? soonPanel(p)
            : CONFIG.sampleNotice
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
        ${p.highlights?.length ? `<h2 class="covers-title">What it covers</h2><ul class="covers">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        ${
          p.seller_name
            ? `<div class="partner-note"><p><strong>Run by ${esc(p.seller_name)}</strong>, an independent partner of Talaash Heritage.${p.seller_bio ? ` ${esc(p.seller_bio)}` : ""}</p><p class="small muted">You book and pay through Talaash Heritage, and our <a href="shipping-returns.html">refund policy</a> applies.</p></div>`
            : ""
        }
        <dl class="spec">${specRows(p)}</dl>
      </div>
    </div>`;

  if (request || soon || flag?.soldOut || CONFIG.sampleNotice) return;
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
