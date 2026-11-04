// The site assistant inside the "Ask us" panel. Replies come from functions/api/assist.ts and always carry a label saying
// so. Everything is shown as text, never as HTML. The conversation lives in this page only and is never stored.
import { CONFIG } from "./config.js";
import { lang } from "./i18n.js";
import { track } from "./track.js";

const EN = {
  label: "Ask the assistant",
  hello: "Hello. Ask me about a walk, a course, a city or a topic, and I'll point you to the right programme.",
  ai: "AI reply",
  set: "From our policies",
  note: "AI can make mistakes. Please confirm anything important with our team.",
  placeholder: "Type your question",
  send: "Send",
  thinking: "Writing a reply",
  busy: "I can't answer just now. Please message our team on WhatsApp, and a person will reply.",
  whatsapp: "WhatsApp us",
  chips: ["Walks in Delhi", "Something for a school group", "Career guidance in archaeology", "How do I cancel?"],
};
const HI = {
  label: "सहायक से पूछें",
  hello: "नमस्ते। किसी भ्रमण, पाठ्यक्रम, शहर या विषय के बारे में पूछें, मैं आपको सही कार्यक्रम तक पहुँचाऊँगा।",
  ai: "AI का उत्तर",
  set: "हमारी नीति से",
  note: "AI से ग़लती हो सकती है। कोई भी महत्वपूर्ण बात हमारी टीम से पक्की कर लें।",
  placeholder: "अपना प्रश्न लिखें",
  send: "भेजें",
  thinking: "उत्तर लिखा जा रहा है",
  busy: "अभी उत्तर नहीं दे पा रहा हूँ। कृपया WhatsApp पर हमारी टीम को संदेश भेजें, कोई व्यक्ति उत्तर देगा।",
  whatsapp: "WhatsApp करें",
  chips: ["दिल्ली में भ्रमण", "विद्यालय के समूह के लिए कार्यक्रम", "पुरातत्व में करियर मार्गदर्शन", "बुकिंग कैसे रद्द करें?"],
};

const history = []; // { role, content, source?, links? }
let waiting = false;

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

export function mountAssistant(box) {
  const L = lang === "hi" ? HI : EN;
  box.className = "assist";
  box.replaceChildren();

  const log = el("div", "assist-log");
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");
  log.setAttribute("tabindex", "0");
  log.setAttribute("aria-label", L.label);
  const chips = el("div", "assist-chips");
  const form = el("form", "assist-form");
  const input = el("input");
  input.type = "text";
  input.maxLength = 400;
  input.autocomplete = "off";
  input.placeholder = L.placeholder;
  input.setAttribute("aria-label", L.placeholder);
  const send = el("button", "btn btn-primary", L.send);
  send.type = "submit";
  form.append(input, send);
  box.append(log, chips, form, el("p", "assist-note", L.note));

  const bubble = (m) => {
    const b = el("div", `assist-msg ${m.role === "user" ? "is-user" : "is-bot"}`);
    if (m.source) b.append(el("span", "assist-label", m.source === "ai" ? L.ai : L.set));
    b.append(el("p", "", m.content));
    (m.links || []).forEach((l) => {
      // Only pages of this site, written by the server from the site's own data.
      if (!/^[a-z0-9?=&_.-]+$/i.test(l.url)) return;
      const a = el("a", "assist-link", l.title);
      a.href = l.url;
      b.append(a);
    });
    if (m.failed) {
      const a = el("a", "btn btn-outline assist-wa", L.whatsapp);
      a.href = `https://wa.me/${CONFIG.whatsappNumber}`;
      a.target = "_blank";
      a.rel = "noopener";
      b.append(a);
    }
    return b;
  };

  const draw = () => {
    log.replaceChildren(bubble({ role: "assistant", content: L.hello }), ...history.map(bubble));
    if (waiting) log.append(el("p", "assist-wait", L.thinking));
    chips.replaceChildren();
    if (!history.length) {
      L.chips.forEach((c) => {
        const b = el("button", "assist-chip", c);
        b.type = "button";
        b.addEventListener("click", () => ask(c));
        chips.append(b);
      });
    }
    send.disabled = waiting;
    log.scrollTop = log.scrollHeight;
  };

  async function ask(text) {
    const q = text.trim();
    if (!q || waiting) return;
    if (!history.length) track("help_question", { label: "assistant" });
    history.push({ role: "user", content: q });
    waiting = true;
    input.value = "";
    draw();
    let msg = { role: "assistant", content: L.busy, failed: true };
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-6).map(({ role, content }) => ({ role, content })) }),
        signal: AbortSignal.timeout(25000),
      });
      const out = await res.json();
      if (out.ok && out.reply) msg = { role: "assistant", content: out.reply, source: out.source, links: out.links };
    } catch { /* The busy message stands, with its WhatsApp button. */ }
    history.push(msg);
    waiting = false;
    draw();
    input.focus();
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });
  draw();
}
