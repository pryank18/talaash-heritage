// Hindi for the site's interface.
//
// The pages are written in English, which stays in the HTML for search
// engines. When a visitor chooses Hindi, every block of interface text whose
// English appears in HI.text is replaced, including text that the page scripts
// add later (cards, the registration form, finder results). Programme names and
// details are not in the dictionary, so they stay in English.
import { HI } from "./hi.js";

export const lang = document.documentElement.getAttribute("data-lang") === "hi" ? "hi" : "en";

const norm = (s) => s.replace(/\s+/g, " ").trim();
const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "svg", "TEXTAREA", "CODE", "TITLE"]);
const ATTRS = ["placeholder", "title", "aria-label"];

/** The Hindi for an English interface string, or the English if there is none. */
export function t(en) {
  if (lang !== "hi") return en;
  const key = norm(en);
  if (HI.text[key] !== undefined) return HI.text[key];
  for (const [re, fn] of HI.patterns) {
    const m = key.match(re);
    const out = m ? fn(...m.slice(1)) : undefined;
    if (out !== undefined) return out;
  }
  return en;
}

function hasOwnText(el) {
  for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
  return false;
}

function translateAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && t(v) !== v) el.setAttribute(a, t(v));
  }
}

/** Replace each block of English interface text under root with its Hindi. */
export function translateTree(root) {
  if (lang !== "hi" || !root || root.nodeType !== 1 || root.closest?.("[data-no-translate]")) return;
  translateAttrs(root);
  if (SKIP.has(root.tagName)) return;
  const html = norm(root.innerHTML);
  if (html && HI.text[html] !== undefined) {
    root.innerHTML = HI.text[html];
    root.querySelectorAll("*").forEach(translateAttrs);
    return;
  }
  if (!root.children.length) {
    const out = t(root.textContent);
    if (out !== root.textContent) root.textContent = out;
    return;
  }
  // A block that mixes text with markup we do not know as a whole: translate
  // each piece of text that is a complete string on its own, then the elements.
  if (hasOwnText(root)) {
    for (const n of root.childNodes) {
      if (n.nodeType !== 3 || !n.nodeValue.trim()) continue;
      const out = t(n.nodeValue);
      if (out !== n.nodeValue) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), out);
    }
  }
  for (const child of [...root.children]) translateTree(child);
}

export function startTranslating() {
  if (lang !== "hi") return;
  document.title = t(document.title);
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", t(meta.getAttribute("content")));
  translateTree(document.body);
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        if ([...m.addedNodes].some((n) => n.nodeType === 3)) translateTree(m.target);
        for (const n of m.addedNodes) if (n.nodeType === 1) translateTree(n);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/** Switch language and reload, so every part of the page is drawn in the new one. */
export function setLang(next) {
  try { localStorage.setItem("th_lang", next); } catch { /* storage blocked */ }
  location.reload();
}
