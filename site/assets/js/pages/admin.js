// Owner page. Every action goes through a database function that checks the
// admin passcode first; this page only lays things out.
import { isLive } from "../config.js";
import { rpc } from "../api.js";
import { listingFormHtml, readListingForm } from "../listing-form.js";
import { $, esc, money, typeLabel } from "../ui.js";

const root = $("#admin-root");
const KEY = "th_admin_pass";
const TABS = ["Payments", "Orders", "Partners", "Listings", "Payouts", "People", "Account"];
let pass = "";
let data = null;
let tab = "Payments";
let editing = undefined;
let flash = { text: "", ok: true };

const when = (iso) =>
  iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "";
const items = (o) => (o.items || []).map((i) => `${i.quantity} × ${esc(i.title)}${i.seller ? ` <span class="muted">(${esc(i.seller)})</span>` : ""}`).join("<br>");
const PILL = {
  pending: "is-wait", approved: "is-ok", paid: "is-ok", fulfilled: "is-ok",
  rejected: "is-bad", suspended: "is-bad", cancelled: "is-bad", refunded: "",
};
const pill = (s) => `<span class="pill ${PILL[s] ?? ""}">${esc(s)}</span>`;

function signIn(message = "") {
  root.innerHTML = `
    <div class="dash">
      <h1>Owner sign-in</h1>
      <form class="form panel" style="max-width:26rem" novalidate>
        <div class="field">
          <label for="a-pass">Admin passcode</label>
          <input id="a-pass" name="passcode" type="password" autocomplete="current-password" required>
        </div>
        <p class="form-error" role="alert">${esc(message)}</p>
        <div><button class="btn btn-primary" type="submit">Open admin</button></div>
        <p class="small muted">You set this passcode in the Supabase SQL editor during setup.</p>
      </form>
    </div>`;
  $("form", root).addEventListener("submit", async (e) => {
    e.preventDefault();
    pass = String(new FormData(e.currentTarget).get("passcode") || "");
    try { sessionStorage.setItem(KEY, pass); } catch { /* tab only */ }
    await refresh();
  });
}

function signOut(message) {
  pass = "";
  data = null;
  try { sessionStorage.removeItem(KEY); } catch { /* nothing */ }
  signIn(message);
}

async function refresh() {
  try {
    data = await rpc("admin_dashboard", { p_passcode: pass });
  } catch (e) {
    signOut(e.message);
    return;
  }
  if (!data?.ok) {
    signOut("That passcode is not right.");
    return;
  }
  render();
}

/** Runs an owner action; a null result means the passcode stopped working. */
async function act(fn, okText) {
  try {
    const r = await fn();
    if (r === null) {
      signOut("Sign in again.");
      return;
    }
    flash = { text: okText, ok: true };
  } catch (e) {
    flash = { text: e.message, ok: false };
  }
  await refresh();
}

function render() {
  const pending = data.orders.filter((o) => o.status === "pending");
  const toConfirm = pending.filter((o) => o.payment_reference).length;
  const sellersWaiting = data.sellers.filter((s) => s.status === "pending").length;
  const listingsWaiting = data.products.filter((p) => p.review_status === "pending").length;
  const owed = data.sellers.filter((s) => s.balance_paise > 0).length;
  const badge = { Payments: toConfirm, Partners: sellersWaiting, Listings: listingsWaiting, Payouts: owed, People: data.leads.length };

  root.innerHTML = `
    <div class="dash">
      <div class="dash-head">
        <h1>Talaash Heritage admin</h1>
        <span class="small"><a href="index.html">View the shop</a> · <button class="btn-plain" type="button" data-signout>Sign out</button></span>
      </div>
      <div class="tabs" role="tablist">
        ${TABS.map((t) => `<button class="chip" type="button" role="tab" aria-selected="${t === tab}" data-tab="${t}">${t}${badge[t] ? ` (${badge[t]})` : ""}</button>`).join("")}
      </div>
      <p class="flash ${flash.ok ? "is-ok" : "is-bad"}" role="status">${esc(flash.text)}</p>
      <div data-body></div>
    </div>`;
  flash = { text: "", ok: true };
  $("[data-signout]", root).addEventListener("click", () => signOut(""));
  // Every tab switch reloads, so new orders, applications and listings show up.
  root.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", async () => {
      tab = b.dataset.tab;
      editing = undefined;
      await refresh();
    }),
  );
  const body = $("[data-body]", root);
  ({ Payments, Orders, Partners, Listings, Payouts, People, Account })[tab](body);
}

