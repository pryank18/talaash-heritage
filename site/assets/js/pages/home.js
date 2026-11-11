import { getProducts } from "../api.js";
import { lang } from "../i18n.js";
import { getVisitor } from "../store.js";
import { CONFIG } from "../config.js";
import { $, $$, esc, formatWhen, formatDuration, groupProducts, initRails, isRequest, kindLabel, money, productCard, productHref, railHtml, requestAction, stockFlag, typeLabel } from "../ui.js";

const SESSION_TYPES = ["live", "course", "walk", "experience", "counselling", "recording"];

function featureCard(p) {
  const flag = stockFlag(p);
  const href = esc(productHref(p));
  if (isRequest(p)) {
    const meta = [[kindLabel(p), p.details?.Length?.toLowerCase()].filter(Boolean).join(", "), p.venue, "Dates and group size set by you"].filter(Boolean);
    return `
    <p class="feature-kicker">Arranged on request</p>
    <h2><a href="${href}">${esc(p.title)}</a></h2>
    <ul class="feature-meta">${meta.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
    <div class="feature-foot">
      <span class="price">${esc(p.pricing?.card || "On request")}</span>
      <a class="btn btn-primary" href="${href}">${esc(requestAction(p))}</a>
    </div>`;
  }
  const meta = [
    p.starts_at ? formatWhen(p.starts_at) : null,
    [formatDuration(p.duration_minutes), p.venue].filter(Boolean).join(", ") || null,
    flag ? flag.text : null,
  ].filter(Boolean);
  return `
    <p class="feature-kicker">${p.starts_at ? `Next ${esc(typeLabel(p.type).toLowerCase())}` : "Featured"}</p>
    <h2><a href="${href}">${esc(p.title)}</a></h2>
    <ul class="feature-meta">${meta.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
    <div class="feature-foot">
      <span class="price">${money(p.price_paise)}</span>
      <a class="btn btn-primary" href="${href}">View details</a>
    </div>`;
}

// "Walk Delhi with us this weekend": six walks that run any day, the coming Saturday and
// Sunday (India time), and a WhatsApp message with those dates filled in.
const WEEKEND_WALKS = [
  "req-mehrauli-archaeological-park", "req-the-qutb-complex", "req-humayuns-tomb",
  "req-lodhi-garden-monuments", "req-hauz-khas", "req-purana-qila",
];
function comingWeekend() {
  // Today's date in India, whatever the visitor's own time zone.
  const ist = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
  const day = ist.getDay(); // 0 Sunday … 6 Saturday
  const late = ist.getHours() >= 15; // after 3 pm a same-day walk is no longer on offer
  // Sunday afternoon: show next weekend. Saturday afternoon or Sunday morning: Sunday only.
  const toSat = day === 0 ? (late ? 6 : -1) : 6 - day;
  const sat = new Date(ist); sat.setDate(ist.getDate() + toSat);
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  return { sat, sun, sundayOnly: (day === 6 && late) || (day === 0 && !late) };
}
function renderWeekend(products) {
  const host = $("#weekend-walks");
  if (!host) return;
  const { sat, sun, sundayOnly } = comingWeekend();
  const loc = lang === "hi" ? "hi-IN" : "en-GB";
  const fmt = (d) => d.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" });
  const dates = sundayOnly ? fmt(sun) : `${fmt(sat)} ${lang === "hi" ? "और" : "and"} ${fmt(sun)}`;
  const datesEl = $("[data-weekend-dates]");
  if (datesEl) datesEl.textContent = dates;
  const wa = $("[data-weekend-wa]");
  if (wa) {
    const msg = `Hello Talaash Heritage, I would like to book a heritage walk on ${sundayOnly ? fmt(sun) : `${fmt(sat)} or ${fmt(sun)}`}.\nWalk:\nNumber of people:\nPreferred start time:\n(ref: home-weekend)`;
    wa.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    wa.target = "_blank"; wa.rel = "noopener";
  }
  const picks = WEEKEND_WALKS.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  if (picks.length === WEEKEND_WALKS.length) host.innerHTML = picks.map(productCard).join("");
}

async function render() {
  const feature = $("#feature");
  const featureSection = $("#feature-section");
  const sessions = $("#home-rails");
  const goods = $("#home-goods");
  renderWeekend([]); // dates and the WhatsApp message first; the cards once the catalogue loads
  try {
    const products = await getProducts();
    renderWeekend(products);
    const now = Date.now();
    const upcoming = products
      .filter((p) => p.starts_at && new Date(p.starts_at).getTime() > now && !stockFlag(p)?.soldOut)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    // Only a real dated event earns the slot under the hero; the hero itself
    // belongs to the programme finder.
    const pick = upcoming[0];
    if (pick) {
      feature.innerHTML = featureCard(pick);
      featureSection.hidden = false;
    }

    // How many programmes the finder can suggest for each audience.
    for (const el of $$(".planner-count")) {
      const n = products.filter((p) => p.find && p.audience?.includes(el.dataset.for)).length;
      if (n) el.textContent = lang === "hi" ? `${n} कार्यक्रम` : `${n} programme${n === 1 ? "" : "s"}`;
    }

    // A short "start here" row, then the main sections of the catalogue, each with "See all".
    const groups = groupProducts(products.filter((p) => SESSION_TYPES.includes(p.type) && p.id !== pick?.id));
    const HOME_ROWS = ["delhi-walks", "day-trips", "journeys", "lectures", "courses", "workshops", "careers"];
    const rows = HOME_ROWS.map((k) => groups.find((g) => g.key === k)).filter(Boolean);
    sessions.innerHTML =
      rows.map((g) => railHtml(g, { limit: 10, href: `shop.html?group=${g.key}` })).join("") ||
      `<p class="muted">Tell us what your group wants to study and we will build it. <a href="contact.html">Contact us</a>.</p>`;
    initRails(sessions);

    const goodsList = products.filter((p) => p.type === "physical").slice(0, 4);
    if (goodsList.length) goods.innerHTML = goodsList.map(productCard).join("");
    else $("#home-goods-section").hidden = true;
  } catch (e) {
    sessions.innerHTML = `<p class="form-error">${esc(e.message)}</p>`;
    goods.innerHTML = "";
  }
}

// A returning, registered visitor is asked the planner's question by name.
// The heading is replaced in place, so nothing on the page moves.
function greet() {
  const first = (getVisitor()?.full_name || "").trim().split(/\s+/)[0]?.slice(0, 24);
  const title = $("#planner-title");
  if (!first || !title) return;
  title.setAttribute("data-no-translate", "");
  title.textContent = lang === "hi" ? `${first}, आप किसके लिए योजना बना रहे हैं?` : `${first}, who are you planning for?`;
}

greet();
document.addEventListener("th:visitor", greet);
render();
