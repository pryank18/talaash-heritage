// Cloudflare Pages Function: POST /api/assist. The site assistant inside the "Ask us" panel.
// Conversations are never stored. Prices, payment and refund questions get fixed answers without calling the model, so they
// cannot drift. The model sees only facts picked from the site. Every reply is checked before it leaves: a price, a web address,
// a promise or any number that is not in those facts throws the reply away and hands over to the team. Any failure sends the
// visitor to WhatsApp. Daily limits live in the database (public.assist_take), so use stays inside the free Workers AI allowance.

import { ANSWERS } from "../../site/assets/js/help-answers.js";
import data from "../_lib/assist-data.json";
import { ABOUT, RULES } from "../_lib/assist-rules";

interface Env {
  AI?: { run(model: string, input: unknown): Promise<unknown> };
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
}
type Ctx = { request: Request; env: Env };
type Turn = { role: "user" | "assistant"; content: string };
type Row = { t: string; u: string; k: string; p: string; f: string; s: string };
type Lang = "en" | "hi";

const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const BACKUP_MODEL = "@cf/zai-org/glm-4.7-flash"; // English only, as on the agency site.
const SITE_CAP = 100; // Replies a day. The free 10,000 Neurons are per Cloudflare account, so this leaves room for other sites.
const VISITOR_CAP = 20;
const MODEL_WAIT_MS = 9000;
const MAX_CHARS = 400;
const MAX_TURNS = 6;
const ROWS = data.rows as Row[];
const HINDI = data.hindi as [string, string][];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

function sameSite(request: Request) {
  const source = request.headers.get("Origin") ?? request.headers.get("Referer");
  if (!source || source === "null") return request.headers.get("Sec-Fetch-Site") === "same-origin";
  try {
    return new URL(source).hostname === new URL(request.url).hostname;
  } catch {
    return false;
  }
}

const clean = (v: unknown) => (typeof v === "string" ? v.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, MAX_CHARS) : "");

function readTurns(v: unknown): Turn[] {
  if (!Array.isArray(v)) return [];
  const out: Turn[] = [];
  for (const t of v.slice(-MAX_TURNS)) {
    const role = (t as Turn)?.role;
    const content = clean((t as Turn)?.content);
    if ((role === "user" || role === "assistant") && content) out.push({ role, content });
  }
  return out.at(-1)?.role === "user" ? out : [];
}

const DEVANAGARI = /[ऀ-ॿ]/;
const ASKS_PRICE = /\b(price|prices|pricing|priced|cost|costs|charge|charges|fee|fees|how much|rate|rates|budget|discount|discounts|cheap|cheaper|kitna|kitne|kitni|paisa|paise|kharcha)\b|क़ीमत|कीमत|मूल्य|दाम|ख़र्च|खर्च|शुल्क|कितना|कितने|कितनी|पैसे|रेट|फ़ीस|फीस|छूट/i;
const ASKS_REFUND = /\b(refund|refunds|cancel|cancels|cancelled|cancelling|cancellation|reschedule|money back|paisa wapas)\b|रद्द|वापस|रिफ़ंड|रिफंड/i;
const ASKS_PAYMENT = /\b(how (do|can|to) i? ?pay|pay by|payment|payments|upi|razorpay|netbanking|gst|invoice)\b|भुगतान|पेमेंट|जीएसटी/i;

