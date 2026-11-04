// The "Ask us" button at the bottom right of every page. It opens a panel with
// the site assistant, WhatsApp, email and call buttons and short answers to the
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
  button: "Ask us",
  title: "Questions? Ask us",
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
  button: "पूछें",
  title: "कोई प्रश्न? हमसे पूछें",
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

  document.body.append(fab, panel);
  document.body.classList.add("has-help");
}
