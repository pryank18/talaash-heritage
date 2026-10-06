// Partner page: sign in, see status, add and edit listings, see paid bookings
// with buyer contacts, earnings and payouts.
import { isLive } from "../config.js";
import { rpc } from "../api.js";
import { listingFormHtml, readListingForm } from "../listing-form.js";
import { $, esc, money, typeLabel } from "../ui.js";

const root = $("#seller-root");
const KEY = "th_partner_session";
let creds = null;
let data = null;
let editing = undefined; // undefined = list view, null = new listing, object = editing
let flash = { text: "", ok: true };

function load() {
  try {
    creds = JSON.parse(sessionStorage.getItem(KEY)) || null;
  } catch {
    creds = null;
  }
}
function save(c) {
  creds = c;
  try {
    if (c) sessionStorage.setItem(KEY, JSON.stringify(c));
    else sessionStorage.removeItem(KEY);
  } catch { /* tab only */ }
}

const when = (iso) =>
  iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "";
const REVIEW = { pending: ["Waiting for review", "is-wait"], approved: ["Live", "is-ok"], rejected: ["Not approved", "is-bad"] };

function signIn(message = "") {
  root.innerHTML = `
    <div class="dash">
      <h1>Partner sign-in</h1>
      <p class="muted">For guides, scholars and makers who sell through Talaash Heritage. Not a partner yet? <a href="sell.html">Apply to sell</a>.</p>
      <form class="form panel" style="max-width:28rem" novalidate>
        <div class="field">
          <label for="p-email">Email</label>
          <input id="p-email" name="email" type="email" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="p-password">Password</label>
          <input id="p-password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <p class="form-error" role="alert">${esc(message)}</p>
        <div><button class="btn btn-primary" type="submit">Sign in</button></div>
        <p class="small muted">Forgot your password? Write to us from your registered email and we will reset it.</p>
      </form>
    </div>`;
  $("form", root).addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    save({ email: d.email.trim().toLowerCase(), password: d.password });
    await refresh();
  });
}

async function refresh() {
  try {
    data = await rpc("seller_dashboard", { p_email: creds.email, p_password: creds.password });
  } catch (e) {
    save(null);
    signIn(e.message);
    return;
  }
  if (!data?.ok) {
    save(null);
    signIn("That email and password do not match.");
    return;
  }
  render();
}

function header(extra = "") {
  return `
    <div class="dash-head">
      <h1>${esc(data.name)}</h1>
      <span class="small">${extra}<button class="btn-plain" type="button" data-signout>Sign out</button></span>
    </div>`;
}

