// The floating buttons at the bottom right of every page: back to top, WhatsApp, and
// "Ask Khoji", the help panel. The panel holds
// Khoji, the site assistant, WhatsApp, email and call buttons and short answers to the
// questions buyers ask most. The answers are fixed text taken from the site's
// own policies (help-answers.js); if you change a policy or a payment method,
// change the answer there. The assistant lives in assistant.js.
// The WhatsApp message carries the page the visitor was on.
import { CONFIG } from "./config.js";
import { lang } from "./i18n.js";
import { esc } from "./ui.js";
import { track } from "./track.js";
import { ANSWERS } from "./help-answers.js";
import { mountAssistant } from "./assistant.js";

const HIDE_ON = new Set(["admin.html", "seller.html"]);
const raw = location.pathname.split("/").pop() || "index";
const page = raw.endsWith(".html") ? raw : `${raw}.html`;

const EN = {
  button: "Ask Khoji",
  title: "Ask Khoji",
  waFab: "Chat with us on WhatsApp",
  topFab: "Back to top",
  lede: "Prefer a person? Message us on WhatsApp and someone from our team replies.",
  whatsapp: "Chat on WhatsApp",
  email: "Email",
  call: "Call",
  close: "Close",
  common: "Common questions",
  proof: `Rated ${CONFIG.googleRating.score} on Google from ${CONFIG.googleRating.count} reviews`,
  qa: ANSWERS.en,
};

const HI = {
  button: "खोजी से पूछें",
  title: "खोजी से पूछें",
  waFab: "WhatsApp पर हमसे बात करें",
  topFab: "ऊपर जाएँ",
  lede: "किसी व्यक्ति से बात करना चाहते हैं? हमें WhatsApp पर संदेश भेजें, हमारी टीम का कोई सदस्य उत्तर देगा।",
  whatsapp: "WhatsApp पर बात करें",
  email: "ईमेल",
  call: "फ़ोन करें",
  close: "बंद करें",
  common: "सामान्य प्रश्न",
  proof: `Google पर ${CONFIG.googleRating.count} समीक्षाओं से ${CONFIG.googleRating.score} रेटिंग`,
  qa: ANSWERS.hi,
};

/** The prefilled WhatsApp message, naming what the visitor was looking at. */
function message() {
  const heading = document.querySelector("main h1")?.textContent.trim() || document.title.split(" | ")[0];
  const ref = (document.body.dataset.slug || new URLSearchParams(location.search).get("slug") || page.replace(/\.html$/, "")).slice(0, 80);
  const programme = Boolean(document.body.dataset.slug) || page === "product.html";
  const paying = page === "checkout.html" || page === "cart.html";
  if (lang === "hi") {
    return paying
      ? `नमस्ते ${CONFIG.brand}, भुगतान से पहले मेरा एक प्रश्न है: \n\n(ref: ${ref})`
      : programme
      ? `नमस्ते ${CONFIG.brand}, "${heading}" के बारे में मेरा एक प्रश्न है: \n\n(ref: ${ref})`
      : `नमस्ते ${CONFIG.brand}, मेरा एक प्रश्न है: \n\n(ref: ${ref})`;
  }
  return paying
    ? `Hello ${CONFIG.brand}, I have a question before I pay: \n\n(ref: ${ref})`
    : programme
    ? `Hello ${CONFIG.brand}, I have a question about "${heading}": \n\n(ref: ${ref})`
    : `Hello ${CONFIG.brand}, I have a question: \n\n(ref: ${ref})`;
}

const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
const UP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 18.5 5.6 15A7.5 7.5 0 1 1 9 18.4z"/><path d="M9 10.5h6M9 13.5h3.5"/></svg>';

