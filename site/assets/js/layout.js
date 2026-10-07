// Header, footer, cart badge and the registration gate. Loaded on every page.
import { CONFIG, isLive } from "./config.js";
import { cartCount, getVisitor, addToCart } from "./store.js";
import { initGate, openGate } from "./gate.js";
import { getProducts } from "./api.js";
import { $, esc, toast, stockFlag } from "./ui.js";

const page = location.pathname.split("/").pop() || "index.html";
const filter = new URLSearchParams(location.search).get("type");

function navLink(href, label) {
  const [file, query] = href.split("?");
  const wanted = query ? new URLSearchParams(query).get("type") : null;
  const current = page === file && (wanted ? wanted === filter : !filter || file !== "shop.html");
  return `<a href="${href}"${current ? ' aria-current="page"' : ""}>${label}</a>`;
}

function renderHeader() {
  const el = $("#site-header");
  if (!el) return;
  el.innerHTML = `
    <a class="skip" href="#main">Skip to content</a>
    ${isLive() ? "" : `<div class="demo-banner">Demo mode: registrations and orders are not saved anywhere. Add your Supabase keys in <code>assets/js/config.js</code> to go live.</div>`}
    ${isLive() && CONFIG.sampleNotice ? `<div class="demo-banner">This site is being set up. The listings shown are examples; bookings open soon.</div>` : ""}
    <div class="site-header">
      <a class="wordmark" href="index.html" aria-label="${esc(CONFIG.brand)} home">
        <img class="wordmark-badge" src="${esc(CONFIG.logo || "assets/img/logo-192.png")}" alt="" width="48" height="48">
        <span class="wordmark-text"><span class="wordmark-latin">${esc(CONFIG.brand)}</span><span class="wordmark-tag">lost in the mists of time</span></span>
      </a>
      <nav class="site-nav" aria-label="Main">
        ${navLink("shop.html?type=walk", "Walks and experiences")}
        ${navLink("shop.html?type=live", "Courses and lectures")}
        ${navLink("shop.html?type=counselling", "Counselling")}
        ${navLink("shop.html", "Everything")}
        ${navLink("about.html", "About")}
      </nav>
      <a class="cart-link" href="cart.html">Cart <span class="cart-count" data-cart-count>0</span><span class="visually-hidden"> items</span></a>
    </div>`;
}

function renderFooter() {
  const el = $("#site-footer");
  if (!el) return;
  const v = getVisitor();
  const year = new Date().getFullYear();
  el.innerHTML = `
    <div class="scale-bar" aria-hidden="true"></div>
    <div class="site-footer">
      <div>
        <img class="footer-badge" src="assets/img/logo-192.png" alt="" width="72" height="72">
        <p class="footer-tag">lost in the mists of time</p>
        <p>Team for Archaeology, Linguistics, Anthropology, Arts, Sanskrit, History and Heritage.</p>
      </div>
      <div>
        <h2>Shop</h2>
        <ul>
          <li><a href="shop.html?type=walk">Walks and experiences</a></li>
          <li><a href="shop.html?type=live">Courses and lectures</a></li>
          <li><a href="shop.html?type=counselling">Counselling</a></li>
          <li><a href="shop.html?type=recording">Recordings</a></li>
          <li><a href="shop.html?type=physical">Books and prints</a></li>
        </ul>
      </div>
      <div>
        <h2>Help</h2>
        <ul>
          <li><a href="contact.html">Contact us</a></li>
          <li><a href="sell.html">Sell with us</a></li>
          <li><a href="seller.html">Partner sign-in</a></li>
          <li><a href="shipping-returns.html">Shipping, cancellations and refunds</a></li>
          <li><a href="privacy.html">Privacy notice</a></li>
          <li><a href="terms.html">Terms of sale</a></li>
        </ul>
      </div>
      <div>
        <h2>Your details</h2>
        <ul>
          ${
            v
              ? `<li>Registered as ${esc(v.email)}</li><li><button class="btn-plain" type="button" data-edit-details>Update my details</button></li><li><a href="privacy.html#your-choices">Remove my details</a></li>`
              : `<li><button class="btn-plain" type="button" data-edit-details>Register</button></li>`
          }
        </ul>
      </div>
    </div>
    <div class="footer-legal">
      © ${year} ${esc(CONFIG.brand)}. <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a>, ${esc(CONFIG.contactPhone)}${
        CONFIG.instagram ? `, <a href="${esc(CONFIG.instagram)}" rel="noopener">Instagram</a>` : ""
      }
    </div>`;
  $("[data-edit-details]", el)?.addEventListener("click", async () => {
    const saved = await openGate({ edit: Boolean(getVisitor()) });
    if (saved) renderFooter();
  });
}

function updateCartCount() {
  const el = $("[data-cart-count]");
  if (el) el.textContent = String(cartCount());
}

// One "Add to cart" handler for every product card on every page.
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn || CONFIG.sampleNotice) return;
  const products = await getProducts();
  const p = products.find((x) => x.id === btn.dataset.add);
  if (!p || stockFlag(p)?.soldOut) return;
  addToCart(p.id, 1, p.stock ?? undefined);
  toast("Added to cart", { href: "cart.html", label: "View cart" });
});

document.addEventListener("th:cart", updateCartCount);
document.addEventListener("th:visitor", renderFooter);
window.addEventListener("storage", updateCartCount);

renderHeader();
renderFooter();
updateCartCount();
initGate();
