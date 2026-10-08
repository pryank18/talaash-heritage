// Small touches of depth, loaded on every page.
// - Home hero: a gold gallery light follows the cursor and the seal turns
//   towards it; on touch screens the seal drifts slowly as the page scrolls.
// - Programme pictures and the planner tiles turn a little towards the pointer.
// Nothing here runs for visitors who ask their device for reduced motion,
// and nothing changes layout or moves text.

const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

function heroLight() {
  const hero = document.querySelector(".hero");
  const seal = hero?.querySelector(".hero-seal");
  if (!hero || !seal) return;

  let target = { x: 0, y: 0 };
  let now = { x: 0, y: 0 };
  let frame = 0;
  const apply = () => {
    // Ease towards the pointer so the seal moves like something heavy.
    now.x += (target.x - now.x) * 0.08;
    now.y += (target.y - now.y) * 0.08;
    seal.style.setProperty("--seal-ry", `${(now.x * 5).toFixed(2)}deg`);
    seal.style.setProperty("--seal-rx", `${(-now.y * 4).toFixed(2)}deg`);
    seal.style.setProperty("--seal-x", `${(now.x * 10).toFixed(1)}px`);
    seal.style.setProperty("--seal-y", `${(now.y * 8).toFixed(1)}px`);
    frame = Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.002 ? requestAnimationFrame(apply) : 0;
  };
  const kick = () => { if (!frame) frame = requestAnimationFrame(apply); };

  if (finePointer.matches) {
    hero.addEventListener("pointermove", (e) => {
      if (reduce.matches) return;
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      hero.style.setProperty("--light-x", `${(px * 100).toFixed(1)}%`);
      hero.style.setProperty("--light-y", `${(py * 100).toFixed(1)}%`);
      hero.classList.add("is-lit");
      target = { x: px * 2 - 1, y: py * 2 - 1 };
      kick();
    }, { passive: true });
    hero.addEventListener("pointerleave", () => {
      hero.classList.remove("is-lit");
      target = { x: 0, y: 0 };
      kick();
    });
  } else {
    // Touch screens: a slow parallax while the hero is on screen.
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (reduce.matches || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const r = hero.getBoundingClientRect();
        if (r.bottom < 0) return;
        seal.style.setProperty("--seal-y", `${Math.round(-r.top * 0.18)}px`);
      });
    }, { passive: true });
  }
}

const TILT = ".card-art, .planner-tile";
function tilt() {
  if (!finePointer.matches) return;
  let el = null;
  const reset = (node) => {
    node.classList.remove("is-tracking", "is-tilted");
    node.style.transform = "";
  };
  document.addEventListener("pointermove", (e) => {
    if (reduce.matches) return;
    const hit = e.target.closest?.(TILT);
    if (el && el !== hit) reset(el);
    el = hit;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    // Pictures turn a little more than the tiles, which carry text.
    const max = el.classList.contains("planner-tile") ? 4 : 7;
    el.classList.add("is-tracking", "is-tilted");
    el.style.transform = `perspective(700px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--sheen-x", `${((px + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty("--sheen-y", `${((py + 0.5) * 100).toFixed(0)}%`);
  }, { passive: true });
  document.addEventListener("pointerout", (e) => {
    if (el && !el.contains(e.relatedTarget)) { reset(el); el = null; }
  });
}

if (!reduce.matches) {
  heroLight();
  tilt();
}
