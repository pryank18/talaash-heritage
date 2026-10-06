import { CONFIG } from "../config.js";
import { createOrder, verifyPayment } from "../api.js";
import { clearCart } from "../store.js";
import { requireVisitor } from "../gate.js";
import { $, esc, loadScript, money } from "../ui.js";
import { pricedCart } from "./cart.js";

const root = $("#checkout-root");

// What each way of paying is called at checkout. Which ones appear, and in
// what order, is set by CONFIG.paymentMethods.
const METHODS = {
  upi: {
    title: "Pay by UPI",
    help: "Google Pay, PhonePe, Paytm or any UPI app. You get the payment details on the next screen, and we confirm your order as soon as we see the money, usually within a few hours.",
    button: (total) => `Place order and pay ${money(total)} by UPI`,
  },
  razorpay: {
    title: "Pay by card, netbanking or UPI",
    help: "Secure payment through Razorpay. Your order is confirmed immediately.",
    button: (total) => `Pay ${money(total)}`,
  },
  whatsapp: {
    title: "Order on WhatsApp",
    help: "We save your order and you message us. We reply with payment details and confirm once you have paid.",
    button: () => "Send order on WhatsApp",
  },
};
const methods = (CONFIG.paymentMethods || []).filter((m) => METHODS[m]);
if (!methods.length) methods.push("whatsapp");

function orderUrl(order) {
  return `order.html?id=${encodeURIComponent(order.order_id)}&t=${encodeURIComponent(order.access_token)}`;
}

function rememberOrder(order) {
  try {
    localStorage.setItem("th_last_order", JSON.stringify({ id: order.order_id, t: order.access_token, number: order.order_number }));
  } catch { /* not essential */ }
}

