// dc-lite: a small runtime for the 3D model apps first built as Claude Design canvases.
// It runs the canvas's own markup (with {{ bindings }}, <sc-for>, <sc-if>, on* events and ref)
// and its own Component class, so the website shows the same model and interface as the canvas.
// Rendering patches the live DOM in place, so the WebGL canvas and any control being dragged
// are never recreated.

export class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; }
  setState(patch) {
    const p = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = Object.assign({}, this.state, p);
    if (this.__schedule) this.__schedule();
  }
  forceUpdate() { if (this.__schedule) this.__schedule(); }
}

const EVENTS = { onclick: 'click', onchange: 'input', oninput: 'input', onpointerdown: 'pointerdown', onpointerup: 'pointerup',
  onpointerleave: 'pointerleave', onpointercancel: 'pointercancel', onkeydown: 'keydown', onfocus: 'focus', onblur: 'blur' };
const ONE = /^\{\{\s*([\w.$]+)\s*\}\}$/;
const ANY = /\{\{\s*([\w.$]+)\s*\}\}/g;

function lookup(scope, path) {
  let v = scope;
  for (const k of path.split('.')) { if (v == null) return undefined; v = v[k]; }
  return v;
}
function interp(str, scope) {
  const m = str.match(ONE);
  if (m) return lookup(scope, m[1]);
  return str.replace(ANY, (_, p) => { const v = lookup(scope, p); return v == null ? '' : String(v); });
}

// Template node -> virtual nodes
function build(node, scope, out) {
  if (node.nodeType === 3) { out.push({ text: interp(node.nodeValue, scope) }); return; }
  if (node.nodeType !== 1) return;
  const tag = node.tagName.toLowerCase();
  if (tag === 'sc-for') {
    const list = interp(node.getAttribute('list') || '', scope) || [];
    const as = node.getAttribute('as') || 'item';
    const kids = [];
    list.forEach((item, i) => {
      const s = Object.create(scope); s[as] = item; s.$index = i;
      for (const c of node.childNodes) build(c, s, kids);
    });
    out.push({ tag: 'dc-group', attrs: { style: 'display:contents' }, events: {}, kids });
    return;
  }
  if (tag === 'sc-if') {
    const v = interp(node.getAttribute('value') || '', scope);
    const kids = [];
    if (v) for (const c of node.childNodes) build(c, scope, kids);
    out.push({ tag: 'dc-group', attrs: { style: 'display:contents' }, events: {}, kids });
    return;
  }
  const vn = { tag, attrs: {}, events: {}, kids: [], ns: node.namespaceURI };
  for (const a of node.attributes) {
    const name = a.name;
    if (name.startsWith('hint-')) continue;
    if (EVENTS[name]) { vn.events[EVENTS[name]] = interp(a.value, scope); continue; }
    if (name === 'ref') { vn.ref = interp(a.value, scope); continue; }
    vn.attrs[name] = interp(a.value, scope);
  }
  for (const c of node.childNodes) build(c, scope, vn.kids);
  out.push(vn);
}

function setAttr(el, k, v) {
  if (v === undefined || v === null || v === false) { el.removeAttribute(k); if (k === 'value' && 'value' in el) el.value = ''; return; }
  const s = String(v);
  if (k === 'value' && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) {
    if (el.value !== s) el.value = s;
    el.setAttribute('value', s);
    return;
  }
  if (el.getAttribute(k) !== s) el.setAttribute(k, s);
}

function create(vn) {
  if ('text' in vn) return document.createTextNode(vn.text);
  const el = vn.ns && vn.ns !== 'http://www.w3.org/1999/xhtml' ? document.createElementNS(vn.ns, vn.tag) : document.createElement(vn.tag);
  el.__h = {};
  for (const k in vn.attrs) setAttr(el, k, vn.attrs[k]);
  el.__a = vn.attrs;
  bindEvents(el, vn.events);
  for (const c of vn.kids) el.appendChild(create(c));
  if (el.tagName === 'SELECT' && 'value' in vn.attrs) el.value = vn.attrs.value;
  if (typeof vn.ref === 'function') vn.ref(el);
  return el;
}

function bindEvents(el, events) {
  el.__h = el.__h || {};
  for (const ev in events) {
    if (!el.__h[ev]) el.addEventListener(ev, (e) => { const f = el.__h[ev]; if (typeof f === 'function') f(e); });
    el.__h[ev] = events[ev];
  }
  for (const ev in el.__h) if (!(ev in events)) el.__h[ev] = null;
}

function patch(parent, vnodes) {
  const live = parent.childNodes;
  let i = 0;
  for (; i < vnodes.length; i++) {
    const vn = vnodes[i], el = live[i];
    if (!el) { parent.appendChild(create(vn)); continue; }
    if ('text' in vn) {
      if (el.nodeType === 3) { if (el.nodeValue !== vn.text) el.nodeValue = vn.text; }
      else parent.replaceChild(create(vn), el);
      continue;
    }
    if (el.nodeType !== 1 || el.tagName.toLowerCase() !== vn.tag) { parent.replaceChild(create(vn), el); continue; }
    // Only attributes this runtime set are managed: the 3D code's own changes (canvas size,
    // tabindex, cursor) are left alone.
    const prev = el.__a || {}, seen = {};
    for (const k in vn.attrs) { seen[k] = 1; if (el.tagName === 'CANVAS' && k === 'style' && prev.style === vn.attrs.style) continue; setAttr(el, k, vn.attrs[k]); }
    for (const k in prev) if (!seen[k]) el.removeAttribute(k);
    el.__a = vn.attrs;
    bindEvents(el, vn.events);
    if (el.tagName === 'CANVAS') continue; // never touch the WebGL canvas's insides
    patch(el, vn.kids);
    if (el.tagName === 'SELECT' && 'value' in vn.attrs && el.value !== String(vn.attrs.value)) el.value = vn.attrs.value;
  }
  while (live.length > vnodes.length) parent.removeChild(live[live.length - 1]);
}

export function mount(host, markup, Component, props) {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  const roots = Array.from(tpl.content.childNodes);
  const comp = new Component(props || {});
  let queued = false, mounted = false;
  const render = () => {
    queued = false;
    const vals = comp.renderVals ? comp.renderVals() : {};
    const scope = Object.assign(Object.create(null), vals);
    const out = [];
    for (const n of roots) build(n, scope, out);
    patch(host, out);
    if (mounted && comp.componentDidUpdate) comp.componentDidUpdate();
  };
  comp.__schedule = () => { if (!queued) { queued = true; Promise.resolve().then(render); } };
  render();
  mounted = true;
  if (comp.componentDidMount) comp.componentDidMount();
  return comp;
}
