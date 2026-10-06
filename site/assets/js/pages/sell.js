import { CONFIG, isLive } from "../config.js";
import { rpc } from "../api.js";
import { $ } from "../ui.js";

const root = $("#apply-root");
document.querySelectorAll("[data-commission]").forEach((el) => {
  el.textContent = `${CONFIG.partnerCommissionPct}%`;
});

function form() {
  root.innerHTML = `
  <form class="form panel" novalidate>
    <h2>Apply to sell</h2>
    <div class="form-row">
      <div class="field">
        <label for="s-name">Your name or organisation</label>
        <input id="s-name" name="name" type="text" autocomplete="name" required maxlength="120">
      </div>
      <div class="field">
        <label for="s-city">City</label>
        <input id="s-city" name="city" type="text" autocomplete="address-level2" required maxlength="120">
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <label for="s-email">Email <span class="hint">you sign in with this</span></label>
        <input id="s-email" name="email" type="email" autocomplete="email" required maxlength="254">
      </div>
      <div class="field">
        <label for="s-phone">Phone or WhatsApp <span class="hint">with country code</span></label>
        <input id="s-phone" name="phone" type="tel" autocomplete="tel" required maxlength="20" placeholder="+91">
      </div>
    </div>
    <div class="field">
      <label for="s-offering">What do you want to offer?</label>
      <textarea id="s-offering" name="offering" rows="4" required maxlength="2000" placeholder="For example: two-hour Sunday walks at Mehrauli, monthly, groups of 15, in Hindi and English. I have led walks for six years."></textarea>
    </div>
    <div class="field">
      <label for="s-bio">About you <span class="hint">shown to buyers on your listings</span></label>
      <textarea id="s-bio" name="bio" rows="3" maxlength="1000" placeholder="One or two sentences: your training and experience."></textarea>
    </div>
    <div class="form-row">
      <div class="field">
        <label for="s-upi">UPI ID for your earnings</label>
        <input id="s-upi" name="upi" type="text" required maxlength="260" placeholder="name@bank">
      </div>
      <div class="field">
        <label for="s-password">Choose a password <span class="hint">10 characters or more</span></label>
        <input id="s-password" name="password" type="password" autocomplete="new-password" required minlength="10" maxlength="200">
      </div>
    </div>
    <label class="check">
      <input type="checkbox" name="terms">
      <span>I have read and accept the partner terms above, including the ${CONFIG.partnerCommissionPct}% commission (or the rate Talaash Heritage agrees with me when approving my account).</span>
    </label>
    <p class="form-error" role="alert" data-error></p>
    <div><button class="btn btn-primary" type="submit">Send my application</button></div>
    <p class="small muted">Already applied? <a href="seller.html">Sign in to your partner page</a>.</p>
  </form>`;

  const f = $("form", root);
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("[data-error]", f);
    const btn = $('button[type="submit"]', f);
    err.textContent = "";
    const d = Object.fromEntries(new FormData(f));
    const missing = [
      d.name.trim().length < 2 && "your name",
      d.city.trim().length < 2 && "your city",
      !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(d.email.trim()) && "a valid email",
      !/^\+?[0-9]{8,15}$/.test(d.phone.replace(/[^0-9+]/g, "")) && "a phone number with country code",
      d.offering.trim().length < 20 && "what you want to offer, in a couple of sentences",
      !/^[A-Za-z0-9._-]{2,200}@[A-Za-z0-9.-]{2,64}$/.test(d.upi.trim()) && "a UPI ID like name@bank",
      d.password.length < 10 && "a password of 10 characters or more",
    ].filter(Boolean);
    if (missing.length) {
      err.textContent = `Enter ${missing.join(", ")}.`;
      return;
    }
    if (!d.terms) {
      err.textContent = "Tick the box to accept the partner terms.";
      return;
    }
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      await rpc("apply_as_seller", {
        p_name: d.name.trim(),
        p_email: d.email.trim().toLowerCase(),
        p_phone: d.phone.replace(/[^0-9+]/g, ""),
        p_city: d.city.trim(),
        p_offering: d.offering.trim(),
        p_bio: d.bio.trim(),
        p_payout_upi: d.upi.trim(),
        p_password: d.password,
        p_terms: true,
        p_terms_version: CONFIG.partnerTermsVersion,
      });
      root.innerHTML = `
        <div class="panel">
          <h2>Application received</h2>
          <p>We review applications within two working days and reply by email or WhatsApp. Once you are approved, sign in on the <a href="seller.html">partner page</a> with the email and password you just chose, and add your first listing.</p>
        </div>`;
    } catch (ex) {
      err.textContent = ex.message;
      btn.disabled = false;
      btn.textContent = "Send my application";
    }
  });
}

if (isLive()) form();
else root.innerHTML = `<p class="note">Applications open once the shop is connected to its database.</p>`;
