// Instagram posts load only when the visitor asks for them. Until then each
// post shows as a plain link to Instagram (the blockquote's own fallback), no
// request goes to Instagram and it can set no cookies. One press on "Show the
// Instagram posts" loads them all; the choice is remembered in this browser
// (th_embeds) so returning visitors see them straight away.
const KEY = "th_embeds";
const SRC = "https://www.instagram.com/embed.js";

function remembered() {
  try { return localStorage.getItem(KEY) === "instagram"; } catch { return false; }
}

function load() {
  document.querySelectorAll(".embed-gate").forEach((el) => el.remove());
  if (document.querySelector(`script[src="${SRC}"]`)) {
    window.instgrm?.Embeds?.process();
    return;
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = SRC;
  document.body.appendChild(s);
}

export function initEmbeds() {
  const posts = document.querySelectorAll("blockquote.instagram-media");
  if (!posts.length) return;
  if (remembered()) return load();
  const hi = document.documentElement.getAttribute("data-lang") === "hi";
  // One button above each group of posts (the grid on the creator page, the
  // "Watch it" block on a programme page, the reel list on watch.html).
  const groups = new Set(Array.from(posts, (p) => p.closest(".ig-grid, .reel-grid, .reels-on-page") || p.parentElement));
  for (const g of groups) {
    const gate = document.createElement("div");
    gate.className = "embed-gate";
    gate.innerHTML = `<button type="button" class="btn btn-outline btn-small">${hi ? "Instagram पोस्ट दिखाएँ" : "Show the Instagram posts"}</button>
      <span class="small muted">${hi ? "दबाने पर Instagram से जुड़ेंगे, जो अपनी कुकीज़ सेट कर सकता है।" : "This connects to Instagram, which may set its own cookies."}</span>`;
    gate.querySelector("button").addEventListener("click", () => {
      try { localStorage.setItem(KEY, "instagram"); } catch { /* this page only */ }
      load();
    });
    g.parentNode.insertBefore(gate, g);
  }
}
