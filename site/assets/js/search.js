// Site search: the magnifier in the header opens a panel that searches every programme,
// guide and main page. The index (data/search.json) is built with the site by
// tools/build_learn.py; listings kept only in the database (career courses, books, prints)
// are added when the panel first opens. Nothing is sent anywhere except a count of what was
// searched (event "search"), so the Traffic tab can show what visitors look for.
// Opens on "/" or Ctrl/Cmd+K, and on any page with ?q= in the address.
import { lang } from "./i18n.js";
import { esc } from "./ui.js";
import { track } from "./track.js";
import { getListingTitles } from "./api.js";
import { CONFIG } from "./config.js";

const EN = {
  open: "Search",
  label: "Search programmes and guides",
  placeholder: "Try Qutb Minar, Harappa, temple, career…",
  close: "Close",
  popular: "Popular searches",
  none: (q) => `Nothing found for “${q}”.`,
  noneHelp: "Tell us what you are looking for and we will arrange it.",
  ask: "Ask on WhatsApp",
  finder: "Help me choose",
  count: (n) => (n === 1 ? "1 result" : `${n} results`),
  more: (n) => `Show all ${n} results`,
};
const HI = {
  open: "खोजें",
  label: "कार्यक्रम और लेख खोजें",
  placeholder: "जैसे Qutb Minar, Harappa, temple, career…",
  close: "बंद करें",
  popular: "लोकप्रिय खोजें",
  none: (q) => `“${q}” के लिए कुछ नहीं मिला।`,
  noneHelp: "बताइए आप क्या खोज रहे हैं, हम उसकी व्यवस्था करेंगे।",
  ask: "WhatsApp पर पूछें",
  finder: "कार्यक्रम चुनने में मदद",
  count: (n) => `${n} परिणाम`,
  more: (n) => `सभी ${n} परिणाम देखें`,
};
const L = lang === "hi" ? HI : EN;
const POPULAR = ["Delhi heritage walk", "Qutb Minar", "Harappan", "Temple architecture", "Career", "School trip", "Kids", "Museum"];

// Words people type for the same thing.
const SYNONYMS = {
  qutub: "qutb", kutub: "qutb", qutab: "qutb", harappa: "harappan", indus: "harappan", saraswati: "harappan",
  kids: "children families kids", child: "children families", children: "children families kids", job: "career", jobs: "career", careers: "career",
  school: "school schools students", college: "college students", tour: "trip tour journey", trip: "trip tour journey",
  mandir: "temple", temples: "temple", fort: "fort qila", qila: "fort qila", museum: "museum", walk: "walk walks",
  mughal: "mughal", sultanate: "sultanate", upsc: "upsc", sanskrit: "sanskrit", brahmi: "brahmi script",
  ashoka: "asoka ashoka", asoka: "asoka ashoka", online: "online",
};

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, " ").trim();

let index = null;
let loading = null;

async function loadIndex() {
  if (index) return index;
  loading ||= (async () => {
    let data = { items: [], hide: [], kinds: {} };
    try {
      const res = await fetch("data/search.json");
      if (res.ok) data = await res.json();
    } catch { /* offline: the database listings may still load */ }
    const items = data.items.slice();
    const hidden = new Set(data.hide || []);
    const TYPE = { counselling: "Counselling", recording: "Recording", physical: "Book or print", live: "Live session", walk: "Walk" };
    for (const p of await getListingTitles()) {
      if (hidden.has(p.slug) || p.tags?.includes("unlisted")) continue;
      items.push({ t: p.title, u: `product.html?slug=${encodeURIComponent(p.slug)}`, k: data.kinds?.[p.slug] || TYPE[p.type] || "Programme", p: "", x: `${p.subtitle || ""} ${(p.tags || []).join(" ")}` });
    }
    const seen = new Set();
    index = items.filter((i) => !seen.has(i.u) && seen.add(i.u)).map((i) => ({ ...i, _t: ` ${norm(i.t)}`, _p: ` ${norm(i.p)}`, _k: ` ${norm(i.k)}`, _x: ` ${norm(i.x)}` }));
    return index;
  })();
  return loading;
}

function expand(token) {
  return [token, ...(SYNONYMS[token] || "").split(" ").filter(Boolean)];
}

/** Every word must match the start of a word somewhere; title matches count most. */
function search(q) {
  const tokens = norm(q).split(" ").filter(Boolean);
  if (!tokens.length || !index) return [];
  const score = (item, strict) => {
    let total = 0;
    for (const tk of tokens) {
      let best = 0;
      for (const w of expand(tk)) {
        const n = ` ${w}`;
        if (item._t.includes(n)) best = Math.max(best, item._t.startsWith(n) ? 12 : 8);
        else if (item._p.includes(n)) best = Math.max(best, 6);
        else if (item._k.includes(n)) best = Math.max(best, 4);
        else if (item._x.includes(n)) best = Math.max(best, 2);
      }
      if (!best && strict) return 0;
      total += best;
    }
    // Programmes before guides when equal: a visitor searching is often ready to book.
    return total ? total + (item.k === "Guide" ? 0 : item.k === "Page" ? 0.5 : 1) : 0;
  };
  let hits = index.map((i) => [score(i, true), i]).filter(([s]) => s > 0);
  if (!hits.length && tokens.length > 1) hits = index.map((i) => [score(i, false), i]).filter(([s]) => s >= tokens.length * 2);
  return hits.sort((a, b) => b[0] - a[0] || a[1].t.localeCompare(b[1].t)).map(([, i]) => i);
}

