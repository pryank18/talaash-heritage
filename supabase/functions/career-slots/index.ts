// Free weekend slots for the career courses.
//
// GET or POST ?slug=career-course-weekend | career-course-one-evening
// Returns public.career_slots(slug). Before answering, and at most every 10 minutes, it reads
// Pryank's Google Calendar through its secret iCal address (function secret ICAL_URL) and stores
// his busy times in public.calendar_sync, so anything already in his calendar is never offered.
// Events marked "Free" (transparent) and cancelled events do not block time. All-day events block
// the whole day. If ICAL_URL is not set, slots are still returned; only site bookings block time.
//
// Deploy with JWT verification off: the website calls it with the public anon key.
import ICAL from "npm:ical.js@1.5.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ICAL_URL = Deno.env.get("ICAL_URL") || "";
const ORIGINS = (Deno.env.get("SITE_ORIGIN") || "https://talaash-heritage.pages.dev").split(",").map((s) => s.trim());
const SLUGS = new Set(["career-course-weekend", "career-course-one-evening"]);
const STALE_MS = 10 * 60 * 1000;
const WINDOW_DAYS = 60;

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const ok = ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

async function rpc(name: string, args: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function lastSync(): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/calendar_sync?id=eq.1&select=synced_at`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  const rows = res.ok ? await res.json() : [];
  return rows[0]?.synced_at ? Date.parse(rows[0].synced_at) : 0;
}

/** Busy intervals from the iCal feed within the booking window. */
function busyFrom(icsText: string): { start: string; end: string }[] {
  const from = Date.now() - 24 * 3600 * 1000;
  const to = Date.now() + WINDOW_DAYS * 24 * 3600 * 1000;
  const comp = new ICAL.Component(ICAL.parse(icsText));
  const vevents = comp.getAllSubcomponents("vevent");
  const out: { start: string; end: string }[] = [];
  const exceptions = vevents.filter((v: any) => v.hasProperty("recurrence-id"));
  const add = (start: any, end: any, transp: string, status: string) => {
    if (transp === "TRANSPARENT" || status === "CANCELLED") return;
    const s = start.toJSDate().getTime();
    const e = end.toJSDate().getTime();
    if (e <= from || s >= to || e <= s) return;
    out.push({ start: new Date(s).toISOString(), end: new Date(e).toISOString() });
  };
  for (const v of vevents) {
    if (v.hasProperty("recurrence-id")) continue;
    const ev = new ICAL.Event(v);
    for (const x of exceptions) if (x.getFirstPropertyValue("uid") === ev.uid) ev.relateException(x);
    const transp = String(v.getFirstPropertyValue("transp") || "OPAQUE").toUpperCase();
    const status = String(v.getFirstPropertyValue("status") || "").toUpperCase();
    if (!ev.isRecurring()) {
      add(ev.startDate, ev.endDate, transp, status);
      continue;
    }
    const it = ev.iterator();
    let next;
    let guard = 0;
    while ((next = it.next()) && guard++ < 2000) {
      if (next.toJSDate().getTime() > to) break;
      const occ = ev.getOccurrenceDetails(next);
      const item = occ.item.component;
      const oTransp = String(item.getFirstPropertyValue("transp") || transp).toUpperCase();
      const oStatus = String(item.getFirstPropertyValue("status") || status).toUpperCase();
      add(occ.startDate, occ.endDate, oTransp, oStatus);
    }
  }
  return out;
}

async function syncIfStale(): Promise<void> {
  if (!ICAL_URL) return;
  if (Date.now() - (await lastSync()) < STALE_MS) return;
  const res = await fetch(ICAL_URL, { headers: { Accept: "text/calendar" } });
  if (!res.ok) throw new Error(`calendar ${res.status}`);
  const busy = busyFrom(await res.text());
  await rpc("calendar_busy_replace", { p_busy: busy, p_note: `iCal sync: ${busy.length} busy periods` });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  const url = new URL(req.url);
  let slug = url.searchParams.get("slug") || "";
  if (!slug && req.method === "POST") {
    try { slug = (await req.json()).slug || ""; } catch { /* no body */ }
  }
  if (!SLUGS.has(slug)) return json(req, 400, { ok: false, error: "slug" });
  let calendar = "ok";
  try {
    await syncIfStale();
  } catch (e) {
    // A calendar outage must not stop bookings; the last good copy is used.
    calendar = "stale";
    console.error("calendar sync failed", String(e));
  }
  try {
    const slots = await rpc("career_slots", { p_slug: slug });
    return json(req, 200, { ...slots, calendar });
  } catch (e) {
    console.error(String(e));
    return json(req, 500, { ok: false, error: "slots" });
  }
});
