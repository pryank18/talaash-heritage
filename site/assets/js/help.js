// The "Ask us" button at the bottom right of every page. It opens a panel with
// WhatsApp, email and call buttons and short answers to the questions buyers
// ask most. The answers are fixed text taken from the site's own policies and
// prices, so nothing here can promise what the business does not offer. If you
// change a policy or a payment method, change the answer here too.
// The WhatsApp message carries the page the visitor was on.
import { CONFIG } from "./config.js";
import { lang } from "./i18n.js";
import { esc } from "./ui.js";
import { track } from "./track.js";

const HIDE_ON = new Set(["admin.html", "seller.html"]);
const raw = location.pathname.split("/").pop() || "index";
const page = raw.endsWith(".html") ? raw : `${raw}.html`;

const EN = {
  button: "Ask us",
  title: "Questions? Ask us",
  lede: "Message us on WhatsApp and someone from our team replies. Or open one of the common questions below.",
  whatsapp: "Chat on WhatsApp",
  email: "Email",
  call: "Call",
  close: "Close",
  common: "Common questions",
  proof: `Rated ${CONFIG.googleRating.score} on Google from ${CONFIG.googleRating.count} reviews`,
  qa: [
    ["How do I pay?",
      "By card, netbanking or UPI through Razorpay, and your booking is confirmed at once. You can also pay by UPI directly, or send the order on WhatsApp and pay when we reply. All prices include GST, and a GST invoice is issued on request."],
    ["Can I cancel or change my booking?",
      `Lectures, courses and career courses: full refund if you cancel 48 hours or more before the start. Heritage walks and experiences: full refund 72 hours or more before. One-to-one counselling: move your slot free up to 24 hours before. If we cancel, you choose a new date or a full refund. <a href="shipping-returns.html">Full policy</a>.`],
    ["How do online sessions work?",
      "They are live, so you can ask questions as you go. Once your payment is confirmed, the joining link appears on your order page, and we also send it by email and WhatsApp the day before. If you cannot find it, message us."],
    ["Can you arrange this for my school, college or company?",
      "Yes. Walks, lectures, workshops and trips can be arranged for your group on your dates. Schools get a per-student rate on walks, workshops and day trips. Send your group size, dates and city, and we reply with a plan and a quotation. You pay nothing until you approve it."],
    ["Which programme suits me?",
      `Answer a few quick questions and the <a href="finder.html">programme finder</a> suggests the right walk, course or trip. Or tell us on WhatsApp what you are looking for.`],
    ["Which language are sessions in?",
      "Programmes arranged for your group are taught in English or Hindi, as you prefer. For dated courses, the language is listed on the programme page."],
    ["Who teaches?",
      `The Talaash Heritage team of archaeologists and historians. Career courses are taught by <a href="archaeologywala.html">@archaeologywala</a>, an archaeologist trained at Deccan College, Pune.`],
  ],
};

const HI = {
  button: "पूछें",
  title: "कोई प्रश्न? हमसे पूछें",
  lede: "हमें WhatsApp पर संदेश भेजें, हमारी टीम का कोई सदस्य उत्तर देगा। या नीचे दिए गए सामान्य प्रश्न देखें।",
  whatsapp: "WhatsApp पर बात करें",
  email: "ईमेल",
  call: "फ़ोन करें",
  close: "बंद करें",
  common: "सामान्य प्रश्न",
  proof: `Google पर ${CONFIG.googleRating.count} समीक्षाओं से ${CONFIG.googleRating.score} रेटिंग`,
  qa: [
    ["भुगतान कैसे करें?",
      "Razorpay के माध्यम से कार्ड, नेटबैंकिंग या UPI से भुगतान करें, आपकी बुकिंग तुरंत पक्की हो जाती है। आप सीधे UPI से भी भुगतान कर सकते हैं, या WhatsApp पर ऑर्डर भेजकर हमारे उत्तर के बाद भुगतान कर सकते हैं। सभी मूल्यों में GST शामिल है, और माँगने पर GST बिल दिया जाता है।"],
    ["क्या मैं बुकिंग रद्द या बदल सकता हूँ?",
      `व्याख्यान, पाठ्यक्रम और करियर पाठ्यक्रम: आरंभ से 48 घंटे या उससे पहले रद्द करने पर पूरी राशि वापस। धरोहर भ्रमण और अनुभव: 72 घंटे या उससे पहले रद्द करने पर पूरी राशि वापस। व्यक्तिगत परामर्श: 24 घंटे पहले तक समय निःशुल्क बदलें। यदि हम कार्यक्रम रद्द करें, तो आप नई तिथि या पूरी राशि वापसी चुन सकते हैं। <a href="shipping-returns.html">पूरी नीति</a>।`],
    ["ऑनलाइन सत्र कैसे होते हैं?",
      "सत्र लाइव होते हैं, इसलिए आप बीच में प्रश्न पूछ सकते हैं। भुगतान की पुष्टि होते ही जुड़ने का लिंक आपके ऑर्डर पृष्ठ पर दिखता है, और एक दिन पहले हम उसे ईमेल और WhatsApp पर भी भेजते हैं। लिंक न मिले, तो हमें संदेश भेजें।"],
    ["क्या आप इसे मेरे विद्यालय, महाविद्यालय या कंपनी के लिए आयोजित कर सकते हैं?",
      "हाँ। भ्रमण, व्याख्यान, कार्यशालाएँ और यात्राएँ आपकी तिथियों पर आपके समूह के लिए आयोजित की जा सकती हैं। भ्रमण, कार्यशालाओं और एक दिन की यात्राओं पर विद्यालयों के लिए प्रति विद्यार्थी दर है। समूह का आकार, तिथियाँ और शहर भेजें, हम योजना और कोटेशन भेजेंगे। आपकी स्वीकृति तक कोई भुगतान नहीं।"],
    ["मेरे लिए कौन सा कार्यक्रम सही है?",
      `कुछ आसान प्रश्नों के उत्तर दें, <a href="finder.html">कार्यक्रम खोजक</a> आपके लिए सही भ्रमण, पाठ्यक्रम या यात्रा सुझाएगा। या WhatsApp पर बताएँ कि आप क्या खोज रहे हैं।`],
    ["सत्र किस भाषा में होते हैं?",
      "आपके समूह के लिए आयोजित कार्यक्रम अंग्रेज़ी या हिन्दी में, आपकी पसंद के अनुसार होते हैं। निश्चित तिथि वाले पाठ्यक्रमों की भाषा कार्यक्रम के पृष्ठ पर दी गई है।"],
    ["कौन पढ़ाता है?",
      `Talaash Heritage के पुरातत्वविदों और इतिहासकारों की टीम। करियर पाठ्यक्रम <a href="archaeologywala.html">@archaeologywala</a> पढ़ाते हैं, जिन्होंने डेक्कन कॉलेज, पुणे से पुरातत्व की शिक्षा ली है।`],
  ],
};

