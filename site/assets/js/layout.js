// Header, footer, cart badge and the registration gate. Loaded on every page.
import { CONFIG, isLive } from "./config.js";
import { cartCount, getVisitor, addToCart } from "./store.js";
import { initGate, openGate } from "./gate.js";
import { getProducts } from "./api.js";
import { $, esc, toast, canBuy } from "./ui.js";
import { lang, setLang, startTranslating, t } from "./i18n.js";
import "./magic.js";

const page = location.pathname.split("/").pop() || "index.html";
const filter = new URLSearchParams(location.search).get("type");

// Pages whose main text has not been translated yet. Their header, footer and buttons are still in Hindi.
const ENGLISH_ONLY = new Set(["about.html", "privacy.html", "terms.html", "shipping-returns.html", "sell.html", "seller.html", "cart.html", "checkout.html", "order.html", "admin.html"]);

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
    <div class="lang-bar" data-no-translate><div class="lang-bar-inner">
      <span class="visually-hidden">Language / भाषा:</span>
      <button type="button" class="lang-option" data-lang-set="en" lang="en" aria-pressed="${lang === "en"}">English</button>
      <span aria-hidden="true">|</span>
      <button type="button" class="lang-option" data-lang-set="hi" lang="hi" aria-pressed="${lang === "hi"}">हिन्दी</button>
    </div></div>
    ${isLive() ? "" : `<div class="demo-banner">Demo mode: registrations and orders are not saved anywhere. Add your Supabase keys in <code>assets/js/config.js</code> to go live.</div>`}
    ${isLive() && CONFIG.sampleNotice ? `<div class="demo-banner">This site is being set up. The listings shown are examples; bookings open soon.</div>` : ""}
    ${lang === "hi" && ENGLISH_ONLY.has(page) ? `<div class="lang-notice" lang="hi" data-no-translate>यह पृष्ठ अभी केवल अंग्रेज़ी में उपलब्ध है। किसी भी जानकारी के लिए आप हमें WhatsApp पर हिन्दी में लिख सकते हैं।</div>` : ""}
    ${lang === "hi" && page === "product.html" ? `<div class="lang-notice" lang="hi" data-no-translate>कार्यक्रम का विस्तृत विवरण अभी अंग्रेज़ी में है। हिन्दी में जानकारी के लिए आप हमें WhatsApp पर लिख सकते हैं।</div>` : ""}
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
      <button type="button" class="lang-quick" data-no-translate data-lang-set="${lang === "hi" ? "en" : "hi"}" lang="${lang === "hi" ? "en" : "hi"}">${lang === "hi" ? "English" : "हिन्दी"}</button>
      <button class="theme-toggle" type="button" data-theme-toggle>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>
        <span class="visually-hidden" data-theme-label></span>
      </button>
      <a class="cart-link" href="cart.html"><svg class="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg><span class="cart-word">Cart</span> <span class="cart-count" data-cart-count>0</span><span class="visually-hidden"> items</span></a>
    </div>`;
}

/** The header switch between light and dark. The choice is kept for later visits. */
function initThemeToggle() {
  const btn = $("[data-theme-toggle]");
  if (!btn) return;
  const sync = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const label = t(dark ? "Switch to light theme" : "Switch to dark theme");
    btn.setAttribute("title", label);
    $("[data-theme-label]", btn).textContent = label;
  };
  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("th_theme", next); } catch { /* storage blocked: the switch still works for this page */ }
    sync();
  });
  sync();
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
          <li><a href="finder.html">Help me choose a programme</a></li>
          <li><a href="contact.html">Contact us</a></li>
          <li><a href="about.html#questions">Common questions</a></li>
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

// ---- phone app shell: bottom tabs and the "More" sheet -----------------------
// Shown by CSS on phones and portrait tablets only; desktop keeps the header nav.
const NO_TABS = new Set(["admin.html", "seller.html", "checkout.html"]);
const MORE_PAGES = new Set(["about.html", "sell.html", "privacy.html", "terms.html", "shipping-returns.html", "cart.html", "order.html"]);
const ICON = {
  home: '<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  shop: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/>',
  find: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/><path d="M8.5 11h5M11 8.5v5"/>',
  contact: '<path d="M4.5 18.5 5.6 15A7.5 7.5 0 1 1 9 18.4z"/><path d="M9 10.5h6M9 13.5h3.5"/>',
  more: '<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[name]}</svg>`;