// ---- tabs -------------------------------------------------------------------
function Payments(body) {
  const rows = data.orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => Number(Boolean(b.payment_reference)) - Number(Boolean(a.payment_reference)));
  body.innerHTML = `
    <h2>Payments to confirm</h2>
    <p class="muted">Find the reference and the amount in your UPI app or bank statement first. Confirming marks the order paid, reduces seats, unlocks the buyer's links and credits any partner.</p>
    ${
      rows.length
        ? `<div class="table-scroll"><table class="dtable">
        <thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Amount</th><th>UPI reference</th><th></th></tr></thead>
        <tbody>${rows
          .map(
            (o) => `<tr>
          <td><strong>${esc(o.order_number)}</strong><br>${when(o.created_at)}</td>
          <td>${esc(o.customer_name)}<br><a href="https://wa.me/${esc(o.customer_phone.replace(/[^0-9]/g, ""))}" target="_blank" rel="noopener">${esc(o.customer_phone)}</a></td>
          <td>${items(o)}</td>
          <td>${money(o.total_paise)}</td>
          <td>${o.payment_reference ? `<strong>${esc(o.payment_reference)}</strong>` : `<span class="muted">Not paid yet (${esc(o.payment_method)})</span>`}</td>
          <td><div class="row-actions">
            <button class="btn btn-primary btn-small" type="button" data-confirm="${esc(o.id)}" data-num="${esc(o.order_number)}">Confirm payment</button>
            <button class="btn btn-danger btn-small" type="button" data-cancel="${esc(o.id)}" data-num="${esc(o.order_number)}">Cancel</button>
          </div></td></tr>`,
          )
          .join("")}</tbody></table></div>`
        : `<p>Nothing waiting. New orders appear here.</p>`
    }`;
  body.querySelectorAll("[data-confirm]").forEach((b) =>
    b.addEventListener("click", () => act(() => rpc("admin_confirm_payment", { p_passcode: pass, p_order_id: b.dataset.confirm }), `${b.dataset.num} marked paid.`)),
  );
  body.querySelectorAll("[data-cancel]").forEach((b) =>
    b.addEventListener("click", () => {
      if (confirm(`Cancel order ${b.dataset.num}?`))
        act(() => rpc("admin_set_order_status", { p_passcode: pass, p_order_id: b.dataset.cancel, p_status: "cancelled", p_tracking: null }), `${b.dataset.num} cancelled.`);
    }),
  );
}

function Orders(body) {
  const rows = data.orders.filter((o) => o.status !== "pending");
  const revenue = rows.filter((o) => o.status === "paid" || o.status === "fulfilled").reduce((n, o) => n + o.total_paise, 0);
  body.innerHTML = `
    <h2>Orders</h2>
    <p class="muted">${rows.length} orders. ${money(revenue)} received.</p>
    <div class="table-scroll"><table class="dtable">
      <thead><tr><th>Order</th><th>Status</th><th>Buyer</th><th>Items</th><th>Amount</th><th>Deliver to</th><th></th></tr></thead>
      <tbody>${rows
        .map((o) => {
          const a = o.shipping_address;
          return `<tr>
          <td><strong>${esc(o.order_number)}</strong><br>${when(o.created_at)}</td>
          <td>${pill(o.status)}</td>
          <td>${esc(o.customer_name)}<br>${esc(o.customer_phone)}<br>${esc(o.customer_email)}</td>
          <td>${items(o)}</td>
          <td>${money(o.total_paise)}${o.payment_reference ? `<br><span class="muted">ref ${esc(o.payment_reference)}</span>` : ""}</td>
          <td>${a ? esc([a.line1, a.line2, a.city, a.state, a.postal_code].filter(Boolean).join(", ")) : "—"}${o.tracking_number ? `<br>Tracking ${esc(o.tracking_number)}` : ""}</td>
          <td><div class="row-actions">
            ${o.status === "paid" ? `<button class="btn btn-outline btn-small" type="button" data-done="${esc(o.id)}" data-ship="${a ? 1 : ""}" data-num="${esc(o.order_number)}">${a ? "Mark shipped" : "Mark completed"}</button>` : ""}
            ${o.status === "paid" || o.status === "fulfilled" ? `<button class="btn btn-danger btn-small" type="button" data-refund="${esc(o.id)}" data-num="${esc(o.order_number)}">Mark refunded</button>` : ""}
            ${o.status === "cancelled" || o.status === "refunded" ? `<button class="btn-plain small" type="button" data-delete="${esc(o.id)}" data-num="${esc(o.order_number)}">Delete</button>` : ""}
          </div></td></tr>`;
        })
        .join("")}</tbody></table></div>`;
  body.querySelectorAll("[data-done]").forEach((b) =>
    b.addEventListener("click", () => {
      const tracking = b.dataset.ship ? prompt("Tracking number (optional)") : null;
      act(() => rpc("admin_set_order_status", { p_passcode: pass, p_order_id: b.dataset.done, p_status: "fulfilled", p_tracking: tracking }), `${b.dataset.num} marked completed.`);
    }),
  );
  body.querySelectorAll("[data-refund]").forEach((b) =>
    b.addEventListener("click", () => {
      if (confirm(`Mark ${b.dataset.num} refunded? Send the money back yourself first; this updates the record, returns the seats and removes any partner earnings.`))
        act(() => rpc("admin_set_order_status", { p_passcode: pass, p_order_id: b.dataset.refund, p_status: "refunded", p_tracking: null }), `${b.dataset.num} marked refunded.`);
    }),
  );
  body.querySelectorAll("[data-delete]").forEach((b) =>
    b.addEventListener("click", () => {
      if (confirm(`Delete ${b.dataset.num} from your records for good?`))
        act(() => rpc("admin_delete_order", { p_passcode: pass, p_order_id: b.dataset.delete }), `${b.dataset.num} deleted.`);
    }),
  );
}