/** The prefilled WhatsApp message, naming what the visitor was looking at. */
function message() {
  const heading = document.querySelector("main h1")?.textContent.trim() || document.title.split(" | ")[0];
  const ref = (document.body.dataset.slug || new URLSearchParams(location.search).get("slug") || page.replace(/\.html$/, "")).slice(0, 80);
  const programme = Boolean(document.body.dataset.slug) || page === "product.html";
  const paying = page === "checkout.html" || page === "cart.html";
  if (lang === "hi") {
    return paying
      ? `नमस्ते ${CONFIG.brand}, भुगतान से पहले मेरा एक प्रश्न है: \n\n(ref: ${ref})`
      : programme
      ? `नमस्ते ${CONFIG.brand}, "${heading}" के बारे में मेरा एक प्रश्न है: \n\n(ref: ${ref})`
      : `नमस्ते ${CONFIG.brand}, मेरा एक प्रश्न है: \n\n(ref: ${ref})`;
  }
  return paying
    ? `Hello ${CONFIG.brand}, I have a question before I pay: \n\n(ref: ${ref})`
    : programme
    ? `Hello ${CONFIG.brand}, I have a question about "${heading}": \n\n(ref: ${ref})`
    : `Hello ${CONFIG.brand}, I have a question: \n\n(ref: ${ref})`;
}

const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 18.5 5.6 15A7.5 7.5 0 1 1 9 18.4z"/><path d="M9 10.5h6M9 13.5h3.5"/></svg>';

export function initHelp() {
  if (HIDE_ON.has(page) || document.querySelector(".help-fab")) return;
  const L = lang === "hi" ? HI : EN;

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "help-fab";
  fab.setAttribute("data-no-translate", "");
  fab.setAttribute("aria-haspopup", "dialog");
  fab.innerHTML = `${ICON}<span>${esc(L.button)}</span>`;

  const panel = document.createElement("dialog");
  panel.className = "help-panel";
  panel.setAttribute("aria-labelledby", "help-title");
  panel.setAttribute("data-no-translate", "");
  if (lang === "hi") panel.lang = "hi";

  const draw = () => {
    const text = message();
    const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
    const mail = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(L.title)}&body=${encodeURIComponent(text)}`;
    panel.innerHTML = `
      <div class="help-head">
        <h2 id="help-title">${esc(L.title)}</h2>
        <button class="sheet-close" type="button" data-help-close aria-label="${esc(L.close)}">×</button>
      </div>
      <div class="help-body">
        <p class="help-lede">${esc(L.lede)}</p>
        <div class="help-actions">
          <a class="btn btn-primary" href="${esc(wa)}" target="_blank" rel="noopener">${esc(L.whatsapp)}</a>
          <a class="btn btn-outline" href="${esc(mail)}">${esc(L.email)}</a>
          <a class="btn btn-outline" href="tel:${esc(CONFIG.contactPhone.replace(/\s+/g, ""))}">${esc(L.call)}</a>
        </div>
        <h3>${esc(L.common)}</h3>
        <div class="help-qa">
          ${L.qa.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join("")}
        </div>
        <p class="help-proof"><a href="${esc(CONFIG.socials.find((s) => s.label === "Google reviews")?.href || "contact.html")}" target="_blank" rel="noopener">★ ${esc(L.proof)}</a></p>
      </div>`;
    panel.querySelector("[data-help-close]").addEventListener("click", () => panel.close());
    panel.querySelectorAll("details").forEach((d) =>
      d.addEventListener("toggle", () => { if (d.open) track("help_question", { label: d.querySelector("summary").textContent.slice(0, 200) }); }),
    );
  };

  fab.addEventListener("click", () => {
    draw();
    panel.showModal();
    track("help_open", { label: page });
  });
  // A tap on the dimmed area outside the panel closes it.
  panel.addEventListener("click", (e) => { if (e.target === panel) panel.close(); });
  panel.addEventListener("close", () => fab.focus());

  document.body.append(fab, panel);
  document.body.classList.add("has-help");
}