export function initHelp() {
  if (HIDE_ON.has(page) || document.querySelector(".help-fab")) return;
  const L = lang === "hi" ? HI : EN;

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "help-fab";
  fab.setAttribute("data-no-translate", "");
  fab.setAttribute("aria-haspopup", "dialog");
  fab.innerHTML = `${ICON}<span>${esc(L.button)}</span>`;

  const panel = document.createElement("dialog");
  panel.className = "help-panel";
  panel.setAttribute("aria-labelledby", "help-title");
  panel.setAttribute("data-no-translate", "");
  if (lang === "hi") panel.lang = "hi";

  const draw = () => {
    const text = message();
    const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
    const mail = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(L.title)}&body=${encodeURIComponent(text)}`;
    panel.innerHTML = `
      <div class="help-head">
        <h2 id="help-title">${esc(L.title)}</h2>
        <button class="sheet-close" type="button" data-help-close aria-label="${esc(L.close)}">×</button>
      </div>
      <div class="help-body">
        <div data-assistant></div>
        <p class="help-lede">${esc(L.lede)}</p>
        <div class="help-actions">
          <a class="btn btn-primary" href="${esc(wa)}" target="_blank" rel="noopener">${esc(L.whatsapp)}</a>
          <a class="btn btn-outline" href="${esc(mail)}">${esc(L.email)}</a>
          <a class="btn btn-outline" href="tel:${esc(CONFIG.contactPhone.replace(/\s+/g, ""))}">${esc(L.call)}</a>
        </div>
        <h3>${esc(L.common)}</h3>
        <div class="help-qa">
          ${L.qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join("")}
        </div>
        <p class="help-proof"><a href="${esc(CONFIG.socials.find((s) => s.label === "Google reviews")?.href || "contact.html")}" target="_blank" rel="noopener">★ ${esc(L.proof)}</a></p>
      </div>`;
    mountAssistant(panel.querySelector("[data-assistant]"));
    panel.querySelector("[data-help-close]").addEventListener("click", () => panel.close());
    panel.querySelectorAll("details").forEach((d) =>
      d.addEventListener("toggle", () => { if (d.open) track("help_question", { label: d.querySelector("summary").textContent.slice(0, 200) }); }),
    );
  };

  fab.addEventListener("click", () => {
    draw();
    panel.showModal();
    track("help_open", { label: page });
  });
  // A tap on the dimmed area outside the panel closes it.
  panel.addEventListener("click", (e) => { if (e.target === panel) panel.close(); });
  panel.addEventListener("close", () => fab.focus());

  // WhatsApp, always one tap away. The message names the page at the moment of the tap.
  const waFab = document.createElement("a");
  waFab.className = "wa-fab";
  waFab.target = "_blank";
  waFab.rel = "noopener";
  waFab.setAttribute("aria-label", L.waFab);
  waFab.setAttribute("title", L.waFab);
  waFab.setAttribute("data-no-translate", "");
  waFab.innerHTML = WA_ICON;
  const aim = () => { waFab.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message())}`; };
  aim();
  ["pointerdown", "focus", "click"].forEach((type) => waFab.addEventListener(type, aim));

  // Back to the top, once the visitor has scrolled well down a page.
  const topFab = document.createElement("button");
  topFab.type = "button";
  topFab.className = "top-fab";
  topFab.hidden = true;
  topFab.setAttribute("aria-label", L.topFab);
  topFab.setAttribute("title", L.topFab);
  topFab.setAttribute("data-no-translate", "");
  topFab.innerHTML = UP_ICON;
  let frame = 0;
  const check = () => { frame = 0; topFab.hidden = window.scrollY < Math.max(500, window.innerHeight * 0.9); };
  window.addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(check); }, { passive: true });
  check();
  topFab.addEventListener("click", () => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: calm ? "instant" : "smooth" });
    const home = document.querySelector("main") || document.body;
    home.setAttribute("tabindex", "-1");
    home.focus({ preventScroll: true });
  });

  // On a phone the keyboard lifts fixed buttons over the form, so they step aside while someone types.
  const typing = (el) => el instanceof Element && el.matches('textarea, select, input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"])');
  document.addEventListener("focusin", (e) => document.body.classList.toggle("is-typing", typing(e.target)));
  document.addEventListener("focusout", () => document.body.classList.remove("is-typing"));

  document.body.append(topFab, waFab, fab, panel);
  document.body.classList.add("has-help");
}
