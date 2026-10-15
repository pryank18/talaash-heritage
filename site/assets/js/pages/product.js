import { getProduct, getProducts } from "../api.js";
import { CONFIG } from "../config.js";
import { addToCart, getCart, MAX_QTY } from "../store.js";
import { t } from "../i18n.js";
import { track } from "../track.js";
import { $, esc, formatDuration, formatWhen, isRequest, isSoon, kindLabel, photoCredit, priceHtml, pricingHtml, productArt, productHref, requestLinks, stockFlag, toast } from "../ui.js";

const root = $("#product-root");
// Static programme pages carry their slug on <body>; the dynamic page takes it from the link.
const slug = new URLSearchParams(location.search).get("slug") || document.body.dataset.slug;

function specRows(p) {
  const rows = [];
  const sessions = p.type === "course" || (p.tags || []).includes("career-course");
  if (p.starts_at) rows.push([sessions ? "Starts" : "When", formatWhen(p.starts_at)]);
  if (p.duration_minutes) rows.push([sessions ? "Each session" : "Length", formatDuration(p.duration_minutes)]);
  if (p.venue) rows.push(["Where", p.venue]);
  if (p.seller_name) rows.push(["Offered by", [p.seller_name, p.seller_city].filter(Boolean).join(", ")]);
  if (p.speaker) rows.push(["Taught by", p.speaker]);
  // Lower-case keys (gst_pct) are for the site's own use, not for display.
  for (const [k, v] of Object.entries(p.details || {})) if (!/^[a-z_]+$/.test(k)) rows.push([k, v]);
  if (p.requires_shipping && !isSoon(p)) rows.push(["Delivery", "Shipped within India. Delivery charge is shown in your cart."]);
  return rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
}

function googleLine() {
  const r = CONFIG.googleRating;
  const href = (CONFIG.socials || []).find((s) => s.label === "Google reviews")?.href;
  return r && href ? `<p class="small"><a href="${esc(href)}" target="_blank" rel="noopener">★ Rated ${esc(r.score)} on Google from ${r.count} reviews</a></p>` : "";
}

