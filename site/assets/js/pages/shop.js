import { getProducts } from "../api.js";
import { $, $$, esc, isRequest, productCard } from "../ui.js";

const FILTERS = {
  all: { label: "Everything", types: null, title: "Everything we offer" },
  walk: { label: "Walks and experiences", types: ["walk", "experience"], title: "Heritage walks and experiences" },
  live: { label: "Courses and lectures", types: ["live", "course"], title: "Courses and lectures" },
  counselling: { label: "Counselling", types: ["counselling"], title: "One-to-one counselling" },
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

const params = new URLSearchParams(location.search);
let active = FILTERS[params.get("type")] ? params.get("type") : "all";
let who = AUDIENCES[params.get("for")] ? params.get("for") : "";
let sort = "featured";

const grid = $("#shop-grid");
const chips = $("#shop-filters");
const forRow = $("#shop-for");
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
  heading.textContent = FILTERS[active].title;
  document.title = `${FILTERS[active].title} | Talaash Heritage`;
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
    const list = sorted(forWho ? inSection.filter((p) => p.audience?.includes(forWho)) : inSection);
    const onRequest = list.filter(isRequest).length;
    const noun = list.length === 1 ? "listing" : "listings";
    count.textContent = `${list.length} ${noun}${forWho ? ` suitable for ${AUDIENCES[forWho].toLowerCase()}` : ""}${!onRequest ? "." : list.length === 1 ? ", arranged on request, on dates you choose." : `. ${onRequest === list.length ? "All" : onRequest} arranged on request, on dates you choose.`}`;
    grid.innerHTML = list.length
      ? list.map(productCard).join("")
      : `<div class="empty"><h2>Nothing listed here yet</h2><p>Tell us what you are looking for and we will arrange it. <a href="contact.html">Contact us</a> or <a href="shop.html">see everything we offer</a>.</p></div>`;
  } catch (e) {
    grid.innerHTML = `<p class="form-error">${esc(e.message)}</p>`;
  }
}

chips.innerHTML =
  Object.entries(FILTERS)
    .map(([key, f]) => `<button class="chip" type="button" data-filter="${key}" aria-pressed="false">${f.label}</button>`)
    .join("") +
  `<label>Sort by
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

forRow.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-for]");
  if (!chip) return;
  who = chip.dataset.for;
  const url = new URL(location.href);
  if (who) url.searchParams.set("for", who);
  else url.searchParams.delete("for");
  history.replaceState(null, "", url);
  render();
});

chips.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filter]");
  if (!chip) return;
  active = chip.dataset.filter;
  const url = new URL(location.href);
  if (active === "all") url.searchParams.delete("type");
  else url.searchParams.set("type", active);
  history.replaceState(null, "", url);
  render();
});
$("#shop-sort").addEventListener("change", (e) => {
  sort = e.target.value;
  render();
});

render();
