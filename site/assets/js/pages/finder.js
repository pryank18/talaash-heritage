// "Help me choose a programme": suggests programmes from the real catalogue
// and builds an enquiry. It works only from the catalogue's own fields, so it
// cannot suggest anything that is not on offer or state a price or a date.
import { getProducts } from "../api.js";
import { CONFIG } from "../config.js";
import { getVisitor } from "../store.js";
import { $, $$, esc, kindLabel, productCard } from "../ui.js";

const WHO = {
  school: "A school class",
  college: "A college or university group",
  work: "A workplace team",
  public: "An individual or a private group",
};
const PLACE = {
  delhi: "In Delhi, at a monument or museum",
  local: "At our own venue",
  online: "Online",
  travel: "A trip of several days",
};
const LENGTH = {
  short: "Up to about 2 hours",
  half: "About half a day",
  long: "A full day or more",
  series: "Several sessions",
};
const TOPIC = {
  monuments: "Monuments and architecture",
  archaeology: "Archaeology and fieldwork",
  ancient: "Prehistory and the first cities",
  scripts: "Scripts, languages and texts",
  art: "Art, sculpture and religion",
  museums: "Museums and conservation",
  heritage: "Culture, heritage and society",
  careers: "Careers and further study",
};
// Short wording for the "why it fits" line.
const WHO_FIT = { school: "Suits schools", college: "Suits colleges and universities", work: "Suits workplace teams", public: "Open to individuals and private groups" };
const PLACE_FIT = { delhi: "In Delhi", local: "At your venue", online: "Online", travel: "A trip of several days" };
const LENGTH_FIT = { short: "Up to about 2 hours", half: "About half a day", long: "A full day or more", series: "Several sessions" };

const form = $("#finder-form");
const out = $("#finder-results");
const error = $("#finder-error");

function answers() {
  const data = new FormData(form);
  return {
    who: data.get("who") || "",
    place: data.get("place") || "",
    length: data.get("length") || "",
    topics: data.getAll("topic"),
  };
}

/**
 * Programmes that suit the answers, best first. The audience must match.
 * Place, length and topic narrow the list; if nothing fits all of them they are
 * relaxed in that order, and the caller is told what was relaxed.
 */
export function suggest(products, a, limit = 5) {
  const pool = products.filter((p) => p.find && p.audience?.includes(a.who));
  const fits = (p, use) =>
    (!use.place || !a.place || p.find.places.includes(a.place)) &&
    (!use.length || !a.length || p.find.lengths.includes(a.length)) &&
    (!use.topics || !a.topics.length || a.topics.some((t) => p.find.topics.includes(t)));
  const steps = [
    { use: { place: true, length: true, topics: true }, relaxed: [] },
    { use: { place: true, length: false, topics: true }, relaxed: ["length"] },
    { use: { place: false, length: false, topics: true }, relaxed: ["length", "place"] },
    { use: { place: true, length: false, topics: false }, relaxed: ["length", "topics"] },
    { use: { place: false, length: false, topics: false }, relaxed: ["length", "place", "topics"] },
  ];
  for (const step of steps) {
    // A relaxation only counts if the visitor actually gave that answer.
    const relaxed = step.relaxed.filter((k) => (k === "topics" ? a.topics.length : a[k]));
    if (step.relaxed.length && !relaxed.length) continue;
    const found = pool.filter((p) => fits(p, step.use));
    if (!found.length) continue;
    const score = (p) =>
      3 * a.topics.filter((t) => p.find.topics.includes(t)).length +
      2 * (a.place && p.find.places.includes(a.place) ? 1 : 0) +
      (a.length && p.find.lengths.includes(a.length) ? 1 : 0);
    // Ties go to the programme whose subject is most fully about what was asked.
    const focus = (p) => (a.topics.length ? a.topics.filter((t) => p.find.topics.includes(t)).length / p.find.topics.length : 0);
    found.sort((x, y) => score(y) - score(x) || focus(y) - focus(x) || x.sort_order - y.sort_order);
    return { list: found.slice(0, limit), relaxed };
  }
  return { list: [], relaxed: [] };
}

function why(p, a) {
  const parts = [WHO_FIT[a.who]];
  const place = a.place && p.find.places.includes(a.place) ? a.place : p.find.places[0];
  parts.push(PLACE_FIT[place]);
  if (p.details?.Length) parts.push(p.details.Length);
  const topics = a.topics.filter((t) => p.find.topics.includes(t)).map((t) => TOPIC[t]);
  if (topics.length) parts.push(`Covers ${topics.join(" and ").toLowerCase()}`);
  return parts.join(" · ");
}

