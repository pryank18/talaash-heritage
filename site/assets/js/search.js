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

// ---------------------------------------------------------------------------
// Matching. Every word typed has to match a word in the result (exactly, as the start of a
// word, or with one or two typing mistakes). Results rank by where the words match (title
// first, then place, then type, then description), and a result that contains the whole
// phrase typed ("national museum") ranks above one that only has the words apart
// ("National Crafts Museum").

// Words people type for the same thing. Each expands to the words used on the site.
const SYNONYMS = {
  qutub: "qutb", kutub: "qutb", qutab: "qutb", kutab: "qutb", harappa: "harappan", indus: "harappan", sindhu: "harappan",
  kid: "children families", kids: "children families", child: "children families", children: "children families",
  family: "families children", job: "career careers", jobs: "career careers", career: "careers",
  school: "schools students", student: "students school", college: "colleges students university",
  tour: "trip journey", trip: "tour journey", travel: "trip journey tour", day: "day",
  mandir: "temple", temples: "temple", qila: "fort", quila: "fort", kila: "fort", fort: "qila",
  mosque: "masjid", masjid: "mosque", tomb: "maqbara", maqbara: "tomb", stepwell: "baoli", baori: "baoli", bawli: "baoli",
  ashoka: "asoka asokan", asoka: "ashoka asokan", mughal: "mughals", moghul: "mughal", mogul: "mughal",
  lal: "red", taj: "taj", sufi: "dargah", photography: "photo", photos: "photo", heritage: "heritage",
  counselling: "counselling career guidance", counseling: "counselling career", guidance: "career counselling",
  calcutta: "kolkata", bombay: "mumbai", banaras: "varanasi", benares: "varanasi", mamallapuram: "mahabalipuram", mahabalipuram: "mamallapuram",
};
// Hindi words and names, typed in Devanagari, turned into the English used on the site.
const HINDI = [
  ["राष्ट्रीय संग्रहालय", "national museum"], ["लाल किला", "red fort"], ["पुराना किला", "purana qila"], ["जामा मस्जिद", "jama masjid"],
  ["कुतुब मीनार", "qutb minar"], ["क़ुतुब मीनार", "qutb minar"], ["कुतुब", "qutb"], ["क़ुतुब", "qutb"], ["हुमायूँ", "humayun"], ["हुमायूं", "humayun"],
  ["चांदनी चौक", "chandni chowk"], ["चाँदनी चौक", "chandni chowk"], ["ताज महल", "taj mahal"], ["ताजमहल", "taj mahal"],
  ["इंडिया गेट", "india gate"], ["जंतर मंतर", "jantar mantar"], ["लोधी", "lodhi"], ["हौज़ खास", "hauz khas"], ["हौज खास", "hauz khas"],
  ["महरौली", "mehrauli"], ["निज़ामुद्दीन", "nizamuddin"], ["निजामुद्दीन", "nizamuddin"], ["अग्रसेन", "agrasen"], ["तुगलकाबाद", "tughlaqabad"],
  ["पुरानी दिल्ली", "old delhi"], ["दिल्ली", "delhi"], ["आगरा", "agra"], ["जयपुर", "jaipur"], ["मुंबई", "mumbai"], ["भोपाल", "bhopal"],
  ["खजुराहो", "khajuraho"], ["कोणार्क", "konark"], ["सांची", "sanchi"], ["साँची", "sanchi"], ["नालंदा", "nalanda"], ["राखीगढ़ी", "rakhigarhi"],
  ["हड़प्पा", "harappan"], ["सिंधु", "harappan"], ["संग्रहालय", "museum"], ["मंदिर", "temple"], ["किला", "fort"], ["मकबरा", "tomb"],
  ["मस्जिद", "masjid"], ["बावली", "baoli"], ["गुफा", "cave"], ["गुफाएँ", "caves"], ["स्तूप", "stupa"], ["भ्रमण", "walk"], ["सैर", "walk"],
  ["यात्रा", "trip"], ["विद्यालय", "school"], ["स्कूल", "school"], ["कॉलेज", "college"], ["बच्चे", "children"], ["बच्चों", "children"],
  ["करियर", "career"], ["कैरियर", "career"], ["पुरातत्व", "archaeology"], ["इतिहास", "history"], ["ब्राह्मी", "brahmi"], ["संस्कृत", "sanskrit"],
  ["पाली", "pali"], ["प्राकृत", "prakrit"], ["लिपि", "script"], ["कार्यशाला", "workshop"], ["व्याख्यान", "lecture"], ["पाठ्यक्रम", "course"],
  ["कोर्स", "course"], ["मुगल", "mughal"], ["मुग़ल", "mughal"], ["सल्तनत", "sultanate"], ["अशोक", "ashoka"], ["कला", "art"], ["धरोहर", "heritage"],
  ["विरासत", "heritage"], ["परामर्श", "counselling"],
];
const STOP = new Set(["the", "a", "an", "of", "in", "at", "and", "for", "to", "with", "on", "near", "me", "by", "ka", "ki", "ke", "se", "mein"]);

const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['\u2019]s\b/g, "").replace(/[^a-z0-9\u0900-\u097f]+/g, " ").trim();
// Names people use for a place that the site writes differently.
const PHRASES = [
  ["old fort", "purana qila"], ["lal kila", "red fort"], ["lal qila", "red fort"], ["lal quila", "red fort"], ["laal qila", "red fort"],
  ["indus valley", "harappan"], ["indus civilisation", "harappan"], ["indus civilization", "harappan"], ["mohenjo daro", "harappan"],
  ["kartavya path", "india gate"], ["rajpath", "india gate"], ["shahjahanabad", "old delhi"],
];
/** Plurals to singular, so "temples" finds "temple" and "museums" finds "museum". */
const stem = (w) => (w.length > 4 && w.endsWith("ies") ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
const words = (s) => norm(s).split(" ").filter(Boolean).map(stem);

/** Edit distance with swapped letters counted once ("musuem" is one step from "museum"). Stops early above max. */
function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      best = Math.min(best, d[i][j]);
    }
    if (best > max) return max + 1;
  }
  return d[a.length][b.length];
}

