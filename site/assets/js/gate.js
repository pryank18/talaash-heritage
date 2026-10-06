// The registration gate. Every visitor gives their name, email, phone number
// and location before they use the site (gateMode "hard"), or at the latest
// before they pay ("soft" / "checkout"). See CONFIG.gateMode.

import { CONFIG } from "./config.js";
import { registerVisitor } from "./api.js";
import { getVisitor, setVisitor } from "./store.js";
import { $, esc, toast } from "./ui.js";

const META_KEY = "th_first_touch";

/** Remember how the visitor first arrived, even if they register three pages later. */
function captureFirstTouch() {
  try {
    if (sessionStorage.getItem(META_KEY)) return;
    const q = new URLSearchParams(location.search);
    const utm = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      if (q.get(k)) utm[k] = q.get(k).slice(0, 120);
    }
    sessionStorage.setItem(
      META_KEY,
      JSON.stringify({ landing: location.pathname + location.search, referrer: document.referrer || "", utm }),
    );
  } catch { /* storage unavailable */ }
}

function firstTouch() {
  try {
    return JSON.parse(sessionStorage.getItem(META_KEY)) || {};
  } catch {
    return {};
  }
}

function currentPage() {
  return location.pathname.split("/").pop() || "index.html";
}

function template(hard, v) {
  return `
  <div class="gate-top">
    <span class="wordmark-deva" lang="hi" aria-hidden="true">तलाश</span>
    <h2 id="gate-title">${v && hard ? "Our privacy notice changed. Confirm your details" : v ? "Update your details" : hard ? "Register to enter Talaash Heritage" : "Register with Talaash Heritage"}</h2>
    <p>We ask every visitor for their contact details and location. We use them to send lecture links and order updates, and to plan sessions and walks near you.</p>
  </div>
  <form class="gate-body form" novalidate>
    <div class="form-row">
      <div class="field">
        <label for="g-name">Full name</label>
        <input id="g-name" name="full_name" type="text" autocomplete="name" required maxlength="120" value="${esc(v?.full_name)}">
      </div>
      <div class="field">
        <label for="g-email">Email</label>
        <input id="g-email" name="email" type="email" autocomplete="email" required maxlength="254" inputmode="email" value="${esc(v?.email)}">
      </div>
    </div>
    <div class="field">
      <label for="g-phone">Phone number <span class="hint">with country code</span></label>
      <div class="phone">
        <input id="g-dial" name="dial" type="text" inputmode="tel" autocomplete="tel-country-code" aria-label="Country code" value="${esc(v?.dial || CONFIG.defaultDialCode)}" maxlength="5">
        <input id="g-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" required maxlength="15" value="${esc(v?.phone_national)}">
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <label for="g-city">City or town</label>
        <input id="g-city" name="city" type="text" autocomplete="address-level2" required maxlength="120" value="${esc(v?.city)}">
      </div>
      <div class="field">
        <label for="g-region">State <span class="hint">optional</span></label>
        <input id="g-region" name="region" type="text" autocomplete="address-level1" maxlength="120" value="${esc(v?.region)}">
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <label for="g-country">Country</label>
        <input id="g-country" name="country" type="text" autocomplete="country-name" required maxlength="80" value="${esc(v?.country || CONFIG.defaultCountry)}">
      </div>
      <div class="field">
        <label for="g-postal">PIN code <span class="hint">optional</span></label>
        <input id="g-postal" name="postal_code" type="text" autocomplete="postal-code" inputmode="numeric" maxlength="12" value="${esc(v?.postal_code)}">
      </div>
    </div>
    <div class="gate-locate">
      <button type="button" class="btn btn-outline btn-small" data-locate>Add my precise location</button>
      <span class="muted" data-locate-status>Optional. Your browser will ask for permission.</span>
    </div>
    <div class="hp" aria-hidden="true">
      <label for="g-website">Leave this empty</label>
      <input id="g-website" name="th_extra_field" type="text" tabindex="-1" autocomplete="off">
    </div>
    <label class="check">
      <input type="checkbox" name="consent" required>
      <span>I agree to Talaash Heritage storing these details and contacting me about my registrations and orders, as set out in the <a href="privacy.html" target="_blank" rel="noopener">privacy notice</a>.</span>
    </label>
    <label class="check">
      <input type="checkbox" name="marketing_opt_in" ${v?.marketing_opt_in ? "checked" : ""}>
      <span>Also tell me about new lectures, courses and walks by email and WhatsApp. I can stop these at any time.</span>
    </label>
    <p class="form-error" role="alert" data-error></p>
    <div class="gate-foot">
      <button class="btn btn-primary" type="submit">${v ? "Save my details" : "Register and enter"}</button>
      ${hard ? "" : `<button class="btn-plain" type="button" data-close>${v ? "Cancel" : "Not now"}</button>`}
    </div>
  </form>`;
}

let openPromise = null;