function Partners(body) {
  body.innerHTML = `
    <h2>Partners</h2>
    <p class="muted">Applications come from the <a href="sell.html">Sell with us</a> page. Approving lets them add listings; each listing still needs your review. Commission applies to bookings made after you change it.</p>
    ${
      data.sellers.length
        ? data.sellers
            .map(
              (s) => `
        <form class="panel form" data-seller="${esc(s.id)}">
          <div class="dash-head"><h2 style="margin:0">${esc(s.name)} ${pill(s.status)}</h2><span class="small muted">Applied ${when(s.created_at)}</span></div>
          <p>${esc(s.city)} · ${esc(s.email)} · <a href="https://wa.me/${esc(s.phone.replace(/[^0-9]/g, ""))}" target="_blank" rel="noopener">${esc(s.phone)}</a> · Payouts to <strong>${esc(s.payout_upi)}</strong></p>
          <p><strong>Wants to offer:</strong> ${esc(s.offering)}</p>
          ${s.bio ? `<p><strong>About:</strong> ${esc(s.bio)}</p>` : ""}
          <p class="small">${s.listings} listings · ${money(s.gross_paise)} paid bookings · ${money(s.earned_paise)} earned · ${money(s.paid_out_paise)} paid out · <strong>${money(s.balance_paise)} owed</strong></p>
          <div class="form-row">
            <div class="field"><label>Status</label>
              <select name="status">${["pending", "approved", "rejected", "suspended"].map((x) => `<option ${x === s.status ? "selected" : ""}>${x}</option>`).join("")}</select></div>
            <div class="field"><label>Commission %</label><input name="commission" type="number" min="0" max="90" step="0.5" value="${Number(s.commission_pct)}"></div>
            <div class="field"><label>Note to partner <span class="hint">they see this</span></label><input name="note" type="text" maxlength="500" value="${esc(s.owner_note || "")}"></div>
          </div>
          <div class="row-actions"><button class="btn btn-primary btn-small" type="submit">Save</button></div>
        </form>`,
            )
            .join("")
        : `<p>No applications yet. Share the <a href="sell.html">Sell with us</a> page.</p>`
    }`;
  body.querySelectorAll("[data-seller]").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      act(
        () => rpc("admin_update_seller", { p_passcode: pass, p_seller_id: f.dataset.seller, p_status: d.status, p_commission_pct: Number(d.commission), p_note: d.note }),
        "Partner saved.",
      );
    }),
  );
}

