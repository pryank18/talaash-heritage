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

const params = new URLSearchParams(location.search);
let active = FILTERS[params.get("type")] ? params.get("type") : "all";
let sort = "featured";

const grid = $("#shop-grid");
const chips = $("#shop-filters");
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
    const list = sorted(types ? products.filter((p) => types.includes(p.type)) : products);
    const onRequest = list.filter(isRequest).length;
    count.textContent = `${list.length} listed${onRequest ? `. ${onRequest === list.length ? "All" : onRequest} arranged on request, on dates that suit you.` : ""}`;
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
