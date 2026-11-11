// Talaash Heritage 3D model viewer (three.js, vendored; no CDN).
// A page supplies a build(api) function that adds meshes and labels; this file does the
// renderer, orbit and zoom (mouse, touch and keyboard), labels with evidence tags, the
// parts list, preset views, layer toggles, full screen, and the no-WebGL fallback (the
// still image and the facts stay on the page).
//
// Behaviour by device:
// - Phones and tablets: the model turns slowly on its own; one-finger drags scroll the page
//   as usual. "Explore in 3D" opens the model full screen, where drag turns and pinch zooms.
// - Mouse: drag turns; Ctrl/⌘ + scroll zooms (plain scrolling keeps scrolling the page);
//   + and − buttons zoom too. Full screen is optional.
// - Keyboard: focus the model, arrows turn, + and − zoom, 0 resets, Esc leaves full screen.
import * as THREE from '../vendor/three/three.module.min.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

const TAGS = ['Measured', 'Documented', 'Comparative', 'Hypothetical', 'Reconstructed', 'Estimated', 'Illustrative'];
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

// Merge the many small static meshes the scenes are built from into one mesh per material
// look, per layer. Same picture, far fewer draw calls (about 1,000 down to a dozen on the
// temple), which keeps phones smooth and cool.
function mergeStatic(THREE, root) {
  const groups = new Map();
  root.updateMatrixWorld(true);
  const meshes = [];
  root.traverse(o => { if (o.isMesh && !o.userData.keep) meshes.push(o); });
  for (const m of meshes) {
    const mat = m.material;
    const key = [mat.color.getHex(), mat.opacity, mat.transparent, mat.side, mat.roughness, mat.metalness].join('|');
    if (!groups.has(key)) groups.set(key, { mat, list: [] });
    groups.get(key).list.push(m);
  }
  for (const { mat, list } of groups.values()) {
    if (list.length < 2) continue;
    let nv = 0, ni = 0;
    const parts = list.map(m => {
      let g = m.geometry.index ? m.geometry : m.geometry.clone().setIndex([...Array(m.geometry.attributes.position.count).keys()]);
      g = g.clone().applyMatrix4(m.matrixWorld);
      nv += g.attributes.position.count; ni += g.index.count;
      return g;
    });
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    let ov = 0, oi = 0;
    for (const g of parts) {
      pos.set(g.attributes.position.array, ov * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, ov * 3);
      const src = g.index.array;
      for (let i = 0; i < src.length; i++) idx[oi + i] = src[i] + ov;
      ov += g.attributes.position.count; oi += src.length;
      g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    const merged = new THREE.Mesh(geo, mat);
    merged.castShadow = true; merged.receiveShadow = true;
    root.add(merged);
    for (const m of list) { m.parent.remove(m); m.geometry.dispose(); }
  }
}

function skyTexture(THREE) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#c9d6de'); gr.addColorStop(0.55, '#ece6da'); gr.addColorStop(1, '#e6dccb');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function groundTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, '#d2c8b4'); gr.addColorStop(0.7, '#d9d0bf'); gr.addColorStop(1, '#e6dccb');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function start(build) {
  const stage = document.getElementById('m3d-stage');
  if (!stage) return;
  const wrap = stage.closest('.m3d-wrap') || stage.parentElement;
  if (!webglOK()) { stage.classList.add('no-webgl'); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (e) { stage.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, COARSE ? 1.75 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.className = 'm3d-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D model. With the keyboard: arrow keys turn it, plus and minus zoom, 0 resets the view.');
  stage.insertBefore(canvas, stage.firstChild);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stage.classList.remove('webgl'); stage.classList.add('no-webgl'); });

  const scene = new THREE.Scene();
  scene.background = skyTexture(THREE);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);

  scene.add(new THREE.HemisphereLight(0xfff6e6, 0x8a7f6c, 1.35));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
  sun.position.set(-40, 70, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(COARSE ? 1024 : 2048, COARSE ? 1024 : 2048);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xdfe8f0, 0.45);
  fill.position.set(50, 25, -40);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.MeshStandardMaterial({ map: groundTexture(THREE), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = 'ground'; ground.userData.keep = true;
  scene.add(ground);

  const labelHost = stage.querySelector('.m3d-labels');
  const labels = [];
  const layers = {};
  const mainGroup = new THREE.Group(); scene.add(mainGroup);

  const api = {
    THREE, scene,
    mat(color, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.92, metalness: 0 }, extra || {})); },
    add(mesh, layer) {
      mesh.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      (layer ? api.layer(layer) : mainGroup).add(mesh);
      return mesh;
    },
    layer(name) {
      if (!layers[name]) { const g = new THREE.Group(); g.name = name; scene.add(g); layers[name] = g; }
      return layers[name];
    },
    label(text, tag, pos, layer) {
      if (!TAGS.includes(tag)) throw new Error('unknown evidence tag ' + tag);
      const n = labels.length + 1;
      const el = document.createElement('div');
      el.className = 'm3d-label';
      el.innerHTML = '<span class="m3d-pin tag-' + tag.toLowerCase() + '">' + n + '</span><span class="m3d-ltext"><span class="m3d-tag tag-' + tag.toLowerCase() + '">' + tag + '</span> </span>';
      el.querySelector('.m3d-ltext').appendChild(document.createTextNode(text));
      labelHost.appendChild(el);
      labels.push({ el, text, tag, n, pos: new THREE.Vector3(pos[0], pos[1], pos[2]), layer });
      return el;
    },
    person(x, z, rotY) {
      // 1.7 m figure for scale: plain shapes, no face or clothing detail.
      const g = new THREE.Group();
      const m = api.mat(0x3d5a80);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 1.15, 16), m); body.position.y = 0.9;
      const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.4, 16), m); legs.position.y = 0.2;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), m); head.position.y = 1.59;
      g.add(body, legs, head); g.position.set(x, 0, z); g.rotation.y = rotY || 0;
      return g;
    }
  };

  const view = build(api);
  if (view.sun) sun.position.set(...view.sun);

  // Fewer draw calls: merge per layer.
  mergeStatic(THREE, mainGroup);
  Object.values(layers).forEach(g => mergeStatic(THREE, g));

  // Fit the shadow camera and the haze to the model.
  const bbox = new THREE.Box3();
  [mainGroup, ...Object.values(layers)].forEach(g => bbox.expandByObject(g));
  const bs = bbox.getBoundingSphere(new THREE.Sphere());
  const r = Math.max(bs.radius, 5);
  sun.target.position.copy(bs.center);
  sun.position.copy(bs.center).add(new THREE.Vector3(...(view.sun || [-40, 70, 50])).normalize().multiplyScalar(r * 2.5));
  Object.assign(sun.shadow.camera, { left: -r * 1.2, right: r * 1.2, top: r * 1.2, bottom: -r * 1.2, near: r * 0.5, far: r * 5 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.fog = new THREE.Fog(0xe9e3d7, r * 6, r * 16);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = view.minDistance || 3;
  controls.maxDistance = view.maxDistance || 200;
  controls.autoRotateSpeed = 0.6;

  const narrowStart = () => stage.clientWidth / stage.clientHeight < 0.9;
  const fitCam = cam => narrowStart() && !view.phone ? cam.map((c, i) => view.target[i] + (c - view.target[i]) * 1.55) : cam.slice();
  // Narrow (phone) stage: the page may give its own phone view; otherwise step the camera back.
  const home = narrowStart() && view.phone
    ? { target: view.phone.target.slice(), camera: view.phone.camera.slice() }
    : { target: view.target.slice(), camera: fitCam(view.camera) };
  controls.target.set(...home.target);
  camera.position.set(...home.camera);
  controls.update();

  // ---- Interaction state ----------------------------------------------------------------
  let expanded = false, touched = false, needsLabelReflow = true;
  const setAuto = on => { controls.autoRotate = on && !REDUCED; };
  const stopAuto = () => { if (!touched) { touched = true; setAuto(false); } };
  setAuto(true);
  // The idle turn is a preview: it stops by itself after 40 seconds to save battery.
  setTimeout(() => { if (!touched) setAuto(false); }, 40000);
  canvas.addEventListener('pointerdown', stopAuto);
  canvas.addEventListener('keydown', stopAuto);

  // Touch screens: page scroll first, model on request (no scroll trap).
  const touchMode = COARSE;
  if (touchMode) stage.classList.add('touch');
  function applyMode() {
    const active = !touchMode || expanded;
    controls.enabled = active;
    stage.classList.toggle('is-passive', !active);
    // OrbitControls sets touch-action: none on the canvas; give scrolling back while passive.
    canvas.style.touchAction = active ? 'none' : 'pan-y pinch-zoom';
  }

  // Mouse wheel: only Ctrl/⌘ + scroll zooms, so the page keeps scrolling past the model.
  let hintTimer;
  stage.addEventListener('wheel', e => {
    if (expanded || e.ctrlKey || e.metaKey) { stopAuto(); return; }
    e.stopImmediatePropagation();
    const hint = stage.querySelector('.m3d-wheel-note, .m3d-wheelhint');
    if (hint) { hint.hidden = false; clearTimeout(hintTimer); hintTimer = setTimeout(() => { hint.hidden = true; }, 1600); }
  }, { capture: true });

  // ---- Camera moves (preset views, parts list, keyboard) ---------------------------------
  let anim = null;
  function flyTo(cam, tgt, ms) {
    stopAuto();
    const d = REDUCED ? 0 : (ms || 700);
    anim = { t0: performance.now(), d, c0: camera.position.clone(), t0v: controls.target.clone(), c1: new THREE.Vector3(...cam), t1: new THREE.Vector3(...tgt) };
    wake();
  }
  function stepAnim(now) {
    if (!anim) return;
    const k = anim.d ? Math.min(1, (now - anim.t0) / anim.d) : 1;
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(anim.c0, anim.c1, e);
    controls.target.lerpVectors(anim.t0v, anim.t1, e);
    if (k >= 1) anim = null;
  }
  const sph = new THREE.Spherical(), off = new THREE.Vector3();
  function nudge(dTheta, dPhi, zoom) {
    stopAuto();
    off.copy(camera.position).sub(controls.target);
    sph.setFromVector3(off);
    sph.theta += dTheta;
    sph.phi = Math.min(controls.maxPolarAngle, Math.max(0.05, sph.phi + dPhi));
    sph.radius = Math.min(controls.maxDistance, Math.max(controls.minDistance, sph.radius * (zoom || 1)));
    off.setFromSpherical(sph);
    flyTo(controls.target.clone().add(off).toArray(), controls.target.toArray(), 220);
  }
  canvas.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'ArrowLeft') nudge(-0.2, 0);
    else if (k === 'ArrowRight') nudge(0.2, 0);
    else if (k === 'ArrowUp') nudge(0, -0.12);
    else if (k === 'ArrowDown') nudge(0, 0.12);
    else if (k === '+' || k === '=') nudge(0, 0, 0.8);
    else if (k === '-' || k === '_') nudge(0, 0, 1.25);
    else if (k === '0' || k === 'Home') flyTo(home.camera, home.target);
    else return;
    e.preventDefault();
  });

  // ---- Toolbar ---------------------------------------------------------------------------
  const bar = wrap.querySelector('.m3d-toggles');
  let showLabels = true;
  const toggleState = [];
  const mkBtn = (text, opts) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'm3d-btn' + (opts.cls ? ' ' + opts.cls : ''); b.textContent = text;
    if (opts.label) b.setAttribute('aria-label', opts.label);
    if (opts.pressed !== undefined) b.setAttribute('aria-pressed', String(opts.pressed));
    b.addEventListener('click', () => {
      if (opts.pressed !== undefined) { const v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); opts.on(v); }
      else opts.on();
      wake();
    });
    (opts.host || bar).appendChild(b);
    return b;
  };
  const group = (title) => {
    const g = document.createElement('div'); g.className = 'm3d-group'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', title);
    const s = document.createElement('span'); s.className = 'm3d-group-title'; s.textContent = title; s.setAttribute('aria-hidden', 'true');
    g.appendChild(s); bar.appendChild(g); return g;
  };
  function setLayer(t, v, btn) {
    api.layer(t.layer).visible = v;
    if (t.hides) api.layer(t.hides).visible = !v;
    if (btn) btn.setAttribute('aria-pressed', String(v));
  }
  if (bar) {
    const views = view.views || [];
    if (views.length) {
      const g = group('Views');
      mkBtn('Start', { host: g, on: () => flyTo(home.camera, home.target) });
      views.forEach(vw => mkBtn(vw.name, { host: g, on: () => {
        if (vw.layers) vw.layers.forEach(([name, on]) => { const t = toggleState.find(x => x.t.layer === name); if (t) setLayer(t.t, on, t.btn); });
        flyTo(fitCam(vw.camera), vw.target);
      } }));
    }
    const sg = group('Show');
    mkBtn('Labels', { host: sg, pressed: true, on: v => { showLabels = v; } });
    (view.toggles || []).forEach(t => {
      const btn = mkBtn(t.text, { host: sg, pressed: t.on, on: v => {
        setLayer(t, v);
        // Optional camera for the "off" state (for example the plan from above once the roofs are hidden).
        if (t.viewOff) { if (v) flyTo(home.camera, home.target); else flyTo(fitCam(t.viewOff.camera), t.viewOff.target); }
      } });
      toggleState.push({ t, btn });
      setLayer(t, t.on);
    });
    const zg = group('Zoom');
    mkBtn('+', { host: zg, label: 'Zoom in', cls: 'm3d-sq', on: () => nudge(0, 0, 0.75) });
    mkBtn('−', { host: zg, label: 'Zoom out', cls: 'm3d-sq', on: () => nudge(0, 0, 1.33) });
    mkBtn('Full screen', { host: zg, cls: 'm3d-fs', on: () => setExpanded(!expanded) });
  }
  function ensureLabelLayer(L) {
    if (!L.layer || (layers[L.layer] && layers[L.layer].visible)) return;
    for (const { t, btn } of toggleState) {
      if (t.layer === L.layer) { setLayer(t, true, btn); return; }
      if (t.hides === L.layer) { setLayer(t, false, btn); return; }
    }
  }

  // ---- Parts list (the labels as real text; tap one to fly to it) -------------------------
  const listHost = wrap.querySelector('.m3d-parts');
  if (listHost && labels.length) {
    const det = document.createElement('details');
    det.className = 'm3d-parts-box';
    if (window.innerWidth < 700) det.open = true;
    det.addEventListener('toggle', () => { if (expanded) setTimeout(() => { resize(); wake(); }, 30); });
    det.innerHTML = '<summary>Labelled parts (' + labels.length + ')<span class="small muted"> · tap one to look at it</span></summary><ol class="m3d-parts-list"></ol>';
    const ol = det.querySelector('ol');
    labels.forEach(L => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'm3d-part';
      b.innerHTML = '<span class="m3d-pin tag-' + L.tag.toLowerCase() + '" aria-hidden="true">' + L.n + '</span><span class="m3d-tag tag-' + L.tag.toLowerCase() + '">' + L.tag + '</span> ';
      b.appendChild(document.createTextNode(L.text));
      b.addEventListener('click', () => {
        ensureLabelLayer(L);
        showLabels = true;
        const lb = bar && bar.querySelector('[aria-pressed]'); if (lb && lb.textContent === 'Labels') lb.setAttribute('aria-pressed', 'true');
        const dir = camera.position.clone().sub(controls.target).normalize();
        const dist = Math.max(controls.minDistance * 1.6, Math.min(r * 1.1, camera.position.distanceTo(controls.target) * 0.7));
        flyTo(L.pos.clone().add(dir.multiplyScalar(dist)).toArray(), L.pos.toArray(), 800);
        L.flash = performance.now();
        if (touchMode && !expanded) stage.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
      });
      li.appendChild(b); ol.appendChild(li);
    });
    listHost.appendChild(det);
  }

  // ---- Full screen (CSS; works on every phone, including iPhone) -------------------------
  const openBtn = stage.querySelector('.m3d-open');
  const closeBtn = stage.querySelector('.m3d-close');
  let lastFocus = null;
  function setExpanded(on) {
    if (on === expanded) return;
    expanded = on;
    wrap.classList.toggle('is-expanded', on);
    document.documentElement.classList.toggle('m3d-lock', on);
    const fs = bar && bar.querySelector('.m3d-fs'); if (fs) fs.textContent = on ? 'Exit full screen' : 'Full screen';
    const parts = wrap.querySelector('.m3d-parts-box');
    if (parts) { if (on) { parts.dataset.wasOpen = parts.open ? '1' : ''; parts.open = false; } else parts.open = !!parts.dataset.wasOpen; }
    if (on) { lastFocus = document.activeElement; stopAuto(); canvas.focus({ preventScroll: true }); }
    else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    applyMode();
    setTimeout(() => { resize(); needsLabelReflow = true; wake(); }, 30);
  }
  if (openBtn) openBtn.addEventListener('click', () => setExpanded(true));
  // On touch screens a tap on the model (not a scroll) opens it too.
  canvas.addEventListener('click', () => { if (touchMode && !expanded) setExpanded(true); });
  if (closeBtn) closeBtn.addEventListener('click', () => setExpanded(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && expanded) setExpanded(false); });
  applyMode();

  // ---- Labels ------------------------------------------------------------------------------
  // Wide stage: full text labels. Narrow stage (phones): numbered pins that match the parts
  // list below the model, so nothing is cut off at the edge. Labels are placed in priority
  // order; one that would overlap a label already shown is hidden until the view changes.
  const v = new THREE.Vector3();
  function placeLabels(now) {
    const w = stage.clientWidth, h = stage.clientHeight;
    const pins = w < 640;
    if (pins !== stage.classList.contains('pins')) { stage.classList.toggle('pins', pins); needsLabelReflow = true; }
    const shown = [];
    const rc = stage.querySelector('.m3d-recon');
    const bottom = h - (rc ? rc.offsetHeight + 14 : 30);
    const topMin = pins ? 8 : 40;
    for (const L of labels) {
      const layerOn = !L.layer || (layers[L.layer] && layers[L.layer].visible);
      v.copy(L.pos).project(camera);
      let vis = showLabels && layerOn && v.z < 1 && v.z > -1;
      if (vis) {
        if (needsLabelReflow || !L.w) { L.el.style.display = ''; L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; }
        let x = (v.x + 1) / 2 * w - (pins ? L.w / 2 : L.w / 2), y = (1 - v.y) / 2 * h - (pins ? L.h / 2 : L.h);
        if (x < 4) x = 4;
        if (x + L.w > w - 4) x = w - 4 - L.w;
        if (y < topMin || y + L.h > bottom) vis = false;
        const rr = { x, y, w: L.w, h: L.h };
        if (vis && shown.some(o => rr.x < o.x + o.w + 3 && o.x < rr.x + rr.w + 3 && rr.y < o.y + o.h + 2 && o.y < rr.y + rr.h + 2)) vis = false;
        if (vis) { shown.push(rr); L.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; }
      }
      L.el.style.display = vis ? '' : 'none';
      L.el.classList.toggle('is-flash', !!(L.flash && now - L.flash < 1600));
    }
    needsLabelReflow = false;
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    labels.forEach(L => { L.w = 0; });
  }
  window.addEventListener('resize', () => { resize(); wake(); });
  resize();

  // ---- Render loop: only while the model is on screen and the tab is visible -------------
  let onScreen = true, running = false, first = true, idleFrames = 0;
  const camPrev = new THREE.Vector3(), tgtPrev = new THREE.Vector3();
  function frame(now) {
    if (!onScreen || document.hidden) { running = false; return; }
    stepAnim(now);
    controls.update();
    const moving = anim || controls.autoRotate || !camPrev.equals(camera.position) || !tgtPrev.equals(controls.target);
    camPrev.copy(camera.position); tgtPrev.copy(controls.target);
    renderer.render(scene, camera);
    placeLabels(now);
    if (first) { first = false; stage.classList.add('webgl'); stage.dataset.ready = '1'; }
    idleFrames = moving ? 0 : idleFrames + 1;
    // Stop after a short idle spell; any input wakes it again.
    if (idleFrames > 90 && !labels.some(L => L.flash && now - L.flash < 1700)) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function wake() { idleFrames = 0; if (!running && onScreen && !document.hidden) { running = true; requestAnimationFrame(frame); } }
  ['pointerdown', 'pointermove', 'wheel', 'touchstart'].forEach(ev => canvas.addEventListener(ev, wake, { passive: true }));
  controls.addEventListener('change', wake);
  document.addEventListener('visibilitychange', wake);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { onScreen = es[0].isIntersecting || expanded; if (onScreen) wake(); }, { rootMargin: '100px' }).observe(stage);
    // While the model fills most of a small screen, the floating help buttons step aside.
    new IntersectionObserver(es => { document.body.classList.toggle('m3d-inview', es[0].intersectionRatio > 0.55); }, { threshold: [0, 0.55, 1] }).observe(stage);
  }
  wake();
}
