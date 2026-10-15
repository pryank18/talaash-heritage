// First-party measurement. Records anonymous page views and clicks on the
// enquiry, social and booking buttons, with the source of the visit (UTM tags
// or the referring site), so we can see which pages, posts and ads bring
// enquiries. No cookies and no third-party scripts: a random device number is
// kept in this browser, and events go to our own database through public.track().
// Respects "Do Not Track". Reports: the Traffic tab of admin.html.
import { CONFIG, isLive } from "./config.js";

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const SOCIAL = /(^|\.)(instagram\.com|facebook\.com|linkedin\.com|youtube\.com|x\.com|twitter\.com|google\.com\/maps|maps\.google\.com|g\.page)/;

const off = () => !isLive() || navigator.doNotTrack === "1" || window.doNotTrack === "1" || /bot|crawl|spider|preview|lighthouse/i.test(navigator.userAgent);

function randomId() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => (b % 36).toString(36)).join("");
}

function stored(storage, key, make) {
  try {
    let v = storage.getItem(key);
    if (!v) { v = make(); storage.setItem(key, v); }
    return v;
  } catch {
    return make();
  }
}

/** Where this visit came from, fixed on the first page of the visit. */
function attribution() {
  try {
    const saved = sessionStorage.getItem("th_attr");
    if (saved) return JSON.parse(saved);
  } catch { /* storage blocked */ }
  const q = new URLSearchParams(location.search);
  const out = { landing: (location.pathname + location.search).slice(0, 300) };
  for (const k of UTM) if (q.get(k)) out[k] = q.get(k).slice(0, 120);
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.hostname !== location.hostname) out.referrer = ref.hostname.replace(/^www\./, "").slice(0, 200);
  } catch { /* bad referrer */ }
  try { sessionStorage.setItem("th_attr", JSON.stringify(out)); } catch { /* storage blocked */ }
  return out;
}

const device = () => (matchMedia("(max-width: 640px)").matches ? "mobile" : matchMedia("(max-width: 1024px)").matches ? "tablet" : "desktop");
const lang = () => (document.documentElement.lang || "").startsWith("hi") ? "hi" : "en";

/** Sends one event. Never throws and never delays the page. */
export function track(event, extra = {}) {
  if (off()) return;
  const body = {
    event,
    visitor: stored(localStorage, "th_vid", randomId),
    session: stored(sessionStorage, "th_sid", randomId),
    path: location.pathname.slice(0, 300) || "/",
    device: device(),
    lang: lang(),
    ...attribution(),
    ...extra,
  };
  try {
    fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/track`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${CONFIG.supabaseAnonKey}` },
      body: JSON.stringify({ p: body }),
    }).catch(() => {});
  } catch { /* offline */ }
}

const isProgrammePage = () => Boolean(document.body.dataset.slug) || location.pathname.endsWith("/product.html");
const slugOf = (url) => (url.pathname.split("/").pop() || "").replace(/\.html$/, "");

function onClick(e) {
  const a = e.target.closest?.("a[href]");
  if (!a) return;
  let url;
  try { url = new URL(a.getAttribute("href"), location.href); } catch { return; }
  const label = (document.body.dataset.slug || slugOf(new URL(location.href)) || "home").slice(0, 200);
  if (url.hostname === "wa.me" || url.hostname === "api.whatsapp.com") return track("enquiry_whatsapp", { label });
  if (url.protocol === "mailto:") return track("enquiry_email", { label });
  if (url.protocol === "tel:") return track("call_click", { label });
  if (url.origin !== location.origin) {
    return track(SOCIAL.test(url.hostname + url.pathname) ? "social_click" : "outbound_click", { label: url.hostname + url.pathname.slice(0, 120) });
  }
  // From a guide to a programme: the cross-sell working.
  if (document.body.classList.contains("guide-page") && /\.html$/.test(url.pathname) && !url.pathname.endsWith("/learn.html")) {
    const target = slugOf(url);
    if (window.__thProgrammes?.has(target) || url.pathname.endsWith("/product.html")) track("learn_to_programme", { label: target || url.search.slice(0, 200) });
  }
}

export function initTracking() {
  if (off()) return;
  track("page_view", { label: (document.title || "").slice(0, 200) });
  document.addEventListener("click", onClick, { capture: true });
  // Programme pages are known from the catalogue, so guide clicks to them can be told apart from guide-to-guide links.
  if (document.body.classList.contains("guide-page")) {
    fetch("data/catalogue.json").then((r) => r.json()).then((c) => {
      window.__thProgrammes = new Set(c.programmes.map((p) => p.slug));
    }).catch(() => {});
  }
  if (isProgrammePage()) document.body.dataset.tracked = "programme";
}
