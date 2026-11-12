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
      <span class="price">${esc(kindLabel(p))}</span>
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
      <span class="price">${esc(typeLabel(p.type))}</span>
      <a class="btn btn-primary" href="${href}">View details</a>
    </div>`;
}

// "Special weekends and special days": the walks carousel under the hero. The slides are in the page
// itself. It moves on by one slide every few seconds and loops; it stops while the visitor points at it,
// touches it, tabs into it, when it is off screen or the tab is hidden, and for good when the visitor
// presses pause or asks for reduced motion. Arrows and dots move it by hand.
function initWalks() {
  const track = $("#walks-track");
  const prev = $("[data-walks-prev]");
  const next = $("[data-walks-next]");
  const dotsHost = $("[data-walks-dots]");
  const play = $("[data-walks-play]");
  if (!track || !prev || !next) return;
  const slides = [...track.querySelectorAll(".walk-slide")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = reduce ? "auto" : "smooth";
  const hi = lang === "hi";
  const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
  const stepW = () => (slides[0] ? slides[0].getBoundingClientRect().width + gap() : track.clientWidth * 0.8);
  const maxLeft = () => track.scrollWidth - track.clientWidth;
  const current = () => Math.round(track.scrollLeft / stepW());
  // Positions a visitor can land on: every slide until the last screenful is in view.
  const stops = () => Math.max(1, Math.round(maxLeft() / stepW()) + 1);
  const goTo = (i) => track.scrollTo({ left: Math.min(i * stepW(), maxLeft()), behavior });

  let dots = [];
  const drawDots = () => {
    if (!dotsHost) return;
    const n = stops();
    if (dots.length === n) return;
    dotsHost.innerHTML = Array.from({ length: n }, (_, i) =>
      `<button type="button" class="walks-dot" aria-label="${hi ? `स्लाइड ${i + 1}` : `Go to slide ${i + 1}`}"></button>`).join("");
    dots = [...dotsHost.querySelectorAll(".walks-dot")];
    dots.forEach((d, i) => d.addEventListener("click", () => { goTo(i); hold(); }));
  };
  const sync = () => {
    drawDots();
    const atEnd = track.scrollLeft >= maxLeft() - 2;
    const i = atEnd ? stops() - 1 : current();
    dots.forEach((d, k) => d.setAttribute("aria-current", k === i ? "true" : "false"));
  };

  // Autoplay
  let stopped = reduce;
  let paused = false;
  let visible = true;
  let timer = null;
  const tick = () => {
    if (stopped || paused || !visible || document.hidden) return;
    const atEnd = track.scrollLeft >= maxLeft() - 2;
    if (atEnd) goTo(0);
    else goTo(current() + 1);
  };
  const start = () => { clearInterval(timer); timer = setInterval(tick, 4500); };
  let resume = null;
  const hold = () => { paused = true; clearTimeout(resume); resume = setTimeout(() => { paused = false; }, 8000); };
  const setPlayLabel = () => {
    if (!play) return;
    play.setAttribute("aria-pressed", stopped ? "true" : "false");
    play.setAttribute("aria-label", stopped ? (hi ? "स्लाइड शो चलाएँ" : "Play the slideshow") : (hi ? "स्लाइड शो रोकें" : "Pause the slideshow"));
    play.classList.toggle("is-stopped", stopped);
  };

  prev.addEventListener("click", () => {
    hold();
    if (track.scrollLeft <= 2) goTo(stops() - 1); else goTo(current() - 1);
  });
  next.addEventListener("click", () => {
    hold();
    if (track.scrollLeft >= maxLeft() - 2) goTo(0); else goTo(current() + 1);
  });
  play?.addEventListener("click", () => { stopped = !stopped; paused = false; setPlayLabel(); });
  track.addEventListener("mouseenter", () => { paused = true; });
  track.addEventListener("mouseleave", () => { paused = false; });
  track.addEventListener("focusin", () => { paused = true; });
  track.addEventListener("focusout", () => { paused = false; });
  track.addEventListener("touchstart", hold, { passive: true });
  track.addEventListener("wheel", hold, { passive: true });
  track.addEventListener("scroll", sync, { passive: true });
  addEventListener("resize", () => { dots = []; sync(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 }).observe(track);
  }
  setPlayLabel();
  sync();
  start();
}

async function render() {
  const feature = $("#feature");
  const featureSection = $("#feature-section");
  const sessions = $("#home-rails");
  const goods = $("#home-goods");
  try {
    const products = await getProducts();
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
initWalks();
document.addEventListener("th:visitor", greet);
render();
