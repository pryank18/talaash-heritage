// bhaja: the 3D model app from the Claude Design canvas 478bfafe-eaef-4987-bd7d-5d54414d37e2 (version 1794414610-88ae),
// run on the website by dc-lite.js. Texts and facts are the checked ones (render/3d/*-sources.md).
import { DCLogic, mount } from './dc-lite.js';

const MARKUP = `
<div class="bj-root" style="position: relative; width: 100%; height: var(--app-h, 100vh); min-height: 560px; overflow: hidden; background: #14110f; font-family: Inter, system-ui, sans-serif; color: #efe7dc">
<canvas ref="{{ setCanvas }}" data-bhaja="1" aria-label="Interactive 3D model of the Bhaja chaitya hall. Drag to orbit, scroll to zoom." role="img" style="position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; cursor: grab"></canvas>

<div aria-hidden="true" style="position: absolute; inset: 0; pointer-events: none">
<sc-for list="{{ labelPos }}" as="lb" hint-placeholder-count="0">
<div style="{{ lb.style }}">
<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 10px; background: #e0b07a; color: #1a1410; font-size: 11px; font-weight: 600">{{ lb.n }}</span>
<span style="font-size: 12px; font-weight: 500; color: #f6efe4; text-shadow: 0 1px 3px rgba(0,0,0,0.9)">{{ lb.name }}</span>
</div>
</sc-for>
</div>

<div class="{{ panelCls }}" style="position: absolute; top: 20px; left: 20px; width: 340px; max-height: calc(100% - 205px); display: flex; flex-direction: column; background: rgba(20,17,15,0.86); border: 1px solid #3a322b; border-radius: 12px; overflow: hidden">
<div style="padding: 18px 20px 14px 20px; border-bottom: 1px solid #3a322b; display: flex; flex-direction: column; gap: 6px">
<div style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #c9b9a4">Bhaja Caves · Maval, Pune district</div>
<p style="margin: 0; font-family: Spectral, Georgia, serif; font-weight: 600; font-size: 26px; line-height: 1.15; color: #f6efe4">Chaitya Hall, Cave 12</p>
<div style="font-size: 13px; line-height: 1.45; color: #c9b9a4">Rock-cut Buddhist prayer hall of about the 2nd century BCE. Modelled to the measured survey of 1880; estimated parts are tagged.</div>
<div style="display: flex; gap: 8px; margin-top: 6px">
<button type="button" onClick="{{ setFt }}" aria-pressed="{{ ftPressed }}" style="{{ ftStyle }}">Feet</button>
<button type="button" onClick="{{ setM }}" aria-pressed="{{ mPressed }}" style="{{ mStyle }}">Metres</button>
</div>
</div>
<div class="bj-scroll" style="overflow-y: auto; padding: 8px 20px 16px 20px; display: flex; flex-direction: column">
<sc-for list="{{ facts }}" as="f" hint-placeholder-count="10">
<div style="padding: 10px 0; border-bottom: 1px solid #2c2621; display: flex; flex-direction: column; gap: 3px">
<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px">
<span style="font-size: 12px; font-weight: 600; color: #e0b07a">{{ f.k }}</span>
<span style="{{ f.tagStyle }}">{{ f.tag }}</span>
</div>
<div style="font-size: 13px; line-height: 1.45; color: #efe7dc">{{ f.v }}</div>
</div>
</sc-for>
<div style="padding-top: 12px; font-size: 11.5px; line-height: 1.5; color: #b3a490">Sources: J. Fergusson &amp; J. Burgess, The Cave Temples of India (1880), pp. 182, 223–226; Gazetteer of the Bombay Presidency, vol. XVIII part III, Poona (1885), "Bhaja". Comparative: Bharhut relief, Freer Gallery of Art F1932.26; J. Marshall, A Guide to Sanchi. Chant text: Khuddakapāṭha 1; Majjhima Nikāya 100. Labels: 1 stupa · 2 pillars · 3 teak ribs · 4 great arch · 5 aisle · 6 circumambulation · 7–9 colour view · I1–I5 iconography.</div>
</div>
</div>

<div class="bj-bar" style="position: absolute; left: 20px; right: 20px; bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(20,17,15,0.86); border: 1px solid #3a322b; border-radius: 12px">
<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center">
<button type="button" class="bj-facts-btn" onClick="{{ togglePanel }}" aria-pressed="{{ panelPressed }}" style="{{ panelBtnStyle }}">Facts</button>
<span style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #c9b9a4; margin-right: 4px">View</span>
<sc-for list="{{ views }}" as="v" hint-placeholder-count="6">
<button type="button" onClick="{{ v.pick }}" aria-pressed="{{ v.pressed }}" style="{{ v.style }}">{{ v.label }}</button>
</sc-for>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center">
<span style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #c9b9a4; margin-right: 4px">Look</span>
<sc-for list="{{ looks }}" as="lk" hint-placeholder-count="2">
<button type="button" onClick="{{ lk.pick }}" aria-pressed="{{ lk.pressed }}" style="{{ lk.style }}">{{ lk.label }}</button>
</sc-for>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center">
<sc-for list="{{ toggles }}" as="t" hint-placeholder-count="5">
<button type="button" onClick="{{ t.pick }}" aria-pressed="{{ t.pressed }}" style="{{ t.style }}">{{ t.label }}</button>
</sc-for>
</div>
<div style="display: flex; gap: 10px; align-items: center">
<label for="bj-time" style="font-size: 12px; color: #c9b9a4">Sun (hall faces west)</label>
<input id="bj-time" type="range" min="12" max="18.5" step="0.25" value="{{ time }}" onChange="{{ onTime }}" style="width: 150px; accent-color: #e0b07a">
<span style="font-size: 12px; font-weight: 600; color: #f6efe4; min-width: 56px">{{ timeLabel }}</span>
</div>
</div>

<div class="bj-brand" style="position: absolute; top: 20px; right: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; max-width: 520px; pointer-events: none">
<div style="display: flex; gap: 8px; padding: 6px 8px; background: rgba(246,239,228,0.92); border-radius: 10px"><img src="assets/img/logo-192.webp" alt="Talaash Heritage" width="44" height="44" style="display: block; width: 44px; height: 44px"><img src="assets/img/archaeologywala-logo.webp" alt="archaeologywala" width="44" height="44" style="display: block; width: 44px; height: 44px; object-fit: contain"></div>
<div style="padding: 6px 10px; background: rgba(20,17,15,0.86); border: 1px solid #3a322b; border-radius: 8px; font-size: 12px; font-weight: 600; color: #f6efe4; text-align: right">Reconstruction from published surveys. Estimated parts tagged.</div>
<div class="bj-hint" style="padding: 8px 12px; background: rgba(20,17,15,0.7); border-radius: 8px; font-size: 12px; color: #c9b9a4; text-align: right">{{ hintText }}</div>
</div>
<sc-if value="{{ wheelNote }}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; left: 50%; top: 45%; transform: translate(-50%, -50%); padding: 10px 16px; background: rgba(20,17,15,0.9); border: 1px solid #3a322b; border-radius: 10px; font-size: 14px; color: #f6efe4; pointer-events: none">Click the model first, or hold Ctrl (⌘ on a Mac), to zoom with the scroll wheel</div>
</sc-if>

<sc-if value="{{ showChant }}" hint-placeholder-val="{{ false }}">
<div aria-live="polite" style="position: absolute; top: 64px; left: 50%; transform: translateX(-50%); width: min(560px, calc(100% - 420px)); min-width: 300px; padding: 14px 20px; background: rgba(20,17,15,0.86); border: 1px solid #3a322b; border-radius: 12px; display: flex; flex-direction: column; gap: 5px; text-align: center">
<div style="font-family: 'Noto Sans Devanagari', sans-serif; font-size: 22px; font-weight: 600; color: #f6efe4; line-height: 1.4">{{ chantDeva }}</div>
<div style="font-size: 14px; font-style: italic; color: #e0b07a">{{ chantRoman }}</div>
<div style="font-size: 13px; color: #efe7dc">{{ chantEn }}</div>
<div style="font-size: 11px; color: #b3a490">{{ chantVoice }}</div>
</div>
</sc-if>

<sc-if value="{{ showPad }}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; right: 20px; bottom: 120px; display: flex; gap: 6px; padding: 8px; background: rgba(20,17,15,0.7); border-radius: 10px">
<sc-for list="{{ pad }}" as="pb" hint-placeholder-count="4">
<button type="button" onPointerDown="{{ pb.down }}" onPointerUp="{{ pb.up }}" onPointerLeave="{{ pb.up }}" onPointerCancel="{{ pb.up }}" style="{{ pb.style }}">{{ pb.label }}</button>
</sc-for>
</div>
</sc-if>

<sc-if value="{{ showStatus }}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none">
<div style="padding: 14px 20px; background: rgba(20,17,15,0.9); border: 1px solid #3a322b; border-radius: 10px; font-size: 14px; color: #efe7dc">{{ statusText }}</div>
</div>
</sc-if>
</div>
`;

class Component extends DCLogic {
  constructor(...args) {
    super(...args);
    this.state = Object.assign({}, this.defaults());
    this.canvasEl = null;
    this.setCanvas = (el) => { if (el) this.canvasEl = el; };
  }