function Listings(body) {
  if (editing !== undefined) {
    body.innerHTML = listingFormHtml(editing, { admin: true, sellers: data.sellers });
    const f = $("[data-listing-form]", body);
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
        const id = await rpc("admin_save_product", { p_passcode: pass, p_id: editing?.id ?? null, p: listing });
        if (id === null) return signOut("Sign in again.");
        editing = undefined;
        flash = { text: "Listing saved.", ok: true };
        await refresh();
      } catch (ex) {
        err.textContent = ex.message;
      }
    });
    return;
  }
  body.innerHTML = `
    <div class="dash-head"><h2>Listings</h2><button class="btn btn-primary btn-small" type="button" data-new>Add a listing</button></div>
    <p class="muted">Partner listings waiting for review are at the top. Your own edits go live straight away.</p>
    <div class="table-scroll"><table class="dtable">
      <thead><tr><th>Title</th><th>Run by</th><th>Kind</th><th>When</th><th>Price</th><th>Seats</th><th>Status</th><th></th></tr></thead>
      <tbody>${data.products
        .map(
          (p) => `<tr>
        <td>${esc(p.title)}</td>
        <td>${esc(p.seller_name || "Talaash Heritage")}</td>
        <td>${esc(typeLabel(p.type))}</td>
        <td>${p.starts_at ? when(p.starts_at) : "—"}</td>
        <td>${money(p.price_paise)}</td>
        <td>${p.stock ?? "Unlimited"}</td>
        <td>${pill(p.review_status)}${p.is_active ? "" : ` <span class="pill">paused</span>`}</td>
        <td><div class="row-actions">
          ${p.review_status === "pending" ? `<button class="btn btn-primary btn-small" type="button" data-approve="${esc(p.id)}">Approve</button><button class="btn btn-danger btn-small" type="button" data-reject="${esc(p.id)}">Reject</button>` : ""}
          <button class="btn btn-outline btn-small" type="button" data-edit="${esc(p.id)}">Edit</button>
        </div></td></tr>`,
        )
        .join("")}</tbody></table></div>`;
  $("[data-new]", body).addEventListener("click", () => {
    editing = null;
    render();
  });
  body.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => {
      editing = data.products.find((p) => p.id === b.dataset.edit);
      render();
    }),
  );
  body.querySelectorAll("[data-approve]").forEach((b) =>
    b.addEventListener("click", () => act(() => rpc("admin_review_product", { p_passcode: pass, p_id: b.dataset.approve, p_decision: "approved", p_note: null }), "Listing approved and live.")),
  );
  body.querySelectorAll("[data-reject]").forEach((b) =>
    b.addEventListener("click", () => {
      const note = prompt("What should the partner change? They will see this note.");
      if (note !== null) act(() => rpc("admin_review_product", { p_passcode: pass, p_id: b.dataset.reject, p_decision: "rejected", p_note: note }), "Listing sent back to the partner.");
    }),
  );
}

function Payouts(body) {
  const owed = data.sellers.filter((s) => s.balance_paise > 0);
  body.innerHTML = `
    <h2>Owed to partners</h2>
    <p class="muted">Pay by UPI from your own app, then record it here with the UPI reference. Refunds after a payout show as a negative balance, which comes off the next payout.</p>
    ${
      owed.length
        ? `<div class="table-scroll"><table class="dtable"><thead><tr><th>Partner</th><th>Pay to</th><th>Owed</th><th></th></tr></thead>
        <tbody>${owed
          .map(
            (s) => `<tr><td>${esc(s.name)}</td><td><strong>${esc(s.payout_upi)}</strong></td><td>${money(s.balance_paise)}</td>
          <td><button class="btn btn-primary btn-small" type="button" data-pay="${esc(s.id)}" data-owed="${s.balance_paise}" data-name="${esc(s.name)}">Record payout</button></td></tr>`,
          )
          .join("")}</tbody></table></div>`
        : `<p>Nothing owed right now.</p>`
    }
    <h2 style="margin-top:2rem">Payout history</h2>
    ${
      data.payouts.length
        ? `<div class="table-scroll"><table class="dtable"><thead><tr><th>Date</th><th>Partner</th><th>Amount</th><th>Reference</th><th>Note</th></tr></thead>
        <tbody>${data.payouts.map((p) => `<tr><td>${when(p.paid_at)}</td><td>${esc(p.seller)}</td><td>${money(p.amount_paise)}</td><td>${esc(p.reference || "")}</td><td>${esc(p.note || "")}</td></tr>`).join("")}</tbody></table></div>`
        : `<p>No payouts recorded yet.</p>`
    }`;
  body.querySelectorAll("[data-pay]").forEach((b) =>
    b.addEventListener("click", () => {
      const amount = prompt(`Amount paid to ${b.dataset.name}, in rupees`, String(Number(b.dataset.owed) / 100));
      if (amount === null) return;
      const paise = Math.round(Number(amount) * 100);
      if (!(paise > 0)) {
        flash = { text: "Enter the amount you paid.", ok: false };
        return render();
      }
      const reference = prompt("UPI reference of the payment (optional)") ?? "";
      act(() => rpc("admin_record_payout", { p_passcode: pass, p_seller_id: b.dataset.pay, p_amount_paise: paise, p_reference: reference, p_note: null }), "Payout recorded.");
    }),
  );
}

