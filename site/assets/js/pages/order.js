import { CONFIG, isLive } from "../config.js";
import { getOrder, submitPaymentReference } from "../api.js";
import { $, esc, money, toast } from "../ui.js";

const root = $("#order-root");
const params = new URLSearchParams(location.search);
let id = params.get("id");
let token = params.get("t");

// Opening order.html with no link shows the most recent order from this browser.
if (!id || !token) {
  try {
    const last = JSON.parse(localStorage.getItem("th_last_order"));
    if (last) ({ id, t: token } = last);
  } catch { /* none saved */ }
}

const STATUS = {
  pending: { label: "Awaiting payment", cls: "is-pending" },
  paid: { label: "Paid", cls: "is-paid" },
  fulfilled: { label: "Completed", cls: "is-paid" },
  cancelled: { label: "Cancelled", cls: "is-bad" },
  refunded: { label: "Refunded", cls: "" },
  failed: { label: "Payment failed", cls: "is-bad" },
};

const upiId = () => CONFIG.upiId || (isLive() ? "" : "demo@upi");

function upiLink(o) {
  const q = new URLSearchParams({
    pa: upiId(),
    pn: CONFIG.upiName || CONFIG.brand,
    am: (o.total_paise / 100).toFixed(2),
    cu: "INR",
    tn: o.order_number,
  });
  // UPI apps expect spaces as %20 and a plain @ in the payee address.
  return `upi://pay?${q.toString().replace(/\+/g, "%20").replace(/%40/g, "@")}`;
}

function headline(o) {
  if (o.status === "paid" || o.status === "fulfilled") return `Thank you, ${o.customer_name.split(" ")[0]}. Your order is confirmed.`;
  if (o.status === "pending" && o.payment_method === "upi") {
    return o.reference_submitted ? "Thank you. We are checking your payment." : `Order saved. Pay ${money(o.total_paise)} by UPI to confirm it.`;
  }
  if (o.status === "pending" && o.payment_method === "whatsapp") return "Order received. Finish it on WhatsApp.";
  if (o.status === "pending") return "We are confirming your payment.";
  if (o.status === "failed") return "This payment did not go through.";
  return `Order ${o.order_number}`;
}