/** Shown in place of the cart for programmes we run on request. */
function requestPanel(p) {
  const links = requestLinks(p);
  const tags = p.tags || [];
  const counselling = tags.includes("counselling");
  const travels = ["tour", "field", "trip", "journey"].some((k) => tags.includes(k));
  const how = counselling
    ? "Share what you would like to discuss and when you are available. We confirm a time before you pay."
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
      ${googleLine()}
    </div>`;
}

/** The cancellation rule that applies to this listing, as set out on shipping-returns.html. */
function refundLine(p) {
  const tags = p.tags || [];
  if (p.type === "live" || p.type === "course" || tags.includes("career-course")) return "Full refund if you cancel 48 hours or more before it starts.";
  if (p.type === "walk" || p.type === "experience") return "Full refund if you cancel 72 hours or more before the start, or send someone in your place.";
  if (p.type === "counselling") return "Move your slot free of charge up to 24 hours before it.";
  if (p.type === "recording") return "Instant access. If the link does not work, we fix it or refund you.";
  if (p.type === "physical") return "Arrived damaged or wrong? We replace it or refund you, including delivery.";
  return "";
}

const waText = (p) => `Hello ${CONFIG.brand}, I have a question about "${p.title}": \n\n(ref: ${p.slug})`;

/** Under the cart button: what the buyer can count on, and a way to ask before paying. */
function assuranceHtml(p) {
  const r = CONFIG.googleRating;
  const reviews = (CONFIG.socials || []).find((s) => s.label === "Google reviews")?.href;
  const teacher = p.speaker === "@archaeologywala"
    ? `Taught by <a href="archaeologywala.html">@archaeologywala</a>, an archaeologist trained at Deccan College, Pune.`
    : p.speaker ? `Taught by ${esc(p.speaker)}.` : "";
  const lines = [
    teacher,
    refundLine(p) ? `${esc(refundLine(p))} <a href="shipping-returns.html">Policy</a>` : "",
    `Pay securely by card, netbanking or UPI.${p.details?.gst_pct ? " The price includes GST." : ""}`,
    reviews && r ? `<a href="${esc(reviews)}" target="_blank" rel="noopener">Rated ${esc(r.score)} on Google from ${r.count} reviews</a>` : "",
  ].filter(Boolean);
  const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(waText(p))}`;
  const mail = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(`Question: ${p.title}`)}&body=${encodeURIComponent(waText(p))}`;
  return `<ul class="assure">${lines.map((l) => `<li>${l}</li>`).join("")}</ul>
    <div class="ask-box">
      <p><strong>Questions before you book?</strong> Ask us and we help you decide.</p>
      <div class="buy-row">
        <a class="btn btn-outline" href="${esc(wa)}" target="_blank" rel="noopener">Ask on WhatsApp</a>
        <a class="btn btn-plain" href="${esc(mail)}">Email us</a>
        <a class="btn btn-plain" href="tel:${esc(CONFIG.contactPhone.replace(/\s+/g, ""))}">Call ${esc(CONFIG.contactPhone)}</a>
      </div>
    </div>`;
}

const PLAN_HEAD = { timed: "How the time is spent", days: "Day by day", outline: "Course outline", steps: "How it is planned" };
const PLAN_NOTE = {
  timed: "Timings are a guide. The plan is confirmed with your quotation.",
  days: "Days can be added, removed or reordered. The final itinerary comes with your quotation.",
  outline: "The number and length of sessions are agreed with your batch.",
};
const lowerFirst = (x) => (x && !/^[A-Z]{2}/.test(x) ? x[0].toLowerCase() + x.slice(1) : x);

/** Plan, aims, take-away, options, notes and related programmes. Mirrors extras_html() in tools/build_catalogue.py. */
function extrasHtml(p, all) {
  const out = [];
  if (p.plan?.length) {
    const kind = p.plan_kind || "timed";
    const items = p.plan.map((s) => `<li><p class="plan-head"><strong>${esc(s.title)}</strong>${s.minutes ? ` <span class="plan-time">${s.minutes} min</span>` : ""}</p>${s.detail ? `<p>${esc(s.detail)}</p>` : ""}${s.activity ? `<p class="plan-do">You: ${esc(lowerFirst(s.activity))}</p>` : ""}</li>`);
    out.push(`<h2 class="covers-title">${PLAN_HEAD[kind]}</h2><ol class="plan plan-${kind}">${items.join("")}</ol>${PLAN_NOTE[kind] ? `<p class="small muted">${PLAN_NOTE[kind]}</p>` : ""}`);
  }
  if (p.objectives?.length) out.push(`<h2 class="covers-title">By the end you can</h2><ul class="covers">${p.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>`);
  if (p.takeaway) out.push(`<h2 class="covers-title">You take away</h2><p>${esc(p.takeaway)}.</p>`);
  if (p.options?.length) out.push(`<h2 class="covers-title">Options you can add</h2><ul class="options">${p.options.map(([t, n]) => `<li><strong>${esc(t)}.</strong> ${esc(n)}</li>`).join("")}</ul>`);
  if (p.notes?.length) out.push(`<h2 class="covers-title">Good to know</h2><ul class="covers">${p.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`);
  const related = (p.related || []).map((slug) => all.find((x) => x.slug === slug)).filter(Boolean);
  if (related.length) out.push(`<h2 class="covers-title">Programmes in this journey</h2><ul class="covers">${related.map((r) => `<li><a href="${esc(productHref(r))}">${esc(r.title)}</a></li>`).join("")}</ul>`);
  return out.join("");
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
  // The dynamic page points search engines at the programme's static copy.
  if (p.page && !document.querySelector('link[rel="canonical"]')) {
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = new URL(p.page, location.href).href;
    document.head.append(link);
  }
  $('meta[name="description"]')?.setAttribute("content", p.subtitle || p.title);

  const all = p.related?.length ? await getProducts().catch(() => []) : [];
  const request = isRequest(p);
  const soon = isSoon(p);
  const flag = request || soon ? null : stockFlag(p);
  const inCart = getCart().find((l) => l.id === p.id)?.qty || 0;
  const max = Math.min(MAX_QTY, p.stock ?? MAX_QTY);
  const unit = p.requires_shipping ? "Quantity" : p.type === "counselling" ? "Sessions" : p.type === "recording" ? "Copies" : "Seats";

  root.innerHTML = `
    <p class="crumbs"><a href="shop.html">Everything we offer</a> / ${esc(t(kindLabel(p)))}</p>
    <div class="product">
      <div><div class="product-art">${productArt(p, "(min-width: 760px) 50vw, 100vw")}</div>${photoCredit(p)}</div>
      <div>
        <h1>${esc(p.title)}</h1>
        ${p.subtitle ? `<p class="product-sub">${esc(p.subtitle)}</p>` : ""}
        <p class="product-price">${request ? esc(p.pricing?.card || "On request") : soon ? "Coming soon" : priceHtml(p)}</p>
        ${request ? pricingHtml(p) : ""}
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
               <p class="small muted" data-incart>${inCart ? `${inCart} already in your cart. <a href="cart.html">View cart</a>` : ""}</p>
               ${assuranceHtml(p)}`
        }
        <div class="prose">${(p.description || "").split(/\n{2,}/).map((para) => `<p>${esc(para)}</p>`).join("")}</div>
        ${p.highlights?.length ? `<h2 class="covers-title">What it covers</h2><ul class="covers">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        ${extrasHtml(p, all)}
        ${
          p.seller_name
            ? `<div class="partner-note"><p><strong>Run by ${esc(p.seller_name)}</strong>, an independent partner of Talaash Heritage.${p.seller_bio ? ` ${esc(p.seller_bio)}` : ""}</p><p class="small muted">You book and pay through Talaash Heritage, and our <a href="shipping-returns.html">refund policy</a> applies.</p></div>`
            : ""
        }
        <dl class="spec">${specRows(p)}</dl>
      </div>
    </div>`;

  // Phones: keep the request buttons in reach at the foot of the screen.
  if (request || soon) {
    const links = requestLinks(p);
    const counselling = (p.tags || []).includes("counselling");
    const bar = document.createElement("div");
    bar.className = "app-action";
    bar.innerHTML = `
      <a class="btn btn-primary" href="${esc(links.whatsapp)}" target="_blank" rel="noopener">${soon ? "Notify me on WhatsApp" : counselling ? "Request a session on WhatsApp" : "Request on WhatsApp"}</a>
      <a class="btn btn-outline" href="${esc(links.email)}">Email</a>`;
    document.querySelector(".app-action")?.remove();
    document.body.append(bar);
    document.body.classList.add("has-action");
  }

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
    track("add_to_cart", { label: p.slug, value: String(p.price_paise * qty) });
    const now = getCart().find((l) => l.id === p.id)?.qty || qty;
    $("[data-incart]", root).innerHTML = `${now} in your cart. <a href="cart.html">View cart</a>`;
    toast("Added to cart", { href: "cart.html", label: "View cart" });
  });
}

render();
