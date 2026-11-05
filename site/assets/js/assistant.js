// Khoji, the site assistant, inside the help panel. Replies come from functions/api/assist.ts and always carry a label saying
// so. Everything is shown as text, never as HTML. The conversation lives in this page only and is never stored.
import { CONFIG } from "./config.js";
import { lang } from "./i18n.js";
import { track } from "./track.js";

const EN = {
  label: "Ask Khoji",
  hello: "Hello, I'm Khoji from Talaash Heritage. Looking for a walk, a course or a trip, or curious about a place? Tell me what you have in mind.",
  ai: "Khoji",
  set: "Khoji",
  note: "Khoji is our AI guide. For anything important, please check with our team.",
  placeholder: "Type your question",
  send: "Send",
  thinking: "Khoji is typing",
  busy: "Sorry, I can't reply just now. Message our team on WhatsApp and someone will help you.",
  whatsapp: "WhatsApp us",
  chips: ["Walks in Delhi", "Something for a school group", "Career guidance in archaeology", "How do I cancel?"],
};
const HI = {
  label: "खोजी से पूछें",
  hello: "नमस्ते, मैं Talaash Heritage से खोजी हूँ। कोई भ्रमण, पाठ्यक्रम या यात्रा खोज रहे हैं, या किसी स्थान के बारे में जानना चाहते हैं? बताइए, आपके मन में क्या है।",
  ai: "खोजी",
  set: "खोजी",
  note: "खोजी हमारा AI मार्गदर्शक है। कोई भी महत्वपूर्ण बात हमारी टीम से पक्की कर लें।",
  placeholder: "अपना प्रश्न लिखें",
  send: "भेजें",
  thinking: "खोजी लिख रहा है",
  busy: "क्षमा करें, अभी उत्तर नहीं दे पा रहा हूँ। WhatsApp पर हमारी टीम को संदेश भेज दीजिए, वे आपकी सहायता करेंगे।",
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
    // A reply that sends someone to WhatsApp, with no page to offer, carries the button.
    if (m.failed || (/WhatsApp/.test(m.content) && !(m.links || []).length)) {
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
