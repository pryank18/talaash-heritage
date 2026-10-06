import { getProducts } from "../api.js";
import { $, esc, formatWhen, formatDuration, money, productCard, stockFlag, typeLabel } from "../ui.js";

const SESSION_TYPES = ["live", "course", "walk", "experience", "counselling", "recording"];

function featureCard(p) {
  const flag = stockFlag(p);
  const href = `product.html?slug=${encodeURIComponent(p.slug)}`;
  const meta = [
    p.starts_at ? formatWhen(p.starts_at) : null,
    [formatDuration(p.duration_minutes), p.venue].filter(Boolean).join(", ") || null,
    flag ? flag.text : null,
  ].filter(Boolean);
  return `
    <p class="feature-kicker">${p.starts_at ? `Next ${esc(typeLabel(p.type).toLowerCase())}` : "Featured"}</p>
    <h2><a href="${href}">${esc(p.title)}</a></h2>
    <ul class="feature-meta">${meta.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
    <div class="feature-foot">
      <span class="price">${money(p.price_paise)}</span>
      <a class="btn btn-primary" href="${href}">View details</a>
    </div>`;
}

async function render() {
  const feature = $("#feature");
  const sessions = $("#home-sessions");
  const goods = $("#home-goods");
  try {
    const products = await getProducts();
    const now = Date.now();
    const upcoming = products
      .filter((p) => p.starts_at && new Date(p.starts_at).getTime() > now && !stockFlag(p)?.soldOut)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    const pick = upcoming[0] || products.find((p) => p.is_featured) || products[0];
    if (pick) feature.innerHTML = featureCard(pick);
    else feature.hidden = true;

    const sessionList = products.filter((p) => SESSION_TYPES.includes(p.type) && p.id !== pick?.id).slice(0, 6);
    sessions.innerHTML = sessionList.length ? sessionList.map(productCard).join("") : `<p class="muted">New sessions are being scheduled. Check back soon.</p>`;

    const goodsList = products.filter((p) => p.type === "physical").slice(0, 4);
    if (goodsList.length) goods.innerHTML = goodsList.map(productCard).join("");
    else $("#home-goods-section").hidden = true;
  } catch (e) {
    feature.hidden = true;
    sessions.innerHTML = `<p class="form-error">${esc(e.message)}</p>`;
    goods.innerHTML = "";
  }
}

render();