  componentDidMount() {
    try { if (window.speechSynthesis) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); } } catch (e) {}
    let tries = 0;
    const wait = () => {
      if (this.dead) return;
      if (window.THREE) {
        try { this.init(window.THREE); } catch (e) { this.setState({ err: 'The 3D view could not start: ' + (e && e.message ? e.message : e) }); }
        return;
      }
      if (++tries > 150) { this.setState({ err: 'The 3D library did not load. Reload the page to try again.' }); return; }
      this.waitTimer = setTimeout(wait, 100);
    };
    wait();
  }

  componentWillUnmount() {
    this.dead = true;
    clearTimeout(this.waitTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    if (this.cleanupInput) this.cleanupInput();
    this.stopChant();
    if (this.g && this.g.renderer) this.g.renderer.dispose();
  }

  defaults() { return { view: 'exterior', timber: false, ribsAll: false, person: true, labels: true, time: 16.5, units: 'm', panel: !(window.matchMedia && matchMedia('(max-width: 760px)').matches), wheelNote: false, labelPos: [], ready: false, err: '', real: false, live: false, color: false, chant: false, chantLine: 0, chantVoice: '', ico: false }; }
  st() { const o = Object.assign({}, this.defaults(), this.state || {}); o.liveOn = o.live || o.color || o.chant; return o; }

  // keeps the 3D scene in step with the UI state (runs on every render)
  sync() {
    const g = this.g; if (!g) return;
    const s = this.st(), a = this.applied || (this.applied = {});
    if (a.view !== s.view) { const first = a.view === undefined; a.view = s.view; this.goView(s.view, !first); }
    if (a.timber !== s.timber || a.ribsAll !== s.ribsAll || a.person !== s.person || a.live !== s.live || a.color !== s.color || a.chant !== s.chant || a.ico !== s.ico) { a.timber = s.timber; a.ribsAll = s.ribsAll; a.person = s.person; a.live = s.live; a.color = s.color; a.chant = s.chant; a.ico = s.ico; this.applyVisibility(); }
    if (a.real !== s.real) { a.real = s.real; this.applyLook(); }
    if (a.time !== s.time) { a.time = s.time; this.applySun(); }
    if (a.labels !== s.labels) { a.labels = s.labels; this.dirty = true; }
  }

  // ------------------------------------------------------------------ scene
  init(T) {
    const canvas = this.canvasEl || document.querySelector('canvas[data-bhaja="1"]');
    if (!canvas) throw new Error('canvas not found');
    const renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scene = new T.Scene();
    const sky = new T.Color(0xa9bccd);
    scene.background = sky;
    scene.fog = new T.Fog(sky, 300, 1500);
    const cam = new T.PerspectiveCamera(50, 1, 0.3, 4000);

    const g = this.g = { T, renderer, scene, cam, canvas, occluders: [], ribs: [], timber: [], person: [], pillarPos: [], symPillars: [] };
    canvas.tabIndex = 0; canvas.style.outline = 'none';

    // ---- measured dimensions (feet) -- Burgess 1880 / Bombay Gazetteer 1885
    const L = 59;                 // length to back of apse
    const HW = (26 + 8 / 12) / 2; // half of 26 ft 8 in
    const ZC = -(L - HW);         // centre of the semicircular apse
    const PH = 11 + 4 / 12;       // pillar height 11 ft 4 in
    const NB = (16 + 4 / 12) / 2; // nave half-width at pillar base (16 ft 4 in)
    const NT = 15.5 / 2;          // nave half-width at pillar tops (15 ft 6 in)
    const PD = HW - (3 + 5 / 12) - NB; // pillar thickness implied by aisle 3 ft 5 in
    const SPR = PH + 7 + 5 / 12;  // vault springs from ledge 7 ft 5 in above pillar tops
    const CROWN = 26 + 5 / 12;    // 26 ft 5 in to the crown
    const RISE = CROWN - SPR;
    const TRI = NT + PD;          // outer face of the triforium wall
    const LEAN = 5 / 12;          // pillars rake inward ~5 in
    Object.assign(g, { L, HW, ZC, PH, NB, NT, PD, SPR, CROWN, RISE });

    const M = (c, r, extra) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0, side: T.DoubleSide }, extra || {}));
    const mat = {
      rock: M(0x6c6056, 0.95), hall: M(0x655a50, 0.62), floor: M(0x574c43, 0.85),
      teak: M(0x5b3b22, 0.7), wood: M(0x8b5b34, 0.78), stupa: M(0x6a5e53, 0.55),
      hole: new T.MeshBasicMaterial({ color: 0x15100c }), green: M(0x5e6a44, 1), valley: M(0x6d7a4c, 1),
      person: M(0xd8d0c2, 0.8)
    };
    g.U = { uAmt: { value: 0 } };
    this.patchMat(mat.rock, { col2: 0x4b423a, s: [0.17, 0.17, 0.17], v: 0.95, b: 0.7, r: 0.15, band: 0.12 });
    this.patchMat(mat.hall, { col2: 0x4a4038, s: [0.24, 0.24, 0.24], v: 0.6, b: 0.22, r: 0.25, band: 0.05, d: 1 });
    this.patchMat(mat.floor, { col2: 0x453b33, s: [0.3, 0.3, 0.3], v: 0.75, b: 0.35, r: 0.15, d: 1 });
    this.patchMat(mat.stupa, { col2: 0x4f453c, s: [0.3, 0.3, 0.3], v: 0.5, b: 0.18, r: 0.2, d: 1 });
    this.patchMat(mat.teak, { col2: 0x38220f, s: [2.2, 2.2, 0.35], v: 0.85, b: 0.3, r: 0.1, d: 1 });
    this.patchMat(mat.wood, { col2: 0x5e3a1c, s: [0.35, 3.5, 0.35], v: 0.75, b: 0.3, r: 0.1 });
    this.patchMat(mat.green, { col2: 0x434f2b, s: [0.05, 0.05, 0.05], v: 1, b: 0.5, r: 0 });
    this.patchMat(mat.valley, { col2: 0x55623a, s: [0.012, 0.012, 0.012], v: 1, b: 0, r: 0 });

    const add = (geo, m, pos, occ, list) => {
      const mesh = new T.Mesh(geo, m);
      if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.castShadow = true; mesh.receiveShadow = true;
      scene.add(mesh);
      if (occ !== false) g.occluders.push(mesh);
      if (list) list.push(mesh);
      return mesh;
    };
    const grid = (nu, nv, fn) => {
      const pos = [], uv = [], idx = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(i / nu, j / nv); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx); geo.computeVertexNormals();
      return geo;
    };
    const box = (w, h, d, m, p, list, occ) => add(new T.BoxGeometry(w, h, d), m, p, occ, list);

    // ---- hall floor (rectangle + semicircular apse)
    const fs = new T.Shape();
    fs.moveTo(-HW, 0); fs.lineTo(HW, 0); fs.lineTo(HW, -ZC); fs.absarc(0, -ZC, HW, 0, Math.PI, false); fs.lineTo(-HW, 0);
    const fg = new T.ShapeGeometry(fs, 48); fg.rotateX(-Math.PI / 2);
    add(fg, mat.floor, [0, 0.01, 0]);

    // ---- outer aisle walls
    [-1, 1].forEach((sd) => {
      const w = new T.PlaneGeometry(-ZC, PH); w.rotateY(Math.PI / 2);
      add(w, mat.hall, [sd * HW, PH / 2, ZC / 2]);
      const c = new T.PlaneGeometry(HW - TRI, -ZC); c.rotateX(Math.PI / 2);
      add(c, mat.hall, [sd * (HW + TRI) / 2, PH, ZC / 2]);
      box(TRI - NT, SPR - PH, -ZC, mat.hall, [sd * (NT + TRI) / 2, (PH + SPR) / 2, ZC / 2]);
      box(0.35, 0.3, -ZC, mat.hall, [sd * (NT - 0.175), SPR - 0.15, ZC / 2]); // narrow ledge
    });
    add(grid(48, 4, (u, v) => { const a = Math.PI * u; return [HW * Math.cos(a), PH * v, ZC - HW * Math.sin(a)]; }), mat.hall);
    add(grid(48, 2, (u, v) => { const a = Math.PI * u, r = TRI + (HW - TRI) * v; return [r * Math.cos(a), PH, ZC - r * Math.sin(a)]; }), mat.hall);
    add(grid(48, 4, (u, v) => { const a = Math.PI * u; return [NT * Math.cos(a), PH + (SPR - PH) * v, ZC - NT * Math.sin(a)]; }), mat.hall);
    add(grid(48, 2, (u, v) => { const a = Math.PI * u, r = NT + (TRI - NT) * v; return [r * Math.cos(a), PH, ZC - r * Math.sin(a)]; }), mat.hall);

    // ---- barrel vault + half-dome over the apse
    add(grid(48, 24, (u, v) => { const a = Math.PI * u; return [NT * Math.cos(a), SPR + RISE * Math.sin(a), ZC * v]; }), mat.hall);
    add(grid(48, 16, (u, v) => { const a = Math.PI * u, e = (Math.PI / 2) * v; return [NT * Math.cos(a) * Math.cos(e), SPR + RISE * Math.sin(e), ZC - NT * Math.sin(a) * Math.cos(e)]; }), mat.hall);

    // ---- 27 raking octagonal pillars: 11 per side + 5 round the apse
    const R8 = (PD / 2) / Math.cos(Math.PI / 8);
    const pillar = (x, z, dx, dz) => {
      const geo = new T.CylinderGeometry(R8, R8, PH, 8, 1);
      geo.rotateY(Math.PI / 8);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + PH / 2) / PH; p.setX(i, p.getX(i) + dx * LEAN * t); p.setZ(i, p.getZ(i) + dz * LEAN * t); }
      geo.computeVertexNormals();
      const pm = add(geo, mat.hall, [x, PH / 2, z]);
      g.pillarPos.push([x, z]);
      return pm;
    };
    const pc = NB + PD / 2;
    const N = 11, Z0 = -2.5;
    for (let k = 0; k < N; k++) {
      const z = Z0 + (ZC - Z0) * k / (N - 1);
      const pl = pillar(-pc, z, 1, 0), pr = pillar(pc, z, -1, 0);
      if (k === 6 || k === 7) g.symPillars.push(pl, pr); // 7th and 8th from the entrance (1885 Gazetteer; row not stated)
    }
    g.symZ = [Z0 + (ZC - Z0) * 6 / (N - 1), Z0 + (ZC - Z0) * 7 / (N - 1)];
    for (let k = 1; k <= 5; k++) { const a = Math.PI * k / 6; pillar(pc * Math.cos(a), ZC - pc * Math.sin(a), -Math.cos(a), Math.sin(a)); }

    // ---- teak ribs following the vault
    let k = 0;
    for (let z = -0.9; z > ZC + 0.4; z -= 1.62, k++) {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push(new T.Vector3(NT * 0.985 * Math.cos(a), SPR + RISE * 0.985 * Math.sin(a), z)); }
      const rib = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.19, 4, false), mat.teak, null, false);
      rib.userData.lost = k < 4;
      g.ribs.push(rib);
    }

    // ---- stupa (dagoba) at the apse centre: 11 ft dia., drum 4 ft, dome 6 ft
    add(new T.CylinderGeometry(5.5, 5.5, 4, 72), mat.stupa, [0, 2, ZC]);
    const dome = new T.SphereGeometry(5.5, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 6 / 5.5, 1);
    add(dome, mat.stupa, [0, 4, ZC]);
    let y = 9.85;
    [[3.2, 0.3], [2.6, 1.4], [3.0, 0.25], [2.6, 1.4], [3.0, 0.25], [3.4, 0.25]].forEach((s) => { box(s[0], s[1], s[0], mat.stupa, [0, y + s[1] / 2, ZC]); y += s[1]; });
    g.stupaTop = y;

    // ---- rock-cut cliff with the hall opening (hall faces west = +z)
    const FW = 320, FH = 62;
    const fr = new T.Shape();
    fr.moveTo(-FW, -3); fr.lineTo(FW, -3); fr.lineTo(FW, FH); fr.lineTo(-FW, FH); fr.lineTo(-FW, -3);
    const hole = new T.Path();
    hole.moveTo(-HW, 0); hole.lineTo(HW, 0); hole.lineTo(HW, PH); hole.lineTo(NT, PH); hole.lineTo(NT, SPR);
    hole.absellipse(0, SPR, NT, RISE, 0, Math.PI, false);
    hole.lineTo(-NT, PH); hole.lineTo(-HW, PH); hole.lineTo(-HW, 0);
    fr.holes.push(hole);
    add(new T.ShapeGeometry(fr, 48), mat.rock, [0, 0, 0]);
    add(grid(2, 2, (u, v) => [-FW + 2 * FW * u, FH + 210 * v, -420 * v]), mat.green);
    add(grid(2, 2, (u, v) => [-FW + 2 * FW * u, 0, 26 * v]), mat.rock);
    add(grid(2, 2, (u, v) => [-FW + 2 * FW * u, -122 * v, 26 + 240 * v]), mat.green);
    add(grid(2, 2, (u, v) => [-1600 + 3200 * u, -122, 266 + 1400 * v]), mat.valley, null, false);

    // ---- the great chaitya arch band on the facade, with ~170 pin holes in 3 rows
    const BW = 2.2;
    const band = new T.Shape();
    band.moveTo(NT + BW, PH); band.lineTo(NT + BW, SPR);
    band.absellipse(0, SPR, NT + BW, RISE + BW, 0, Math.PI, false);
    band.lineTo(-(NT + BW), PH); band.lineTo(-NT, PH); band.lineTo(-NT, SPR);
    band.absellipse(0, SPR, NT, RISE, Math.PI, 0, true);
    band.lineTo(NT, PH); band.lineTo(NT + BW, PH);
    const PAINT = { red: M(0x9a3b22, 0.8), yellow: M(0xc4943a, 0.8), white: M(0xe6dccb, 0.8) };
    g.paintable = [];
    const paintIt = (m, pm) => { m.userData.orig = m.material; m.userData.paint = pm; g.paintable.push(m); return m; };
    paintIt(add(new T.ExtrudeGeometry(band, { depth: 0.5, bevelEnabled: false, curveSegments: 48 }), mat.rock, [0, 0, 0]), PAINT.red);
    const holeGeo = new T.CircleGeometry(0.08, 10);
    const per = 57, rows = [0.45, 1.1, 1.75];
    const inst = new T.InstancedMesh(holeGeo, mat.hole, per * rows.length);
    const dm = new T.Object3D(); let n = 0;
    rows.forEach((d) => { for (let i = 0; i < per; i++) { const a = Math.PI * (i + 0.5) / per; dm.position.set((NT + d) * Math.cos(a), SPR + (RISE + d) * Math.sin(a), 0.52); dm.updateMatrix(); inst.setMatrixAt(n++, dm.matrix); } });
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst); g.pins = inst;

    // ---- flanking facade relief (simplified): rail bands and blind chaitya arches
    const gav = (cx, cy, s) => {
      const sh = new T.Shape(); const a = 1.4 * s, b = 1.6 * s, w = 0.45 * s;
      sh.moveTo(a + w, 0); sh.lineTo(a + w, 1.2 * s); sh.absellipse(0, 1.2 * s, a + w, b + w, 0, Math.PI, false); sh.lineTo(-(a + w), 0); sh.lineTo(-a, 0); sh.lineTo(-a, 1.2 * s);
      sh.absellipse(0, 1.2 * s, a, b, Math.PI, 0, true); sh.lineTo(a, 0); sh.lineTo(a + w, 0);
      paintIt(add(new T.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 20 }), mat.rock, [cx, cy, 0]), PAINT.red);
    };
    [-1, 1].forEach((sd) => {
      [PH + 0.4, SPR + 3].forEach((ry) => {
        paintIt(box(13, 0.35, 0.4, mat.rock, [sd * (HW + 7.2), ry, 0.2]), PAINT.yellow);
        paintIt(box(13, 0.35, 0.4, mat.rock, [sd * (HW + 7.2), ry + 1.6, 0.2]), PAINT.yellow);
        for (let i = 0; i < 16; i++) paintIt(box(0.3, 1.25, 0.3, mat.rock, [sd * (HW + 1.2 + i * 0.8), ry + 0.8, 0.15], null, false), PAINT.white);
      });
      if (sd < 0) gav(sd * (HW + 4), SPR - 4.6, 1); // right side left clear for the recorded window with two half-figures
      gav(sd * (HW + 10), SPR - 4.6, 1);
      gav(sd * (HW + 7), SPR + 6, 1.2);
    });

    // ---- iconography layer: positions from the 1885 Gazetteer; grey slabs are placeholders, not carvings
    const icoG = new T.Group(); icoG.visible = false; scene.add(icoG);
    const plc = new T.MeshStandardMaterial({ color: 0x9c8f80, roughness: 0.9, side: T.DoubleSide });
    const dark = new T.MeshStandardMaterial({ color: 0x1e1915, roughness: 1, side: T.DoubleSide });
    const ip = (geo, m, x, y, z, rx) => { const me = new T.Mesh(geo, m); me.position.set(x, y, z); if (rx) me.rotation.x = rx; me.castShadow = true; me.receiveShadow = true; icoG.add(me); return me; };
    // female figure high up on the left of the front
    ip(new T.CylinderGeometry(0.75, 1.05, 4.6, 16, 1, false, 0, Math.PI), plc, -(HW + 2.2), 26.6, 0.02, 0).rotation.y = -Math.PI / 2;
    ip(new T.SphereGeometry(0.6, 16, 10, 0, Math.PI), plc, -(HW + 2.2), 29.4, 0.02, 0);
    // window in the projecting side to the right of the great arch, with two half-figures
    ip(new T.BoxGeometry(3.4, 2.6, 0.12), dark, HW + 4, 15.2, 0.06, 0);
    [-0.75, 0.75].forEach((dx) => {
      ip(new T.SphereGeometry(0.62, 14, 10, 0, Math.PI), plc, HW + 4 + dx, 14.7, 0.12, 0);
      ip(new T.SphereGeometry(0.36, 14, 10, 0, Math.PI), plc, HW + 4 + dx, 15.75, 0.12, 0);
    });
    // heads of two others in small compartments, level with the top of the arch
    [HW + 2.0, HW + 3.6].forEach((x) => {
      ip(new T.BoxGeometry(1.3, 1.4, 0.12), dark, x, 27.6, 0.06, 0);
      ip(new T.SphereGeometry(0.42, 14, 10, 0, Math.PI), plc, x, 27.6, 0.12, 0);
    });
    g.ico = { group: icoG, hi: M(0x9a7448, 0.55, { emissive: 0x2a1a08 }) };

    // ---- reconstructed timber front (from the floor sockets, mortices and pin holes)
    const TB = g.timber;
    [-1, 1].forEach((sd) => {
      box(0.7, SPR, 0.7, mat.wood, [sd * (NT - 0.35), SPR / 2, -0.5], TB);
      box(0.6, 11.25, 0.6, mat.wood, [sd * 2.4, 11.25 / 2, -0.5], TB);
    });
    box(2 * NT, 0.7, 0.7, mat.wood, [0, 11.6, -0.5], TB);
    box(2 * NT, 0.6, 0.6, mat.wood, [0, SPR, -0.5], TB);
    const panel = (x0, x1, y0, y1) => box(x1 - x0, y1 - y0, 0.25, mat.wood, [(x0 + x1) / 2, (y0 + y1) / 2, -0.5], TB);
    [-1, 1].forEach((sd) => {
      const s = (a, b) => sd > 0 ? [a, b] : [-b, -a];
      let r = s(2.7, 4.4); panel(r[0], r[1], 0, 11.25);
      r = s(6.4, NT - 0.7); panel(r[0], r[1], 0, 11.25);
      r = s(4.4, 6.4); panel(r[0], r[1], 7, 11.25);
    });
    panel(-2.1, 2.1, 8, 11.25);
    for (let x = -NT + 0.95; x < NT - 0.5; x += 0.95) {
      const top = SPR + RISE * Math.sqrt(Math.max(0, 1 - (x / NT) * (x / NT))) - 0.2;
      box(0.14, top - 11.95, 0.22, mat.wood, [x, (top + 11.95) / 2, -0.45], TB, false);
    }
    for (let yy = 12.9; yy < SPR + RISE - 0.4; yy += 0.95) {
      const hw = yy <= SPR ? NT - 0.7 : NT * Math.sqrt(Math.max(0, 1 - ((yy - SPR) / RISE) * ((yy - SPR) / RISE))) - 0.2;
      if (hw > 0.3) box(2 * hw, 0.14, 0.22, mat.wood, [0, yy, -0.45], TB, false);
    }
    const facing = new T.Mesh(new T.ExtrudeGeometry(band, { depth: 0.18, bevelEnabled: false, curveSegments: 48 }), mat.wood);
    facing.position.set(0, 0, 0.5); facing.castShadow = true; scene.add(facing); TB.push(facing);
    const shaft = new T.Mesh(new T.CylinderGeometry(0.29, 0.29, 6.2, 16), mat.wood);
    shaft.position.set(0, g.stupaTop - 1.67 + 3.1, ZC); shaft.castShadow = true; scene.add(shaft); TB.push(shaft);
    const umb = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 0.22, 48), mat.wood);
    umb.position.set(0, g.stupaTop + 3.8, ZC); umb.castShadow = true; scene.add(umb); TB.push(umb);

    // ---- person for scale (5 ft 7 in)
    const body = new T.Mesh(new T.CylinderGeometry(0.55, 0.62, 4.6, 20), mat.person); body.position.set(-2.6, 2.3, -14);
    const head = new T.Mesh(new T.SphereGeometry(0.45, 20, 14), mat.person); head.position.set(-2.6, 5.15, -14);
    [body, head].forEach((m) => { m.castShadow = true; scene.add(m); g.person.push(m); });

    // ---- light
    g.hemi = new T.HemisphereLight(0xd6e0ea, 0x3b3028, 0.42); scene.add(g.hemi);
    const sun = new T.DirectionalLight(0xffe2b8, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    const sc = sun.shadow.camera; sc.left = -95; sc.right = 95; sc.top = 95; sc.bottom = -95; sc.near = 1; sc.far = 900;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
    sun.target.position.set(0, 10, -28);
    scene.add(sun); scene.add(sun.target);
    g.sun = sun;
    const fill = new T.PointLight(0xffd9b0, 0.25, 70, 2); fill.position.set(0, 14, -20); scene.add(fill);

    this.buildExtras(T, mat, FH);

    // ---- label anchors
    g.anchors = [
      { n: 1, name: 'Stupa', p: new T.Vector3(0, g.stupaTop + 1.2, ZC) },
      { n: 2, name: 'Octagonal pillars (raking)', p: new T.Vector3(-(pc - 0.1), 8.2, -17.6) },
      { n: 3, name: 'Teak ribs', p: new T.Vector3(0, CROWN - 0.9, -22) },
      { n: 4, name: 'Great arch, pin holes', p: new T.Vector3(0, CROWN + 1.3, 0.9) },
      { n: 5, name: 'Aisle', p: new T.Vector3((HW + TRI) / 2, 5, -26) },
      { n: 6, name: 'Clockwise circumambulation', p: new T.Vector3(-(HW + TRI) / 2, 6.4, -34.8), live: true },
      { n: 7, name: 'Garlands and umbrella', p: new T.Vector3(0, g.stupaTop + 5.6, ZC), color: true },
      { n: 8, name: 'Hand prints (ritual touching)', p: new T.Vector3(0.6, 2.6, ZC + 6.0), color: true },
      { n: 9, name: 'Painted relief (hypothetical)', p: new T.Vector3(HW + 7, SPR + 5.6, 0.7), color: true },
      { n: 'I1', name: 'Stupa: no Buddha figure recorded', p: new T.Vector3(0, 10.6, ZC + 4.6), ico: true },
      { n: 'I2', name: 'Symbols on 7th–8th pillars (row not recorded)', p: new T.Vector3(-(NB - 0.9), 9.2, (g.symZ[0] + g.symZ[1]) / 2), ico: true },
      { n: 'I3', name: 'Female figure, beaded belt', p: new T.Vector3(-(HW + 2.2), 31.0, 0.7), ico: true },
      { n: 'I4', name: 'Window with two half-figures', p: new T.Vector3(HW + 4, 17.3, 0.7), ico: true },
      { n: 'I5', name: 'Two heads in compartments', p: new T.Vector3(HW + 2.8, 29.2, 0.7), ico: true }
    ];

    // ---- views
    g.views = {
      exterior: { pos: [36, 17, 72], tgt: [0, 13, -8], clip: null },
      nave: { pos: [0, 5.6, 2.5], tgt: [0, 10, ZC], clip: null },
      aisle: { pos: [(HW + TRI) / 2, 5.4, -0.5], tgt: [(HW + TRI) / 2 - 0.6, 5.2, -36], clip: null },
      stupa: { pos: [7, 7.5, ZC + 17], tgt: [0, 8.5, ZC], clip: null },
      section: { pos: [66, 24, -30], tgt: [0, 12, -30], clip: new T.Plane(new T.Vector3(-1, 0, 0), 0) },
      plan: { pos: [0, 150, -29], tgt: [0, 0, -29.3], clip: new T.Plane(new T.Vector3(0, -1, 0), 6) }
    };

    this.cs = this.sph(g.views.exterior);
    this.sync();
    this.bindInput();

    const resize = () => {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); this.dirty = true;
    };
    this.ro = new ResizeObserver(resize); this.ro.observe(canvas); resize();

    this.raycaster = new T.Raycaster();
    const loop = () => {
      if (this.dead) return;
      this.raf = requestAnimationFrame(loop);
      this.step();
      renderer.render(scene, cam);
    };
    loop();
    this.setState({ ready: true });
  }

  patchMat(m, o) {
    const T = this.g.T, U = this.g.U;
    const uni = { uAmt: U.uAmt, uCol2: { value: new T.Color(o.col2) }, uScale: { value: new T.Vector3(o.s[0], o.s[1], o.s[2]) }, uVar: { value: o.v }, uBump: { value: o.b }, uRough: { value: o.r || 0 }, uBand: { value: o.band || 0 }, uDepth: { value: o.d || 0 } };
    const pars = [
      'uniform float uAmt; uniform vec3 uCol2; uniform vec3 uScale; uniform float uVar; uniform float uBump; uniform float uRough; uniform float uBand; uniform float uDepth;',
      'varying vec3 vBjPos;',
      'float bjHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
      'float bjNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);',
      ' return mix(mix(mix(bjHash(i), bjHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(bjHash(i + vec3(0.0, 1.0, 0.0)), bjHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
      '  mix(mix(bjHash(i + vec3(0.0, 0.0, 1.0)), bjHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(bjHash(i + vec3(0.0, 1.0, 1.0)), bjHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }',
      'float bjFbm(vec3 p){ float a = 0.5; float s = 0.0; for (int i = 0; i < 5; i++) { s += a * bjNoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }',
      'vec3 bjBumpN(vec3 sp, vec3 sn, float h, float k){ vec3 sx = dFdx(sp); vec3 sy = dFdy(sp); vec3 r1 = cross(sy, sn); vec3 r2 = cross(sn, sx); float det = dot(sx, r1); vec3 grad = sign(det) * (dFdx(h) * k * r1 + dFdy(h) * k * r2); return normalize(abs(det) * sn - grad); }'
    ].join('\n');
    const colorCode = [
      '#include <color_fragment>',
      'float bjN = bjFbm(vBjPos * uScale);',
      'float bjM = bjNoise(vBjPos * uScale * 9.0);',
      'vec3 bjCol = mix(diffuseColor.rgb, uCol2, clamp((bjN - 0.38) * 2.2, 0.0, 1.0) * uVar);',
      'bjCol *= 1.0 + (bjM - 0.5) * 0.35 * uVar;',
      'bjCol *= 1.0 - uBand * (0.5 + 0.5 * sin(vBjPos.y * 1.3 + bjN * 4.0));',
      'bjCol *= mix(1.0, 0.45, clamp(-vBjPos.z / 60.0, 0.0, 1.0) * uDepth);',
      'diffuseColor.rgb = mix(diffuseColor.rgb, bjCol, uAmt);'
    ].join('\n');
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBjPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBjPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + pars)
        .replace('#include <color_fragment>', colorCode)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (bjN - 0.5) * uRough * uAmt, 0.04, 1.0);')
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nif (uAmt > 0.0 && uBump > 0.0) { float bjH = bjFbm(vBjPos * uScale * 3.1); normal = normalize(mix(normal, bjBumpN(-vViewPosition, normal, bjH, uBump), uAmt)); }');
    };
    m.customProgramCacheKey = () => 'bhaja-surface-v1';
  }

  buildExtras(T, mat, FH) {
    const g = this.g, scene = g.scene, ZC = g.ZC;
    // seeded random so the scene is identical on every load
    let seed = 20260111;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

    // ---- sky dome (realistic look)
    const sky = new T.Mesh(new T.SphereGeometry(2500, 32, 16), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color(0x5f8fc4) }, hor: { value: new T.Color(0xe4d2b4) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float t = clamp(vP.y * 1.6 + 0.05, 0.0, 1.0); gl_FragColor = vec4(mix(hor, top, pow(t, 0.7)), 1.0); }'
    }));
    sky.renderOrder = -1; sky.visible = false; scene.add(sky); g.sky = sky;

    // ---- trees on the slopes (realistic look)
    const NTREE = 230;
    const trunkM = new T.MeshStandardMaterial({ color: 0x4a3828, roughness: 0.9 });
    const leafM = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true });
    const trunks = new T.InstancedMesh(new T.CylinderGeometry(0.35, 0.6, 1, 6), trunkM, NTREE);
    const crowns = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), leafM, NTREE);
    const o = new T.Object3D(), col = new T.Color();
    for (let i = 0; i < NTREE; i++) {
      let x, z, y;
      if (rnd() < 0.55) { z = 34 + rnd() * 220; x = -320 + rnd() * 640; y = -122 * (z - 26) / 240; }
      else { do { z = -12 - rnd() * 330; x = -320 + rnd() * 640; } while (Math.abs(x) < 48 && z > -26); y = FH + 210 * (-z) / 420; }
      const h = 14 + rnd() * 20, cr = 6 + rnd() * 7;
      o.position.set(x, y + h * 0.5, z); o.scale.set(1, h, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); trunks.setMatrixAt(i, o.matrix);
      o.position.set(x, y + h + cr * 0.35, z); o.scale.set(cr, cr * (0.75 + rnd() * 0.3), cr); o.rotation.set(0, rnd() * 6.28, 0); o.updateMatrix(); crowns.setMatrixAt(i, o.matrix);
      col.setHSL(0.24 + rnd() * 0.06, 0.32 + rnd() * 0.15, 0.2 + rnd() * 0.08); crowns.setColorAt(i, col);
    }
    trunks.instanceMatrix.needsUpdate = true; crowns.instanceMatrix.needsUpdate = true; if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    [trunks, crowns].forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.visible = false; scene.add(m); });
    g.trees = [trunks, crowns];

    // ---- the hall in use (illustrative)
    const S = (c, r) => new T.MeshStandardMaterial({ color: c, roughness: r });
    const skin = S(0x7a4e33, 0.7), robe = S(0xa45f2c, 0.85), robe2 = S(0x8a4a24, 0.85), white = S(0xe9e2d3, 0.85), clay = S(0x8a4b2c, 0.8);
    const group = new T.Group(); group.visible = false; scene.add(group);
    const part = (grp, geo, m, x, y, z, sx, sy, sz) => { const me = new T.Mesh(geo, m); me.position.set(x, y, z); if (sx) me.scale.set(sx, sy, sz); me.castShadow = true; me.receiveShadow = true; grp.add(me); return me; };
    const monkStanding = () => { const k = new T.Group();
      part(k, new T.CylinderGeometry(0.38, 0.72, 4.3, 14), robe, 0, 2.15, 0);
      part(k, new T.SphereGeometry(0.62, 14, 10), robe2, 0, 4.05, 0, 1, 0.55, 0.8);
      part(k, new T.SphereGeometry(0.4, 14, 10), skin, 0, 4.75, 0); return k; };
    const monkSeated = () => { const k = new T.Group();
      part(k, new T.CylinderGeometry(1.0, 1.15, 0.7, 16), robe, 0, 0.35, 0);
      part(k, new T.CylinderGeometry(0.42, 0.62, 2.0, 14), robe, 0, 1.7, 0);
      part(k, new T.SphereGeometry(0.6, 14, 10), robe2, 0, 2.75, 0, 1, 0.55, 0.8);
      part(k, new T.SphereGeometry(0.4, 14, 10), skin, 0, 3.3, 0); return k; };
    const lay = () => { const k = new T.Group();
      part(k, new T.CylinderGeometry(0.38, 0.62, 4.2, 14), white, 0, 2.1, 0);
      part(k, new T.SphereGeometry(0.58, 14, 10), skin, 0, 4.0, 0, 1, 0.5, 0.75);
      part(k, new T.SphereGeometry(0.4, 14, 10), skin, 0, 4.7, 0); return k; };

    // circumambulation loop: in by the left aisle, round behind the apse, out by the right aisle (stupa always on the walker's right)
    const a = (g.HW + g.NB + g.PD) / 2;
    const path = [[-a, 7], [-a, -1], [-a, ZC]];
    for (let i = 1; i < 24; i++) { const th = Math.PI + Math.PI * i / 24; path.push([a * Math.cos(th), ZC + a * Math.sin(th)]); }
    path.push([a, ZC], [a, -1], [a, 7], [-a, 7]);
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    const total = cum[cum.length - 1];
    const walkers = [];
    for (let i = 0; i < 8; i++) { const w = monkStanding(); group.add(w); walkers.push({ obj: w, off: total * i / 8 }); }
    [[-5.2, -20], [-1.8, -20], [1.8, -20], [5.2, -20], [-5.2, -25], [-1.8, -25], [1.8, -25], [5.2, -25]].forEach((q) => { const m = monkSeated(); m.position.set(q[0], 0, q[1]); group.add(m); });
    const d1 = lay(); d1.position.set(-1.6, 0, ZC + 8.2); d1.rotation.y = Math.PI; group.add(d1);
    part(d1, new T.CylinderGeometry(0.55, 0.55, 0.06, 18), clay, 0, 3.3, 0.7);
    const d2 = lay(); d2.position.set(1.9, 0, ZC + 8.6); d2.rotation.y = Math.PI; group.add(d2);
    const petal = new T.SphereGeometry(0.13, 8, 6), wf = S(0xf4f1ea, 0.6), pf = S(0xe58fa8, 0.6);
    for (let i = 0; i < 5; i++) part(d1, petal, i % 2 ? pf : wf, -0.25 + i * 0.12, 3.4, 0.7 + (i % 3 - 1) * 0.15);
    for (let i = 0; i < 34; i++) { const th = 0.12 * Math.PI + 0.76 * Math.PI * i / 33; part(group, petal, i % 2 ? pf : wf, 5.9 * Math.cos(th), 0.13, ZC + 5.9 * Math.sin(th)); }
    const flameM = new T.MeshBasicMaterial({ color: 0xffc35a });
    const flames = [];
    for (let i = 0; i < 12; i++) { const th = 0.1 * Math.PI + 0.8 * Math.PI * i / 11, x = 6.8 * Math.cos(th), z = ZC + 6.8 * Math.sin(th);
      part(group, new T.CylinderGeometry(0.28, 0.18, 0.16, 10), clay, x, 0.08, z);
      const f = new T.Mesh(new T.ConeGeometry(0.07, 0.24, 8), flameM); f.position.set(x, 0.3, z); group.add(f); flames.push(f); }
    const lamps = [[-3.6, 6.4], [3.6, 6.4], [0, 7.2]].map((q) => { const l = new T.PointLight(0xff9a45, 1.2, 28, 2); l.position.set(q[0], 1.3, ZC + q[1]); group.add(l); return l; });
    const obstacles = [[-5.2, -20, 1.15], [-1.8, -20, 1.15], [1.8, -20, 1.15], [5.2, -20, 1.15], [-5.2, -25, 1.15], [-1.8, -25, 1.15], [1.8, -25, 1.15], [5.2, -25, 1.15], [-1.6, ZC + 8.2, 0.62], [1.9, ZC + 8.6, 0.62]];
    for (let i = 0; i < 12; i++) { const th = 0.1 * Math.PI + 0.8 * Math.PI * i / 11; obstacles.push([6.8 * Math.cos(th), ZC + 6.8 * Math.sin(th), 0.3]); }
    g.live = { group, walkers, path, cum, total, flames, lamps, obstacles, t0: performance.now() };

    // ---- colour and ritual practice of the period (comparative: Bharhut and Sanchi reliefs)
    const cg = new T.Group(); cg.visible = false; scene.add(cg);
    const ochreR = S(0x9a3b22, 0.8), ochreY = S(0xc4943a, 0.8), limeW = S(0xeee6d6, 0.7), pinkF = S(0xd9839b, 0.7), wood = S(0x6b4528, 0.8);
    const gMats = [limeW, ochreR, ochreY, pinkF];
    [ochreR, ochreY, limeW, pinkF].forEach((m) => { m.side = T.DoubleSide; });
    // festoons of flower garlands on the dome, two tiers
    const domePt = (th, ph, k) => new T.Vector3(5.5 * k * Math.sin(ph) * Math.cos(th), 4 + 6 * k * Math.cos(ph), ZC + 5.5 * k * Math.sin(ph) * Math.sin(th));
    [[0.62, 0.38, 16, 0], [1.02, 0.3, 20, 1]].forEach((tier) => {
      const n = tier[2];
      for (let i = 0; i < n; i++) {
        const pts = [];
        for (let j = 0; j <= 12; j++) { const t = j / 12; pts.push(domePt(2 * Math.PI * (i + t) / n, tier[0] + tier[1] * Math.sin(Math.PI * t), 1.03)); }
        part(cg, new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.14, 6, false), gMats[(i + tier[3]) % 4], 0, 0, 0);
      }
    });
    // garlands hanging from the rim of the umbrella
    const rimY = g.stupaTop + 3.8;
    for (let i = 0; i < 10; i++) {
      const pts = [];
      for (let j = 0; j <= 10; j++) { const t = j / 10, th = 2 * Math.PI * (i + t) / 10; pts.push(new T.Vector3(2.55 * Math.cos(th), rimY - 0.1 - 1.0 * Math.sin(Math.PI * t), ZC + 2.55 * Math.sin(th))); }
      part(cg, new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, 0.09, 6, false), gMats[i % 4], 0, 0, 0);
    }
    // hand prints on the drum (ritual touching)
    const handShape = new T.Shape(); handShape.absarc(0, 0, 0.2, 0, Math.PI * 2, false);
    const palmG = new T.ShapeGeometry(handShape, 12);
    for (let i = 0; i < 11; i++) {
      const th = 0.18 * Math.PI + 0.64 * Math.PI * i / 10, y = 1.6 + (i % 3) * 0.55;
      const h = new T.Group();
      const pm = new T.Mesh(palmG, ochreR); h.add(pm);
      [[-0.17, 0.27, 0.35], [-0.06, 0.33, 0.12], [0.05, 0.34, 0], [0.15, 0.3, -0.12], [0.24, 0.05, -0.75]].forEach((f) => {
        const fm = new T.Mesh(new T.PlaneGeometry(0.075, 0.26), ochreR); fm.position.set(f[0], f[1], 0); fm.rotation.z = f[2]; h.add(fm); });
      h.position.set(5.53 * Math.cos(th), y, ZC + 5.53 * Math.sin(th));
      h.rotation.y = Math.atan2(Math.cos(th), Math.sin(th));
      cg.add(h);
    }
    // flowers strewn on the floor before the stupa
    for (let i = 0; i < 70; i++) { const rr = 7.3 + rnd() * 2.2, th = 0.15 * Math.PI + rnd() * 0.7 * Math.PI; part(cg, petal, gMats[i % 4], rr * Math.cos(th), 0.12, ZC + rr * Math.sin(th)); }
    // people: banner bearers, a kneeling devotee, one touching the stupa, musicians
    const banner = (k, m) => { part(k, new T.CylinderGeometry(0.06, 0.06, 10, 8), wood, 0.7, 5, 0); const b = part(k, new T.PlaneGeometry(1.3, 2.6), m, 0.7 + 0.68, 8.4, 0); b.material = m; return k; };
    const cobs = [];
    [[-5.2, -7, ochreR], [5.2, -7, ochreY]].forEach((q) => { const k = banner(lay(), q[2]); k.position.set(q[0], 0, q[1]); k.rotation.y = Math.PI; cg.add(k); cobs.push([q[0], q[1], 0.62]); });
    const kn = new T.Group();
    part(kn, new T.CylinderGeometry(0.75, 0.85, 1.0, 14), white, 0, 0.5, 0);
    const torso = part(kn, new T.CylinderGeometry(0.38, 0.55, 1.7, 14), white, 0, 1.75, 0.15); torso.rotation.x = 0.35;
    part(kn, new T.SphereGeometry(0.4, 14, 10), skin, 0, 2.85, 0.55);
    kn.position.set(0, 0, ZC + 10.4); kn.rotation.y = Math.PI; cg.add(kn); cobs.push([0, ZC + 10.4, 0.9]);
    const tc = lay(); const arm = part(tc, new T.CylinderGeometry(0.11, 0.11, 1.5, 8), skin, 0.3, 3.35, 0.6); arm.rotation.x = 1.15;
    tc.position.set(6.25, 0, ZC); tc.rotation.y = -Math.PI / 2; cg.add(tc); cobs.push([6.25, ZC, 0.62]);
    const drummer = lay(); const drum = part(drummer, new T.CylinderGeometry(0.45, 0.45, 1.3, 16), wood, 0, 3.0, 0.65); drum.rotation.z = Math.PI / 2;
    drummer.position.set(-6, 0, 13); drummer.rotation.y = Math.PI; cg.add(drummer); cobs.push([-6, 13, 0.62]);
    const flutist = lay(); const fl = part(flutist, new T.CylinderGeometry(0.05, 0.05, 1.4, 8), wood, 0.45, 4.55, 0.45); fl.rotation.z = Math.PI / 2 - 0.25;
    flutist.position.set(6, 0, 13); flutist.rotation.y = Math.PI; cg.add(flutist); cobs.push([6, 13, 0.62]);
    g.color = { group: cg, obstacles: cobs };
  }

  animateLive() {
    const L = this.g.live, now = performance.now(), t = (now - L.t0) / 1000;
    const speed = 2.3; // ft per second, an unhurried walk
    L.walkers.forEach((w) => {
      let d = (t * speed + w.off) % L.total, i = 1;
      while (i < L.cum.length - 1 && L.cum[i] < d) i++;
      const p0 = L.path[i - 1], p1 = L.path[i], seg = L.cum[i] - L.cum[i - 1], f = seg ? (d - L.cum[i - 1]) / seg : 0;
      const dx = p1[0] - p0[0], dz = p1[1] - p0[1];
      w.obj.position.set(p0[0] + dx * f, 0.06 * Math.abs(Math.sin(t * 5.2 + w.off)), p0[1] + dz * f);
      w.obj.rotation.y = Math.atan2(dx, dz);
    });
    L.flames.forEach((f, i) => { const k = 0.85 + 0.3 * Math.abs(Math.sin(t * 9 + i * 1.7) * Math.sin(t * 4.3 + i)); f.scale.set(1, k, 1); });
    L.lamps.forEach((l, i) => { l.intensity = 1.05 + 0.25 * Math.sin(t * 11 + i * 2.1) * Math.sin(t * 6.7 + i); });
  }

  applyLook() {
    const g = this.g, real = this.st().real;
    g.U.uAmt.value = real ? 1 : 0;
    g.sky.visible = real;
    g.trees.forEach((m) => { m.visible = real; });
    g.scene.background = real ? null : new g.T.Color(0xa9bccd);
    if (!real) g.scene.fog.color.setHex(0xa9bccd);
    g.hemi.intensity = real ? 0.3 : 0.42;
    g.renderer.toneMappingExposure = real ? 1.15 : 1.05;
    this.applySun();
  }

  chantLines() {
    const N = ['नमो तस्स भगवतो अरहतो सम्मासम्बुद्धस्स', 'Namo tassa bhagavato arahato sammāsambuddhassa', 'Namo tassa bhagavato arahato sammaa sambuddhassa', 'Homage to the Blessed One, the Worthy One, the fully awakened Buddha.'];
    const out = [N];
    const ord = [['', '', '', ''], ['दुतियम्पि ', 'Dutiyampi ', 'Dutiyampi ', 'For the second time, '], ['ततियम्पि ', 'Tatiyampi ', 'Tatiyampi ', 'For the third time, ']];
    const ref = [['बुद्धं', 'buddhaṃ', 'buddham', 'Buddha'], ['धम्मं', 'dhammaṃ', 'dhammam', 'Dhamma'], ['सङ्घं', 'saṅghaṃ', 'sangham', 'Saṅgha']];
    ord.forEach((o) => ref.forEach((r) => {
      const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
      out.push([o[0] + r[0] + ' सरणं गच्छामि', cap(o[1] + r[1] + ' saraṇaṃ gacchāmi'), cap(o[2] + r[2] + ' saranam gacchaami'),
        (o[3] ? o[3] + 'I' : 'I') + ' go to the ' + r[3] + ' for refuge.']);
    }));
    return out;
  }

  startChant() {
    this.stopChant();
    const run = this.chantRun = {};
    // synthesised hum of several voices with a long, cave-like echo
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC(); if (ctx.state === 'suspended') ctx.resume();
        const master = ctx.createGain(); master.gain.value = 0;
        const dry = ctx.createGain(); dry.gain.value = 0.45;
        const wet = ctx.createGain(); wet.gain.value = 0.9;
        const conv = ctx.createConvolver();
        const len = Math.floor(ctx.sampleRate * 3.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
        conv.buffer = ir;
        const voiceBus = ctx.createGain(); voiceBus.gain.value = 0.5;
        [[700, 6], [1150, 8], [2600, 10]].forEach((f, i) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f[0]; bp.Q.value = f[1]; const fg = ctx.createGain(); fg.gain.value = [1, 0.55, 0.25][i]; voiceBus.connect(bp); bp.connect(fg); fg.connect(dry); fg.connect(conv); });
        const low = ctx.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 420; voiceBus.connect(low); low.connect(dry); low.connect(conv);
        conv.connect(wet); dry.connect(master); wet.connect(master); master.connect(ctx.destination);
        const oscs = [-0.7, 0, 0.6, -0.25, 0.35].map((det, i) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 110 + det; const g = ctx.createGain(); g.gain.value = i < 4 ? 0.22 : 0.12; if (i === 4) o.frequency.value = 55.2; o.connect(g); g.connect(voiceBus); o.start(); return o; });
        const swell = ctx.createOscillator(), swg = ctx.createGain(); swell.frequency.value = 0.18; swg.gain.value = 0.18; swell.connect(swg); swg.connect(voiceBus.gain); swell.start();
        this.audio = { ctx, master, oscs, swell };
      }
    } catch (e) { this.audio = null; }
    const lines = this.chantLines();
    const synth = window.speechSynthesis;
    let voice = null, label = 'Captions only: this browser has no speech voice.';
    if (synth && window.SpeechSynthesisUtterance) {
      const vs = synth.getVoices() || [];
      voice = vs.find((v) => /^hi/i.test(v.lang)) || vs.find((v) => /^mr/i.test(v.lang)) || null;
      label = voice ? 'Voice: ' + voice.name + ' (device text-to-speech) reading Pali in Devanagari.' : 'No Hindi voice on this device: the default voice reads romanised Pali.';
    }
    this.setState({ chantVoice: label, chantLine: 0 });
    const pitches = [110, 110, 123.47, 110, 98, 110];
    const say = (i) => {
      if (this.chantRun !== run) return;
      const idx = i % lines.length;
      this.setState({ chantLine: idx });
      if (this.audio) { const f = pitches[idx % pitches.length], t = this.audio.ctx.currentTime; this.audio.oscs.forEach((o, k) => o.frequency.setTargetAtTime(k === 4 ? f / 2 : f + [-0.7, 0, 0.6, -0.25][k], t, 0.4)); }
      const next = () => { if (this.chantRun !== run) return; run.timer = setTimeout(() => say(i + 1), idx === lines.length - 1 ? 3500 : 700); };
      if (synth && window.SpeechSynthesisUtterance) {
        const u = new SpeechSynthesisUtterance(voice ? lines[idx][0] : lines[idx][2]);
        if (voice) { u.voice = voice; u.lang = voice.lang; }
        u.rate = 0.6; u.pitch = 0.2; u.volume = 1;
        let done = false; const fin = () => { if (done) return; done = true; clearTimeout(run.guard); next(); };
        u.onend = fin; u.onerror = fin;
        run.guard = setTimeout(fin, 12000);
        synth.speak(u);
      } else { run.timer = setTimeout(next, 4200); }
    };
    run.start = setTimeout(() => say(0), 250);
  }

  stopChant() {
    const run = this.chantRun;
    if (run) { clearTimeout(run.timer); clearTimeout(run.guard); clearTimeout(run.start); }
    this.chantRun = null;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    if (this.audio) { const a = this.audio; try { a.master.gain.setTargetAtTime(0, a.ctx.currentTime, 0.15); setTimeout(() => { try { a.ctx.close(); } catch (e) {} }, 600); } catch (e) {} this.audio = null; }
  }

  sph(v) {
    const d = [v.pos[0] - v.tgt[0], v.pos[1] - v.tgt[1], v.pos[2] - v.tgt[2]];
    const r = Math.hypot(d[0], d[1], d[2]);
    return { t: v.tgt.slice(), r: r, phi: Math.acos(Math.max(-1, Math.min(1, d[1] / r))), theta: Math.atan2(d[0], d[2]) };
  }

  fpForward() { const f = this.fp; return { x: -Math.sin(f.yaw) * Math.cos(f.pitch), y: Math.sin(f.pitch), z: -Math.cos(f.yaw) * Math.cos(f.pitch) }; }

  goView(name, animate) {
    const g = this.g;
    if (name === 'walk') {
      g.renderer.clippingPlanes = [];
      this.isFP = true; this.tw = 1; this.keys = {}; this.lastT = 0;
      this.fp = { x: 0, z: 18, yaw: 0, pitch: 0.06 };
      this.dirty = true;
      try { g.canvas.focus({ preventScroll: true }); } catch (e) {}
      return;
    }
    if (this.isFP) {
      const c = g.cam.position, f = this.fpForward();
      this.cs = this.sph({ pos: [c.x, c.y, c.z], tgt: [c.x + f.x * 12, c.y + f.y * 12, c.z + f.z * 12] });
      this.isFP = false;
    }
    const v = g.views[name];
    g.renderer.clippingPlanes = v.clip ? [v.clip] : [];
    this.from = JSON.parse(JSON.stringify(this.cs));
    this.goal = this.sph(v);
    let dt = this.goal.theta - this.from.theta;
    dt = ((dt + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    this.goal.theta = this.from.theta + dt;
    this.tw = animate ? 0 : 1;
    if (!animate) this.cs = this.goal;
    this.dirty = true;
  }

  applyVisibility() {
    const g = this.g, s = this.st();
    const wood = s.timber || s.liveOn;
    g.timber.forEach((m) => { m.visible = wood; });
    g.pins.visible = !wood;
    if (g.live) g.live.group.visible = s.liveOn;
    if (g.ico) {
      g.ico.group.visible = s.ico;
      g.symPillars.forEach((m) => { if (!m.userData.orig) m.userData.orig = m.material; m.material = s.ico ? g.ico.hi : m.userData.orig; });
    }
    if (g.color) {
      g.color.group.visible = s.color;
      g.paintable.forEach((m) => { m.material = s.color ? m.userData.paint : m.userData.orig; });
    }
    g.ribs.forEach((m) => { m.visible = s.ribsAll || !m.userData.lost; });
    g.person.forEach((m) => { m.visible = s.person; });
    this.dirty = true;
  }

  applySun() {
    const g = this.g, t = this.st().time, T = g.T, scene = g.scene;
    const elev = Math.max(2, 72 - (t - 12) * 11) * Math.PI / 180;
    const south = 18 * Math.PI / 180;
    const c = g.sun.target.position;
    g.sun.position.set(c.x + 400 * Math.cos(elev) * Math.sin(south), c.y + 400 * Math.sin(elev), c.z + 400 * Math.cos(elev) * Math.cos(south));
    const warm = Math.min(1, Math.max(0, (t - 15.5) / 3));
    g.sun.color.setRGB(1, 0.93 - 0.2 * warm, 0.82 - 0.35 * warm);
    g.sun.intensity = (this.st().real ? 2.8 : 2.4) - 0.9 * Math.max(0, (t - 17.5));
    if (g.sky) {
      g.sky.material.uniforms.hor.value.setHex(0xe4d2b4).lerp(new T.Color(0xf09a5e), warm);
      g.sky.material.uniforms.top.value.setHex(0x5f8fc4).lerp(new T.Color(0x3c5a86), warm);
      if (this.st().real) scene.fog.color.copy(g.sky.material.uniforms.hor.value);
    }
    this.dirty = true;
  }

  bindInput() {
    const c = this.g.canvas, pts = new Map();
    let last = null, pinch = 0;
    const down = (e) => { try { c.focus({ preventScroll: true }); } catch (er) {} c.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); last = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey }; c.style.cursor = 'grabbing'; this.tw = 1; };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && this.isFP) return;
      if (pts.size === 2) {
        const a = Array.from(pts.values()); const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        if (pinch) this.zoom(pinch / d); pinch = d; return;
      }
      if (!last) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y; last.x = e.clientX; last.y = e.clientY;
      if (this.isFP) { this.fp.yaw += dx * 0.004; this.fp.pitch = Math.max(-1.2, Math.min(1.2, this.fp.pitch + dy * 0.004)); this.dirty = true; return; }
      const s = this.cs;
      if (last.pan) {
        const cam = this.g.cam, T = this.g.T, k = s.r * 0.0016;
        const right = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
        s.t[0] += (-dx * right.x + dy * up.x) * k; s.t[1] += (-dx * right.y + dy * up.y) * k; s.t[2] += (-dx * right.z + dy * up.z) * k;
      } else {
        s.theta -= dx * 0.005; s.phi = Math.max(0.001, Math.min(Math.PI - 0.05, s.phi - dy * 0.005));
      }
      this.dirty = true;
    };
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) { last = null; c.style.cursor = 'grab'; } };
    const wheel = (e) => {
      if (!(e.ctrlKey || e.metaKey) && document.activeElement !== c && !document.fullscreenElement) {
        clearTimeout(this.wheelTimer); if (!this.st().wheelNote) this.setState({ wheelNote: true });
        this.wheelTimer = setTimeout(() => this.setState({ wheelNote: false }), 1600);
        return;
      }
      e.preventDefault();
      if (this.isFP) { const st = Math.max(-2, Math.min(2, -e.deltaY * 0.01)); this.fpMove(-Math.sin(this.fp.yaw) * st, -Math.cos(this.fp.yaw) * st); return; }
      this.tw = 1; this.zoom(Math.exp(e.deltaY * 0.0012));
    };
    const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
    const kd = (e) => { if (!this.isFP || MOVE_KEYS.indexOf(e.code) < 0) return; e.preventDefault(); this.keys[e.code] = true; };
    const ku = (e) => { if (this.keys) this.keys[e.code] = false; };
    const bl = () => { this.keys = {}; };
    c.addEventListener('keydown', kd); c.addEventListener('keyup', ku); c.addEventListener('blur', bl);
    const ctx = (e) => e.preventDefault();
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', wheel, { passive: false }); c.addEventListener('contextmenu', ctx);
    this.cleanupInput = () => {
      c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up);
      c.removeEventListener('wheel', wheel); c.removeEventListener('contextmenu', ctx);
      c.removeEventListener('keydown', kd); c.removeEventListener('keyup', ku); c.removeEventListener('blur', bl);
    };
  }

  zoom(f) { this.cs.r = Math.max(1.5, Math.min(600, this.cs.r * f)); this.dirty = true; }

  step() {
    const g = this.g, T = g.T;
    if (g.sky) g.sky.position.copy(g.cam.position);
    if (g.live && g.live.group.visible) this.animateLive();
    if (this.audio) {
      const c = g.cam.position, d = Math.hypot(c.x, c.y - 5, c.z + 25);
      this.audio.master.gain.setTargetAtTime(0.16 * Math.max(0.06, Math.min(1, 1 - (d - 22) / 110)), this.audio.ctx.currentTime, 0.2);
    }
    if (this.isFP) { this.stepFP(); return; }
    if (this.tw < 1) {
      this.tw = Math.min(1, this.tw + 0.022);
      const e = this.tw < 0.5 ? 2 * this.tw * this.tw : 1 - Math.pow(-2 * this.tw + 2, 2) / 2;
      const a = this.from, b = this.goal, lr = (x, y) => x + (y - x) * e;
      this.cs = { t: [lr(a.t[0], b.t[0]), lr(a.t[1], b.t[1]), lr(a.t[2], b.t[2])], r: Math.exp(lr(Math.log(a.r), Math.log(b.r))), phi: lr(a.phi, b.phi), theta: lr(a.theta, b.theta) };
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;
    const s = this.cs, cam = g.cam;
    cam.position.set(s.t[0] + s.r * Math.sin(s.phi) * Math.sin(s.theta), s.t[1] + s.r * Math.cos(s.phi), s.t[2] + s.r * Math.sin(s.phi) * Math.cos(s.theta));
    cam.up.set(0, 1, 0);
    cam.lookAt(s.t[0], s.t[1], s.t[2]);
    cam.updateMatrixWorld();
    this.updateLabels();
  }

  walkable(x, z) {
    const g = this.g, r = 0.55, HW = g.HW, ZC = g.ZC, s = this.st();
    if (z >= 0) { if (z > 24 || Math.abs(x) > 60) return false; if (z < r && Math.abs(x) > HW - r) return false; }
    else if (z >= ZC) { if (Math.abs(x) > HW - r) return false; }
    else if (Math.hypot(x, z - ZC) > HW - r) return false;
    if (Math.hypot(x, z - ZC) < 5.5 + r) return false;
    for (let i = 0; i < g.pillarPos.length; i++) { const p = g.pillarPos[i]; if (Math.hypot(x - p[0], z - p[1]) < 0.95 + r) return false; }
    if ((s.timber || s.liveOn) && Math.abs(z + 0.5) < 0.125 + r && Math.abs(x) < g.NT + r) {
      const ax = Math.abs(x);
      if (!(ax < 2.1 - r || (ax > 4.4 + r && ax < 6.4 - r))) return false;
    }
    if (s.person && Math.hypot(x + 2.6, z + 14) < 0.62 + r) return false;
    if (s.color && g.color) { const oc = g.color.obstacles; for (let i = 0; i < oc.length; i++) if (Math.hypot(x - oc[i][0], z - oc[i][1]) < oc[i][2] + r) return false; }
    if (s.liveOn && g.live) { const ob = g.live.obstacles; for (let i = 0; i < ob.length; i++) if (Math.hypot(x - ob[i][0], z - ob[i][1]) < ob[i][2] + r) return false; }
    return true;
  }

  fpMove(dx, dz) {
    const f = this.fp;
    if (this.walkable(f.x + dx, f.z + dz)) { f.x += dx; f.z += dz; }
    else if (this.walkable(f.x + dx, f.z)) f.x += dx;
    else if (this.walkable(f.x, f.z + dz)) f.z += dz;
    else return;
    this.dirty = true;
  }

  stepFP() {
    const g = this.g, f = this.fp, k = this.keys || {};
    const now = performance.now(), dt = this.lastT ? Math.min(0.05, (now - this.lastT) / 1000) : 0; this.lastT = now;
    const turn = ((k.ArrowLeft || k.padLeft) ? 1 : 0) - ((k.ArrowRight || k.padRight) ? 1 : 0);
    if (turn) { f.yaw += turn * 1.5 * dt; this.dirty = true; }
    const fwd = ((k.KeyW || k.ArrowUp || k.padFwd) ? 1 : 0) - ((k.KeyS || k.ArrowDown || k.padBack) ? 1 : 0);
    const side = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    if (fwd || side) {
      const sp = ((k.ShiftLeft || k.ShiftRight) ? 9 : 4.6) * dt; // about 1.4 m/s walking
      const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw);
      this.fpMove((fx * fwd - fz * side) * sp, (fz * fwd + fx * side) * sp);
    }
    if (!this.dirty) return;
    this.dirty = false;
    const EYE = 5.25; // 1.6 m eye level
    const d = this.fpForward(), cam = g.cam;
    cam.up.set(0, 1, 0);
    cam.position.set(f.x, EYE, f.z);
    cam.lookAt(f.x + d.x, EYE + d.y, f.z + d.z);
    cam.updateMatrixWorld();
    this.updateLabels();
  }

  updateLabels() {
    const g = this.g;
    const st = this.st();
    if (!st.labels) { if (st.labelPos.length) this.setState({ labelPos: [] }); return; }
    const w = g.canvas.clientWidth, h = g.canvas.clientHeight, clips = g.renderer.clippingPlanes;
    const out = [];
    g.anchors.forEach((a) => {
      if (a.live && !st.liveOn) return;
      if (a.color && !st.color) return;
      if (a.ico && !st.ico) return;
      if (clips.some((pl) => pl.distanceToPoint(a.p) < 0)) return;
      const v = a.p.clone().project(g.cam);
      if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 1.02 || Math.abs(v.y) > 1.02) return;
      const dir = a.p.clone().sub(g.cam.position); const dist = dir.length(); dir.normalize();
      this.raycaster.set(g.cam.position, dir); this.raycaster.far = dist - 0.4;
      const hits = this.raycaster.intersectObjects(g.occluders, false).filter((hh) => !clips.some((pl) => pl.distanceToPoint(hh.point) < 0));
      if (hits.length) return;
      const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
      out.push({ n: String(a.n), name: a.name, style: 'position:absolute;left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;transform:translate(-10px,-50%);display:flex;align-items:center;gap:6px;white-space:nowrap' });
    });
    this.setState({ labelPos: out });
  }

  // ------------------------------------------------------------------ UI values
  renderVals() {
    this.sync();
    const s = this.st();
    const on = 'min-height:36px;padding:0 12px;border-radius:8px;border:1px solid #e0b07a;background:#e0b07a;color:#1a1410;font:600 13px Inter,system-ui,sans-serif;cursor:pointer';
    const off = 'min-height:36px;padding:0 12px;border-radius:8px;border:1px solid #4a3f36;background:transparent;color:#efe7dc;font:500 13px Inter,system-ui,sans-serif;cursor:pointer';
    const views = [['exterior', 'Exterior'], ['nave', 'Nave'], ['aisle', 'Aisle'], ['stupa', 'Stupa'], ['section', 'Section'], ['plan', 'Plan'], ['walk', 'Walk (first person)']].map((v) => ({
      label: v[1], pressed: s.view === v[0] ? 'true' : 'false', style: s.view === v[0] ? on : off,
      pick: () => { if (this.st().view === v[0]) { if (this.g) this.goView(v[0], true); } else this.setState({ view: v[0] }); }
    }));
    const hold = (key) => ({ down: () => { this.keys = this.keys || {}; this.keys[key] = true; }, up: () => { if (this.keys) this.keys[key] = false; } });
    const padBtn = 'min-width:44px;min-height:44px;padding:0 12px;border-radius:8px;border:1px solid #4a3f36;background:rgba(20,17,15,0.9);color:#efe7dc;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;touch-action:none;user-select:none';
    const pad = [['padLeft', 'Turn left'], ['padFwd', 'Forward'], ['padBack', 'Back'], ['padRight', 'Turn right']].map((q) => Object.assign({ label: q[1], style: padBtn }, hold(q[0])));
    const tg = (key, label) => ({ label: label, pressed: s[key] ? 'true' : 'false', style: s[key] ? on : off, pick: () => this.setState({ [key]: !this.st()[key] }) });
    const looks = [[false, 'Model'], [true, 'Realistic']].map((l) => ({ label: l[1], pressed: s.real === l[0] ? 'true' : 'false', style: s.real === l[0] ? on : off, pick: () => this.setState({ real: l[0] }) }));
    const chantBtn = { label: 'Chant (sound)', pressed: s.chant ? 'true' : 'false', style: s.chant ? on : off, pick: () => { const onNow = !this.st().chant; if (onNow) this.startChant(); else this.stopChant(); this.setState({ chant: onNow }); } };
    const toggles = [tg('ico', 'Iconography'), tg('live', 'Show it in use'), tg('color', 'Colour & rituals of the time'), chantBtn, tg('timber', 'Timber front (hypothetical)'), tg('ribsAll', 'Restore lost ribs'), tg('person', 'Person for scale'), tg('labels', 'Labels')];

    const ft = s.units === 'ft';
    const tagM = 'font-size:10.5px;font-weight:600;letter-spacing:0.04em;padding:2px 7px;border-radius:999px;background:#2f3a2c;color:#cfe0c4;white-space:nowrap';
    const tagR = 'font-size:10.5px;font-weight:600;letter-spacing:0.04em;padding:2px 7px;border-radius:999px;background:#4a3524;color:#f0cfa8;white-space:nowrap';
    const tagI = 'font-size:10.5px;font-weight:600;letter-spacing:0.04em;padding:2px 7px;border-radius:999px;background:#253447;color:#c8daf0;white-space:nowrap';
    const tagC = 'font-size:10.5px;font-weight:600;letter-spacing:0.04em;padding:2px 7px;border-radius:999px;background:#3a2f4a;color:#e0d2f2;white-space:nowrap';
    const tagE = 'font-size:10.5px;font-weight:600;letter-spacing:0.04em;padding:2px 7px;border-radius:999px;background:#3a3631;color:#e2dbd0;white-space:nowrap';
    const TAGS = { ill: ['Illustrative', tagI], doc: ['Documented', tagM], cmp: ['Comparative', tagC], hyp: ['Hypothetical', tagR], unc: ['Position uncertain', tagR], plc: ['Placeholder form', tagR], est: ['Estimated', tagE] };
    const F = (k, a, b, rec) => { const t = TAGS[rec] || (rec ? ['Reconstructed', tagR] : ['Measured', tagM]); return { k: k, v: ft ? a : b, tag: t[0], tagStyle: t[1] }; };
    const extra = [];
    if (s.ico) {
      const i1 = 'The 1880 and 1885 surveys record no image of the Buddha in the hall. The stupa stands at its far end; no figure is shown.';
      extra.push(F('I1 · Stupa', i1, i1, 'doc'));
      const i2 = 'On four of the pillars, seven ornaments or Buddhist symbols are carved in low relief (Fergusson and Burgess 1880; Gazetteer 1885). On the left of the 7th pillar: four tridents round a centre which perhaps held a face (the Gazetteer prints "fan"), with buds and leaves at the corners. On the 8th pillar: two flowers and what looks like a fan on the right side, and a posy of holy flowers on the left. The other symbols are not described.';
      extra.push(F('I2 · Pillar symbols', i2, i2, 'doc'));
      const i2b = 'The sources do not say which row these pillars are in, or which end they count from. The model highlights the 7th and 8th pillars of both rows, counting from the entrance, so the placement is uncertain.';
      extra.push(F('I2 · Where they are', i2b, i2b, 'unc'));
      const i3 = 'High up on the left of the front: a female figure, much weather-worn, with a beaded belt about the loins (Fergusson and Burgess 1880; the 1885 Gazetteer prints "lions").';
      extra.push(F('I3 · Female figure', i3, i3, 'doc'));
      const i4 = 'Two half-figures looking out at a window in the projecting side to the right of the great arch (Gazetteer 1885).';
      extra.push(F('I4 · Window figures', i4, i4, 'doc'));
      const i5 = 'On the same side, the heads of two others in two small compartments, level with the top of the arch (Gazetteer 1885).';
      extra.push(F('I5 · Heads', i5, i5, 'doc'));
      const i6 = 'Grey slabs only mark where the figures are; they are not models of the carvings. Their exact positions on the front are approximate.';
      extra.push(F('Figure markers', i6, i6, 'plc'));
    }
    if (s.chant) {
      const h1 = 'The Khuddakapāṭha of the Pali canon opens with the homage "Namo tassa bhagavato arahato sammāsambuddhassa", followed by the Three Refuges, each taken three times. In the Saṅgārava Sutta (MN 100) the homage is spoken three times.';
      extra.push(F('Chant text', h1, h1, 'doc'));
      const h2 = 'The words, language and melody used at Bhaja are not recorded. The voice is your device\'s text-to-speech. The hum of several voices and the cave-like echo are synthesised. Louder inside the hall, fainter outside.';
      extra.push(F('Chant sound', h2, h2, 'ill'));
    }
    if (s.color) {
      const c1 = 'Reliefs of about the same era show stupa worship: at Bharhut (2nd century BCE), people walk round and kneel before a stupa, celestials bring flower garlands, and hand prints mark its base (Freer Gallery of Art, F1932.26); on the Sanchi gateways (late 1st century BCE), worshippers gather round stupas with music and dancing, and banners are carried in a relic procession (Marshall, A Guide to Sanchi). None of this is recorded at Bhaja itself; the strewn flowers are illustrative.';
      extra.push(F('Colour & rituals', c1, c1, 'cmp'));
      const c2 = 'A Bharhut relief shows hand prints on a stupa base, a sign of worship by ritual touching (Freer Gallery of Art). The red colour here is illustrative.';
      extra.push(F('Hand prints', c2, c2, 'cmp'));
      const c3 = 'No paint is recorded on the Bhaja front in the sources used. The colours on the facade arch, rails and small arches are a hypothesis.';
      extra.push(F('Painted facade', c3, c3, 'hyp'));
      const c4 = 'Earth colours only (red and yellow ochre, lime white), chosen as a hypothesis. No pigment study of Bhaja is cited here.';
      extra.push(F('Palette', c4, c4, 'hyp'));
      const c5 = 'Left as bare stone: no painting inside the hall is shown.';
      extra.push(F('Interior', c5, c5, 'ill'));
    }
    if (s.liveOn) {
      const u = 'Monks walk round the stupa keeping it on their right (pradakṣiṇā, clockwise), along the aisle behind the apse. Others sit in the nave; lay donors bring flowers, and lamps burn at the stupa.';
      extra.push(F('In use', u, u, 'ill'));
      const d = 'The 1880 and 1885 surveys record no image of the Buddha in the hall, so none is shown; the stupa is at its far end.';
      extra.push(F('No Buddha image', d, d, 'doc'));
      const n = 'Number of people, robe colour, lamps and offerings are illustrative, not recorded for this hall. The timber front is shown in place while the hall is in use.';
      extra.push(F('What is shown', n, n, 'ill'));
    }
    if (s.real) {
      const r = 'Basalt and teak surfaces are generated textures, with lava-flow banding and darker light deep in the hall. Colours are approximate, not taken from photographs; trees and sky are generic.';
      extra.push(F('Realistic look', r, r, 'ill'));
    }
    const facts = extra.concat([
      F('Date', 'Fergusson and Burgess (1880): about 200 BCE or earlier. The 1885 Gazetteer: 2nd–1st century BCE.', 'Fergusson and Burgess (1880): about 200 BCE or earlier. The 1885 Gazetteer: 2nd–1st century BCE.', 'doc'),
      F('Setting', 'In the west face of a steep hill, about 400 ft above Bhaja village (Gazetteer 1885).', 'In the west face of a steep hill, about 122 m above Bhaja village (Gazetteer 1885).', 'doc'),
      F('Length', '59 ft, front to the back of the semicircular apse.', '17.98 m, front to the back of the semicircular apse.'),
      F('Width', '26 ft 8 in (Fergusson and Burgess). The 1885 Gazetteer gives about 29 ft.', '8.13 m (Fergusson and Burgess). The 1885 Gazetteer gives about 8.8 m.'),
      F('Height', '26 ft 5 in from the floor to the crown of the vault.', '8.05 m from the floor to the crown of the vault.'),
      F('Pillars', '27 plain octagonal shafts, 11 ft 4 in high, raking inward about 5 in on each side.', '27 plain octagonal shafts, 3.45 m high, raking inward about 13 cm on each side.'),
      F('Nave and aisle', 'Nave 16 ft 4 in wide at the pillar bases, 15 ft 6 in at their tops; aisle 3 ft 5 in.', 'Nave 4.98 m wide at the pillar bases, 4.72 m at their tops; aisle 1.04 m.'),
      F('Vault', 'Rises from a narrow ledge 7 ft 5 in above the pillar tops.', 'Rises from a narrow ledge 2.26 m above the pillar tops.'),
      F('Ribs', 'Teak ribs line the vault. By 1880 the first four, and parts of others, had given way or been pulled down; the model shows that state.', 'Teak ribs line the vault. By 1880 the first four, and parts of others, had given way or been pulled down; the model shows that state.', 'doc'),
      F('Stupa', '11 ft across at the floor; drum 4 ft, dome 6 ft high; a two-storeyed box on top.', '3.35 m across at the floor; drum 1.22 m, dome 1.83 m high; a two-storeyed box on top.'),
      F('Hole in the box', 'The upper box has a hole 7 in across and about 1 ft 8 in deep.', 'The upper box has a hole 18 cm across and about 51 cm deep.'),
      F('Front', 'Entirely of wood: four holes in the floor for the main uprights, mortices in the arch for a cross-beam, and about 170 pin holes in three rows on the great arch.', 'Entirely of wood: four holes in the floor for the main uprights, mortices in the arch for a cross-beam, and about 170 pin holes in three rows on the great arch.', 'doc'),
      F('Inside', 'The 1880 and 1885 surveys record carved symbols on four pillars but no image of the Buddha.', 'The 1880 and 1885 surveys record carved symbols on four pillars but no image of the Buddha.', 'doc'),
      F('Timber front form', 'Screen with central and side doors, frame and lattice in the arch window, and an umbrella on the stupa: a hypothesis built on the sockets, mortices and pin holes. Toggle it on.', 'Screen with central and side doors, frame and lattice in the arch window, and an umbrella on the stupa: a hypothesis built on the sockets, mortices and pin holes. Toggle it on.', 'hyp'),
      F('Estimated in the model', 'Pillar spacing (11 a side, 5 round the apse), rib spacing, box sizes, aisle ceiling, facade relief and terrain.', 'Pillar spacing (11 a side, 5 round the apse), rib spacing, box sizes, aisle ceiling, facade relief and terrain.', 'est'),
      F('Person', '5 ft 7 in, for scale.', '1.70 m, for scale.', 'ill')
    ]);
    const hr = Math.floor(s.time), mn = Math.round((s.time - hr) * 60);
    const timeLabel = ((hr % 12) || 12) + ':' + String(mn).padStart(2, '0') + (hr >= 12 ? ' pm' : ' am');
    return {
      setCanvas: this.setCanvas,
      panelCls: s.panel ? 'bj-panel open' : 'bj-panel', panelPressed: s.panel ? 'true' : 'false', panelBtnStyle: s.panel ? on : off,
      togglePanel: () => this.setState({ panel: !this.st().panel }), wheelNote: s.wheelNote,
      views: views, toggles: toggles, facts: facts, looks: looks, pad: pad,
      showPad: s.view === 'walk',
      showChant: s.chant,
      chantDeva: this.chantLines()[s.chantLine][0], chantRoman: this.chantLines()[s.chantLine][1], chantEn: this.chantLines()[s.chantLine][3],
      chantVoice: s.chantVoice,
      hintText: s.view === 'walk' ? 'Walk: W/S or ↑/↓ to move · A/D to sidestep · ←/→ to turn · drag to look · Shift to go faster · eye level 1.6 m' : 'Drag to orbit · right-drag or Shift-drag to pan · pinch, or click the model then scroll, to zoom',
      labelPos: s.labelPos,
      time: s.time, timeLabel: timeLabel,
      onTime: (e) => this.setState({ time: parseFloat(e.target.value) }),
      setFt: () => this.setState({ units: 'ft' }), setM: () => this.setState({ units: 'm' }),
      ftPressed: ft ? 'true' : 'false', mPressed: ft ? 'false' : 'true',
      ftStyle: ft ? on : off, mStyle: ft ? off : on,
      showStatus: !s.ready || !!s.err,
      statusText: s.err || 'Loading the 3D model…'
    };
  }
}

export function start(host) { return mount(host, MARKUP, Component); }