function render() {
  if (data.status !== "approved") {
    const msg = {
      pending: "Your application is with us. We reply within two working days; once approved you can add listings here.",
      rejected: "We are not able to take your application forward at the moment.",
      suspended: "Your partner account is paused, and your listings are hidden from the shop. Write to us to discuss.",
    }[data.status];
    root.innerHTML = `<div class="dash">${header()}<p class="panel">${esc(msg)}${data.note ? `<br><br><strong>Note from us:</strong> ${esc(data.note)}` : ""}</p></div>`;
    wire();
    return;
  }

  if (editing !== undefined) {
    root.innerHTML = `<div class="dash">${header()}${listingFormHtml(editing)}</div>`;
    wire();
    const f = $("[data-listing-form]", root);
    $("[data-cancel]", f).addEventListener("click", () => {
      editing = undefined;
      render();
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("[data-form-error]", f);
      const { listing, problems } = readListingForm(f);
      if (problems.length) {
        err.textContent = `Enter ${problems.join(" and ")}.`;
        return;
      }
      try {
        const id = await rpc("seller_save_product", { p_email: creds.email, p_password: creds.password, p_id: editing?.id ?? null, p: listing });
        if (id === null) {
          save(null);
          signIn("Your session ended. Sign in again.");
          return;
        }
        editing = undefined;
        flash = { text: "Sent for review. It goes live once we approve it.", ok: true };
        await refresh();
      } catch (ex) {
        err.textContent = ex.message;
      }
    });
    return;
  }

  const b = data.balance;
  root.innerHTML = `
    <div class="dash">
      ${header()}
      <p class="muted">Commission: ${esc(String(Number(data.commission_pct)))}% of each paid booking. Earnings are paid to ${esc(data.payout_upi)}.</p>
      <p class="flash ${flash.ok ? "is-ok" : "is-bad"}" role="status">${esc(flash.text)}</p>
      <div class="stats">
        <div class="stat"><strong>${money(b.gross_paise)}</strong><span>Paid bookings</span></div>
        <div class="stat"><strong>${money(b.earned_paise)}</strong><span>Your share after commission</span></div>
        <div class="stat"><strong>${money(b.paid_out_paise)}</strong><span>Paid out to you</span></div>
        <div class="stat"><strong>${money(b.balance_paise)}</strong><span>Owed to you now</span></div>
      </div>

      <div class="dash-head"><h2>Your listings</h2><button class="btn btn-primary btn-small" type="button" data-new>Add a listing</button></div>
      ${
        data.products.length
          ? `<div class="table-scroll"><table class="dtable">
          <thead><tr><th>Listing</th><th>Kind</th><th>Price</th><th>Seats left</th><th>Status</th><th></th></tr></thead>
          <tbody>${data.products
            .map((p) => {
              const [label, cls] = REVIEW[p.review_status] || [p.review_status, ""];
              return `<tr>
                <td>${esc(p.title)}${p.review_note ? `<br><span class="small muted">Note: ${esc(p.review_note)}</span>` : ""}</td>
                <td>${esc(typeLabel(p.type))}</td>
                <td>${money(p.price_paise)}</td>
                <td>${p.stock ?? "Unlimited"}</td>
                <td><span class="pill ${cls}">${label}</span>${p.is_active ? "" : ` <span class="pill">Paused</span>`}</td>
                <td><div class="row-actions">
                  <button class="btn btn-outline btn-small" type="button" data-edit="${esc(p.id)}">Edit</button>
                  <button class="btn btn-outline btn-small" type="button" data-toggle="${esc(p.id)}" data-active="${p.is_active}">${p.is_active ? "Pause" : "Resume"}</button>
                  ${p.review_status === "approved" && p.is_active ? `<a class="btn-plain small" href="product.html?slug=${encodeURIComponent(p.slug)}">View</a>` : ""}
                </div></td>
              </tr>`;
            })
            .join("")}</tbody></table></div>`
          : `<p>No listings yet. Add your first one; we review it within a day.</p>`
      }

      <h2 style="margin-top:2rem">Bookings</h2>
      <p class="small muted">${data.pending_bookings ? `${data.pending_bookings} more ${data.pending_bookings === 1 ? "booking is" : "bookings are"} waiting for the buyer's payment. ` : ""}Buyer details appear here once their payment is confirmed. Use them only to run the booking.</p>
      ${
        data.bookings.length
          ? `<div class="table-scroll"><table class="dtable">
          <thead><tr><th>Paid</th><th>Order</th><th>Listing</th><th>Qty</th><th>Buyer</th><th>Your share</th></tr></thead>
          <tbody>${data.bookings
            .map(
              (o) => `<tr>
              <td>${when(o.paid_at)}</td>
              <td>${esc(o.order_number)}${o.status === "refunded" ? ` <span class="pill is-bad">Refunded</span>` : ""}</td>
              <td>${esc(o.title)}</td>
              <td>${o.quantity}</td>
              <td>${esc(o.customer_name)}<br><a href="https://wa.me/${esc(o.customer_phone.replace(/[^0-9]/g, ""))}" target="_blank" rel="noopener">${esc(o.customer_phone)}</a><br>${esc(o.customer_email)}${
                o.shipping_address
                  ? `<br><span class="small">${esc([o.shipping_address.line1, o.shipping_address.line2, o.shipping_address.city, o.shipping_address.state, o.shipping_address.postal_code].filter(Boolean).join(", "))}</span>`
                  : ""
              }</td>
              <td>${o.status === "refunded" ? "—" : money(o.seller_payout_paise)}</td>
            </tr>`,
            )
            .join("")}</tbody></table></div>`
          : `<p>No paid bookings yet.</p>`
      }

      <h2 style="margin-top:2rem">Payouts</h2>
      ${
        data.payouts.length
          ? `<div class="table-scroll"><table class="dtable"><thead><tr><th>Date</th><th>Amount</th><th>Reference</th><th>Note</th></tr></thead>
          <tbody>${data.payouts.map((p) => `<tr><td>${when(p.paid_at)}</td><td>${money(p.amount_paise)}</td><td>${esc(p.reference || "")}</td><td>${esc(p.note || "")}</td></tr>`).join("")}</tbody></table></div>`
          : `<p>No payouts yet. We pay what is owed every Monday by UPI.</p>`
      }
    </div>`;
  flash = { text: "", ok: true };
  wire();

  $("[data-new]", root)?.addEventListener("click", () => {
    editing = null;
    render();
  });
  root.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => {
      editing = data.products.find((p) => p.id === btn.dataset.edit);
      render();
    }),
  );
  root.querySelectorAll("[data-toggle]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const active = btn.dataset.active === "true";
      try {
        await rpc("seller_set_active", { p_email: creds.email, p_password: creds.password, p_id: btn.dataset.toggle, p_active: !active });
        flash = { text: active ? "Listing paused." : "Listing back on sale.", ok: true };
      } catch (e) {
        flash = { text: e.message, ok: false };
      }
      await refresh();
    }),
  );
}

function wire() {
  $("[data-signout]", root)?.addEventListener("click", () => {
    save(null);
    data = null;
    editing = undefined;
    signIn();
  });
}

if (!isLive()) {
  root.innerHTML = `<div class="dash"><h1>Partner sign-in</h1><p class="note">Partner accounts work once the shop is connected to its database.</p></div>`;
} else {
  load();
  if (creds) refresh();
  else signIn();
}