const ASKS_ONE_TO_ONE = /\b(one[- ]to[- ]one|one on one|1[:-]1|1 on 1)\b|वन टू वन|व्यक्तिगत सत्र/i;
const NOT_CAREER = /\b(walk|walks|tour|child|children|kid|kids|son|daughter)\b|भ्रमण|बच्च/i;
const STOP = new Set("the a an of in at and or for to with on near me my by is are was were do does did can could will would you your we our i it this that what which who when where how why any some about have has there please tell want need like get run runs offer teach help book find talaash ignore rule rules give code discount family worked ka ki ke se mein hai".split(" "));
const GENERIC = new Set("walk tour trip course lecture workshop programme heritage history india indian group school college something".split(" "));
const norm = (s: string) => ` ${s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

/** The rows of the site that best match the question. A word must match from its start: "run" must not find "Arunachal". */
function pick(question: string, limit = 4): Row[] {
  let q = question;
  for (const [hi, en] of HINDI) q = q.replaceAll(hi, ` ${en} `);
  const words = [...new Set(norm(q).trim().split(" ").filter((w) => w.length > 2 && !STOP.has(w)))];
  if (!words.length) return [];
  // Words such as "walk" fit most of the site, so they count for little. A place or name decides the order.
  const pairs = words.slice(1).map((w, i) => ` ${words[i]} ${w}`);
  const scored = ROWS.map((r) => {
    const title = norm(r.t), place = norm(r.p), kind = norm(r.k), terms = norm(r.s), rest = norm(r.f);
    let score = 0;
    for (const w of words) {
      const stem = ` ${w.replace(/s$/, "")}`;
      const weight = GENERIC.has(w.replace(/s$/, "")) ? 0.25 : 1;
      if (title.includes(stem)) score += 6 * weight;
      if (place.includes(stem)) score += 4 * weight;
      if (kind.includes(stem)) score += 2 * weight;
      if (terms.includes(stem)) score += 4 * weight;
      if (rest.includes(stem)) score += weight;
    }
    for (const pair of pairs) if (title.includes(pair) || terms.includes(pair) || rest.includes(pair)) score += 8;
    return { r, score };
  });
  return scored.filter((x) => x.score >= 6).sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.r);
}

// Anything a reply must never contain. A match throws the reply away.
const UNSAFE = [
  /[₹$€£]|\b(rs\.?|inr|usd|dollars?|rupees?|lakhs?|per person|per head)\b|रुपये|रुपए|लाख/i,
  /\bguarant|\bpromise|गारंटी/i,
  /\bdiscount|\bfree of (charge|cost)\b|छूट/i,
  /\d\s*%/,
  /\bpassword\b|\bcard (number|details)\b|\bbank details\b|\botp\b|पासवर्ड/i,
  /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|in|ai|net|org|io|dev|html)\b/i,
  /\bas an ai language model\b|\bsystem prompt\b/i,
];

/** Numbers in a reply must be numbers in the facts, so an invented date or length cannot get through. */
const digits = (s: string) => s.match(/\d[\d,]*/g)?.map((n) => n.replaceAll(",", "")) ?? [];
const UNITS = /\b(\d+)\s*(hour|day|night|week|month|year|km|kilomet|student|people|person|seat|session)/gi;
const measures = (s: string) => [...s.matchAll(UNITS)].map((m) => `${m[1]} ${m[2].toLowerCase()}`);
function safe(reply: string, facts: string, lang: Lang) {
  if (!reply || reply.length > 900) return false;
  if (UNSAFE.some((r) => r.test(reply))) return false;
  if (/[०-९]/.test(reply)) return false;
  // Hindi gets Hindi. Hindi typed in English letters may get either, so an English question is not checked here.
  if (lang === "hi" && !DEVANAGARI.test(reply)) return false;
  const known = new Set(digits(facts));
  const knownMeasures = new Set(measures(facts));
  return digits(reply).every((n) => known.has(n)) && measures(reply).every((m) => knownMeasures.has(m));
}

const HANDOVER: Record<Lang, string> = {
  en: "Our team can answer that properly, so I won't guess. Please message us on WhatsApp and someone will reply.",
  hi: "इसका सही उत्तर हमारी टीम देगी, इसलिए मैं अनुमान नहीं लगाऊँगा। कृपया WhatsApp पर संदेश भेजें, कोई व्यक्ति उत्तर देगा।",
};
const PRICE: Record<Lang, { found: string; none: string }> = {
  en: {
    found: "The current price is on the programme's own page, with GST included. Tap below to see it. For a group, WhatsApp us your group size and dates and we'll send a quotation.",
    none: "Each programme's page shows its current price, with GST included. Tell me which walk, course or trip you have in mind and I'll point you to it, or WhatsApp us your group size and dates for a quotation.",
  },
  hi: {
    found: "वर्तमान मूल्य कार्यक्रम के अपने पृष्ठ पर दिया गया है, GST सहित। देखने के लिए नीचे टैप करें। समूह के लिए, WhatsApp पर समूह का आकार और तिथियाँ भेजें, हम कोटेशन भेजेंगे।",
    none: "हर कार्यक्रम के पृष्ठ पर उसका वर्तमान मूल्य GST सहित दिया गया है। बताइए आप किस भ्रमण, पाठ्यक्रम या यात्रा के बारे में सोच रहे हैं, या कोटेशन के लिए WhatsApp पर समूह का आकार और तिथियाँ भेजें।",
  },
};
const ONE_TO_ONE: Record<Lang, string> = {
  en: "Yes, in four ways: a single online counselling session of about 60 minutes, an application clinic with a review of your statement of purpose and CV, a career course on one evening of 2 hours, or a career course over a weekend, with two sessions of 1 hour 30 minutes. Each page below shows the details and price.",
  hi: "हाँ, चार तरीकों से: लगभग 60 मिनट का एक ऑनलाइन परामर्श सत्र, आपके उद्देश्य-विवरण और CV की समीक्षा के साथ आवेदन क्लिनिक, एक शाम का 2 घंटे का करियर पाठ्यक्रम, या सप्ताहांत का करियर पाठ्यक्रम जिसमें 1 घंटे 30 मिनट के दो सत्र होते हैं। विवरण और मूल्य नीचे के पृष्ठों पर हैं।",
};
const ONE_TO_ONE_ROWS = ["product.html?slug=counselling-archaeology-careers", "product.html?slug=career-course-one-evening", "product.html?slug=career-course-weekend"]
  .map((u) => ROWS.find((r) => r.u === u)!);
const plain = (html: string) => html.replace(/<a [^>]*>(Full policy|पूरी नीति)<\/a>[.।]?/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// The site's own Hindi words, and small slips the model repeats.
const TIDY: [RegExp, string][] = [
  [/व्हाट्सएप|व्हाट्सऐप/g, "WhatsApp"], [/प्रोग्राम फाइंडर|प्रोग्राम फ़ाइंडर/g, "कार्यक्रम खोजक"], [/विरासत भ्रमण/g, "धरोहर भ्रमण"], [/तलाश हेरिटेज/g, "Talaash Heritage"],
  [/ in my facts/gi, ""],
];
const tidy = (reply: string) => TIDY.reduce((t, [from, to]) => t.replace(from, to), reply);
const FINDER: Record<Lang, { title: string; url: string }> = {
  en: { title: "Help me choose a programme", url: "finder.html" },
  hi: { title: "कार्यक्रम खोजक", url: "finder.html" },
};
const POLICY: Record<Lang, { title: string; url: string }> = {
  en: { title: "Cancellations and refunds", url: "shipping-returns.html" },
  hi: { title: "रद्द करने और वापसी की नीति", url: "shipping-returns.html" },
};
const DECLINED = /^Our team can help|^I am an AI assistant\. I c|^I cannot|I cannot provide|मैं .*नहीं कर सकता/;

async function hashed(ip: string, host: string) {
  const day = new Date().toISOString().slice(0, 10);
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${day}|${host}|${ip}`));
  return [...new Uint8Array(bytes)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function take(env: Env, visitor: string) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/assist_take`, {
      method: "POST",
      headers: { apikey: env.SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ p_visitor: visitor, p_visitor_cap: VISITOR_CAP, p_site_cap: SITE_CAP }),
      signal: AbortSignal.timeout(3000),
    });
    return res.ok && (await res.json()) === true;
  } catch {
    return false;
  }
}

function textOf(out: unknown) {
  const o = out as { response?: unknown; choices?: { message?: { content?: unknown } }[] };
  const raw = typeof o?.response === "string" ? o.response : o?.choices?.[0]?.message?.content;
  return typeof raw === "string" ? raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/[*_#`]/g, "").trim() : "";
}

