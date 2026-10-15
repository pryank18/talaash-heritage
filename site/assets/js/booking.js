// Career courses booked on a weekend evening: the slot picker on the programme page,
// the slot held while the buyer checks out, and the labels shown in the cart, checkout
// and order page. The rules (Saturday and Sunday, 5 to 8 pm IST, 24 hours ahead, up to
// 8 weekends) live in the database: public.career_slots, career_hold and career_attach.
import { CONFIG } from "./config.js";
import { rpc } from "./api.js";
import { esc, money } from "./ui.js";

const HOLDS_KEY = "th_holds_v1";

export const bookingKind = (p) => (p?.tags?.includes("career-weekend") ? "weekend" : p?.tags?.includes("career-single") ? "single" : null);
export const isBookable = (p) => Boolean(bookingKind(p));

// ---- holds kept in this browser: { [productId]: { hold, start, kind, topic, at } } ----
function readHolds() {
  try { return JSON.parse(localStorage.getItem(HOLDS_KEY)) || {}; } catch { return {}; }
}
function writeHolds(h) {
  try { localStorage.setItem(HOLDS_KEY, JSON.stringify(h)); } catch { /* storage blocked */ }
}
export const getHold = (productId) => readHolds()[productId] || null;
export function setHold(productId, data) { const h = readHolds(); h[productId] = data; writeHolds(h); }
export function dropHold(productId) { const h = readHolds(); delete h[productId]; writeHolds(h); }
export function clearHolds() { writeHolds({}); }

// ---- times, always shown in Indian time ----
const day = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
const clock = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
const t12 = (d) => clock.format(d).replace(/\s?([ap])\.?m\.?/i, (_, x) => ` ${x.toLowerCase()}m`);
const isoAt = (date, hhmm) => new Date(`${date}T${hhmm}:00+05:30`);

/** "Sat, 24 Oct and Sun, 25 Oct, 5:00 to 6:30 pm IST" or "Sat, 24 Oct, 5:00 to 7:00 pm IST". */
export function slotLabel(kind, startIso) {
  const s = new Date(startIso);
  const mins = kind === "weekend" ? 90 : 120;
  const e = new Date(s.getTime() + mins * 60000);
  const days = kind === "weekend" ? `${day.format(s)} and ${day.format(new Date(s.getTime() + 86400000))}` : day.format(s);
  return `${days}, ${t12(s).replace(/ [ap]m$/, "")} to ${t12(e)} IST`;
}

