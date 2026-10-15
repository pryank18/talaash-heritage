import { getProducts } from "../api.js";
import { $, $$, esc, groupByKey, groupProducts, initRails, isRequest, isSoon, productCard, railHtml } from "../ui.js";
import { t } from "../i18n.js";

const FILTERS = {
  all: { label: "Everything", types: null, title: "Everything we offer" },
  walk: { label: "Walks and experiences", types: ["walk", "experience"], title: "Heritage walks and experiences" },
  live: { label: "Courses and lectures", types: ["live", "course"], title: "Courses and lectures" },
  counselling: { label: "Counselling", types: ["counselling"], title: "Career counselling and career courses" },
  recording: { label: "Recordings", types: ["recording"], title: "Recorded lectures" },
  physical: { label: "Books and prints", types: ["physical"], title: "Books and prints" },
};

// A second, optional question: who the programme is for. It narrows whichever section is open.
const AUDIENCES = {
  school: "Schools",
  college: "Colleges and universities",
  work: "Workplaces",
  public: "Individuals and private groups",
};

// A third question: where it happens.
const WHERE = {
  delhi: "In Delhi",
  nearby: "Day trips from Delhi",
  india: "Around India",
  anywhere: "Online or at your venue",
};

const params = new URLSearchParams(location.search);
let where = WHERE[params.get("where")] ? params.get("where") : "";
// One section opened from its "See all" link.
let group = groupByKey(params.get("group")) ? params.get("group") : "";
let active = FILTERS[params.get("type")] ? params.get("type") : "all";
let who = AUDIENCES[params.get("for")] ? params.get("for") : "";
let sort = "featured";

const shopRoot = $("#shop-grid");
const chips = $("#shop-filters");
const forRow = $("#shop-for");
const whereRow = $("#shop-where");
const heading = $("#shop-title");
const count = $("#shop-count");

function sorted(list) {
  const out = [...list];
  if (sort === "price-asc") out.sort((a, b) => a.price_paise - b.price_paise);
  if (sort === "price-desc") out.sort((a, b) => b.price_paise - a.price_paise);
  if (sort === "date") out.sort((a, b) => (a.starts_at ? new Date(a.starts_at) : Infinity) - (b.starts_at ? new Date(b.starts_at) : Infinity));
  return out;
}

async function render() {
  heading.textContent = group ? groupByKey(group).title : FILTERS[active].title;
  document.title = t(`${FILTERS[active].title} | Talaash Heritage`);
  $$("[data-filter]", chips).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === active)));
  try {
    const products = await getProducts();
    const types = FILTERS[active].types;
    const inSection = types ? products.filter((p) => types.includes(p.type)) : products;
    // Sections with nothing planned for a group (recordings, books) do not ask who it is for.
    const asks = inSection.some((p) => p.audience?.length);
    forRow.hidden = !asks;
    const forWho = asks && who ? who : "";
    $$("[data-for]", forRow).forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.for === forWho)));
    const regions = new Set(inSection.map((p) => p.region).filter(Boolean));
    whereRow.hidden = regions.size < 2;
    const at = !whereRow.hidden && regions.has(where) ? where : "";
    $$("[data-where]", whereRow).forEach((c) => {
      c.setAttribute("aria-pressed", String(c.dataset.where === at));
      c.hidden = Boolean(c.dataset.where) && !regions.has(c.dataset.where);
    });
    const list = sorted(inSection.filter((p) => (!forWho || p.audience?.includes(forWho)) && (!at || p.region === at)));
    const available = list.filter((p) => !isSoon(p));
    const soon = list.filter(isSoon);
    const onRequest = available.filter(isRequest).length;

    const parts = [];
    if (onRequest) parts.push(`${onRequest} arranged on request`);
    if (available.length > onRequest) parts.push(`${available.length - onRequest} available to book`);
    if (soon.length) parts.push(`${soon.length} coming soon`);
    count.textContent = list.length
      ? `${[forWho ? `Suitable for ${AUDIENCES[forWho].toLowerCase()}` : "", at ? WHERE[at] : ""].filter(Boolean).join(", ")}${forWho || at ? ": " : ""}${parts.join(", ")}.`
      : "";

    const grid = (items) => `<div class="grid">${items.map(productCard).join("")}</div>`;
    const groups = groupProducts(list);
    let html = "";
    if (group) {
      // One section in full, from a "See all" link.
      const g = groups.find((x) => x.key === group);
      html += `<p class="shop-back"><a href="${esc(linkFor(""))}">← All sections</a></p>`;
      if (g) {
        html += grid(g.items);
        count.textContent = `${g.items.length} arranged on request.`;
      }
    } else if (sort === "featured" && groups.length > 1) {
      // Sections, each a row of cards with "See all".
      const showFeatured = active === "all" && !forWho && !at;
      const featured = showFeatured ? available.filter((p) => p.tags?.includes("home")) : [];
      if (featured.length) html += railHtml({ key: "featured", title: "Featured programmes", items: featured });
      html += groups.map((g) => railHtml(g, { href: linkFor(g.key) })).join("");
    } else {
      // One section only, or sorted by date or price: a single grid.
      html += grid(available);
      if (soon.length) html += `<section class="shop-block" aria-labelledby="soon-title"><h2 id="soon-title">Coming soon</h2><p class="muted shop-block-note">Not yet available. Register your interest on any of these and we will let you know when it is ready.</p>${grid(soon)}</section>`;
    }
    shopRoot.innerHTML = html || `<div class="empty"><h2>Nothing listed here yet</h2><p>Tell us what you are looking for and we will arrange it. <a href="contact.html">Contact us</a> or <a href="shop.html">see everything we offer</a>.</p></div>`;
    initRails(shopRoot);
  } catch (e) {
    shopRoot.innerHTML = `<p class="form-error">${esc(e.message)}</p>`;
  }
}