export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  if (!sameSite(request)) return json({ ok: false, error: "forbidden" }, 403);
  const raw = await request.text();
  if (raw.length > 4000) return json({ ok: false, error: "too_large" }, 413);
  let body: { messages?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  const turns = readTurns(body.messages);
  if (!turns.length) return json({ ok: false, error: "bad_request" }, 400);

  const question = turns.at(-1)!.content;
  const lang: Lang = DEVANAGARI.test(question) ? "hi" : "en";
  // A short follow-up such as "and in Agra?" still finds its subject in the earlier question.
  const rows = pick(question).length ? pick(question) : pick(turns.filter((t) => t.role === "user").map((t) => t.content).join(" "));
  // A button always backs up "see below". A declined request gets no programme buttons, only the finder.
  const answer = (reply: string, source: "set" | "ai", only?: { title: string; url: string }[]) => {
    if (only) return json({ ok: true, reply, source, links: only });
    const pages = DECLINED.test(reply) ? [] : rows.slice(0, 3).map((r) => ({ title: r.t, url: r.u }));
    return json({ ok: true, reply, source, links: pages.length ? pages : [FINDER[lang]] });
  };

  // Fixed answers: these never reach the model, so they cost nothing and cannot drift.
  // (Price first: "How much is one-to-one?" must lead to the pages, which the matching rows do.)
  if (ASKS_PRICE.test(question)) return answer(rows.length ? PRICE[lang].found : PRICE[lang].none, "set");
  if (ASKS_REFUND.test(question)) return answer(plain(ANSWERS[lang][1][1]), "set", [POLICY[lang]]);
  if (ASKS_PAYMENT.test(question)) return answer(plain(ANSWERS[lang][0][1]), "set", []);
  if (ASKS_ONE_TO_ONE.test(question) && !NOT_CAREER.test(question)) return answer(ONE_TO_ONE[lang], "set", ONE_TO_ONE_ROWS.map((r) => ({ title: r.t, url: r.u })));

  if (!env.AI) return json({ ok: false, error: "unavailable" }, 503);
  const url = new URL(request.url);
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  // Branch previews count against the site's daily limit only, so a test run is not cut off at one visitor's limit.
  const preview = url.hostname.endsWith(".talaash-heritage.pages.dev");
  const visitor = preview ? crypto.randomUUID().replaceAll("-", "").slice(0, 24) : await hashed(ip, url.hostname);
  if (!(await take(env, visitor))) return json({ ok: false, error: "limit" }, 429);

  const policies = ANSWERS.en.slice(2).map(([q, a]) => `Q: ${q}\nA: ${plain(a)}`).join("\n");
  const found = rows.map((r) => `- ${r.t} (${r.k}${r.p ? `, ${r.p}` : ""}): ${r.f}`).join("\n") || "- Nothing on the site matches this question.";
  const facts = `${ABOUT}\n\nCOMMON QUESTIONS:\n${policies}\n\nFROM THE SITE, FOR THIS QUESTION:\n${found}`;
  const run = (name: string) =>
    Promise.race([
      env.AI!.run(name, {
        messages: [{ role: "system", content: `${RULES}\n\nFACTS:\n${facts}` }, ...turns],
        max_completion_tokens: 380,
        max_tokens: 380,
        temperature: 0.1,
        chat_template_kwargs: { enable_thinking: false },
      }),
      new Promise((_, no) => setTimeout(() => no(new Error("timeout")), MODEL_WAIT_MS)),
    ]);
  try {
    const out = await run(MODEL).catch((e) => {
      if (lang === "hi") throw e;
      return run(BACKUP_MODEL);
    });
    const reply = tidy(textOf(out));
    if (!reply) return json({ ok: false, error: "empty" }, 502);
    return safe(reply, facts, lang) ? answer(reply, "ai") : answer(HANDOVER[lang], "set");
  } catch (e) {
    console.error("assist: model failed", e instanceof Error ? e.message : "unknown");
    return json({ ok: false, error: "model" }, 502);
  }
}