/** Opens the form. Resolves with the visitor once registered, or null if dismissed. */
export function openGate({ hard = false, edit = false } = {}) {
  if (openPromise) return openPromise;
  const existing = edit ? getVisitor() : null;

  openPromise = new Promise((resolve) => {
    const dlg = document.createElement("dialog");
    dlg.className = `gate${hard ? " is-hard" : ""}`;
    dlg.setAttribute("aria-labelledby", "gate-title");
    dlg.innerHTML = template(hard, existing);
    document.body.append(dlg);
    if (hard) document.body.classList.add("is-gated");

    const form = $("form", dlg);
    const errorEl = $("[data-error]", dlg);
    const submitBtn = $('button[type="submit"]', dlg);
    let coords = null;

    let done = false;
    const finish = (visitor) => {
      done = true;
      document.body.classList.remove("is-gated");
      dlg.close();
      dlg.remove();
      openPromise = null;
      resolve(visitor);
    };

    // In hard mode Escape must not dismiss the form.
    dlg.addEventListener("cancel", (e) => {
      e.preventDefault();
      if (!hard) finish(null);
    });
    // Some browsers close a dialog on a second Escape regardless. Reopen it.
    dlg.addEventListener("close", () => {
      if (!done && hard) dlg.showModal();
      else if (!done) finish(null);
    });
    $("[data-close]", dlg)?.addEventListener("click", () => finish(null));

    $("[data-locate]", dlg).addEventListener("click", () => {
      const status = $("[data-locate-status]", dlg);
      if (!navigator.geolocation) {
        status.textContent = "This browser cannot share a location. City and country are enough.";
        return;
      }
      status.textContent = "Waiting for permission…";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Rounded to about 100 m: enough to plan a walk, not enough to find a front door.
          coords = { latitude: +pos.coords.latitude.toFixed(3), longitude: +pos.coords.longitude.toFixed(3) };
          status.textContent = "Location added.";
        },
        () => {
          status.textContent = "Location not shared. City and country are enough.";
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
      );
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      const data = Object.fromEntries(new FormData(form));
      if (data.th_extra_field) {
        // Honeypot filled: almost certainly a bot. Fail without saying why.
        errorEl.textContent = "Could not save your details. Try again.";
        return;
      }

      const dial = `+${String(data.dial || "").replace(/[^0-9]/g, "")}`;
      const national = String(data.phone || "").replace(/[^0-9]/g, "").replace(/^0+/, "");
      const phone = `${dial}${national}`;

      const problems = [];
      const mark = (name, bad) => form.elements[name]?.setAttribute("aria-invalid", bad ? "true" : "false");
      const badName = data.full_name.trim().length < 2;
      const badEmail = !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(data.email.trim());
      const badPhone = !/^\+[0-9]{8,15}$/.test(phone) || (dial === "+91" && !/^[6-9][0-9]{9}$/.test(national));
      const badCity = data.city.trim().length < 2;
      const badCountry = data.country.trim().length < 2;
      mark("full_name", badName);
      mark("email", badEmail);
      mark("phone", badPhone);
      mark("city", badCity);
      mark("country", badCountry);
      if (badName) problems.push("your full name");
      if (badEmail) problems.push("a valid email address");
      if (badPhone) problems.push(dial === "+91" ? "a 10-digit mobile number" : "a valid phone number");
      if (badCity) problems.push("your city");
      if (badCountry) problems.push("your country");
      if (problems.length) {
        errorEl.textContent = `Enter ${problems.join(", ")}.`;
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      if (!form.elements.consent.checked) {
        errorEl.textContent = "Tick the consent box to continue.";
        form.elements.consent.focus();
        return;
      }

      const payload = {
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone,
        city: data.city.trim(),
        region: data.region.trim(),
        country: data.country.trim(),
        postal_code: data.postal_code.trim(),
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        consent: true,
        marketing_opt_in: form.elements.marketing_opt_in.checked,
        meta: firstTouch(),
      };

      submitBtn.disabled = true;
      const label = submitBtn.textContent;
      submitBtn.textContent = "Saving…";
      try {
        const res = await registerVisitor(payload);
        const visitor = {
          id: res.id,
          full_name: payload.full_name,
          email: payload.email,
          phone,
          dial,
          phone_national: national,
          city: payload.city,
          region: payload.region,
          country: payload.country,
          postal_code: payload.postal_code,
          marketing_opt_in: payload.marketing_opt_in,
          consent_version: CONFIG.consentVersion,
          demo: res.demo,
        };
        setVisitor(visitor);
        finish(visitor);
        toast(existing ? "Details saved." : `Registered. Welcome, ${payload.full_name.split(" ")[0]}.`);
      } catch (err) {
        errorEl.textContent = err.message || "Could not save your details. Try again.";
        submitBtn.disabled = false;
        submitBtn.textContent = label;
      }
    });

    dlg.showModal();
    $("#g-name", dlg).focus();
  });
  return openPromise;
}

/** Called on every page load. */
export function initGate() {
  captureFirstTouch();
  const v = getVisitor();
  // A changed consent version means the notice changed: ask again.
  if (v && v.consent_version === CONFIG.consentVersion) return;
  if (CONFIG.gateExemptPages.includes(currentPage())) return;
  if (CONFIG.gateMode === "hard") openGate({ hard: true, edit: Boolean(v) });
  else if (CONFIG.gateMode === "soft" && !sessionStorage.getItem("th_gate_dismissed")) {
    openGate().then((v) => {
      if (!v) sessionStorage.setItem("th_gate_dismissed", "1");
    });
  }
}

/** Used by checkout: no registration, no order. */
export async function requireVisitor() {
  const v = getVisitor();
  if (v && v.consent_version === CONFIG.consentVersion) return v;
  return openGate({ hard: true, edit: Boolean(v) });
}
