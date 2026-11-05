// Cloudflare Pages Function: POST /api/assist. Khoji, the site assistant inside the help panel.
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
type Row = { t: string; u: string; k: string; p: string; f: string; s: string; x?: string };
type Lang = "en" | "hi";

const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const BACKUP_MODEL = "@cf/zai-org/glm-4.7-flash"; // English only, as on the agency site.
const SITE_CAP = 100; // Replies a day. The free 10,000 Neurons are per Cloudflare account, so this leaves room for other sites.
const VISITOR_CAP = 20;
const MODEL_WAIT_MS = 11000;
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
// Hindi typed in English letters is answered in proper Hindi by the main model.
const ROMAN_HINDI = /\b(mujhe|mujhko|hamein|humein|karni|karna|chahiye|chahta|chahti|kaise|kitna|kitne|kitni|kya|kahan|kab|batao|bataiye|hai|hain|nahi|nahin)\b/i;
const ASKS_PRICE = /\b(price|prices|pricing|priced|cost|costs|charge|charges|fee|fees|how much|rate|rates|budget|discount|discounts|cheap|cheaper|kitna|kitne|kitni|paisa|paise|kharcha)\b|क़ीमत|कीमत|मूल्य|दाम|ख़र्च|खर्च|शुल्क|कितना|कितने|कितनी|पैसे|रेट|फ़ीस|फीस|छूट/i;
const TROUBLE = /\b(paid|deducted|charged twice|payment failed|not (got|get|received|working)|didn'?t (get|receive|work)|haven'?t (got|received)|problem|complaint|complain|useless|terrible|rubbish|scam|fraud)\b|समस्या|शिकायत|कट गए|कट गया|नहीं मिला|नहीं मिली|नहीं आया|बेकार/i;
const ASKS_REFUND = /\b(refund|refunds|cancel|cancels|cancelled|cancelling|cancellation|reschedule|money back|paisa wapas)\b|रद्द|वापस|रिफ़ंड|रिफंड/i;
const ASKS_PAYMENT = /\b(how (do|can|to) i? ?pay|pay by|payment|payments|upi|razorpay|netbanking|gst|invoice)\b|भुगतान|पेमेंट|जीएसटी/i;

