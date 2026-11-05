// Asks the site assistant on a deployed copy a fixed set of questions and writes the answers to assist-report.md for a person to read.
// Usage: node tools/assist-check.mjs https://assistant.talaash-heritage.pages.dev
import { writeFileSync } from "node:fs";
const base = process.argv[2];
const qs = ["mujhe delhi me walk karni hai", "kya aap school ke liye program karte hain?", "मेरे बच्चे के लिए कुछ है?", "ताज महल कब बना?", "Hello", "Is there anything in Mumbai?"];
const convo = [["Walks in Delhi", "We have several walks in Delhi. Who is it for?"], "It's for my college students"];
let out = "# Assistant check\n\n", bad = 0;
for (const q of qs) {
  let line;
  try {
    const res = await fetch(`${base}/api/assist`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify({ messages: [{ role: "user", content: q }] }) });
    const text = await res.text();
    try {
      const o = JSON.parse(text);
      if (!o.ok) bad++;
      line = `[${res.status} ${o.source ?? o.error}] ${o.reply ?? ""}\n  links: ${(o.links ?? []).map((l) => l.url).join(", ")}`;
    } catch { bad++; line = `[${res.status} not json] ${text.slice(0, 120)}`; }
  } catch (e) { bad++; line = `[failed] ${e.message}`; }
  out += `Q: ${q}\nA: ${line}\n\n`;
}
{
  const [[a, b], c] = convo;
  const res = await fetch(`${base}/api/assist`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify({ messages: [{ role: "user", content: a }, { role: "assistant", content: b }, { role: "user", content: c }] }) });
  out += `Follow-up: ${c}\nA: ${(await res.text()).slice(0, 700)}\n\n`;
}
writeFileSync("assist-report.md", `${out}\nFailures: ${bad} of ${qs.length}\n`);