function upiPanel(o) {
  if (o.reference_submitted) {
    return `<p>We have your payment reference. We check each UPI payment by hand and confirm within a few hours, sooner during the day. This page changes to Paid when we do, and your links appear here, so bookmark it.</p>
            <p class="upi-open">
              <button class="btn btn-outline btn-small" type="button" data-refresh>Check again</button>
              <a href="https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello ${CONFIG.brand}, I have paid for order ${o.order_number} by UPI.`)}" target="_blank" rel="noopener">In a hurry? Tell us on WhatsApp</a>
            </p>`;
  }
  if (!upiId()) {
    const text = encodeURIComponent(`Hello ${CONFIG.brand}, I would like to pay for order ${o.order_number}.`);
    return `<p>Message us on WhatsApp and we will send you the payment details for this order.</p>
            <p><a class="btn btn-primary" href="https://wa.me/${CONFIG.whatsappNumber}?text=${text}" target="_blank" rel="noopener">Message us on WhatsApp</a></p>`;
  }
  return `
    <div class="upi">
      <ol class="upi-steps">
        <li>
          <strong>Pay ${money(o.total_paise)} to this UPI ID</strong>
          <div class="upi-id"><code data-upi-id>${esc(upiId())}</code><button class="btn btn-outline btn-small" type="button" data-copy>Copy UPI ID</button></div>
          <p class="upi-open"><a class="btn btn-primary" href="${esc(upiLink(o))}">Open my UPI app</a> <span class="small muted">On a phone this fills in the amount for you.</span></p>
          <p class="small muted">Paying from another device? Scan the code. If your app asks for a note, type <strong>${esc(o.order_number)}</strong>.</p>
        </li>
        <li>
          <strong>Tell us the UPI reference</strong>
          <p class="small muted">It is the 12-digit number on your payment receipt, sometimes called UTR or UPI transaction ID.</p>
          <form class="upi-ref" data-ref-form novalidate>
            <label class="visually-hidden" for="upi-ref">UPI reference number</label>
            <input id="upi-ref" name="reference" type="text" inputmode="numeric" autocomplete="off" maxlength="35" placeholder="12-digit reference" required>
            <button class="btn btn-primary" type="submit">Submit payment reference</button>
          </form>
          <p class="form-error" role="alert" data-ref-error></p>
        </li>
      </ol>
      <div class="upi-qr" data-qr aria-label="UPI payment QR code"></div>
    </div>`;
}

function nextStep(o) {
  if (o.status === "pending" && o.payment_method === "upi") return upiPanel(o);
  if (o.status === "pending" && o.payment_method === "whatsapp") {
    const text = encodeURIComponent(`Hello ${CONFIG.brand}, I would like to pay for order ${o.order_number}.`);
    return `<p>We have saved your order. Send us a WhatsApp message and we will reply with a payment link. Your seats and items are confirmed once you pay.</p>
            <p><a class="btn btn-primary" href="https://wa.me/${CONFIG.whatsappNumber}?text=${text}" target="_blank" rel="noopener">Message us on WhatsApp</a></p>`;
  }
  if (o.status === "pending") return `<p>This usually takes a few seconds. The page refreshes by itself. If money left your account and this still says awaiting payment after ten minutes, write to <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a> with your order number.</p>`;
  if (o.status === "failed") return `<p>Nothing was charged. <a href="cart.html">Go back to your cart</a> to try again.</p>`;
  if (o.status === "paid" && o.has_shipping) return `<p>We pack and ship within 3 to 5 working days and email your tracking number.</p>`;
  return "";
}

function view(o) {
  const s = STATUS[o.status] || { label: o.status, cls: "" };
  const access = o.items.filter((i) => i.access_url || i.access_notes);
  document.title = `Order ${o.order_number} | Talaash Heritage`;
  root.innerHTML = `
    <div class="doc">
      ${o.demo ? `<p class="note">Demo order. Nothing was charged and nothing was saved outside this browser.</p>` : ""}
      <h1>${esc(headline(o))}</h1>
      <p>Order <strong>${esc(o.order_number)}</strong> <span class="status ${s.cls}">${esc(s.label)}</span></p>
      ${nextStep(o)}
      ${o.tracking_number ? `<p>Tracking number: <strong>${esc(o.tracking_number)}</strong></p>` : ""}
      ${
        access.length
          ? `<h2>Your links</h2>${access
              .map(
                (i) => `<div class="access"><p><strong>${esc(i.title)}</strong></p>
                  ${i.access_url ? `<p><a href="${esc(i.access_url)}" target="_blank" rel="noopener">Open the link</a></p>` : ""}
                  ${i.access_notes ? `<p class="muted">${esc(i.access_notes)}</p>` : ""}</div>`,
              )
              .join("")}<p class="small muted">Bookmark this page. It is the only place these links are shown.</p>`
          : ""
      }
      <h2>What you ordered</h2>
      <div class="table-scroll"><table>
        <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
        <tbody>
          ${o.items.map((i) => `<tr><td>${esc(i.title)}</td><td>${i.quantity}</td><td>${money(i.line_total_paise)}</td></tr>`).join("")}
          ${o.shipping_paise ? `<tr><td colspan="2">Delivery</td><td>${money(o.shipping_paise)}</td></tr>` : ""}
          <tr><th colspan="2">Total</th><th>${money(o.total_paise)}</th></tr>
        </tbody>
      </table></div>
      <p><a href="shop.html">Back to the shop</a></p>
    </div>`;
  wire(o);
}

/** Buttons and the QR code on the UPI panel. */
async function wire(o) {
  $("[data-refresh]", root)?.addEventListener("click", load);

  $("[data-copy]", root)?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(upiId());
      toast("UPI ID copied");
    } catch {
      const range = document.createRange();
      range.selectNodeContents($("[data-upi-id]", root));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      toast("Press copy to copy the selected UPI ID");
    }
  });

  const form = $("[data-ref-form]", root);
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("[data-ref-error]", root);
    const btn = $("button", form);
    err.textContent = "";
    btn.disabled = true;
    try {
      await submitPaymentReference(id, token, form.elements.reference.value);
      toast("Payment reference submitted");
      load();
    } catch (ex) {
      err.textContent = ex.message;
      btn.disabled = false;
    }
  });

  const qrBox = $("[data-qr]", root);
  if (qrBox) {
    try {
      const { default: qrcode } = await import("../vendor/qrcode.js");
      const qr = qrcode(0, "M");
      qr.addData(upiLink(o));
      qr.make();
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch {
      qrBox.remove(); // the UPI ID and the app button still work
    }
  }
}

let polls = 0;
async function load() {
  if (!id || !token) {
    root.innerHTML = `<div class="empty"><h1>No order to show</h1><p>Open the order link from your confirmation, or <a href="shop.html">go to the shop</a>.</p></div>`;
    return;
  }
  let order = null;
  try {
    order = await getOrder(id, token);
  } catch (e) {
    root.innerHTML = `<div class="empty"><h1>The order did not load</h1><p>${esc(e.message)}</p></div>`;
    return;
  }
  if (!order) {
    root.innerHTML = `<div class="empty"><h1>We could not find that order</h1><p>The link may be incomplete. Write to <a href="mailto:${esc(CONFIG.contactEmail)}">${esc(CONFIG.contactEmail)}</a> with your order number and we will help.</p></div>`;
    return;
  }
  view(order);
  // Card payments are confirmed by the gateway a moment after checkout closes.
  if (order.status === "pending" && order.payment_method === "razorpay" && polls < 20) {
    polls += 1;
    setTimeout(load, 4000);
  }
  // UPI payments are confirmed by a person; look again once a minute while the page is open.
  if (order.status === "pending" && order.payment_method === "upi" && order.reference_submitted && polls < 30) {
    polls += 1;
    setTimeout(load, 60000);
  }
}

load();
