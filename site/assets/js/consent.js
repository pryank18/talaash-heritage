// Google Analytics 4 and Google Ads, only with the visitor's agreement.
//
// Dormant until CONFIG.ga4Id or CONFIG.googleAdsId is filled in: with both
// empty, nothing here runs, no banner shows and the site sets no cookies.
// Once an ID is set, every visitor sees a short banner. Google's script is not
// even downloaded unless they press Accept; "No thanks" sets nothing. The choice
// is kept in this browser (th_consent) so the banner does not return, and the
// "Cookie settings" link in the footer reopens it. Ad personalisation
// (remarketing) stays off either way.
//
// Our own measurement (track.js) is separate, sets no cookies and runs either way.
import { CONFIG, isLive } from "./config.js";

const KEY = "th_consent";
const VERSION = 1; // bump to ask everyone again if the banner's promise changes

const ids = () => [CONFIG.ga4Id, CONFIG.googleAdsId].map((x) => String(x || "").trim()).filter(Boolean);
export const consentEnabled = () => isLive() && ids().length > 0;

function getChoice() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY));
    return c && c.v === VERSION ? c.choice : null;
  } catch {
    return null;
  }
}

function setChoice(choice) {
  try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, choice, at: new Date().toISOString() })); } catch { /* storage blocked: ask again next page */ }
}

let loaded = false;

function loadGoogle() {
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  for (const id of ids()) window.gtag("config", id);
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids()[0])}`;
  document.head.appendChild(s);
}

/** Removes Google's cookies after someone withdraws agreement. */
function clearGoogleCookies() {
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0].trim();
    if (!/^(_ga|_gid|_gat|_gcl_|_gac_|FPID|FPLC)/.test(name)) continue;
    for (const d of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
    }
  }
}

function decide(choice) {
  setChoice(choice);
  document.querySelector(".consent")?.remove();
  if (choice === "granted") {
    loadGoogle();
    if (window.gtag) window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted" });
  } else {
    if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied" });
    clearGoogleCookies();
  }
}

const TEXT = {
  en: {
    body: "May we use Google Analytics and Google Ads cookies to see which adverts and pages bring people to us? Nothing is set unless you agree.",
    yes: "Accept",
    no: "No thanks",
    more: "Privacy notice",
    label: "Cookie choice",
  },
  hi: {
    body: "क्या हम Google Analytics और Google Ads की कुकीज़ इस्तेमाल कर सकते हैं, ताकि पता चले कि कौन-से विज्ञापन और पेज लोगों को हम तक लाते हैं? आपकी अनुमति के बिना कुछ भी सेट नहीं होगा।",
    yes: "स्वीकार करें",
    no: "नहीं, धन्यवाद",
    more: "निजता सूचना",
    label: "कुकी का चुनाव",
  },
};

export function openConsent() {
  if (!consentEnabled() || document.querySelector(".consent")) return;
  const t = TEXT[document.documentElement.getAttribute("data-lang") === "hi" ? "hi" : "en"];
  const box = document.createElement("section");
  box.className = "consent";
  box.setAttribute("aria-label", t.label);
  box.innerHTML = `<p>${t.body} <a href="privacy.html#cookies">${t.more}</a></p>
    <div class="consent-actions">
      <button type="button" class="btn btn-outline btn-small" data-consent="denied">${t.no}</button>
      <button type="button" class="btn btn-primary btn-small" data-consent="granted">${t.yes}</button>
    </div>`;
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-consent]");
    if (b) decide(b.dataset.consent);
  });
  document.body.appendChild(box);
}

/** Shows the banner once no modal (such as the welcome form) is open, so its
 *  buttons can be pressed. The welcome form may open a moment after load. */
function openWhenFree() {
  if (getChoice() !== null) return;
  const modal = document.querySelector("dialog[open]");
  if (modal) {
    modal.addEventListener("close", () => setTimeout(openWhenFree, 50), { once: true });
    return;
  }
  openConsent();
}

export function initConsent() {
  if (!consentEnabled()) return;
  if (/\/admin(\.html)?$/.test(location.pathname)) return;
  const choice = getChoice();
  if (choice === "granted") loadGoogle();
  else if (choice === null) setTimeout(openWhenFree, 400);
}

/** Mirrors our own key events to Google, only when Google is loaded with agreement. */
export function sendToGoogle(event, extra = {}) {
  if (!loaded || !window.gtag || getChoice() !== "granted") return;
  const paise = Number(extra.value);
  const value = Number.isFinite(paise) && paise > 0 ? paise / 100 : undefined;
  const money = value === undefined ? {} : { value, currency: "INR" };
  switch (event) {
    case "purchase": {
      window.gtag("event", "purchase", { transaction_id: extra.label, ...money });
      const label = String(CONFIG.googleAdsPurchaseLabel || "").trim();
      if (CONFIG.googleAdsId && label) {
        window.gtag("event", "conversion", { send_to: `${String(CONFIG.googleAdsId).trim()}/${label}`, transaction_id: extra.label, ...money });
      }
      break;
    }
    case "begin_checkout":
    case "add_to_cart":
      window.gtag("event", event, money);
      break;
    case "enquiry_whatsapp":
    case "enquiry_email":
    case "call_click":
      window.gtag("event", "generate_lead", { method: event.replace("enquiry_", "").replace("_click", ""), page: extra.label });
      break;
    default:
      break;
  }
}