const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';
export const searchButton = () => `<button class="search-toggle" type="button" data-search-open aria-haspopup="dialog" title="${esc(L.open)}">${ICON}<span class="visually-hidden">${esc(L.open)}</span></button>`;

export function initSearch() {
  const buttons = document.querySelectorAll("[data-search-open]");
  const panel = document.createElement("dialog");
  panel.className = "search-panel";
  panel.setAttribute("aria-label", L.label);
  panel.setAttribute("data-no-translate", "");
  if (lang === "hi") panel.lang = "hi";
  panel.innerHTML = `
    <form class="search-bar" role="search" action="#">
      ${ICON}
      <input type="search" name="q" autocomplete="off" enterkeyhint="search" spellcheck="false" aria-label="${esc(L.label)}" placeholder="${esc(L.placeholder)}">
      <button class="sheet-close" type="button" data-search-close aria-label="${esc(L.close)}">×</button>
    </form>
    <div class="search-results" aria-live="polite"></div>`;
  document.body.append(panel);
  const input = panel.querySelector("input");
  const out = panel.querySelector(".search-results");
  let limit = 12;
  let logged = "";
  let timer;

  const log = () => {
    const q = input.value.trim();
    if (q.length < 2 || q === logged) return;
    logged = q;
    track("search", { label: q.slice(0, 200), value: String(search(q).length) });
  };

  const draw = () => {
    const q = input.value.trim();
    if (!q) {
      out.innerHTML = `<p class="search-head">${esc(L.popular)}</p><div class="search-chips">${POPULAR.map((p) => `<button type="button" class="chip" data-q="${esc(p)}">${esc(p)}</button>`).join("")}</div>`;
      return;
    }
    const hits = search(q);
    if (!hits.length) {
      const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello ${CONFIG.brand}, I am looking for: ${q}`)}`;
      out.innerHTML = `<div class="search-empty"><p><strong>${esc(L.none(q))}</strong></p><p>${esc(L.noneHelp)}</p>
        <p class="search-empty-actions"><a class="btn btn-primary btn-small" href="${esc(wa)}" target="_blank" rel="noopener">${esc(L.ask)}</a> <a class="btn btn-outline btn-small" href="finder.html">${esc(L.finder)}</a></p></div>`;
      return;
    }
    out.innerHTML = `<p class="search-head">${esc(L.count(hits.length))}</p><ul class="search-list">${hits
      .slice(0, limit)
      .map((i) => `<li><a href="${esc(i.u)}"><span class="search-title">${esc(i.t)}</span><span class="search-meta">${esc(i.k)}${i.p ? ` · ${esc(i.p)}` : ""}</span></a></li>`)
      .join("")}</ul>${hits.length > limit ? `<button type="button" class="btn btn-outline btn-small search-more" data-more>${esc(L.more(hits.length))}</button>` : ""}`;
  };

  const open = async (q = "") => {
    if (!panel.open) panel.showModal();
    if (q) input.value = q;
    input.focus();
    out.innerHTML = index ? "" : `<p class="search-head">…</p>`;
    await loadIndex();
    limit = 12;
    draw();
  };

  buttons.forEach((b) => {
    b.addEventListener("click", () => open());
    // Start fetching the index as soon as the visitor shows intent.
    b.addEventListener("pointerenter", () => loadIndex(), { once: true });
  });
  input.addEventListener("input", () => {
    limit = 12;
    clearTimeout(timer);
    timer = setTimeout(log, 1200);
    if (index) draw();
  });
  panel.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    log();
    const first = out.querySelector(".search-list a");
    if (first) location.href = first.getAttribute("href");
  });
  out.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-q]");
    if (chip) { input.value = chip.dataset.q; draw(); log(); input.focus(); return; }
    if (e.target.closest("[data-more]")) { limit = 1000; draw(); return; }
    if (e.target.closest("a")) log();
  });
  panel.querySelector("[data-search-close]").addEventListener("click", () => panel.close());
  panel.addEventListener("click", (e) => { if (e.target === panel) panel.close(); });
  panel.addEventListener("close", () => { log(); clearTimeout(timer); });

  document.addEventListener("keydown", (e) => {
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
      if (document.querySelector("dialog[open]:not(.search-panel)")) return;
      e.preventDefault();
      open();
    }
  });

  const q = new URLSearchParams(location.search).get("q");
  if (q) open(q.slice(0, 100));
}
