// Small rendering helpers shared by every page.
import { CONFIG } from "./config.js";
import { lang, t } from "./i18n.js";

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape text before placing it inside HTML. Catalogue text is data, not markup. */
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
export const money = (paise) => inr.format((paise || 0) / 100);

const TYPE_LABEL = {
  live: "Live lecture",
  recording: "Recorded lecture",
  course: "Course",
  walk: "Heritage walk",
  experience: "Experience",
  counselling: "One-to-one counselling",
  physical: "Ships across India",
};
export const typeLabel = (type) => TYPE_LABEL[type] || "Item";

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
export function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${dateFmt.format(d)}, ${timeFmt.format(d).toLowerCase()} IST`;
}

export function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} minutes`;
  return m ? `${h} hr ${m} min` : `${h} ${h === 1 ? "hour" : "hours"}`;
}

/** Run for a group that asks, at a time and place agreed with them. Never goes in the cart. */
export const isRequest = (p) => Boolean(p.tags?.includes("on-request"));
/** Listed so people can ask to be told when it is ready. Never goes in the cart. */
export const isSoon = (p) => Boolean(p.tags?.includes("coming-soon"));
/** True for anything the cart can sell right now. */
export const canBuy = (p) => !isRequest(p) && !isSoon(p) && !CONFIG.sampleNotice && !stockFlag(p)?.soldOut;
export const kindLabel = (p) => p.kind || typeLabel(p.type);

const waLink = (text) => `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
/** WhatsApp and email links that open with the programme already named. Nothing about the visitor is put in the link. */
export function requestLinks(p) {
  const soon = isSoon(p);
  const text = lang === "hi"
    ? soon
      ? `नमस्ते ${CONFIG.brand}, कृपया "${p.title}" उपलब्ध होने पर मुझे सूचित करें।`
      : p.tags?.includes("counselling")
      ? `नमस्ते ${CONFIG.brand}, परामर्श सत्र के लिए अनुरोध।\n\nचर्चा का विषय: \nमेरी उपलब्धता: `
      : `नमस्ते ${CONFIG.brand}, "${p.title}" के आयोजन के लिए अनुरोध।\n\nकिसके लिए (विद्यालय, महाविद्यालय, कार्यस्थल या निजी समूह): \nसमूह का आकार: \nपसंदीदा तिथियाँ: \nशहर या ऑनलाइन: \nकोई बदलाव जो आप चाहते हैं: `
    : soon
    ? `Hello ${CONFIG.brand}, please let me know when "${p.title}" is available.`
    : p.tags?.includes("counselling")
    ? `Hello ${CONFIG.brand}, I would like to book a counselling session.\n\nWhat I want to discuss: \nWhen I am free: `
    : `Hello ${CONFIG.brand}, I would like to request "${p.title}".\n\nWho it is for (school, college, workplace or private group): \nGroup size: \nPreferred dates: \nCity or online: \nAnything you would like changed: `;
  const subject = soon ? `${t("Notify me")}: ${p.title}` : `${t("Request")}: ${p.title}`;
  return {
    whatsapp: waLink(text),
    email: `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
  };
}

/** What the card says under the picture: type, plus the date for dated things. */
export function typeLine(p) {
  if (isRequest(p)) return `${kindLabel(p)} · On request`;
  if (isSoon(p)) return `${p.type === "physical" ? "Printed item" : typeLabel(p.type)} · Coming soon`;
  const when = p.starts_at ? formatWhen(p.starts_at) : "";
  if (p.type === "course" && when) return `Course, starts ${when}`;
  if (p.type === "counselling") return `${typeLabel(p.type)}, ${formatDuration(p.duration_minutes) || "book your own time"}`;
  return when ? `${typeLabel(p.type)}, ${when}` : typeLabel(p.type);
}

/** Length and place for programmes run on request, so a card can be judged without opening it. */
export const cardMeta = (p) => (isRequest(p) ? [p.details?.Length, p.venue].filter(Boolean).join(" · ") : "");

/** The card's call to action, named for the format so visitors know what the next step is. */
const ACTION = {
  "Heritage walk": "Enquire about this walk",
  "Museum visit": "Enquire about this visit",
  "Lecture": "Request this lecture",
  "Workshop": "Request this workshop",
  "Course": "Request this course",
  "Field school": "Enquire about this field school",
  "Study tour": "Plan this study tour",
  "One-to-one counselling": "Request a session",
};
export const requestAction = (p) => ACTION[kindLabel(p)] || "Enquire";

/** null = no flag. Seats and stock are only called out when it changes a decision. */
export function stockFlag(p) {
  if (p.stock === null || p.stock === undefined) return null;
  if (p.stock <= 0) return { text: p.requires_shipping ? "Sold out" : "Fully booked", low: false, soldOut: true };
  if (p.stock <= 10) return { text: p.requires_shipping ? `${p.stock} left` : `${p.stock} seats left`, low: true, soldOut: false };
  return null;
}

// ---- placeholder artwork -----------------------------------------------------
// Until real photographs are added (products.image_url), each product gets its
// own stratigraphic section drawing: layers of deposit, generated from the slug
// so the same product always gets the same picture.
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Strata in the brand's stone greys, earth and gold.
const STRATA = ["#2a2926", "#7f7e7e", "#a8a39a", "#cfc9bd", "#dda638", "#8a7550", "#e8e3d9", "#565550", "#b9b2a5"];
const TOP = { live: "#dda638", recording: "#a8a39a", course: "#7f7e7e", walk: "#cfc9bd", experience: "#8a7550", counselling: "#2a2926", physical: "#e8e3d9" };