async function fetchSlots(slug) {
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/functions/v1/career-slots?slug=${encodeURIComponent(slug)}`, {
      headers: { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${CONFIG.supabaseAnonKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok) return data;
    }
  } catch { /* fall back to the database directly */ }
  return rpc("career_slots", { p_slug: slug });
}

const HOLD_ERRORS = {
  taken: "Someone has just booked that time. Please choose another.",
  invalid_time: "That time can no longer be booked. Please choose another.",
  too_many_holds: "You have several times on hold already. Finish that booking, or wait 30 minutes and try again.",
  topic: "Please choose a topic.",
  not_bookable: "This course cannot be booked online right now. Please message us on WhatsApp.",
};

/**
 * The slot picker shown on the programme page in place of the quantity and cart buttons.
 * onBooked(hold) is called once a slot is held.
 */
export async function mountBooking(el, p, onBooked) {
  const kind = bookingKind(p);
  const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello ${CONFIG.brand}, I would like to book "${p.title}" at a different time.\n\nTopic: \nDays and times that suit me: `)}`;
  el.innerHTML = `<p class="muted small">Loading free times…</p>`;
  let data;
  try {
    data = await fetchSlots(p.slug);
  } catch {
    el.innerHTML = `<p class="form-error">Free times did not load. <a href="${esc(wa)}" target="_blank" rel="noopener">Book on WhatsApp instead</a>.</p>`;
    return;
  }
  const state = { topic: data.topics?.[0] || "", date: "", time: "" };
  const days = data.days || [];
  const dayName = (d) => (kind === "weekend" ? `${day.format(isoAt(d, "12:00"))} and ${day.format(new Date(isoAt(d, "12:00").getTime() + 86400000))}` : day.format(isoAt(d, "12:00")));

  const draw = (message = "") => {
    const times = days.find((d) => d.date === state.date)?.times || [];
    el.innerHTML = `
      <div class="booking">
        <fieldset>
          <legend>1. Choose a topic</legend>
          ${(data.topics || []).map((t) => `<label class="booking-opt"><input type="radio" name="topic" value="${esc(t)}" ${t === state.topic ? "checked" : ""}> ${esc(t)}</label>`).join("")}
        </fieldset>
        <fieldset>
          <legend>2. Choose ${kind === "weekend" ? "a weekend" : "a day"}</legend>
          ${
            days.length
              ? `<div class="booking-grid">${days.map((d) => `<button type="button" class="booking-chip${d.date === state.date ? " is-on" : ""}" data-date="${d.date}" aria-pressed="${d.date === state.date}">${esc(dayName(d.date))}</button>`).join("")}</div>`
              : `<p>Every weekend evening in the next eight weeks is booked. <a href="${esc(wa)}" target="_blank" rel="noopener">Message us on WhatsApp</a> and we will find a time.</p>`
          }
        </fieldset>
        ${
          state.date
            ? `<fieldset>
          <legend>3. Choose a start time${kind === "weekend" ? " (the same both days)" : ""}</legend>
          <div class="booking-grid">${times.map((t) => `<button type="button" class="booking-chip${t === state.time ? " is-on" : ""}" data-time="${t}" aria-pressed="${t === state.time}">${esc(t12(isoAt(state.date, t)))}</button>`).join("")}</div>
          <p class="small muted">Only free times are shown. Each ${kind === "weekend" ? "session lasts 1 hour 30 minutes" : "session lasts 2 hours"}, between 5 and 8 pm IST.</p>
        </fieldset>`
            : ""
        }
        ${state.date && state.time ? `<p class="booking-sum"><strong>${esc(slotLabel(kind, isoAt(state.date, state.time).toISOString()))}</strong><br>${esc(state.topic)}</p>` : ""}
        <p class="form-error" role="alert">${esc(message)}</p>
        <button class="btn btn-primary" type="button" data-book ${state.date && state.time && state.topic ? "" : "disabled"}>Book this time and pay ${money(p.price_paise)}</button>
        <p class="small muted">Your time is held for 30 minutes while you pay. Need a weekday or another time? <a href="${esc(wa)}" target="_blank" rel="noopener">Ask on WhatsApp</a>.</p>
      </div>`;
  };
  draw();

  el.addEventListener("change", (e) => {
    if (e.target.name === "topic") { state.topic = e.target.value; draw(); }
  });
  el.addEventListener("click", async (e) => {
    const d = e.target.closest("[data-date]");
    if (d) { state.date = d.dataset.date; state.time = ""; draw(); return; }
    const t = e.target.closest("[data-time]");
    if (t) { state.time = t.dataset.time; draw(); return; }
    const b = e.target.closest("[data-book]");
    if (!b) return;
    b.disabled = true;
    b.textContent = "Holding your time…";
    const start = isoAt(state.date, state.time).toISOString();
    let r;
    try {
      r = await rpc("career_hold", { p_slug: p.slug, p_start: start, p_topic: state.topic });
    } catch (err) {
      draw(err.message || "Something went wrong. Please try again.");
      return;
    }
    if (!r?.ok) {
      if (r?.error === "taken" || r?.error === "invalid_time") {
        try { data = await fetchSlots(p.slug); days.splice(0, days.length, ...(data.days || [])); } catch { /* keep old list */ }
        state.time = "";
      }
      draw(HOLD_ERRORS[r?.error] || "Something went wrong. Please try again.");
      return;
    }
    const hold = { hold: r.hold, start, kind, topic: state.topic, at: Date.now() };
    setHold(p.id, hold);
    onBooked(hold);
  });
}

/** Ties every held slot in the cart to the new order. Returns the first problem, or null. */
export async function attachHolds(order, lines) {
  for (const l of lines) {
    if (!isBookable(l.p)) continue;
    const h = getHold(l.p.id);
    if (!h) return { p: l.p, message: `Choose a date and time for "${l.p.title}" first.` };
    let r;
    try {
      r = await rpc("career_attach", { p_hold: h.hold, p_order_id: order.order_id, p_token: order.access_token });
    } catch {
      return { p: l.p, message: "We could not confirm your booked time. Please try again." };
    }
    if (!r?.ok) {
      dropHold(l.p.id);
      return { p: l.p, message: r?.error === "taken" ? "The time you chose has just been booked by someone else. Please choose another; you have not been charged." : "Your held time has expired. Please choose a time again; you have not been charged." };
    }
  }
  return null;
}

/** Sessions for the order page. */
export async function bookingsForOrder(orderId, token) {
  try { return await rpc("career_booking_for_order", { p_order_id: orderId, p_token: token }); } catch { return []; }
}

const sessionRange = (s) => `${day.format(new Date(s.starts_at))}, ${t12(new Date(s.starts_at)).replace(/ [ap]m$/, "")} to ${t12(new Date(s.ends_at))} IST`;

/**
 * Booked sessions on the order page. Once paid, a button sends the booking to Talaash Heritage on
 * WhatsApp from the learner's own phone, so the details sit in their chat (free: the learner starts it).
 */
export function sessionsHtml(bookings, order = {}) {
  if (!bookings?.length) return "";
  const meet = (order.items || []).find((i) => i.access_url)?.access_url || "";
  return `<h2>Your sessions</h2>${bookings
    .map((b) => {
      const lines = (b.sessions || []).map(sessionRange);
      const text = `Hello ${CONFIG.brand}, my career course is booked.\n\nOrder: ${order.order_number || ""}\nCourse: ${b.product}\nTopic: ${b.topic}\n${lines.map((l) => `Session: ${l}`).join("\n")}${meet ? `\nGoogle Meet: ${meet}` : ""}\n\nName: ${order.customer_name || ""}`;
      const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
      return `<div class="access"><p><strong>${esc(b.product)}</strong><br>${esc(b.topic)}</p><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>${
        b.status === "held"
          ? `<p class="small muted">Held for you until payment is confirmed.</p>`
          : `<p class="small">A calendar invitation from talaashheritage@gmail.com reaches your email within an hour.</p><p><a class="btn btn-outline btn-small" href="${esc(wa)}" target="_blank" rel="noopener">Get these details on WhatsApp</a></p>`
      }</div>`;
    })
    .join("")}`;
}