function relaxedNote(relaxed) {
  if (!relaxed.length) return "";
  const names = { length: "the time you have", place: "where you would like it", topics: "the interests you chose" };
  const list = relaxed.map((k) => names[k]);
  const text = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}` : list[0];
  return `<p class="note">No programme matches every answer, so these are the closest, setting aside ${esc(text)}. Most programmes can be adapted, so describe what you need in the enquiry below.</p>`;
}

function enquiryText(chosen, a, f) {
  const lines = [`Hello ${CONFIG.brand}, I would like to enquire about:`];
  for (const p of chosen) lines.push(`- ${p.title} (${kindLabel(p)})`);
  lines.push("");
  lines.push(`Who it is for: ${WHO[a.who]}`);
  if (a.place) lines.push(`Where: ${PLACE[a.place]}`);
  if (a.length) lines.push(`Time available: ${LENGTH[a.length]}`);
  if (a.topics.length) lines.push(`Interests: ${a.topics.map((t) => TOPIC[t]).join(", ")}`);
  lines.push(`Approximate group size: ${f.size || ""}`);
  lines.push(`Preferred dates: ${f.dates || ""}`);
  lines.push(`City or venue: ${f.city || ""}`);
  if (f.notes) lines.push(`Anything else: ${f.notes}`);
  return lines.join("\n");
}

function renderResults(products, a) {
  const { list, relaxed } = suggest(products, a);
  out.hidden = false;
  if (!list.length) {
    out.innerHTML = `<h2>We will design one for you</h2>
      <p>Nothing in the catalogue matches these answers yet, but most of our work is arranged on request. Tell us what you need and we will propose a programme.</p>
      <p><a class="btn btn-primary" href="contact.html">Contact us</a> <a class="btn btn-outline" href="shop.html">Browse every programme</a></p>`;
    out.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const city = getVisitor()?.city || "";
  out.innerHTML = `
    <h2>Suggested programmes</h2>
    ${relaxedNote(relaxed)}
    <div class="grid finder-grid">
      ${list.map((p) => `<div class="finder-pick"><p class="finder-why"><span class="visually-hidden">Why it fits: </span>${esc(why(p, a))}</p>${productCard(p)}</div>`).join("")}
    </div>

    <form id="enquiry" class="form finder-enquiry" novalidate>
      <h2>Send an enquiry</h2>
      <p class="muted">Tick the programmes you are interested in and add a few details. Nothing is booked or charged; we reply with a plan and a quotation.</p>
      <fieldset>
        <legend class="visually-hidden">Programmes to enquire about</legend>
        ${list.map((p, i) => `<label class="check"><input type="checkbox" name="pick" value="${esc(p.id)}"${i === 0 ? " checked" : ""}><span>${esc(p.title)} <span class="muted">(${esc(kindLabel(p))})</span></span></label>`).join("")}
      </fieldset>
      <div class="form-row">
        <div class="field"><label for="f-size">Approximate group size</label><input id="f-size" name="size" type="number" min="1" inputmode="numeric"></div>
        <div class="field"><label for="f-dates">Preferred dates</label><input id="f-dates" name="dates" type="text" placeholder="For example, a Saturday in November"></div>
        <div class="field"><label for="f-city">City or venue</label><input id="f-city" name="city" type="text" value="${esc(city)}"></div>
      </div>
      <div class="field"><label for="f-notes">Anything else <span class="hint">(optional)</span></label><textarea id="f-notes" name="notes" rows="3" placeholder="Class or level, language, anything you would like changed"></textarea></div>
      <p class="form-error" id="enquiry-error" role="alert"></p>
      <div class="buy-row">
        <button class="btn btn-primary" type="submit" name="via" value="whatsapp">Send on WhatsApp</button>
        <button class="btn btn-outline" type="submit" name="via" value="email">Send by email</button>
      </div>
    </form>`;

  const enquiry = $("#enquiry", out);
  enquiry.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#enquiry-error", out);
    const ids = $$('input[name="pick"]:checked', enquiry).map((x) => x.value);
    const chosen = list.filter((p) => ids.includes(p.id));
    if (!chosen.length) {
      err.textContent = "Tick at least one programme.";
      return;
    }
    err.textContent = "";
    const f = Object.fromEntries(["size", "dates", "city", "notes"].map((k) => [k, enquiry.elements[k].value.trim()]));
    const text = enquiryText(chosen, a, f);
    if (e.submitter?.value === "email") {
      const subject = `Enquiry: ${chosen.map((p) => p.title).join(", ")}`;
      location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }
  });
  out.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const a = answers();
  if (!a.who) {
    error.textContent = "Choose who the programme is for.";
    $('input[name="who"]', form).focus();
    return;
  }
  error.textContent = "";
  try {
    renderResults(await getProducts(), a);
  } catch (err) {
    out.hidden = false;
    out.innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
  }
});

// Start loading the catalogue while the visitor answers.
getProducts().catch(() => {});