function whatsappLink(order, cart, customer) {
  const lines = cart.buyable.map((l) => `${l.qty} x ${l.p.title}`).join("\n");
  const text =
    `Hello ${CONFIG.brand}, I would like to confirm order ${order.order_number}.\n\n${lines}\n\n` +
    `Total: ${money(order.total_paise)}\nName: ${customer.name}\nPhone: ${customer.phone}`;
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

async function render() {
  const visitor = await requireVisitor();
  if (!visitor) return;

  let cart;
  try {
    cart = await pricedCart();
  } catch (e) {
    root.innerHTML = `<p class="form-error">${esc(e.message)}</p>`;
    return;
  }
  if (!cart.buyable.length) {
    root.innerHTML = `<div class="empty"><h2>Nothing to check out</h2><p>Your cart is empty.</p><a class="btn btn-primary" href="shop.html">Browse the shop</a></div>`;
    return;
  }

  root.innerHTML = `
    <div class="layout-2">
      <form class="form" id="checkout-form" novalidate>
        <fieldset class="form">
          <legend>Contact</legend>
          <div class="field">
            <label for="c-name">Full name</label>
            <input id="c-name" name="name" type="text" autocomplete="name" required maxlength="120" value="${esc(visitor.full_name)}">
          </div>
          <div class="form-row">
            <div class="field">
              <label for="c-email">Email <span class="hint">links and receipts go here</span></label>
              <input id="c-email" name="email" type="email" autocomplete="email" required maxlength="254" value="${esc(visitor.email)}">
            </div>
            <div class="field">
              <label for="c-phone">Phone <span class="hint">with country code</span></label>
              <input id="c-phone" name="phone" type="tel" autocomplete="tel" required maxlength="20" value="${esc(visitor.phone)}">
            </div>
          </div>
        </fieldset>

        ${
          cart.needsShipping
            ? `<fieldset class="form">
          <legend>Delivery address</legend>
          <div class="field">
            <label for="c-line1">House, street</label>
            <input id="c-line1" name="line1" type="text" autocomplete="address-line1" required maxlength="200">
          </div>
          <div class="field">
            <label for="c-line2">Area, landmark <span class="hint">optional</span></label>
            <input id="c-line2" name="line2" type="text" autocomplete="address-line2" maxlength="200">
          </div>
          <div class="form-row">
            <div class="field">
              <label for="c-city">City</label>
              <input id="c-city" name="city" type="text" autocomplete="address-level2" required maxlength="120" value="${esc(visitor.city)}">
            </div>
            <div class="field">
              <label for="c-state">State</label>
              <input id="c-state" name="state" type="text" autocomplete="address-level1" required maxlength="120" value="${esc(visitor.region)}">
            </div>
            <div class="field">
              <label for="c-pin">PIN code</label>
              <input id="c-pin" name="postal_code" type="text" inputmode="numeric" autocomplete="postal-code" required maxlength="6" value="${esc(visitor.postal_code)}">
            </div>
          </div>
          <p class="small muted">We deliver physical items within India only.</p>
        </fieldset>`
            : ""
        }

        <fieldset class="form">
          <legend>Payment</legend>
          <div class="pay-options">
            ${methods
              .map(
                (m, i) => `<label class="pay-option">
              <input type="radio" name="payment_method" value="${m}" ${i === 0 ? "checked" : ""}>
              <span><strong>${METHODS[m].title}</strong><span class="muted small">${METHODS[m].help}</span></span>
            </label>`,
              )
              .join("")}
          </div>
        </fieldset>

        <p class="form-error" role="alert" data-error></p>
        <button class="btn btn-primary" type="submit" data-submit>${METHODS[methods[0]].button(cart.total)}</button>
        <p class="small muted">By placing this order you agree to our <a href="terms.html" target="_blank" rel="noopener">terms of sale</a> and <a href="shipping-returns.html" target="_blank" rel="noopener">cancellation and refund policy</a>.</p>
      </form>

      <aside class="summary" aria-label="Order summary">
        <h2>Your order</h2>
        <ul class="summary-items">
          ${cart.buyable.map((l) => `<li><span>${l.qty} × ${esc(l.p.title)}</span><span>${money(l.total)}</span></li>`).join("")}
        </ul>
        <dl>
          <div><dt>Subtotal</dt><dd>${money(cart.subtotal)}</dd></div>
          ${cart.needsShipping ? `<div><dt>Delivery in India</dt><dd>${cart.shipping ? money(cart.shipping) : "Free"}</dd></div>` : ""}
          <div class="total"><dt>Total</dt><dd>${money(cart.total)}</dd></div>
        </dl>
        <a href="cart.html" class="small">Change items</a>
      </aside>
    </div>`;

  const form = $("#checkout-form");
  const errorEl = $("[data-error]", form);
  const submit = $("[data-submit]", form);
  const chosen = () => new FormData(form).get("payment_method") || methods[0];
  const payLabel = () => METHODS[chosen()].button(cart.total);
  form.addEventListener("change", (e) => {
    if (e.target.name === "payment_method") submit.textContent = payLabel();
  });

  const reset = (message) => {
    submit.disabled = false;
    submit.textContent = payLabel();
    if (message) errorEl.textContent = message;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    const d = Object.fromEntries(new FormData(form));
    const phone = String(d.phone).replace(/[^0-9+]/g, "");

    const missing = [];
    if (String(d.name).trim().length < 2) missing.push("your full name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(d.email).trim())) missing.push("a valid email address");
    if (!/^\+?[0-9]{8,15}$/.test(phone)) missing.push("a valid phone number");
    if (cart.needsShipping) {
      if (!String(d.line1).trim()) missing.push("your street address");
      if (!String(d.city).trim()) missing.push("your city");
      if (!String(d.state).trim()) missing.push("your state");
      if (!/^[1-9][0-9]{5}$/.test(String(d.postal_code).trim())) missing.push("a 6-digit PIN code");
    }
    if (missing.length) {
      errorEl.textContent = `Enter ${missing.join(", ")}.`;
      return;
    }

    const customer = { name: String(d.name).trim(), email: String(d.email).trim().toLowerCase(), phone };
    const payload = {
      visitor_id: visitor.id,
      payment_method: chosen(),
      customer,
      shipping_address: cart.needsShipping
        ? { line1: d.line1.trim(), line2: (d.line2 || "").trim(), city: d.city.trim(), state: d.state.trim(), postal_code: d.postal_code.trim(), country: "India" }
        : null,
      items: cart.buyable.map((l) => ({ product_id: l.p.id, quantity: l.qty })),
    };

    submit.disabled = true;
    submit.textContent = "Creating your order…";

    let order;
    try {
      order = await createOrder(payload);
    } catch (err) {
      reset(err.message);
      return;
    }
    rememberOrder(order);

    // UPI and WhatsApp orders, and everything in demo mode, finish on the order
    // page: it shows how to pay and takes the payment reference.
    if (order.demo || payload.payment_method !== "razorpay") {
      clearCart();
      if (payload.payment_method === "whatsapp") window.open(whatsappLink(order, cart, customer), "_blank", "noopener");
      location.href = orderUrl(order);
      return;
    }

    try {
      await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    } catch {
      reset(`The payment window did not load. Your order ${order.order_number} is saved. Try again, or choose another way to pay.`);
      return;
    }

    const rzp = new window.Razorpay({
      key: order.razorpay_key_id,
      order_id: order.razorpay_order_id,
      amount: order.total_paise,
      currency: order.currency,
      name: CONFIG.brand,
      description: `Order ${order.order_number}`,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      notes: { order_number: order.order_number },
      theme: { color: "#0e463e" },
      handler: async (response) => {
        submit.textContent = "Confirming payment…";
        try {
          await verifyPayment({
            order_id: order.order_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        } catch {
          // The webhook confirms the payment independently; the order page will catch up.
        }
        clearCart();
        location.href = orderUrl(order);
      },
      modal: {
        ondismiss: () => reset(`Payment window closed. Nothing was charged. Press pay to try again.`),
      },
    });
    rzp.on("payment.failed", (resp) => {
      errorEl.textContent = `Payment failed: ${resp?.error?.description || "the bank declined it"}. You can try another method.`;
    });
    rzp.open();
  });
}

render();