/** How well one typed word matches a list of words: 1 exact, 0.85 start of a word, 0.7 one or two typing mistakes. */
function wordMatch(tok, list) {
  let best = 0;
  const max = tok.length >= 8 ? 2 : tok.length >= 4 ? 1 : 0;
  for (const w of list) {
    if (w === tok) return 1;
    if (tok.length >= 3 && w.startsWith(tok)) best = Math.max(best, 0.85);
    else if (max && w[0] === tok[0] && distance(tok, w, max) <= max) best = Math.max(best, 0.7);
  }
  return best;
}

/** The query as English words, with Hindi names and words translated. */
function queryWords(q) {
  let text = ` ${String(q || "").toLowerCase()} `;
  for (const [hi, en] of HINDI) text = text.split(hi).join(` ${en} `);
  text = ` ${norm(text)} `;
  for (const [from, to] of PHRASES) text = text.split(` ${from} `).join(` ${to} `);
  return words(text).filter((w) => !STOP.has(w)).flatMap(correct);
}

/**
 * A word the site never uses is corrected to the nearest word it does use ("musuem" -> "museum"),
 * or split in two ("redfort" -> "red fort"). Known words and the starts of known words are kept.
 */
function correct(tok) {
  if (!vocab || vocab.has(tok) || SYNONYMS[tok]) return [tok];
  if (tok.length >= 3) for (const w of vocab.keys()) if (w.startsWith(tok)) return [tok];
  for (let i = 2; i <= tok.length - 2; i++) {
    const a = tok.slice(0, i), b = tok.slice(i);
    if ((vocab.has(a) || SYNONYMS[a]) && (vocab.has(b) || SYNONYMS[b])) return [a, b];
  }
  const max = tok.length >= 8 ? 2 : tok.length >= 4 ? 1 : 0;
  let best = null;
  if (max) {
    for (const [w, n] of vocab) {
      if (w[0] !== tok[0]) continue;
      const d = distance(tok, w, max);
      if (d <= max && (!best || d < best.d || (d === best.d && n > best.n))) best = { w, d, n };
    }
  }
  return [best ? best.w : tok];
}

let index = null;
let vocab = null; // every word on the site, with how often it appears
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
      const kind = data.kinds?.[p.slug] || TYPE[p.type] || "Programme";
      items.push({ t: p.title, u: `product.html?slug=${encodeURIComponent(p.slug)}`, k: kind, p: "", x: `${p.subtitle || ""} ${(p.tags || []).join(" ")}`, b: kind === "Career course" ? 1 : 0 });
    }
    const seen = new Set();
    index = items
      .filter((i) => !seen.has(i.u) && seen.add(i.u))
      .map((i) => {
        const f = { t: words(i.t), p: words(i.p), k: words(i.k), x: words(i.x) };
        return { ...i, f, delhi: f.p.includes("delhi"), j: { t: ` ${f.t.join(" ")} `, p: ` ${f.p.join(" ")} `, x: ` ${f.x.join(" ")} ` } };
      });
    vocab = new Map();
    for (const i of index) for (const list of Object.values(i.f)) for (const w of list) vocab.set(w, (vocab.get(w) || 0) + 1);
    return index;
  })();
  return loading;
}

const WEIGHT = { t: 10, p: 7, k: 4, x: 2 };

function score(item, toks, strict) {
  let total = 0;
  let matched = 0;
  let inTitle = 0;
  for (const tok of toks) {
    let best = 0;
    let also = 0;
    for (const [field, weight] of Object.entries(WEIGHT)) {
      let m = wordMatch(tok, item.f[field]);
      for (const alt of (SYNONYMS[tok] || "").split(" ").filter(Boolean)) m = Math.max(m, 0.9 * wordMatch(stem(alt), item.f[field]));
      if (field === "t" && m) inTitle++;
      also += m * weight;
      best = Math.max(best, m * weight);
    }
    if (!best && strict) return 0;
    if (best) matched++;
    // Matching in the title and also in the type or description is a little better than the title alone.
    total += best + 0.2 * (also - best);
  }
  if (!matched) return 0;
  // The whole phrase, in order, counts most of all.
  if (toks.length > 1) {
    const phrase = ` ${toks.join(" ")} `;
    if (item.j.t.includes(phrase)) total += 25;
    else if (item.j.p.includes(phrase)) total += 18;
    else if (item.j.x.includes(phrase)) total += 6;
    if (inTitle === toks.length) total += 8;
  }
  // Programmes before guides: someone searching for a place is usually looking for the visit.
  // Delhi first when all else is equal, because most visits start there.
  return total * (item.k === "Guide" ? 0.8 : 1) + (item.k === "Page" ? 0.5 : item.k === "Guide" ? 0 : 1) + (item.delhi ? 0.3 : 0) + (item.b ? 1.5 : 0);
}

function search(q) {
  const toks = queryWords(q);
  if (!toks.length || !index) return [];
  let hits = index.map((i) => [score(i, toks, true), i]).filter(([s]) => s > 0);
  // Nothing has every word: show what matches most of them.
  if (!hits.length && toks.length > 1) hits = index.map((i) => [score(i, toks, false), i]).filter(([s]) => s >= 2 * Math.ceil(toks.length / 2));
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