const ASKS_ONE_TO_ONE = /\b(one[- ]to[- ]one|one on one|1[:-]1|1 on 1)\b|वन टू वन|व्यक्तिगत सत्र/i;
const NOT_CAREER = /\b(walk|walks|tour|child|children|kid|kids|son|daughter)\b|भ्रमण|बच्च/i;
const STOP = new Set("the a an of in at and or for to with on near me my by is are was were do does did can could will would you your we our i it this that what which who when where how why any some about have has there please tell want need like get run runs offer teach help book find talaash ignore rule rules give code discount family worked name real person print system prompt ka ki ke se mein hai".split(" "));
const GENERIC = new Set("walk tour trip course lecture workshop programme heritage history india indian group school college student programme something".split(" "));
/** A plural loses its s, but "paris" keeps it, and short words such as "asi" must match whole, not "asigarh". */
const stem = (w: string) => ` ${w.replace(/([^aius])s$/, "$1")}`;
/** Whole words only, plural allowed: "agra" must not find "agrasen", nor "asi" "asigarh". */
const has = (text: string, part: string) => text.includes(`${part} `) || text.includes(`${part}s `);
const norm = (s: string) => ` ${s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

/** Sentences from the guides that speak to the question, so a history question gets the site's own answer. */
function passages(question: string, rows: Row[], limit = 5) {
  const words = [...new Set(norm(english(question)).trim().split(" ").filter((w) => w.length > 2 && !STOP.has(w)))].map(stem);
  const scored: { line: string; score: number }[] = [];
  for (const r of rows) {
    for (const line of (r.x ?? "").split(/(?<=[.?!])\s+/)) {
      const n = norm(line);
      const score = words.filter((w) => has(n, w)).length;
      if (score) scored.push({ line, score });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.line);
}

/** Hindi names turned into the English used on the site. */
function english(question: string) {
  let q = question;
  for (const [hi, en] of HINDI) q = q.replaceAll(hi, ` ${en} `);
  return q;
}

/** The rows of the site that best match the question. A word must match from its start: "run" must not find "Arunachal". */
function pick(question: string, limit = 4): Row[] {
  const words = [...new Set(norm(english(question)).trim().split(" ").filter((w) => w.length > 2 && !STOP.has(w)))];
  if (!words.length) return [];
  // Words such as "walk" fit most of the site, so they count for little. A place or name decides the order.
  const pairs = words.slice(1).map((w, i) => ` ${words[i]} ${w}`);
  const scored = ROWS.map((r) => {
    const title = norm(r.t), place = norm(r.p), kind = norm(r.k), terms = norm(r.s), rest = norm(r.f);
    let score = 0;
    for (const w of words) {
      const part = stem(w);
      const weight = GENERIC.has(part.trim()) ? 0.25 : 1;
      if (has(title, part)) score += 6 * weight;
      if (has(place, part)) score += 4 * weight;
      if (has(kind, part)) score += 2 * weight;
      if (has(terms, part)) score += 4 * weight;
      if (has(rest, part)) score += weight;
    }
    for (const pair of pairs) if (title.includes(pair) || terms.includes(pair) || rest.includes(pair)) score += 8;
    return { r, score };
  });
  const kept = scored.filter((x) => x.score >= 6).sort((a, b) => b.score - a.score).slice(0, limit);
  const best = kept[0]?.score ?? 0;
  return (limit > 4 ? kept : kept.filter((x) => x.score >= best * 0.5)).map((x) => x.r);
}

// Anything a reply must never contain. A match throws the reply away.
const UNSAFE = [
  /[₹$€£]|\b(rs\.?|inr|usd|dollars?|rupees?|lakhs?|per person|per head)\b|रुपये|रुपए|लाख/i,
  /(?<!(?:can't|cannot|can not|not|never) )\b(guarantee|promise)/i, /(?<!नहीं )गारंटी/,
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
  if ((lang === "hi") !== DEVANAGARI.test(reply)) return false;
  const known = new Set(digits(facts));
  const knownMeasures = new Set(measures(facts));
  return digits(reply).every((n) => known.has(n)) && measures(reply).every((m) => knownMeasures.has(m));
}

const HANDOVER: Record<Lang, string> = {
  en: "That one's best answered by our team, and I'd rather not guess. Drop us a message on WhatsApp and someone will get back to you.",
  hi: "इसका सही उत्तर हमारी टीम ही दे पाएगी, मैं अनुमान नहीं लगाना चाहता। WhatsApp पर संदेश भेज दीजिए, हमारी टीम आपसे बात करेगी।",
};
const PRICE: Record<Lang, { found: string; none: string }> = {
  en: {
    found: "You'll find the current price, GST included, on the page below. If it's for a group, send us your group size and dates on WhatsApp and we'll put a quotation together.",
    none: "It depends on the programme, and each page shows its current price with GST included. Which walk, course or trip do you have in mind? For a group, send us your size and dates on WhatsApp and we'll put a quotation together.",
  },
  hi: {
    found: "वर्तमान मूल्य, GST सहित, नीचे दिए गए पृष्ठ पर मिल जाएगा। अगर समूह के लिए चाहिए, तो WhatsApp पर समूह का आकार और तिथियाँ भेज दीजिए, हम कोटेशन तैयार कर देंगे।",
    none: "यह कार्यक्रम पर निर्भर करता है, और हर पृष्ठ पर वर्तमान मूल्य GST सहित दिया गया है। आप किस भ्रमण, पाठ्यक्रम या यात्रा के बारे में सोच रहे हैं? समूह के लिए WhatsApp पर आकार और तिथियाँ भेज दीजिए, हम कोटेशन तैयार कर देंगे।",
  },
};
const SORRY: Record<Lang, string> = {
  en: "I'm sorry about that. Please message our team on WhatsApp, with your order number if you have one, and they'll look into it for you.",
  hi: "इसके लिए क्षमा करें। कृपया WhatsApp पर हमारी टीम को संदेश भेजें, ऑर्डर नंबर हो तो वह भी लिख दें, वे इसे देख लेंगे।",
};
const ONE_TO_ONE: Record<Lang, string> = {
  en: "Yes, and you can choose what suits you: a single online counselling session of about 60 minutes, an application clinic with a review of your statement of purpose and CV, a 2-hour career course on one evening, or a career course over a weekend, with two sessions of 1 hour 30 minutes. Details and prices are on the pages below.",
  hi: "हाँ, आप अपनी सुविधा से चुन सकते हैं: लगभग 60 मिनट का एक ऑनलाइन परामर्श सत्र, आपके उद्देश्य-विवरण और CV की समीक्षा के साथ आवेदन क्लिनिक, एक शाम का 2 घंटे का करियर पाठ्यक्रम, या सप्ताहांत का करियर पाठ्यक्रम जिसमें 1 घंटे 30 मिनट के दो सत्र होते हैं। विवरण और मूल्य नीचे के पृष्ठों पर हैं।",
};
const ONE_TO_ONE_ROWS = ["product.html?slug=counselling-archaeology-careers", "product.html?slug=career-course-one-evening", "product.html?slug=career-course-weekend"]
  .map((u) => ROWS.find((r) => r.u === u)!);
const plain = (html: string) => html.replace(/<a [^>]*>(Full policy|पूरी नीति)<\/a>[.।]?/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// The site's own Hindi words, and small slips the model repeats.
const TIDY: [RegExp, string][] = [
  [/व्हाट्सएप|व्हाट्सऐप/g, "WhatsApp"], [/प्रोग्राम फाइंडर|प्रोग्राम फ़ाइंडर/g, "कार्यक्रम खोजक"], [/विरासत भ्रमण/g, "धरोहर भ्रमण"], [/तलाश हेरिटेज/g, "Talaash Heritage"],
  [/का कार्यक्रम खोजक हूँ/g, "का AI मार्गदर्शक हूँ"], [/Schools and colleges (get|receive)/g, "Schools $1"], [/विरासत वाली सैर/g, "धरोहर भ्रमण"], [/कश्मीरे गेट/g, "कश्मीरी गेट"], [/AI गाइड/g, "AI मार्गदर्शक"], [/कस्टमाइज़/g, "अपने अनुसार तय"],
  [/\[[^\]]*\]/g, ""], [/[^.!?।]*\bI(?:'ve| have) put\b[^.!?।]*[.!?।]?/gi, ""], [/ in my facts/gi, ""], [/\s*(Please )?see below\.?$/i, ""], [/\s*नीचे देखें।?$/, ""],
];
const tidy = (reply: string) =>
  TIDY.reduce((t, [from, to]) => t.replace(from, to), reply)
    .replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
    .replace(/\s+/g, " ")
    .trim();
const FINDER: Record<Lang, { title: string; url: string }> = {
  en: { title: "Help me choose a programme", url: "finder.html" },
  hi: { title: "कार्यक्रम खोजक", url: "finder.html" },
};
const POLICY: Record<Lang, { title: string; url: string }> = {
  en: { title: "Cancellations and refunds", url: "shipping-returns.html" },
  hi: { title: "रद्द करने और वापसी की नीति", url: "shipping-returns.html" },
};
const DECLINED = /^Our team can help|^I am sorry|^I'm sorry|^Sorry|^I can't (give|write|share|provide)|outside what|can't help with|^I can only|^I am (Khoji, )?an AI assistant\. I c|^I cannot|I cannot provide|मैं .*नहीं कर सकता/;

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
  const lang: Lang = DEVANAGARI.test(question) || ROMAN_HINDI.test(question) ? "hi" : "en";
  // A short follow-up such as "and in Agra?" still finds its subject in the earlier question.
  const rows = pick(question).length ? pick(question) : pick(turns.filter((t) => t.role === "user").map((t) => t.content).join(" "));
  // Page buttons, programmes first. A declined request gets none.
  const answer = (reply: string, source: "set" | "ai", only?: { title: string; url: string }[]) => {
    if (only) return json({ ok: true, reply, source, links: only });
    const pages = DECLINED.test(reply) ? [] : [...rows.filter((r) => r.k !== "Guide"), ...rows.filter((r) => r.k === "Guide")].slice(0, 3).map((r) => ({ title: r.t, url: r.u }));
    return json({ ok: true, reply, source, links: pages.length || !/finder|खोजक/i.test(reply) ? pages : [FINDER[lang]] });
  };

  // Fixed answers: these never reach the model, so they cost nothing and cannot drift.
  if (TROUBLE.test(question)) return answer(SORRY[lang], "set", []);
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
  const lines = passages(question, pick(question, 8));
  const notes = lines.length ? `\n\nFROM OUR GUIDES:\n${lines.join("\n")}` : "";
  const facts = `${ABOUT}\n\nCOMMON QUESTIONS:\n${policies}\n\nFROM THE SITE, FOR THIS QUESTION:\n${found}${notes}`;
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
      // Hindi tries the main model again: the backup's Hindi did not pass our read.
      return run(lang === "hi" ? MODEL : BACKUP_MODEL);
    });
    const reply = tidy(textOf(out));
    if (!reply) return json({ ok: false, error: "empty" }, 502);
    return safe(reply, facts, lang) ? answer(reply, "ai") : answer(HANDOVER[lang], "set");
  } catch (e) {
    console.error("assist: model failed", e instanceof Error ? e.message : "unknown");
    return answer(HANDOVER[lang], "set");
  }
}