function renderAppShell() {
  if (NO_TABS.has(page) || $(".tabbar")) return;
  const current = page === "index.html" ? "home" : page === "shop.html" || page === "product.html" ? "shop" : page === "finder.html" ? "find" : page === "contact.html" ? "contact" : MORE_PAGES.has(page) ? "more" : "";
  const tab = (key, href, label, extra = "") =>
    `<a class="tab${extra}" href="${href}"${current === key ? ' aria-current="page"' : ""}>${svg(key)}<span>${label}</span></a>`;
  const bar = document.createElement("nav");
  bar.className = "tabbar";
  bar.setAttribute("aria-label", "App");
  bar.innerHTML = `
    ${tab("home", "index.html", "Home")}
    ${tab("shop", "shop.html", "Programmes")}
    ${tab("find", "finder.html", "Choose", " tab-main")}
    ${tab("contact", "contact.html", "Contact")}
    <button class="tab" type="button" data-more aria-haspopup="dialog"${current === "more" ? ' aria-current="page"' : ""}>${svg("more")}<span>More</span></button>`;
  document.body.append(bar);
  document.body.classList.add("has-tabbar");

  const sheet = document.createElement("dialog");
  sheet.className = "sheet";
  sheet.setAttribute("aria-labelledby", "sheet-title");
  const v = getVisitor();
  sheet.innerHTML = `
    <div class="sheet-head"><h2 id="sheet-title">More</h2><button class="sheet-close" type="button" data-close-sheet aria-label="Close">×</button></div>
    <div class="sheet-body">
      <h3>Programmes</h3>
      <ul>
        <li><a href="shop.html?type=walk">Walks and experiences</a></li>
        <li><a href="shop.html?type=live">Courses and lectures</a></li>
        <li><a href="shop.html?type=counselling">Counselling</a></li>
        <li><a href="shop.html?type=recording">Recordings</a></li>
        <li><a href="shop.html?type=physical">Books and prints</a></li>
      </ul>
      <h3>Talaash Heritage</h3>
      <ul>
        <li><a href="about.html">About</a></li>
        <li><a href="about.html#questions">Common questions</a></li>
        <li><a href="cart.html">Cart</a></li>
        <li><a href="sell.html">Sell with us</a></li>
        <li><a href="seller.html">Partner sign-in</a></li>
      </ul>
      <h3>Policies</h3>
      <ul>
        <li><a href="shipping-returns.html">Shipping, cancellations and refunds</a></li>
        <li><a href="privacy.html">Privacy notice</a></li>
        <li><a href="terms.html">Terms of sale</a></li>
      </ul>
      <div class="sheet-theme">
        <h3>Display</h3>
        <ul><li><button class="btn-plain" type="button" data-sheet-theme></button></li></ul>
      </div>
      <h3>Your details</h3>
      <ul>
        ${v ? `<li>Registered as ${esc(v.email)}</li><li><button class="btn-plain" type="button" data-sheet-details>Update my details</button></li>` : `<li><button class="btn-plain" type="button" data-sheet-details>Register</button></li>`}
      </ul>
    </div>`;
  document.body.append(sheet);
  const close = () => sheet.close();
  $("[data-more]", bar).addEventListener("click", () => sheet.showModal());
  $("[data-close-sheet]", sheet).addEventListener("click", close);
  // A tap on the dimmed area outside the sheet closes it.
  sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
  // Mirrors the header switch, which is hidden on narrow phones.
  const themeBtn = $("[data-sheet-theme]", sheet);
  const syncTheme = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    themeBtn.textContent = t(dark ? "Switch to light theme" : "Switch to dark theme");
  };
  themeBtn.addEventListener("click", () => {
    $("[data-theme-toggle]")?.click();
    syncTheme();
  });
  syncTheme();
  $("[data-sheet-details]", sheet).addEventListener("click", async () => {
    close();
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
  if (!p || !canBuy(p)) return;
  addToCart(p.id, 1, p.stock ?? undefined);
  toast("Added to cart", { href: "cart.html", label: "View cart" });
});

document.addEventListener("th:cart", updateCartCount);
document.addEventListener("th:visitor", renderFooter);
window.addEventListener("storage", updateCartCount);

startTranslating();
renderHeader();
initThemeToggle();
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-lang-set]");
  if (b && b.dataset.langSet !== lang) setLang(b.dataset.langSet);
});
renderFooter();
renderAppShell();
updateCartCount();
initGate();