export function stratArt(p) {
  const rnd = seeded(p.slug || p.title || "talaash");
  const W = 400;
  const H = 300;
  const layers = 5 + Math.floor(rnd() * 2);
  let prev = "";
  let y = 0;
  let out = `<rect width="${W}" height="${H}" fill="${TOP[p.type] || STRATA[3]}"/>`;
  for (let i = 0; i < layers; i++) {
    y += 28 + rnd() * 46;
    let colour = STRATA[Math.floor(rnd() * STRATA.length)];
    if (colour === prev) colour = STRATA[(STRATA.indexOf(colour) + 3) % STRATA.length];
    prev = colour;
    let d = `M0 ${y.toFixed(1)}`;
    for (let x = 50; x <= W; x += 50) {
      const yy = y + (rnd() - 0.5) * 22;
      d += ` Q${x - 25} ${(yy + (rnd() - 0.5) * 16).toFixed(1)} ${x} ${yy.toFixed(1)}`;
    }
    out += `<path d="${d} L${W} ${H} L0 ${H} Z" fill="${colour}"/>`;
    // a few finds in the layer
    const finds = Math.floor(rnd() * 3);
    for (let f = 0; f < finds; f++) {
      const fx = 20 + rnd() * (W - 40);
      const fy = Math.min(H - 8, y + 12 + rnd() * 24);
      out += `<rect x="${fx.toFixed(0)}" y="${fy.toFixed(0)}" width="${(6 + rnd() * 10).toFixed(0)}" height="4" rx="2" fill="#17211d" opacity="0.45" transform="rotate(${(rnd() * 50 - 25).toFixed(0)} ${fx.toFixed(0)} ${fy.toFixed(0)})"/>`;
    }
  }
  // photo scale, bottom left
  out += `<g transform="translate(16 ${H - 22})"><rect width="80" height="8" fill="#fbfbf8" stroke="#17211d"/><rect width="20" height="8" fill="#17211d"/><rect x="40" width="20" height="8" fill="#17211d"/></g>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(`Illustration for ${p.title}`)}" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

/** True when the picture is one of our own drawn illustrations rather than a photograph. */
export const isIllustration = (p) => /^assets\/img\/programmes\/[a-z0-9-]+\.jpg$/.test(p.image_url || "");

/** `sizes` tells the browser how wide the picture is shown, so phones fetch the small file. */
export function productArt(p, sizes = "(min-width: 1000px) 25vw, (min-width: 560px) 33vw, 50vw") {
  if (!p.image_url) return stratArt(p);
  if (!isIllustration(p)) return `<img src="${esc(p.image_url)}" alt="${esc(p.title)}" loading="lazy" width="400" height="300">`;
  const small = p.image_url.replace(/\.jpg$/, "-s.jpg");
  return `<img src="${esc(small)}" srcset="${esc(small)} 560w, ${esc(p.image_url)} 1040w" sizes="${esc(sizes)}" alt="${esc(`Illustration for ${p.title}`)}" loading="lazy" width="1040" height="780">`;
}

export function priceHtml(p) {
  const was = p.compare_at_paise && p.compare_at_paise > p.price_paise ? `<s><span class="visually-hidden">was </span>${money(p.compare_at_paise)}</s>` : "";
  return `${money(p.price_paise)}${was}`;
}

export function productCard(p) {
  const request = isRequest(p);
  const soon = isSoon(p);
  const flag = request ? null : soon ? { text: "Coming soon", low: false, soldOut: true } : stockFlag(p);
  const href = `product.html?slug=${encodeURIComponent(p.slug)}`;
  return `
  <article class="card">
    <a class="card-art" href="${href}" tabindex="-1" aria-hidden="true">
      ${productArt(p)}
      ${flag ? `<span class="card-flag${flag.low ? " is-low" : ""}">${esc(flag.text)}</span>` : ""}
    </a>
    <p class="card-type">${esc(typeLine(p))}</p>
    <h3><a href="${href}">${esc(p.title)}</a></h3>
    ${cardMeta(p) ? `<p class="card-meta">${esc(cardMeta(p))}</p>` : ""}
    ${p.seller_name ? `<p class="card-seller">With ${esc(p.seller_name)}</p>` : ""}
    ${
      request
        ? `<div class="card-foot card-foot-wide"><a class="btn btn-outline btn-small" href="${href}">${esc(requestAction(p))}</a></div>`
        : soon
        ? `<div class="card-foot card-foot-wide"><a class="btn btn-outline btn-small" href="${href}">Notify me when available</a></div>`
        : `<div class="card-foot">
      <span class="price">${priceHtml(p)}</span>
      ${
        flag?.soldOut || CONFIG.sampleNotice
          ? `<a class="btn btn-outline btn-small" href="${href}">View details</a>`
          : `<button class="btn btn-outline btn-small" type="button" data-add="${esc(p.id)}">Add to cart</button>`
      }
    </div>`
    }
  </article>`;
}

// ---- toast -------------------------------------------------------------------
let toastTimer;
export function toast(message, link) {
  $(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.innerHTML = `<span>${esc(message)}</span>${link ? `<a href="${esc(link.href)}">${esc(link.label)}</a>` : ""}`;
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 4500);
}

export function shippingFor(subtotalPaise, needsShipping, rule = CONFIG.shipping) {
  if (!needsShipping) return 0;
  return rule.free_above_paise != null && subtotalPaise >= rule.free_above_paise ? 0 : rule.flat_paise;
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.append(s);
  });
}