function People(body) {
  const leads = data.leads;
  const opted = leads.filter((l) => l.marketing_opt_in).length;
  body.innerHTML = `
    <h2>Registered visitors</h2>
    <p class="muted">${leads.length} people registered. ${opted} agreed to announcements; message only those about new sessions.</p>
    <p><button class="btn btn-outline btn-small" type="button" data-csv ${leads.length ? "" : "disabled"}>Download as spreadsheet (CSV)</button></p>
    <div class="table-scroll"><table class="dtable">
      <thead><tr><th>Registered</th><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Announcements</th><th>Came from</th><th></th></tr></thead>
      <tbody>${leads
        .slice(0, 500)
        .map(
          (l) => `<tr><td>${when(l.created_at)}</td><td>${esc(l.full_name)}</td><td>${esc(l.email)}</td><td>${esc(l.phone)}</td>
        <td>${esc([l.city, l.region, l.country].filter(Boolean).join(", "))}</td><td>${l.marketing_opt_in ? "Yes" : "No"}</td>
        <td>${esc(l.utm?.utm_source || l.referrer || "Direct")}</td>
        <td><button class="btn-plain small" type="button" data-del="${esc(l.id)}" data-email="${esc(l.email)}">Delete</button></td></tr>`,
        )
        .join("")}</tbody></table></div>`;
  $("[data-csv]", body).addEventListener("click", () => {
    const cols = ["Registered", "Name", "Email", "Phone", "City", "State", "Country", "PIN", "Latitude", "Longitude", "Announcements", "Visits", "Source", "Campaign", "Referrer", "Landing page"];
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = leads.map((l) =>
      [l.created_at, l.full_name, l.email, l.phone, l.city, l.region, l.country, l.postal_code, l.latitude, l.longitude, l.marketing_opt_in ? "yes" : "no", l.visit_count, l.utm?.utm_source, l.utm?.utm_campaign, l.referrer, l.first_landing]
        .map(cell)
        .join(","),
    );
    const blob = new Blob([`\ufeff${cols.join(",")}\n${rows.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `talaash-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  body.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      if (confirm(`Delete the registration for ${b.dataset.email}? Use this when someone asks for their details to be removed.`))
        act(() => rpc("admin_delete_lead", { p_passcode: pass, p_lead_id: b.dataset.del }), `${b.dataset.email} deleted.`);
    }),
  );
}

function Account(body) {
  body.innerHTML = `
    <form class="form panel" style="max-width:28rem" novalidate>
      <h2>Change the admin passcode</h2>
      <div class="field"><label for="n-pass">New passcode <span class="hint">12 characters or more, no spaces</span></label>
        <input id="n-pass" name="next" type="password" autocomplete="new-password" minlength="12" required></div>
      <div><button class="btn btn-outline" type="submit">Change passcode</button></div>
    </form>
    <div class="panel">
      <h2>Other settings</h2>
      <p>UPI ID, WhatsApp number, contact details, the registration rule and the sample-listings bar are in <code>site/assets/js/config.js</code> in your GitHub repository. Edit that file on github.com and the site updates within a minute or two.</p>
    </div>`;
  $("form", body).addEventListener("submit", async (e) => {
    e.preventDefault();
    const next = String(new FormData(e.currentTarget).get("next") || "");
    try {
      const r = await rpc("admin_change_passcode", { p_passcode: pass, p_new: next });
      if (r === null) return signOut("Sign in again.");
      pass = next;
      try { sessionStorage.setItem(KEY, pass); } catch { /* tab only */ }
      flash = { text: "Passcode changed.", ok: true };
    } catch (ex) {
      flash = { text: ex.message.includes("12 characters") ? "Use at least 12 characters with no spaces." : ex.message, ok: false };
    }
    await refresh();
  });
}

if (!isLive()) {
  root.innerHTML = `<div class="dash"><h1>Owner admin</h1><p class="note">The admin page works once the shop is connected to its database. See docs/SETUP.md.</p></div>`;
} else {
  try { pass = sessionStorage.getItem(KEY) || ""; } catch { pass = ""; }
  if (pass) refresh();
  else signIn();
}