/** The shop address with the current filters and one section open (or none). */
function linkFor(key) {
  const url = new URL(location.href);
  if (key) url.searchParams.set("group", key);
  else url.searchParams.delete("group");
  return url.pathname.split("/").pop() + url.search;
}

// "See all" and "All sections" change the view without reloading the page.
shopRoot.addEventListener("click", (e) => {
  const a = e.target.closest(".rail-all, .shop-back a");
  if (!a) return;
  e.preventDefault();
  const url = new URL(a.href);
  group = url.searchParams.get("group") || "";
  history.pushState(null, "", url);
  render();
  window.scrollTo({ top: $("#shop-title").getBoundingClientRect().top + window.scrollY - 80 });
});
window.addEventListener("popstate", () => {
  const q = new URLSearchParams(location.search);
  group = groupByKey(q.get("group")) ? q.get("group") : "";
  render();
});

chips.innerHTML =
  Object.entries(FILTERS)
    .map(([key, f]) => `<button class="chip" type="button" data-filter="${key}" aria-pressed="false">${f.label}</button>`)
    .join("") +
  `<label><span>Sort by</span>
    <select id="shop-sort">
      <option value="featured">Featured</option>
      <option value="date">Date, soonest first</option>
      <option value="price-asc">Price, low to high</option>
      <option value="price-desc">Price, high to low</option>
    </select>
  </label>`;

forRow.innerHTML =
  `<span class="filters-label" id="shop-for-label">Suitable for</span>` +
  [["", "All"], ...Object.entries(AUDIENCES)]
    .map(([key, label]) => `<button class="chip chip-quiet" type="button" data-for="${key}" aria-pressed="false">${label}</button>`)
    .join("");

whereRow.innerHTML =
  `<span class="filters-label" id="shop-where-label">Where</span>` +
  [["", "Anywhere"], ...Object.entries(WHERE)]
    .map(([key, label]) => `<button class="chip chip-quiet" type="button" data-where="${key}" aria-pressed="false">${label}</button>`)
    .join("");

whereRow.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-where]");
  if (!chip) return;
  where = chip.dataset.where;
  group = "";
  const url = new URL(location.href);
  url.searchParams.delete("group");
  if (where) url.searchParams.set("where", where);
  else url.searchParams.delete("where");
  history.replaceState(null, "", url);
  render();
});

forRow.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-for]");
  if (!chip) return;
  who = chip.dataset.for;
  group = "";
  const url = new URL(location.href);
  url.searchParams.delete("group");
  if (who) url.searchParams.set("for", who);
  else url.searchParams.delete("for");
  history.replaceState(null, "", url);
  render();
});

chips.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filter]");
  if (!chip) return;
  active = chip.dataset.filter;
  group = "";
  const url = new URL(location.href);
  if (active === "all") url.searchParams.delete("type");
  else url.searchParams.set("type", active);
  url.searchParams.delete("group");
  history.replaceState(null, "", url);
  render();
});
$("#shop-sort").addEventListener("change", (e) => {
  sort = e.target.value;
  render();
});

render();
