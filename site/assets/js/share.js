// "Share" on programme pages, guides and the main landing pages. On phones it opens the
// phone's own share sheet; elsewhere a small menu with WhatsApp, Facebook, X, LinkedIn,
// email and copy link. Shared links carry utm_source=<channel>&utm_medium=share so the
// Traffic tab credits visits that came from a share.
import { lang } from "./i18n.js";
import { esc, toast } from "./ui.js";
import { track } from "./track.js";

const HI = lang === "hi";
const L = HI
  ? { share: "साझा करें", copy: "लिंक कॉपी करें", copied: "लिंक कॉपी हो गया", email: "ईमेल", close: "बंद करें" }
  : { share: "Share", copy: "Copy link", copied: "Link copied", email: "Email", close: "Close" };

const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/></svg>';

/** The button. Pages with their own template put it under the heading. */
export const shareButton = () => `<button type="button" class="share-btn" data-share aria-haspopup="true">${ICON}<span>${esc(L.share)}</span></button>`;

// Pages without a template of their own that still deserve a share button under the heading.
const AUTO = new Set(["journeys.html", "archaeologywala.html", "indian-culture-classes-for-kids-online.html", "learn.html", "work.html", "finder.html"]);
const raw = location.pathname.split("/").pop() || "index";
const page = raw.endsWith(".html") ? raw : `${raw}.html`;

function pageUrl(channel) {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const url = new URL(page === "product.html" || !canonical ? location.href : canonical);
  [...url.searchParams.keys()].filter((k) => k.startsWith("utm_") || k === "q").forEach((k) => url.searchParams.delete(k));
  url.hash = "";
  url.searchParams.set("utm_source", channel);
  url.searchParams.set("utm_medium", "share");
  return url.toString();
}

const title = () => (document.querySelector("main h1")?.textContent || document.title).trim();
const label = () => (document.body.dataset.slug || new URLSearchParams(location.search).get("slug") || page.replace(/\.html$/, "")).slice(0, 120);
const log = (channel) => track("social_click", { label: `share-${channel}: ${label()}` });

function menuHtml() {
  const t = title();
  const line = HI ? `${t} | Talaash Heritage` : `${t}, from Talaash Heritage`;
  const links = [
    ["whatsapp", "WhatsApp", (u) => `https://wa.me/?text=${encodeURIComponent(`${line}\n${u}`)}`],
    ["facebook", "Facebook", (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`],
    ["x", "X", (u) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(line)}&url=${encodeURIComponent(u)}`],
    ["linkedin", "LinkedIn", (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`],
    ["email", L.email, (u) => `mailto:?subject=${encodeURIComponent(line)}&body=${encodeURIComponent(u)}`],
  ];
  return `${links
    .map(([ch, name, href]) => `<a role="menuitem" href="${esc(href(pageUrl(ch)))}" data-channel="${ch}"${ch === "email" ? "" : ' target="_blank" rel="noopener"'}>${esc(name)}</a>`)
    .join("")}<button type="button" role="menuitem" data-copy>${esc(L.copy)}</button>`;
}

async function copy() {
  const u = pageUrl("copy");
  try {
    await navigator.clipboard.writeText(u);
  } catch {
    const ta = Object.assign(document.createElement("textarea"), { value: u });
    document.body.append(ta);
    ta.select();
    try { document.execCommand("copy"); } catch { /* nothing more to try */ }
    ta.remove();
  }
  toast(L.copied);
  log("copy");
}

let menu = null;
const closeMenu = () => { menu?.remove(); menu = null; document.querySelectorAll("[data-share][aria-expanded]").forEach((b) => b.removeAttribute("aria-expanded")); };

async function onShare(btn) {
  const touch = matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.share) {
    try {
      await navigator.share({ title: title(), url: pageUrl("native") });
      log("native");
    } catch { /* closed without sharing */ }
    return;
  }
  if (menu) return closeMenu();
  menu = document.createElement("div");
  menu.className = "share-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("data-no-translate", "");
  menu.innerHTML = menuHtml();
  btn.after(menu);
  btn.setAttribute("aria-expanded", "true");
  menu.querySelector("a,button")?.focus();
}

export function initShare() {
  if (AUTO.has(page) && !document.querySelector("[data-share]")) {
    const h1 = document.querySelector("main h1");
    if (h1) h1.insertAdjacentHTML("afterend", `<div class="share-row">${shareButton()}</div>`);
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-share]");
    if (btn) { e.preventDefault(); onShare(btn); return; }
    const item = e.target.closest(".share-menu [data-channel], .share-menu [data-copy]");
    if (item) {
      if (item.matches("[data-copy]")) copy();
      else log(item.dataset.channel);
      closeMenu();
      return;
    }
    if (menu && !e.target.closest(".share-menu")) closeMenu();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu) closeMenu(); });
}
