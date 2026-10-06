// The add/edit listing form, shared by the owner admin page and the partner
// dashboard. The database checks every field again; this only makes the form.
import { esc } from "./ui.js";

const KINDS = [
  ["walk", "Heritage walk"],
  ["experience", "Experience (museum visit, workshop, site day)"],
  ["course", "Course (several sessions)"],
  ["live", "Live lecture"],
  ["counselling", "One-to-one counselling"],
  ["recording", "Recorded lecture"],
  ["physical", "Book, print or other parcel"],
];

// Dates are typed and shown in Indian time.
export function toIstInput(iso) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
}

function detailsText(details) {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details).map(([k, v]) => `${k}: ${v}`).join("\n");
}

const val = (v) => (v === null || v === undefined ? "" : esc(v));

/**
 * @param p        the listing being edited, or null for a new one
 * @param opts.admin   show owner-only fields (featured, position, partner)
 * @param opts.sellers approved partners, for the owner's partner picker
 */
export function listingFormHtml(p, { admin = false, sellers = [] } = {}) {
  const kind = p?.type ?? "walk";
  return `
  <form class="form panel" data-listing-form novalidate>
    <h2>${p ? "Edit listing" : "Add a listing"}</h2>
    ${
      admin
        ? ""
        : `<p class="small muted">New listings and changes go live after Talaash Heritage reviews them, usually within a day.</p>`
    }
    <div class="field">
      <label for="l-title">Title</label>
      <input id="l-title" name="title" type="text" required maxlength="200" value="${val(p?.title)}">
    </div>
    <div class="form-row">
      <div class="field">
        <label for="l-type">Kind</label>
        <select id="l-type" name="type">
          ${KINDS.map(([v, l]) => `<option value="${v}" ${v === kind ? "selected" : ""}>${l}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="l-price">Price in rupees</label>
        <input id="l-price" name="price_rupees" type="number" min="0" step="1" required value="${p ? p.price_paise / 100 : ""}">
      </div>
      <div class="field">
        <label for="l-stock">Seats or stock <span class="hint">empty = unlimited</span></label>
        <input id="l-stock" name="stock" type="number" min="0" step="1" value="${val(p?.stock)}">
      </div>
    </div>
    <div class="field">
      <label for="l-subtitle">One-line summary</label>
      <input id="l-subtitle" name="subtitle" type="text" maxlength="200" value="${val(p?.subtitle)}">
    </div>
    <div class="field">
      <label for="l-description">Description <span class="hint">leave a blank line between paragraphs</span></label>
      <textarea id="l-description" name="description" rows="6" maxlength="5000">${val(p?.description)}</textarea>
    </div>
    <div class="form-row">
      <div class="field">
        <label for="l-starts">Date and time, IST <span class="hint">empty for counselling and recordings</span></label>
        <input id="l-starts" name="starts_at" type="datetime-local" value="${toIstInput(p?.starts_at)}">
      </div>
      <div class="field">
        <label for="l-duration">Length in minutes</label>
        <input id="l-duration" name="duration_minutes" type="number" min="0" step="1" value="${val(p?.duration_minutes)}">
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <label for="l-speaker">Led by</label>
        <input id="l-speaker" name="speaker" type="text" maxlength="120" value="${val(p?.speaker)}">
      </div>
      <div class="field">
        <label for="l-venue">Where</label>
        <input id="l-venue" name="venue" type="text" maxlength="200" value="${val(p?.venue)}">
      </div>
    </div>
    <div class="field">
      <label for="l-details">Other details <span class="hint">one per line, as Label: value</span></label>
      <textarea id="l-details" name="details_text" rows="3" placeholder="Language: Hindi and English&#10;Group size: 15">${val(detailsText(p?.details))}</textarea>
    </div>
    <div class="field">
      <label for="l-image">Photo or poster link <span class="hint">https://… ; empty shows a drawing</span></label>
      <input id="l-image" name="image_url" type="text" value="${val(p?.image_url)}">
    </div>
    <div class="panel" style="margin:0">
      <strong>Shown to the buyer only after their payment is confirmed</strong>
      <div class="field" style="margin-top:0.75rem">
        <label for="l-access">Joining link, recording link or booking-calendar link <span class="hint">https://…</span></label>
        <input id="l-access" name="access_url" type="text" value="${val(p?.access_url)}">
      </div>
      <div class="field" style="margin-top:0.75rem">
        <label for="l-notes">Notes for buyers (meeting point, what to bring, how to book a slot)</label>
        <textarea id="l-notes" name="access_notes" rows="2" maxlength="1000">${val(p?.access_notes)}</textarea>
      </div>
    </div>
    ${
      admin
        ? `<div class="form-row">
      <div class="field">
        <label for="l-seller">Run by</label>
        <select id="l-seller" name="seller_id">
          <option value="">Talaash Heritage</option>
          ${sellers.map((s) => `<option value="${esc(s.id)}" ${s.id === p?.seller_id ? "selected" : ""}>${esc(s.name)}${s.status === "approved" ? "" : ` (${esc(s.status)})`}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="l-slug">Link name <span class="hint">empty = from the title</span></label>
        <input id="l-slug" name="slug" type="text" value="${val(p?.slug)}">
      </div>
      <div class="field">
        <label for="l-sort">Position <span class="hint">lower shows first</span></label>
        <input id="l-sort" name="sort_order" type="number" value="${val(p?.sort_order ?? 100)}">
      </div>
      <div class="field">
        <label for="l-compare">Earlier price, rupees <span class="hint">optional, struck through</span></label>
        <input id="l-compare" name="compare_rupees" type="number" min="0" step="1" value="${p?.compare_at_paise ? p.compare_at_paise / 100 : ""}">
      </div>
    </div>
    <label class="check"><input type="checkbox" name="is_featured" ${p?.is_featured ? "checked" : ""}><span>Feature on the home page when nothing dated is coming up</span></label>`
        : ""
    }
    <label class="check"><input type="checkbox" name="is_active" ${p ? (p.is_active ? "checked" : "") : "checked"}><span>On sale (untick to pause it)</span></label>
    <p class="form-error" role="alert" data-form-error></p>
    <div class="row-actions">
      <button class="btn btn-primary" type="submit">${admin ? "Save listing" : p ? "Send changes for review" : "Send for review"}</button>
      <button class="btn btn-outline" type="button" data-cancel>Cancel</button>
    </div>
  </form>`;
}

/** Reads the form into the shape the database functions expect. */
export function readListingForm(form) {
  const d = Object.fromEntries(new FormData(form));
  const out = {
    title: (d.title || "").trim(),
    type: d.type,
    price_rupees: d.price_rupees === "" ? null : d.price_rupees,
    stock: d.stock ?? "",
    subtitle: d.subtitle ?? "",
    description: d.description ?? "",
    starts_at: d.starts_at ? `${d.starts_at}:00+05:30` : "",
    duration_minutes: d.duration_minutes ?? "",
    speaker: d.speaker ?? "",
    venue: d.venue ?? "",
    details_text: d.details_text ?? "",
    image_url: d.image_url ?? "",
    access_url: d.access_url ?? "",
    access_notes: d.access_notes ?? "",
    is_active: Boolean(d.is_active),
  };
  if ("seller_id" in d) {
    out.seller_id = d.seller_id;
    out.slug = d.slug ?? "";
    out.sort_order = d.sort_order ?? "";
    out.compare_rupees = d.compare_rupees ?? "";
    out.is_featured = Boolean(d.is_featured);
  }
  const problems = [];
  if (out.title.length < 3) problems.push("a title");
  if (out.price_rupees === null || Number(out.price_rupees) < 0) problems.push("a price");
  return { listing: out, problems };
}
