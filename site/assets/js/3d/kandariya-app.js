// kandariya: the 3D model app from the Claude Design canvas aa5f80ed-5676-496a-aaee-353ea79aee60 (version 1794415643-22a3),
// run on the website by dc-lite.js. Texts and facts are the checked ones (render/3d/*-sources.md).
import { DCLogic, mount } from './dc-lite.js';

const MARKUP = `
<div class="k-root" style="box-sizing: border-box; width: 100%; max-width: 1480px; margin: 0 auto; padding: 8px 28px 40px; font-family: Inter, system-ui, sans-serif; color: #2a2118; display: flex; flex-direction: column; gap: 16px">
<div style="display: flex; flex-wrap: wrap; gap: 8px">
<sc-for list="{{ views }}" as="v" hint-placeholder-count="7">
<button type="button" class="{{ v.cls }}" onClick="{{ v.pick }}">{{ v.label }}</button>
</sc-for>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
<sc-for list="{{ toggles }}" as="t" hint-placeholder-count="10">
<button type="button" class="{{ t.cls }}" onClick="{{ t.flip }}" aria-pressed="{{ t.pressed }}">{{ t.label }}</button>
</sc-for>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center; background: #fffaf2; border: 1px solid #e2d5c1; border-radius: 12px; padding: 10px 16px">
<label for="sunHour" style="font-size: 14px; font-weight: 600">Sun, local solar time</label>
<input id="sunHour" type="range" min="5" max="19" step="0.25" value="{{ hour }}" onChange="{{ setHour }}" style="flex: 1 1 220px; min-width: 160px; height: 44px">
<span style="font-size: 14px; min-width: 52px; font-variant-numeric: tabular-nums">{{ hourText }}</span>
<label for="sunDate" style="font-size: 14px; font-weight: 600">Date</label>
<select id="sunDate" value="{{ date }}" onChange="{{ setDate }}" style="min-height: 44px; border-radius: 8px; border: 1px solid #c9b79d; background: #fff; padding: 0 10px; font: 500 14px Inter, system-ui, sans-serif; color: #2a2118">
<option value="mar">21 March (equinox)</option>
<option value="jun">21 June (solstice)</option>
<option value="sep">23 September (equinox)</option>
<option value="dec">21 December (solstice)</option>
</select>
<span style="font-size: 13px; color: #5a4a3a">{{ sunText }}</span>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 18px; align-items: stretch">
<div style="flex: 999 1 640px; min-width: 0; display: flex; flex-direction: column; gap: 10px">
<div ref="{{ setWrap }}" class="k-stage" style="position: relative; width: 100%; height: var(--k-h, 680px); border-radius: 14px; overflow: hidden; background: #cfdde6; border: 1px solid #d8cab4">
<canvas ref="{{ setCanvas }}" aria-label="Interactive 3D model of the Kandariya Mahadeva Temple. Click it to use the keyboard." role="img" style="display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; outline: none"></canvas>
<div style="position: absolute; left: 12px; bottom: 12px; max-width: 70%; padding: 8px 12px; border-radius: 10px; background: rgba(34,26,19,0.78); color: #fffaf2; font-size: 13px; line-height: 1.4; white-space: pre-line">{{ hud }}</div>
<sc-if value="{{ showNote }}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; left: 12px; top: 12px; max-width: 420px; padding: 12px 14px; border-radius: 10px; background: rgba(255,250,242,0.95); color: #2a2118; font-size: 13px; line-height: 1.45; border: 1px solid #d8cab4; white-space: pre-line">{{ noteText }}</div>
</sc-if>
<div style="position: absolute; right: 12px; top: 12px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; pointer-events: none">
<div style="display: flex; gap: 6px; padding: 5px 7px; background: rgba(255,250,242,0.95); border: 1px solid #d8cab4; border-radius: 10px"><img src="assets/img/logo-192.webp" alt="Talaash Heritage" width="40" height="40" style="display: block; width: 40px; height: 40px"><img src="assets/img/archaeologywala-logo.webp" alt="archaeologywala" width="40" height="40" style="display: block; width: 40px; height: 40px; object-fit: contain"></div>
<div style="padding: 5px 9px; background: rgba(34,26,19,0.82); color: #fffaf2; border-radius: 8px; font-size: 12px; font-weight: 600">Reconstruction from published surveys and plans. Estimated parts tagged.</div>
</div>
<sc-if value="{{ wheelNote }}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; left: 50%; top: 45%; transform: translate(-50%, -50%); padding: 10px 16px; background: rgba(34,26,19,0.9); color: #fffaf2; border-radius: 10px; font-size: 14px; pointer-events: none">Click the model first, or hold Ctrl (⌘ on a Mac), to zoom with the scroll wheel</div>
</sc-if>
<sc-if value="{{ showIco }}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; right: 12px; top: 106px; max-width: 260px; padding: 10px 12px; border-radius: 10px; background: rgba(255,250,242,0.95); color: #2a2118; font-size: 12.5px; line-height: 1.35; border: 1px solid #d8cab4; display: flex; flex-direction: column; gap: 5px">
<strong style="font-size: 13px">Iconography</strong>
<sc-for list="{{ icoKey }}" as="k" hint-placeholder-count="6">
<div style="display: flex; gap: 7px; align-items: center"><span style="{{ k.sw }}"></span><span>{{ k.t }}</span></div>
</sc-for>
</div>
</sc-if>
<sc-if value="{{ walk }}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; right: 14px; bottom: 14px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px">
<span></span>
<button type="button" class="pad" aria-label="Walk forward" onPointerDown="{{ padF }}" onPointerUp="{{ padStop }}" onPointerLeave="{{ padStop }}" onPointerCancel="{{ padStop }}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"></path></svg></button>
<span></span>
<button type="button" class="pad" aria-label="Turn left" onPointerDown="{{ padL }}" onPointerUp="{{ padStop }}" onPointerLeave="{{ padStop }}" onPointerCancel="{{ padStop }}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg></button>
<button type="button" class="pad" aria-label="Walk back" onPointerDown="{{ padB }}" onPointerUp="{{ padStop }}" onPointerLeave="{{ padStop }}" onPointerCancel="{{ padStop }}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7"></path></svg></button>
<button type="button" class="pad" aria-label="Turn right" onPointerDown="{{ padR }}" onPointerUp="{{ padStop }}" onPointerLeave="{{ padStop }}" onPointerCancel="{{ padStop }}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button>
</div>
</sc-if>
<sc-if value="{{ loading }}" hint-placeholder-val="{{ true }}">
<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #2a2118; background: rgba(243,237,227,0.9)">Building the model…</div>
</sc-if>
<sc-if value="{{ failed }}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; font-size: 15px; color: #2a2118; background: #f3ede3">This browser could not start WebGL, so the 3D model can't be shown here. The facts panel still works.</div>
</sc-if>
</div>
<p style="margin: 0; font-size: 12.5px; color: #5a4a3a; line-height: 1.5">Textures and colours are approximate. They are generated in code, not taken from photographs. Trees are generic, and people are illustrative.</p>
</div>
<div style="flex: 1 1 360px; min-width: 0; display: flex; flex-direction: column; background: #fffaf2; border: 1px solid #e2d5c1; border-radius: 14px; overflow: hidden">
<div role="tablist" style="display: flex; flex-wrap: wrap; gap: 2px; padding: 4px 10px 0; border-bottom: 1px solid #e2d5c1">
<sc-for list="{{ tabs }}" as="tb" hint-placeholder-count="5">
<button type="button" role="tab" class="{{ tb.cls }}" aria-selected="{{ tb.sel }}" onClick="{{ tb.pick }}">{{ tb.label }}</button>
</sc-for>
</div>
<div class="k-panel-body" style="padding: 16px 18px 20px; display: flex; flex-direction: column; gap: 12px; max-height: 900px; overflow-y: auto">
<sc-if value="{{ tabFacts }}" hint-placeholder-val="{{ true }}">
<div style="display: flex; flex-direction: column; gap: 10px">
<sc-for list="{{ facts }}" as="f" hint-placeholder-count="8">
<div style="display: flex; flex-direction: column; gap: 3px; padding-bottom: 9px; border-bottom: 1px solid #efe5d6">
<div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap"><span class="{{ f.cls }}">{{ f.tag }}</span><span style="font-size: 12px; color: #5a4a3a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em">{{ f.k }}</span></div>
<div style="font-size: 14px; line-height: 1.45">{{ f.v }}</div>
<div style="font-size: 12px; color: #6b5a48">Source {{ f.src }}</div>
</div>
</sc-for>
</div>
</sc-if>
<sc-if value="{{ tabDisc }}" hint-placeholder-val="{{ false }}">
<div style="display: flex; flex-direction: column; gap: 12px">
<p style="margin: 0; font-size: 13px; color: #5a4a3a; line-height: 1.5">Where sources disagree, both figures are recorded here. The model follows the figure marked as used.</p>
<sc-for list="{{ disc }}" as="d" hint-placeholder-count="6">
<div style="display: flex; flex-direction: column; gap: 4px; padding-bottom: 10px; border-bottom: 1px solid #efe5d6">
<div style="font-size: 13px; font-weight: 600">{{ d.k }}</div>
<div style="font-size: 13.5px; line-height: 1.45">{{ d.v }}</div>
<div style="font-size: 13px; line-height: 1.45; color: #2f6b3a"><strong>Used:</strong> {{ d.used }}</div>
</div>
</sc-for>
</div>
</sc-if>
<sc-if value="{{ tabElems }}" hint-placeholder-val="{{ false }}">
<div style="display: flex; flex-direction: column; gap: 10px">
<sc-for list="{{ elems }}" as="e" hint-placeholder-count="8">
<div style="display: flex; flex-direction: column; gap: 3px; padding-bottom: 9px; border-bottom: 1px solid #efe5d6">
<div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap"><span style="font-size: 13.5px; font-weight: 600">{{ e.k }}</span><sc-for list="{{ e.tags }}" as="tg" hint-placeholder-count="1"><span class="{{ tg.cls }}">{{ tg.t }}</span></sc-for></div>
<div style="font-size: 13px; line-height: 1.45; color: #3a2e22">{{ e.v }}</div>
</div>
</sc-for>
</div>
</sc-if>
<sc-if value="{{ tabIco }}" hint-placeholder-val="{{ false }}">
<div style="display: flex; flex-direction: column; gap: 10px">
<p style="margin: 0; font-size: 13px; color: #5a4a3a; line-height: 1.5">Turn on Iconography to colour the figures by kind and show lettered markers; click a marker to open its entry. The figures are generic shapes: what is placed is the kind of figure each zone holds, not a copy of any carving. No deity is depicted.</p>
<sc-if value="{{ hasIcoSel }}" hint-placeholder-val="{{ false }}">
<div style="display: flex; flex-direction: column; gap: 5px; padding: 12px; border-radius: 10px; background: #2a2118; color: #fffaf2">
<div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #e8b27a">Selected marker</div>
<div style="display: flex; gap: 8px; align-items: center"><span style="{{ icoSel.dot }}">{{ icoSel.key }}</span><span style="font-size: 14.5px; font-weight: 600">{{ icoSel.title }}</span></div>
<div style="font-size: 13.5px; line-height: 1.45">{{ icoSel.text }}</div>
<div style="font-size: 12.5px; line-height: 1.45; color: #e6dccb">{{ icoSel.model }}</div>
<div style="font-size: 12px; color: #e8b27a">Source {{ icoSel.src }}</div>
</div>
</sc-if>
<sc-for list="{{ icoItems }}" as="it" hint-placeholder-count="6">
<div style="{{ it.box }}">
<div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap"><span style="{{ it.dot }}">{{ it.key }}</span><span style="font-size: 14px; font-weight: 600">{{ it.title }}</span><sc-for list="{{ it.tags }}" as="tg" hint-placeholder-count="1"><span class="{{ tg.cls }}">{{ tg.t }}</span></sc-for></div>
<div style="font-size: 13.5px; line-height: 1.45">{{ it.text }}</div>
<div style="font-size: 12.5px; line-height: 1.45; color: #5a4a3a"><strong>In the model:</strong> {{ it.model }}</div>
<div style="font-size: 12px; color: #6b5a48">Source {{ it.src }}</div>
</div>
</sc-for>
</div>
</sc-if>
<sc-if value="{{ tabLabels }}" hint-placeholder-val="{{ false }}">
<div style="display: flex; flex-direction: column; gap: 8px">
<p style="margin: 0; font-size: 13px; color: #5a4a3a; line-height: 1.5">The numbered labels in the model match this list. A label hides when something blocks it or when a cut removes it.</p>
<sc-for list="{{ legend }}" as="l" hint-placeholder-count="10">
<div style="display: flex; gap: 10px; align-items: baseline; font-size: 14px; line-height: 1.4"><span style="display: inline-flex; width: 26px; height: 26px; flex: 0 0 26px; border-radius: 50%; background: #221a13; color: #fffaf2; align-items: center; justify-content: center; font-size: 12px; font-weight: 600">{{ l.n }}</span><span>{{ l.t }}</span></div>
</sc-for>
<h3 style="margin: 10px 0 0; font-size: 15px">Layers</h3>
<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #3a2e22"><strong>As built:</strong> none of the sources checked records a lost structural part of the Kandariya itself, so nothing is added.</p>
<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #3a2e22"><strong>In use:</strong> figures are ILLUSTRATIVE. Walking round with the sanctum on the right (pradakṣiṇā, clockwise) is COMPARATIVE [7]. The priest at the liṅga with water, flowers and a lamp is ILLUSTRATIVE. Dress is kept to unstitched lower and upper cloths, with no later objects.</p>
<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #3a2e22"><strong>Period colour:</strong> no paint or plaster is recorded for this temple in the sources checked, so it stays unpainted.</p>
<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #3a2e22"><strong>Iconography:</strong> colours the figures by the kind recorded for each zone and shows lettered markers in place of these numbered labels. The Iconography tab gives every entry with its evidence tags and sources.</p>
<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #3a2e22"><strong>Sound:</strong> left out. None of the sources checked documents a text and melody for this temple's ritual.</p>
</div>
</sc-if>
<sc-if value="{{ tabSources }}" hint-placeholder-val="{{ false }}">
<div style="display: flex; flex-direction: column; gap: 8px">
<p style="margin: 0; font-size: 13px; color: #5a4a3a; line-height: 1.5">The plan is scaled from Cunningham's survey, as published by Fergusson [4]. Only primary sources and standard scholarly works are cited; every fact passed three separate checks.</p>
<sc-for list="{{ sources }}" as="s" hint-placeholder-count="10">
<div style="font-size: 13px; line-height: 1.45"><strong>[{{ s.n }}]</strong> <a href="{{ s.url }}" target="_blank" rel="noopener">{{ s.t }}</a></div>
</sc-for>
</div>
</sc-if>
</div>
</div>
</div>
</div>
`;

class Component extends DCLogic {
  constructor(props) {
    super(props);
    const FT = 0.3048;
    const L = 109 * FT, HW = (60 * FT) / 2, HTOP = 116.5 * FT, F = HTOP - 88 * FT, J = 4.0;
    const JT = F + 5.6, CORN = JT + 1.0;
    this.K = { FT: FT, L: L, HW: HW, HTOP: HTOP, F: F, J: J, JT: JT, CORN: CORN, stairRun: 5.7, jx: 45, jRun: 5.12 };
    this.state = {
      view: 'aerial', mode: 'orbit', labels: true, look: 'real', units: 'm', section: false, plan: false,
      inUse: false, colour: false, asBuilt: false, scale: true, ico: false, icoSel: null, hour: 9, date: 'mar', tab: 'facts',
      ready: false, failed: false, spires: 0, figs: 0, sunText: '', hud: ''
    };
    this.keys = {};
    this.pad = { f: 0, t: 0 };
    this.setWrap = (el) => { this.wrap = el; };
    this.setCanvas = (el) => { this.canvasEl = el; };
    const K = this.K;
    this.VIEWS = [
      { id: 'aerial', label: 'Exterior', t: [17, 14, 0], th: 0.72, ph: 1.2, r: 78 },
      { id: 'east', label: 'Entrance front', t: [18, 15, 0], th: 0.0, ph: 1.47, r: 82 },
      { id: 'hall', label: 'Inside: great hall', t: [12.4, K.F + 1.9, 0], th: 0.0, ph: 1.62, r: 9.0 },
      { id: 'amb', label: 'Inside: ambulatory', t: [7.4, K.F + 1.6, 3.17], th: 0.0, ph: Math.PI / 2, r: 5.0 },
      { id: 'section', label: 'Long section', t: [17, 13, 0], th: Math.PI / 2, ph: 1.36, r: 64 },
      { id: 'plancut', label: 'Plan cut at 1.2 m', t: [17, K.F, 0], th: Math.PI / 2, ph: 0.02, r: 52 },
      { id: 'walk', label: 'Walk (first person)' }
    ];
    // iconography layer: colours per kind of figure, and the sourced items behind each marker
    this.ICOCOL = { proj: 0x2f63b0, rec: 0x23824f, jun: 0xc23b6c, mat: 0xb02a22, card: 0x9a9184, int: 0x9a9184, dik: 0x9a9184, frz: 0x7d5c22, tor: 0xb88512, door: 0x177385 };
    this.ICO = [
      { key: 'A', cat: 'proj', title: 'Wall projections', tags: ['DOCUMENTED', 'ESTIMATED'], src: '[2] [1]',
        text: 'Three sculptural bands run round the walls. Gods and goddesses, mithunas (couples) and surasundarīs (celestial women) stand on the projections.',
        model: 'Every figure on a projection is coloured. Which figure stands in which niche is not modelled, and the bays are ESTIMATED.' },
      { key: 'B', cat: 'rec', title: 'Wall recesses', tags: ['DOCUMENTED', 'ESTIMATED'], src: '[2]',
        text: 'Vyālas (leonine mythical beasts) and nāgīs (serpent goddesses) fill the recesses between the projections.',
        model: 'Every figure in a recess is coloured. The bays are ESTIMATED.' },
      { key: 'C', cat: 'jun', title: 'Between the transept and the sanctum', tags: ['DOCUMENTED', 'ESTIMATED'], src: '[1]',
        text: 'Cunningham (1871): the principal groups of sculpture, the erotic ones, are in the recesses between the pillars of the transept and the sanctum.',
        model: 'The figures on that stretch of wall are coloured. Which niches hold the groups is ESTIMATED.' },
      { key: 'E', cat: 'mat', title: 'Basement niches: the Seven Mothers, Gaṇeśa and Vīrabhadra', tags: ['DOCUMENTED', 'ESTIMATED'], src: '[2]',
        text: 'The basement niches hold the Seven Mothers (saptamātṛkās), with Gaṇeśa at one end and Vīrabhadra at the other. At Khajuraho this is found only here and at the Viśvanātha temple.',
        model: 'The niches are coloured as one group. Their number, positions and sizes are ESTIMATED.' },
      { key: 'F', cat: 'frz', title: 'Processional friezes on the basement', tags: ['DOCUMENTED'], src: '[2]',
        text: 'Two rows of processional friezes run along the basement mouldings: elephants and horses, warriors, hunters, acrobats, musicians, dancers, devotees and erotic couples.',
        model: 'The friezes are not carved in the model. The marker shows the band they run along.' },
      { key: 'G', cat: 'tor', title: 'Makara-toraṇas', tags: ['DOCUMENTED', 'ESTIMATED'], src: '[2]',
        text: 'Kandariya is the only temple at Khajuraho with two makara-toraṇas, ornamental arches flanked by makaras.',
        model: 'The arch at the entrance is drawn with four loops; the loops and the figures on the arch are ESTIMATED or left out.' },
      { key: 'H', cat: 'tor', title: 'The second makara-toraṇa', tags: ['DOCUMENTED', 'ESTIMATED'], src: '[2]',
        text: 'The sources checked do not say where the second arch stands.',
        model: 'It copies the entrance arch and hangs at the entrance to the great hall: both ESTIMATED.' },
      { key: 'I', cat: 'door', title: 'Sanctum doorway', tags: ['DOCUMENTED', 'ESTIMATED'], src: '[1]',
        text: 'Over the centre of the entrance to the sanctum is a small figure of Śiva, with figures of Brahmā and Viṣṇu to the right and left.',
        model: 'A stepped frame is modelled; its figures are not.' },
      { key: 'L', cat: 'int', title: 'Interior figures', tags: ['DOCUMENTED'], src: '[1]',
        text: 'Cunningham counted 226 statues inside the temple and 646 outside, 872 in all.',
        model: 'Figures inside are shown in grey, because their identities are not modelled.' }
    ];
  }

  componentDidMount() {
    let tries = 0;
    const go = () => {
      if (this.dead) return;
      if (window.THREE && this.canvasEl && this.wrap) {
        try { this.init(window.THREE); } catch (e) { console.error(e); this.setState({ failed: true }); }
        return;
      }
      if (++tries > 300) { this.setState({ failed: true }); return; }
      this.t0 = setTimeout(go, 50);
    };
    go();
  }

  componentWillUnmount() {
    this.dead = true;
    clearTimeout(this.t0);
    cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    if (this.unbind) this.unbind();
    if (this.renderer) this.renderer.dispose();
  }

  componentDidUpdate() {
    this.syncState();
  }

  // Applies any state change to the 3D scene. Called after every update and on every frame, so it
  // does not depend on how the host runtime reports previous state.
  syncState() {
    if (!this.T || !this.stone) return;
    const s = this.state || {}, p = this._ap || {};
    if (s.look !== p.look || s.ico !== p.ico) this.applyLook();
    if (s.section !== p.section || s.plan !== p.plan) this.applyClip();
    if (s.hour !== p.hour || s.date !== p.date || s.look !== p.look || s.section !== p.section || s.plan !== p.plan) this.updateSun();
    if (s.inUse !== p.inUse || s.scale !== p.scale) this.applyLayers();
    this._ap = { look: s.look, section: s.section, plan: s.plan, hour: s.hour, date: s.date, inUse: s.inUse, scale: s.scale, ico: s.ico };
  }

  // the iconography item under a point in the view (CSS pixels), from the label boxes laid out last frame
  pickMarker(mx, my) {
    let best = null;
    for (const sp of this.labels || []) {
      const r = sp.userData.rect;
      if (!sp.userData.ico || !sp.visible || !r) continue;
      if (mx >= r[0] - 4 && mx <= r[2] + 4 && my >= r[1] - 4 && my <= r[3] + 4) best = sp.userData.item;
    }
    return best;
  }

  // ---------- helpers usable without WebGL ----------
  fmtLen(m) {
    if (this.state.units === 'ft') {
      const totalIn = m / 0.0254;
      let ft = Math.floor(totalIn / 12);
      let inch = Math.round(totalIn - ft * 12);
      if (inch === 12) { ft += 1; inch = 0; }
      return ft + ' ft ' + inch + ' in';
    }
    return (Math.round(m * 100) / 100).toFixed(2) + ' m';
  }

  sunPos(hour, date) {
    const N = { mar: 81, jun: 172, sep: 264, dec: 355 }[date] || 81;
    const lat = 24.854 * Math.PI / 180;
    const decl = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + N) / 365);
    const H = (hour - 12) * 15 * Math.PI / 180;
    const sinEl = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
    const el = Math.asin(Math.max(-1, Math.min(1, sinEl)));
    let az = Math.atan2(-Math.sin(H), Math.tan(decl) * Math.cos(lat) - Math.sin(lat) * Math.cos(H));
    if (az < 0) az += Math.PI * 2;
    return { el: el, az: az, dir: [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)] };
  }

  heightAt(x, z) {
    const K = this.K;
    if (x >= K.L && x <= K.L + K.stairRun && Math.abs(z) <= 1.6) return K.J + (K.F - K.J) * (1 - (x - K.L) / K.stairRun);
    if (x >= K.jx && x <= K.jx + K.jRun && Math.abs(z) <= 3.6) return K.J * (1 - (x - K.jx) / K.jRun);
    for (const r of this.floorRects) if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return K.F;
    for (const r of this.jagRects) if (x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return K.J;
    return 0;
  }

  blocked(x, z, foot) {
    const r = 0.28;
    for (const c of this.col) {
      if (foot + 0.3 < c.y1 && foot + 1.75 > c.y0 && x + r > c.x0 && x - r < c.x1 && z + r > c.z0 && z - r < c.z1) return true;
    }
    if (this.state.inUse && this.walkers) {
      for (const w of this.walkers) {
        if (Math.abs(w.y - foot) < 1 && Math.hypot(w.x - x, w.z - z) < 0.55) return true;
      }
      for (const p of this.staticPeople) {
        if (Math.abs(p[2] - foot) < 1 && Math.hypot(p[0] - x, p[1] - z) < 0.55) return true;
      }
    }
    if (this.state.scale && Math.abs(foot) < 1 && Math.hypot(52.5 - x, -5.5 - z) < 0.55) return true;
    return false;
  }

  tryMove(nx, nz) {
    const w = this.walkPos;
    const step = (x, z) => {
      const foot = this.heightAt(x, z);
      if (Math.abs(foot - w.y) > 0.6) return false;
      if (this.blocked(x, z, foot)) return false;
      w.x = x; w.z = z; w.y = foot;
      return true;
    };
    if (step(nx, nz)) return true;
    if (step(nx, w.z)) return true;
    return step(w.x, nz);
  }

  // ---------- scene construction (no renderer needed) ----------
  // Plan geometry is read from Fergusson (1910) fig. 342, "Plan of Kandarya Mahadeva, from a plan by Gen. Cunningham",
  // pixel coordinates on the Commons scan: west end v=23, east end v=548, axis u=175.5, max half-width 147 px.
  // Along the axis the drawing is scaled to the measured 109 ft; across it to the measured 60 ft.
  buildScene(T, scene) {
    const K = this.K, F = K.F, J = K.J, JT = K.JT, CORN = K.CORN, L = K.L, HW = K.HW;
    const X = (v) => (v - 23) * L / 525;
    const Hp = (px) => px * HW / 147;
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const boxes = [], amalakas = [], miniAm = [], kalashas = [], ghantas = [], pillars8 = [], pillars16 = [], figures = [];
    const col = [];
    this.col = col;
    const occB = [];
    this.occBoxes = occB;
    const O = (x0, x1, y0, y1, z0, z1) => occB.push([x0, y0, z0, x1, y1, z1]);
    const B = (x0, x1, y0, y1, z0, z1, c, rx, rz) => boxes.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0, c: c || 0, rx: rx || 0, rz: rz || 0 });
    const Bc = (cx, y0, cz, sx, sy, sz, c) => B(cx - sx / 2, cx + sx / 2, y0, y0 + sy, cz - sz / 2, cz + sz / 2, c);
    const C = (x0, x1, z0, z1, y0, y1) => col.push({ x0: x0, x1: x1, z0: z0, z1: z1, y0: y0, y1: y1 });
    const Wl = (x0, x1, z0, z1, y0, y1, c) => { B(x0, x1, y0, y1, z0, z1, c); C(x0, x1, z0, z1, y0, y1); };
    // symmetric wall pair: from half-width a to b (px) between v0 and v1 (px)
    const WP = (v0, v1, a, b, y0, y1, c) => { Wl(X(v0), X(v1), -Hp(b), -Hp(a), y0, y1, c); Wl(X(v0), X(v1), Hp(a), Hp(b), y0, y1, c); };

    // ---- measured outline of the moulded base (drawing) ----
    const BASE = [[23, 56, 46.5], [56, 65, 53.5], [65, 83, 72], [83, 104, 94], [104, 119, 108], [119, 125, 117.5], [125, 155, 143.5], [155, 191, 147], [191, 215, 144], [215, 224, 118], [224, 242, 108.5], [242, 254, 93.5], [254, 269, 108.5], [269, 278, 117.5], [278, 304, 143], [304, 340, 147], [340, 368, 143], [368, 376, 116.5], [376, 392, 108], [392, 412, 93.5], [412, 468, 84], [468, 496, 79], [496, 548, 63]];
    // outer faces of walls, balcony parapets and balustrades at floor level (drawing)
    const WALLS = [[46.7, 82, 28.5], [82, 110, 48.5], [110, 125, 65.5], [125, 278, 86], [151.7, 196.7, 120.5], [278, 368, 87.5], [294.5, 346, 124], [368, 376, 87.5], [376, 400, 74.5], [400, 470, 65.5], [470, 548, 45.5]];
    const toRect = (r) => [X(r[0]), X(r[1]), -Hp(r[2]), Hp(r[2])];
    this.floorRects = WALLS.map(toRect);
    this.baseRects = BASE.map(toRect);
    this.plan = { X: X, Hp: Hp };

    // ---- jagati (terrace): height DOCUMENTED, outline ESTIMATED; rear and side projections DOCUMENTED ----
    const JAG = [[-9, K.jx, -16, 16], [-13, -9, -7, 7], [5, 24, 16, 19.5]];
    this.jagRects = JAG;
    for (const r of JAG) {
      B(r[0] - 0.3, r[1] + 0.3, 0, 0.45, r[2] - 0.3, r[3] + 0.3, 4);
      B(r[0], r[1], 0.45, 3.4, r[2], r[3], 0);
      B(r[0] - 0.12, r[1] + 0.12, 1.35, 1.6, r[2] - 0.12, r[3] + 0.12, 2);
      B(r[0] - 0.12, r[1] + 0.12, 2.45, 2.65, r[2] - 0.12, r[3] + 0.12, 2);
      B(r[0] - 0.2, r[1] + 0.2, 3.4, J, r[2] - 0.2, r[3] + 0.2, 1);
      O(r[0], r[1], 0, J - 0.05, r[2], r[3]);
    }
    const jn = 16, jrise = J / jn, jrun = K.jRun / jn;
    for (let i = 0; i < jn; i++) {
      const x0 = K.jx + i * jrun;
      B(x0, x0 + jrun, 0, J - i * jrise, -3.6, 3.6, i % 2 ? 4 : 1);
      Wl(x0, x0 + jrun, 3.6, 4.2, 0, J - i * jrise + 0.8, 0);
      Wl(x0, x0 + jrun, -4.2, -3.6, 0, J - i * jrise + 0.8, 0);
    }

    // ---- adhiṣṭhāna: steps in from the measured base outline to the wall line (profile ESTIMATED) ----
    const AH = F - J;
    const AL = [[0, 0.07, 1.0, 4], [0.07, 0.2, 0.93, 0], [0.2, 0.24, 0.86, 2], [0.24, 0.36, 0.84, 1], [0.36, 0.45, 0.74, 2], [0.45, 0.57, 0.7, 0], [0.57, 0.61, 0.6, 2], [0.61, 0.72, 0.5, 2], [0.72, 0.84, 0.42, 1], [0.84, 0.88, 0.3, 2], [0.88, 1.0, 0.24, 1]];
    // inset (m) between base outline and wall line, per base band, read from the drawing (base half - nearest wall half)
    const wallHalfAt = (v) => { let h = 0; for (const w of WALLS) if (v >= w[0] && v < w[1]) h = Math.max(h, w[2]); return h; };
    for (const b of BASE) {
      const vm = (b[0] + b[1]) / 2;
      const wh = Math.max(wallHalfAt(vm), 18);
      const off = Hp(Math.max(0, b[2] - wh));
      for (const l of AL) {
        const e = off * l[2];
        const half = Hp(wh) + e;
        const x0 = X(b[0]), x1 = X(b[1]);
        B(x0, x1, J + l[0] * AH, J + l[1] * AH - (l[1] === 1.0 ? 0.012 : 0), -half, half, l[3]);
      }
      C(X(b[0]), b[1] >= 548 ? L : X(b[1]), -Hp(b[2]), Hp(b[2]), J, F);
      O(X(b[0]), X(b[1]), J, F - 0.05, -Hp(b[2]), Hp(b[2]));
    }
    // stair from terrace to porch (east): steps ESTIMATED
    const sn = 19, srise = AH / sn, srun = K.stairRun / sn;
    for (let i = 0; i < sn; i++) {
      const x0 = L + i * srun;
      B(x0, x0 + srun, J, F - i * srise, -1.6, 1.6, i % 2 ? 4 : 1);
      Wl(x0, x0 + srun, 1.6, 2.0, J, F - i * srise + 0.8, 0);
      Wl(x0, x0 + srun, -2.0, -1.6, J, F - i * srise + 0.8, 0);
    }

    // ---- wall sculpture: three equal rows of figures in niches (DOCUMENTED rows; positions ESTIMATED) ----
    let figs = 0;
    const faceBox = (f, a0, a1, y0, y1, d0, d1, c) => {
      const p0 = f.fix + f.out * d0, p1 = f.fix + f.out * d1;
      const lo = Math.min(p0, p1), hi = Math.max(p0, p1);
      if (f.axis === 'z') B(a0, a1, y0, y1, lo, hi, c); else B(lo, hi, y0, y1, a0, a1, c);
    };
    const deco = (f, interior) => {
      const dk = interior ? 0.45 : 1;
      const bands = interior ? [[F, F + 0.25], [F + 3.9, F + 4.1]] : [[F, F + 0.3], [F + 1.75, F + 1.95], [F + 3.4, F + 3.6], [F + 5.05, JT]];
      for (const b of bands) faceBox(f, f.a0, f.a1, b[0], b[1], 0, 0.14 * dk, 2);
      const rows = interior ? [F + 1.95] : [F + 0.42, F + 2.07, F + 3.72];
      // exterior: alternate bays project as piers (wall offsets of a saptaratha plan; depth ESTIMATED)
      const bays = [];
      for (let p = f.a0 + 0.4, k = 0; p < f.a1 - 0.3; p += 0.72, k++) bays.push([p, !interior && k % 2 === 0 ? 0.28 : 0]);
      for (const bb of bays) {
        if (bb[1] > 0) {
          faceBox(f, bb[0] - 0.34, bb[0] + 0.34, F + 0.3, F + 5.05, 0, bb[1], 0);
          for (const b of bands) faceBox(f, bb[0] - 0.36, bb[0] + 0.36, b[0], b[1], bb[1], bb[1] + 0.1, 2);
        }
      }
      for (const y of rows) {
        let k = 0;
        for (const bb of bays) {
          const p = bb[0], o = bb[1];
          faceBox(f, p - 0.27, p + 0.27, y - 0.06, y + 1.08, o, o + 0.04, 3);
          if (o === 0) faceBox(f, p + 0.3, p + 0.36, y - 0.08, y + 1.22, 0, 0.12 * dk, 1);
          faceBox(f, p - 0.3, p + 0.3, y + 1.04, y + 1.2, o, o + 0.16 * dk, 2);
          const px = f.axis === 'z' ? p : f.fix + f.out * (o + 0.1 * dk);
          const pz = f.axis === 'z' ? f.fix + f.out * (o + 0.1 * dk) : p;
          // iconographic zone: projections, recesses, or the juncture wall between the two balconies (zones DOCUMENTED; per figure ESTIMATED)
          const jun = !interior && f.axis === 'z' && p >= X(196.7) && p <= X(294.5);
          const cat = interior ? 'int' : o > 0 ? (jun ? 'jun' : 'proj') : 'rec';
          figures.push({ x: px, y: y + 0.04, z: pz, h: interior ? 0.78 : 0.86 + (rnd() - 0.5) * 0.05, ax: f.axis, tilt: (k % 3 - 1) * 0.11, d: dk, cat: cat });
          figs++; k++;
        }
      }
    };
    const FZ = (v0, v1, half, out) => ({ axis: 'z', fix: out * Hp(half), a0: X(v0), a1: X(v1), out: out });
    const FX = (v, h0, h1, out, side) => ({ axis: 'x', fix: X(v), a0: side * Hp(side > 0 ? h0 : h1), a1: side * Hp(side > 0 ? h1 : h0), out: out });

    // ---- sanctum block outer walls (drawing): rear wall with window, stepped corners, side walls with windows ----
    // rear (west) wall v 82–110, window half-width 18 px
    WP(82, 110, 18, 48.5, F, JT, 0);
    B(X(82), X(110), F + 4.2, JT, -Hp(18), Hp(18), 0);
    WP(110, 125, 44, 65.5, F, JT, 0);
    WP(125, 152, 55.5, 86, F, JT, 0);
    WP(197, 278, 55.5, 86, F, JT, 0);
    B(X(152), X(197), F + 4.2, JT, -Hp(86), -Hp(55.5), 0); B(X(152), X(197), F + 4.2, JT, Hp(55.5), Hp(86), 0);
    for (const s of [-1, 1]) {
      deco(FZ(125, 151.7, 86, s)); deco(FZ(196.7, 278, 86, s)); deco(FZ(110, 125, 65.5, s));
      deco(FX(110, 48.5, 65.5, -1, s)); deco(FX(125, 65.5, 86, -1, s));
      deco(FX(82, 28.5, 48.5, -1, s));
    }
    // garbhagriha: stepped shrine walls around the cella (drawing), cella 21.5 px half-width, v 157–215
    const SHR = [[120, 128, 14.5], [128, 135, 24.5], [135, 142, 31.7], [142, 148, 38.3], [148, 155, 43.5], [155, 198, 46], [198, 228, 39.5]];
    const CEL = [157, 215, 21.5], DOOR = [215, 228, 18.5];
    for (const r of SHR) {
      const v0 = r[0], v1 = r[1];
      if (v1 <= CEL[0]) { Wl(X(v0), X(v1), -Hp(r[2]), Hp(r[2]), F, F + 4.6, 0); continue; }
      const segs = [[v0, Math.max(v0, Math.min(v1, CEL[0])), 0], [Math.max(v0, CEL[0]), Math.min(v1, CEL[1]), CEL[2]], [Math.max(v0, DOOR[0]), Math.min(v1, DOOR[1]), DOOR[2]]];
      for (const sg of segs) {
        if (sg[1] <= sg[0]) continue;
        if (sg[2] === 0) Wl(X(sg[0]), X(sg[1]), -Hp(r[2]), Hp(r[2]), F, F + 4.6, 0);
        else WP(sg[0], sg[1], sg[2], r[2], F, F + 4.6, 0);
      }
    }
    B(X(DOOR[0]), X(DOOR[1]), F + 3.0, F + 4.6, -Hp(DOOR[2]), Hp(DOOR[2]), 0);

    // ---- iconographic niches (sequence and identities DOCUMENTED; niche positions ESTIMATED) ----
    // niche: back plate, two pilasters and a hood on a face; axis 'z' faces north/south, 'x' faces west
    const niche = (axis, c, fix, out, y0, y1, w, cat, d) => {
      const fb = (a0, a1, b0, b1, d0, d1, col) => {
        const p0 = fix + out * d0, p1 = fix + out * d1, lo = Math.min(p0, p1), hi = Math.max(p0, p1);
        if (axis === 'z') B(c + a0, c + a1, b0, b1, lo, hi, col); else B(lo, hi, b0, b1, c + a0, c + a1, col);
      };
      fb(-w + 0.09, w - 0.09, y0 + 0.06, y1 - 0.12, 0, 0.02, 3);
      fb(-w, -w + 0.09, y0, y1 - 0.06, 0, 0.06 * d, 2);
      fb(w - 0.09, w, y0, y1 - 0.06, 0, 0.06 * d, 2);
      fb(-w - 0.05, w + 0.05, y1 - 0.12, y1 + 0.04, 0, 0.11 * d, 2);
      fb(-w, w, y0 - 0.06, y0 + 0.06, 0, 0.08 * d, 2);
      const fh = Math.min(1.2, (y1 - y0) - 0.3);
      const fo = fix + out * (0.02 + 0.06 * d);
      figures.push({ x: axis === 'z' ? c : fo, y: y0 + 0.07, z: axis === 'z' ? fo : c, h: fh, ax: axis, tilt: 0, d: d, cat: cat });
      figs++;
    };
    // basement niches: the Seven Mothers with Gaṇeśa at one end and Vīrabhadra at the other (Krishna Deva).
    // Nine niche positions are ESTIMATED; the names below are internal keys only and are not shown.
    const BY0 = J + 0.61 * AH, BY1 = J + 0.86 * AH;
    const baseFace = (b) => { const wh = Math.max(wallHalfAt((b[0] + b[1]) / 2), 18); return Hp(wh) + Hp(Math.max(0, b[2] - wh)) * 0.5; };
    const MAT = [
      ['E1', 'Gaṇeśa', [304, 340, 147], 1], ['E2', 'Cāmuṇḍā', [254, 269, 108.5], 1], ['E3', 'Indrāṇī', [155, 191, 147], 1],
      ['E4', 'Vārāhī', [83, 104, 94], 1], ['E5', 'Vaiṣṇavī', null, 0], ['E6', 'Kaumārī', [83, 104, 94], -1],
      ['E7', 'Māheśvarī', [155, 191, 147], -1], ['E8', 'Brahmāṇī', [254, 269, 108.5], -1], ['E9', 'Vīrabhadra', [304, 340, 147], -1]
    ];
    this.icoPts = {};
    for (const m of MAT) {
      if (!m[2]) {
        niche('x', 0, X(23), -1, BY0, BY1, 0.45, 'mat', 1);
        this.icoPts[m[0]] = [X(23) - 0.55, (BY0 + BY1) / 2, 0];
      } else {
        const b = m[2], c = X((b[0] + b[1]) / 2), fz = baseFace(b);
        niche('z', c, m[3] * fz, m[3], BY0, BY1, 0.45, 'mat', 1);
        this.icoPts[m[0]] = [c, (BY0 + BY1) / 2, m[3] * (fz + 0.55)];
      }
    }
    this.icoMat = MAT.map((m) => [m[0], m[1]]);
    // three cardinal niches of the sanctum wall, facing the ambulatory (niches ESTIMATED; their figures are not identified on the website)
    const CNx = X(176.5), CNh = Hp(46), WNx = X(120);
    niche('z', CNx, -CNh, -1, F + 0.9, F + 2.45, 0.45, 'card', 0.6);
    niche('z', CNx, CNh, 1, F + 0.9, F + 2.45, 0.45, 'card', 0.6);
    niche('x', 0, WNx, -1, F + 0.9, F + 2.45, 0.45, 'card', 0.6);
    this.icoPts.J1 = [CNx, F + 2.3, -(CNh + 0.3)];
    this.icoPts.J2 = [CNx, F + 2.3, CNh + 0.3];
    this.icoPts.J3 = [WNx - 0.3, F + 2.3, 0];
    // nine-śākhā doorway drawn as a stepped frame (DOCUMENTED; simplified)
    for (let k = 0; k < 3; k++) {
      const o = Hp(DOOR[2]) + 0.12 * k;
      B(X(DOOR[1]), X(DOOR[1]) + 0.1, F, F + 3.0 + 0.12 * (k + 1), o, o + 0.12, 5);
      B(X(DOOR[1]), X(DOOR[1]) + 0.1, F, F + 3.0 + 0.12 * (k + 1), -o - 0.12, -o, 5);
      B(X(DOOR[1]), X(DOOR[1]) + 0.1, F + 3.0 + 0.12 * k, F + 3.0 + 0.12 * (k + 1), -o - 0.12, o + 0.12, 5);
    }
    // interior sculpture on the shrine's outer faces and the ambulatory walls (226 interior figures DOCUMENTED; schematic)
    for (const s of [-1, 1]) { deco(FZ(198, 228, 39.5, s), true); deco({ axis: 'z', fix: s * Hp(55.5), a0: X(200), a1: X(270), out: -s }, true); }
    // ceilings over ambulatory, cella and antarala; tower mass above
    B(X(110), X(278), F + 4.6, JT, -Hp(65.5), Hp(65.5), 1);
    O(X(82), X(278), F + 4.6, CORN, -Hp(86), Hp(86));
    B(X(80), X(280), JT, JT + 0.45, -Hp(86) - 0.4, Hp(86) + 0.4, 2);
    B(X(82), X(278), JT + 0.45, CORN, -Hp(86), Hp(86), 1);
    // antarala: two pillars with sixteen-sided shafts (DOCUMENTED form; positions from drawing)
    const ANTV = 255, ANTH = 30.5;
    for (const s of [-1, 1]) {
      const px = X(ANTV), pz = s * Hp(ANTH);
      pillars16.push({ x: px, y: F + 0.45, z: pz, r: 0.26, h: 4.15 });
      Bc(px, F, pz, 0.72, 0.45, 0.72, 2);
      C(px - 0.38, px + 0.38, pz - 0.38, pz + 0.38, F, F + 4.6);
    }

    // ---- mahamandapa (great hall): walls (drawing), transept windows, four central pillars + four in the windows ----
    WP(278, 297, 63.5, 87.5, F, JT, 0); WP(340, 368, 63.5, 87.5, F, JT, 0);
    B(X(297), X(340), F + 4.2, JT, -Hp(87.5), -Hp(63.5), 0); B(X(297), X(340), F + 4.2, JT, Hp(63.5), Hp(87.5), 0);
    WP(368, 376, 18, 87.5, F, JT, 0); WP(376, 400, 18, 74.5, F, JT, 0);
    B(X(368), X(400), F + 3.6, JT, -Hp(18), Hp(18), 0);
    for (const s of [-1, 1]) {
      deco(FZ(278, 294.5, 87.5, s)); deco(FZ(346, 368, 87.5, s)); deco(FZ(376, 400, 74.5, s));
      deco(FX(278, 86, 87.5, -1, s)); deco(FX(368, 74.5, 87.5, 1, s));
    }
    B(X(276), X(402), JT, JT + 0.45, -Hp(87.5) - 0.4, Hp(87.5) + 0.4, 2);
    B(X(278), X(368), F + 5.4, CORN, -Hp(63.5), Hp(63.5), 1);
    O(X(278), X(400), F + 5.4, CORN, -Hp(87.5), Hp(87.5));
    B(X(278), X(368), JT + 0.45, CORN, -Hp(87.5), Hp(87.5), 1);
    const MX = X(320.5);
    const hallP = [[295, 28], [346, 28]];
    for (const hp of hallP) for (const s of [-1, 1]) {
      const px = X(hp[0]), pz = s * Hp(hp[1]);
      Bc(px, F, pz, 0.8, 0.55, 0.8, 2);
      pillars8.push({ x: px, y: F + 0.55, z: pz, r: 0.3, h: 4.4 });
      Bc(px, F + 4.95, pz, 0.95, 0.45, 0.95, 5);
      C(px - 0.42, px + 0.42, pz - 0.42, pz + 0.42, F, F + 5.4);
    }
    for (const v of [305, 335]) for (const s of [-1, 1]) {
      const px = X(v), pz = s * Hp(68.5);
      Bc(px, F, pz, 0.6, 0.4, 0.6, 2);
      pillars8.push({ x: px, y: F + 0.4, z: pz, r: 0.22, h: 3.45 });
      Bc(px, F + 3.85, pz, 0.7, 0.35, 0.7, 5);
      C(px - 0.32, px + 0.32, pz - 0.32, pz + 0.32, F, F + 4.2);
      // pilasters at the wall face
      Wl(px - 0.2, px + 0.2, s > 0 ? Hp(86) : -Hp(88), s > 0 ? Hp(88) : -Hp(86), F, F + 4.2, 5);
    }

    // ---- open bays: balcony windows with seat slabs, sloping seat-backs, dwarf pillars and ribbed eaves (DOCUMENTED) ----
    const tilt = 0.5;
    const balcony = (r, edges, o) => {
      o = o || {};
      const x0 = r[0], x1 = r[1], z0 = r[2], z1 = r[3];
      for (const e of edges) {
        const alongX = e === 'n' || e === 's';
        const a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1;
        const fix = e === 'n' ? z0 : e === 's' ? z1 : e === 'w' ? x0 : x1;
        const out = (e === 'n' || e === 'w') ? -1 : 1;
        const fixA = (b0, b1, y0, y1, dIn, dOut, c, rot) => {
          const lo = Math.min(fix - dIn * out, fix + dOut * out), hi = Math.max(fix - dIn * out, fix + dOut * out);
          if (alongX) B(b0, b1, y0, y1, lo, hi, c, rot || 0, 0); else B(lo, hi, y0, y1, b0, b1, c, 0, rot || 0);
          return [lo, hi];
        };
        const lh = fixA(a0, a1, F, F + 0.55, o.depth || 0.4, 0.05, 4);
        fixA(a0, a1, F + 0.55, F + 0.65, 0.45, 0.12, 2);
        fixA(a0, a1, F + 0.65, F + 1.05, 0.38, 0.0, 5);
        fixA(a0, a1, F + 1.05, F + 1.2, 0.62, 0.18, 2);
        const cOff = 0.18 + Math.sin(tilt) * 0.38;
        fixA(a0, a1, F + 1.2, F + 1.98, -cOff + 0.06, cOff + 0.06, 1, alongX ? tilt * out : -tilt * out);
        const lo = Math.min(lh[0], fix - 0.62 * out), hi = Math.max(lh[1], fix + 0.6 * out);
        if (alongX) C(a0, a1, lo, hi, F, F + 2.0); else C(lo, hi, F, F + 2.0, a0, a1);
        const span = a1 - a0, n = Math.max(1, Math.round(span / 1.45));
        for (let i = 0; i <= n; i++) {
          const p = a0 + 0.22 + ((span - 0.44) * i) / n;
          const px = alongX ? p : fix - 0.25 * out, pz = alongX ? fix - 0.25 * out : p;
          pillars8.push({ x: px, y: F + 1.2, z: pz, r: 0.15, h: 2.65 });
          Bc(px, F + 3.85, pz, 0.5, 0.12, 0.5, 2);
        }
        const elo = Math.min(fix - 0.3 * out, fix + 0.9 * out), ehi = Math.max(fix - 0.3 * out, fix + 0.9 * out);
        if (alongX) { B(a0 - 0.3, a1 + 0.3, F + 3.97, F + 4.2, elo, ehi, 2); }
        else { B(elo, ehi, F + 3.97, F + 4.2, a0 - 0.3, a1 + 0.3, 2); }
        // ribbed underside of the eave (DOCUMENTED "ribbed eaves")
        for (let p = a0; p < a1; p += 0.22) {
          if (alongX) B(p, p + 0.08, F + 3.88, F + 3.97, Math.min(fix, fix + 0.8 * out), Math.max(fix, fix + 0.8 * out), 1);
          else B(Math.min(fix, fix + 0.8 * out), Math.max(fix, fix + 0.8 * out), F + 3.88, F + 3.97, p, p + 0.08, 1);
        }
      }
      if (o.ceil !== false) {
        B(x0, x1, o.ceilY || F + 4.2, JT, z0, z1, 1);
        O(x0, x1, o.ceilY || F + 4.2, JT + 0.4, z0, z1);
        B(x0 - 0.35, x1 + 0.35, JT, JT + 0.4, z0 - 0.35, z1 + 0.35, 2);
      }
      if (o.roof) roof((x0 + x1) / 2, (z0 + z1) / 2, JT + 0.4, x1 - x0 + 0.2, z1 - z0 + 0.2, o.roofH || 3.0, 3);
    };

    // ---- spire builder (latina / urushringa): curved lofted surface, built later as one mesh ----
    // Plan of each face: seven projections (saptaratha) on the main spire, three on the subsidiary ones.
    let spires = 0;
    const spireDefs = [];
    const curve = (t) => 1 - 0.5 * Math.pow(t, 1.5);
    const sringa = (cx, cz, by, w, h, storeys) => {
      spires++;
      const bodyH = h * 0.82;
      const per = storeys ? 3 : 4;
      const n = storeys ? storeys * per : Math.max(6, Math.round(bodyH / 0.55));
      const sh = bodyH / n;
      spireDefs.push({ cx: cx, cz: cz, by: by, w: w, bodyH: bodyH, n: n, per: per, main: !!storeys });
      for (let i = 0; i < n; i += 3) {
        const hw = (w / 2) * curve(i / n) * 0.86;
        O(cx - hw, cx + hw, by + i * sh, by + (i + 3) * sh, cz - hw, cz + hw);
      }
      // bhūmi-āmalakas on the corner (karna) projections at each storey line
      for (let i = per; i < n; i += per) {
        const hw = (w / 2) * curve(i / n);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) miniAm.push({ x: cx + sx * hw * 0.9, y: by + i * sh - sh * 0.35, z: cz + sz * hw * 0.9, r: hw * 0.17, h: sh * 0.7 });
      }
      const yt = by + bodyH, wtop = w * 0.54;
      Bc(cx, yt, cz, wtop * 0.72, h * 0.03, wtop * 0.72, 2);
      amalakas.push({ x: cx, y: yt + h * 0.03, z: cz, r: w * 0.36, h: h * 0.07 });
      kalashas.push({ x: cx, y: yt + h * 0.1, z: cz, r: w * 0.12, h: h * 0.08 });
    };
    const ratha7 = [[-0.9, -0.74, 0.9], [-0.74, -0.68, 0.84], [-0.68, -0.5, 0.95], [-0.5, -0.44, 0.88], [-0.44, -0.28, 1.0], [-0.28, -0.24, 0.95], [-0.24, 0.24, 1.08], [0.24, 0.28, 0.95], [0.28, 0.44, 1.0], [0.44, 0.5, 0.88], [0.5, 0.68, 0.95], [0.68, 0.74, 0.84], [0.74, 0.9, 0.9]];
    const ratha3 = [[-0.88, -0.52, 0.88], [-0.52, -0.42, 0.82], [-0.42, 0.42, 1.06], [0.42, 0.52, 0.82], [0.52, 0.88, 0.88]];
    const outline = (segs) => {
      const sides = [[[1, 0], [0, 1]], [[0, 1], [-1, 0]], [[-1, 0], [0, -1]], [[0, -1], [1, 0]]];
      const pts = [];
      for (const sd of sides) {
        const nrm = sd[0], tg = sd[1];
        for (const g of segs) for (const sv of [g[0], g[1]]) {
          const x = nrm[0] * g[2] + tg[0] * sv, z = nrm[1] * g[2] + tg[1] * sv;
          const lp = pts[pts.length - 1];
          if (!lp || Math.abs(lp[0] - x) > 1e-6 || Math.abs(lp[1] - z) > 1e-6) pts.push([x, z]);
        }
      }
      const f = pts[0], l = pts[pts.length - 1];
      if (Math.abs(f[0] - l[0]) < 1e-6 && Math.abs(f[1] - l[1]) < 1e-6) pts.pop();
      return pts;
    };
    const OUT7 = outline(ratha7), OUT3 = outline(ratha3);
    const buildSpires = () => {
      const pos = [], uv = [], colr = [];
      for (const d of spireDefs) {
        const tint = 0.95 + rnd() * 0.08;
        const P = d.main ? OUT7 : OUT3;
        const sh = d.bodyH / d.n;
        const rings = [[d.by, 0]];
        for (let i = 0; i <= d.n; i++) {
          const t = i / d.n, y = d.by + i * sh, hw = (d.w / 2) * curve(t);
          const bh = i > 0 && i < d.n && i % d.per === 0;
          if (bh) {
            const e = sh * 0.14;
            rings.push([y - e, (d.w / 2) * curve((i - 0.14) / d.n)], [y - e, hw * 1.055], [y + e, hw * 1.055], [y + e, (d.w / 2) * curve((i + 0.14) / d.n)]);
          } else rings.push([y, hw]);
        }
        rings.push([d.by + d.bodyH, 0]);
        // perimeter coordinates for the lattice pattern
        const per = [0];
        for (let j = 1; j <= P.length; j++) { const a = P[j - 1], b2 = P[j % P.length]; per.push(per[j - 1] + Math.hypot(b2[0] - a[0], b2[1] - a[1])); }
        for (let r = 0; r < rings.length - 1; r++) {
          const r0 = rings[r], r1 = rings[r + 1];
          for (let j = 0; j < P.length; j++) {
            const a = P[j], b2 = P[(j + 1) % P.length];
            const A0 = [d.cx + a[0] * r0[1], r0[0], d.cz + a[1] * r0[1]], B0 = [d.cx + b2[0] * r0[1], r0[0], d.cz + b2[1] * r0[1]];
            const A1 = [d.cx + a[0] * r1[1], r1[0], d.cz + a[1] * r1[1]], B1 = [d.cx + b2[0] * r1[1], r1[0], d.cz + b2[1] * r1[1]];
            const ua0 = per[j] * r0[1], ub0 = per[j + 1] * r0[1], ua1 = per[j] * r1[1], ub1 = per[j + 1] * r1[1];
            const v0 = r0[0] - d.by, v1 = r1[0] - d.by;
            pos.push(...A0, ...A1, ...B0, ...B0, ...A1, ...B1);
            uv.push(ua0, v0, ua1, v1, ub0, v0, ub0, v0, ua1, v1, ub1, v1);
            const ao = (vv) => { const f = Math.min(1, Math.max(0, vv / (d.bodyH * 0.4))); return tint * (0.5 + 0.5 * f * f * (3 - 2 * f)); };
            const c0 = ao(v0), c1 = ao(v1);
            colr.push(c0, c0, c0, c1, c1, c1, c0, c0, c0, c0, c0, c0, c1, c1, c1, c1, c1, c1);
          }
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(colr, 3));
      g.computeVertexNormals();
      return g;
    };

    // ---- pyramidal roofs with bell-rooflets (DOCUMENTED type; heights ESTIMATED) ----
    const roof = (cx, cz, by, wx, wz, h, tiers) => {
      const bodyH = h * 0.8, th = bodyH / tiers;
      for (let k = 0; k < tiers; k++) {
        const f = 1 - 0.7 * (k / tiers);
        const sx = wx * f, sz = wz * f, y = by + k * th;
        Bc(cx, y, cz, sx, th * 0.6, sz, k % 2 ? 0 : 4);
        O(cx - sx / 2, cx + sx / 2, y, y + th, cz - sz / 2, cz + sz / 2);
        Bc(cx, y + th * 0.6, cz, sx + 0.45, th * 0.16, sz + 0.45, 2);
        const gs = Math.min(0.7, th * 0.55), gy = y + th * 0.76;
        const ex = sx / 2 - 0.1, ez = sz / 2 - 0.1;
        const nx = Math.max(1, Math.round(sx / 1.1)), nz = Math.max(1, Math.round(sz / 1.1));
        for (let i = 0; i <= nx; i++) {
          const x = cx - ex + (2 * ex * i) / nx;
          ghantas.push({ x: x, y: gy, z: cz - ez, r: gs * 0.55, h: gs * 0.68 });
          ghantas.push({ x: x, y: gy, z: cz + ez, r: gs * 0.55, h: gs * 0.68 });
        }
        for (let i = 1; i < nz; i++) {
          const z = cz - ez + (2 * ez * i) / nz;
          ghantas.push({ x: cx - ex, y: gy, z: z, r: gs * 0.55, h: gs * 0.68 });
          ghantas.push({ x: cx + ex, y: gy, z: z, r: gs * 0.55, h: gs * 0.68 });
        }
      }
      const yt = by + bodyH, m = Math.min(wx, wz);
      ghantas.push({ x: cx, y: yt, z: cz, r: m * 0.2, h: h * 0.12 });
      amalakas.push({ x: cx, y: yt + h * 0.12, z: cz, r: m * 0.16, h: h * 0.05 });
      kalashas.push({ x: cx, y: yt + h * 0.17, z: cz, r: m * 0.07, h: h * 0.08 });
    };

    // five transepts (rear + two ambulatory windows + two great-hall windows) and the open mandapa/porch facades
    balcony([X(46.7), X(82), -Hp(28.5), Hp(28.5)], ['w', 'n', 's'], { roof: true, roofH: 2.6 });
    balcony([X(151.7), X(196.7), -Hp(120.5), -Hp(86)], ['n', 'w', 'e'], { roof: true });
    balcony([X(151.7), X(196.7), Hp(86), Hp(120.5)], ['s', 'w', 'e'], { roof: true });
    balcony([X(294.5), X(346), -Hp(124), -Hp(87.5)], ['n', 'w', 'e'], { roof: true, roofH: 3.4 });
    balcony([X(294.5), X(346), Hp(87.5), Hp(124)], ['s', 'w', 'e'], { roof: true, roofH: 3.4 });
    balcony([X(400), X(470), -Hp(65.5), Hp(65.5)], ['n', 's'], { ceilY: F + 4.6, depth: 1.24 });
    balcony([X(470), L, -Hp(45.5), Hp(45.5)], ['n', 's'], { ceilY: F + 4.2, depth: 1.24 });
    // mandapa pillars (drawing): four central + two mid-span; porch: four pillars (DOCUMENTED)
    const fullP = [[398, 18], [463, 18], [435, 22.5], [475, 18.5], [537, 18.5]];
    for (const p of fullP) for (const s of [-1, 1]) {
      const px = X(p[0]), pz = s * Hp(p[1]);
      const top = p[0] >= 470 ? F + 4.2 : F + 4.6;
      Bc(px, F, pz, 0.56, 0.4, 0.56, 2);
      pillars8.push({ x: px, y: F + 0.4, z: pz, r: 0.21, h: top - F - 0.8 });
      Bc(px, top - 0.4, pz, 0.66, 0.4, 0.66, 5);
      C(px - 0.3, px + 0.3, pz - 0.3, pz + 0.3, F, top);
    }

    // roofs rising porch → hall → great hall → tower (DOCUMENTED order; heights ESTIMATED)
    roof(X(509), 0, JT + 0.4, X(548) - X(470) + 0.3, Hp(45.5) * 2 + 0.6, 5.4, 4);
    roof(X(435), 0, JT + 0.4, X(470) - X(400) + 0.3, Hp(65.5) * 2 + 0.6, 7.2, 5);
    B(X(368), X(400), JT + 0.45, JT + 1.2, -Hp(74.5), Hp(74.5), 1);
    roof(X(323), 0, CORN, X(368) - X(278) + 0.4, Hp(87.5) * 2 + 0.4, 10.4, 7);

    // ---- vestibule roof (śukanāsa) with stacked niches (DOCUMENTED; form ESTIMATED) ----
    const SX = X(178);
    for (let k = 0; k < 6; k++) {
      const w = 5.6 - k * 0.6, y = CORN + k * 1.05;
      B(X(214), X(278) - k * 0.35, y, y + 1.05, -w / 2, w / 2, k % 2 ? 0 : 4);
      O(X(214), X(278) - k * 0.35, y, y + 1.05, -w / 2, w / 2);
    }

    // ---- shikhara: main spire (12 storeys, 11 bhūmi-āmalakas) + 84 subsidiary spires ----
    // urushringas in four tiers on each face (DOCUMENTED); on the east face they rise above the śukanāsa
    const mainH = K.HTOP - CORN;
    sringa(SX, 0, CORN, 7.6, mainH, 12);
    const URAH = [{ by: CORN, w: 4.0, h: 10.5, d: 3.75 }, { by: CORN + 2.3, w: 3.8, h: 11.2, d: 3.3 }, { by: CORN + 4.8, w: 3.5, h: 10.8, d: 2.85 }, { by: CORN + 7.4, w: 3.1, h: 8.8, d: 2.3 }];
    const URAH_E = [{ by: CORN + 2.6, w: 3.8, h: 10.8, d: 3.3 }, { by: CORN + 4.6, w: 3.5, h: 10.6, d: 2.9 }, { by: CORN + 6.6, w: 3.2, h: 9.6, d: 2.45 }, { by: CORN + 8.6, w: 2.8, h: 7.6, d: 2.0 }];
    for (const f of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      for (const u of (f[0] === 1 ? URAH_E : URAH)) sringa(SX + f[0] * u.d, f[1] * u.d, u.by, u.w, u.h);
    }
    // corner (karna) clusters: 17 at each corner, in four tiers (grouping ESTIMATED)
    for (const cx of [-1, 1]) for (const cz of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const c = 4.75 - 0.33 * k, s2 = 1.3, by = CORN + 2.4 * k, w = 2.0 + 0.15 * k, h = 6.4 + 0.65 * k;
        const pts = k < 3 ? [[c, c], [c, c - s2], [c - s2, c], [c, c - 2 * s2], [c - 2 * s2, c]] : [[c, c - s2], [c - s2, c]];
        for (const p of pts) sringa(SX + cx * p[0], cz * p[1], by, w, h);
      }
    }

    // ---- liṅga on sandstone pīṭhikā at the centre of the cella (DOCUMENTED; c. 4 ft secondary) ----
    const LX = X((CEL[0] + CEL[1]) / 2);
    Bc(LX, F, 0, 1.4, 0.42, 1.4, 0);
    Bc(LX, F + 0.42, 0, 1.52, 0.13, 1.52, 4);
    C(LX - 0.8, LX + 0.8, -0.8, 0.8, F, F + 1.3);
    this.LX = LX;

    // ---- geometry & materials ----
    const lathe = (pts, seg, ribs) => {
      const g = new T.LatheGeometry(pts.map((p) => new T.Vector2(p[0], p[1])), seg);
      if (ribs) {
        const pa = g.attributes.position;
        for (let i = 0; i < pa.count; i++) {
          const x = pa.getX(i), z = pa.getZ(i);
          const k = 0.86 + 0.14 * Math.abs(Math.cos(Math.atan2(z, x) * ribs / 2));
          pa.setX(i, x * k); pa.setZ(i, z * k);
        }
        g.computeVertexNormals();
      }
      return g;
    };
    const amProf = [[0, 0], [0.62, 0], [0.88, 0.14], [1, 0.42], [0.98, 0.6], [0.85, 0.84], [0.6, 1], [0, 1]];
    const gAm = lathe(amProf, 64, 32), gMini = lathe(amProf, 16, 8);
    const gKal = lathe([[0, 0], [0.55, 0], [0.62, 0.06], [1, 0.26], [0.92, 0.4], [0.5, 0.5], [0.38, 0.55], [0.62, 0.6], [0.32, 0.67], [0.14, 0.8], [0.05, 1], [0, 1]], 24);
    const gGh = lathe([[0, 0], [1, 0], [1, 0.12], [0.92, 0.34], [0.78, 0.58], [0.55, 0.8], [0.26, 0.93], [0.12, 0.97], [0.14, 1], [0, 1]], 16);
    // a standing figure in relief: feet, legs, hips, waist, chest, shoulders, neck, head, crown
    const gFig = lathe([[0, 0], [0.34, 0], [0.36, 0.04], [0.3, 0.2], [0.34, 0.36], [0.5, 0.47], [0.36, 0.56], [0.44, 0.66], [0.56, 0.74], [0.5, 0.78], [0.2, 0.8], [0.18, 0.83], [0.26, 0.87], [0.26, 0.93], [0.2, 0.97], [0.08, 1], [0, 1]], 12);
    const gP8 = new T.CylinderGeometry(1, 1, 1, 8), gP16 = new T.CylinderGeometry(1, 1, 1, 16), gBox = new T.BoxGeometry(1, 1, 1);

    this.uTex = { value: 1 };
    this.uCut = { value: 0 };
    const uTex = this.uTex, uCut = this.uCut;
    const stone = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, envMapIntensity: 0.4 });
    stone.onBeforeCompile = (sh) => {
      sh.uniforms.uTex = uTex;
      sh.uniforms.uCut = uCut;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 wpk = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwpk = instanceMatrix * wpk;\n#endif\nvWP = (modelMatrix * wpk).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nuniform float uTex;\nuniform float uCut;\nfloat hk(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\nfloat nk(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(hk(i),hk(i+vec3(1.0,0.0,0.0)),f.x),mix(hk(i+vec3(0.0,1.0,0.0)),hk(i+vec3(1.0,1.0,0.0)),f.x),f.y),mix(mix(hk(i+vec3(0.0,0.0,1.0)),hk(i+vec3(1.0,0.0,1.0)),f.x),mix(hk(i+vec3(0.0,1.0,1.0)),hk(i+vec3(1.0,1.0,1.0)),f.x),f.y),f.z);}')
        .replace('#include <color_fragment>', '#include <color_fragment>\nif (uTex > 0.5) { float g = nk(vWP * 9.0) * 0.4 + nk(vWP * 1.8) * 0.35 + nk(vec3(vWP.x * 0.6, vWP.y * 14.0, vWP.z * 0.6)) * 0.25; float course = smoothstep(0.0, 0.035, abs(fract(vWP.y / 0.42) - 0.5) - 0.465); diffuseColor.rgb *= (0.86 + 0.24 * g) * (1.0 - 0.18 * course); float stain = smoothstep(0.55, 0.85, nk(vec3(vWP.x * 0.35, vWP.y * 0.12, vWP.z * 0.35))); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.78, 0.74, 0.72), stain * 0.5); }')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nif (uCut > 0.5 && !gl_FrontFacing) { diffuseColor.rgb = vec3(0.0); totalEmissiveRadiance = vec3(0.46, 0.22, 0.15); }');
    };
    stone.customProgramCacheKey = () => 'kmt-stone-2';
    // spire surfaces: same stone, plus a lattice of small arch motifs (jāla) drawn from surface coordinates
    const spireMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, envMapIntensity: 0.4, vertexColors: true });
    spireMat.onBeforeCompile = (sh) => {
      stone.onBeforeCompile(sh);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vJ;').replace('#include <project_vertex>', '#include <project_vertex>\nvJ = uv;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vJ;')
        .replace('#include <emissivemap_fragment>', 'if (uTex > 0.5) { vec2 q = vJ / vec2(0.46, 0.5); q.x += floor(q.y) * 0.5; vec2 gq = fract(q); float da = abs(length((gq - vec2(0.5, 0.32)) * vec2(1.0, 1.3)) - 0.3); float jal = 1.0 - smoothstep(0.03, 0.075, min(da, abs(gq.y - 0.04))); diffuseColor.rgb *= 1.0 - 0.32 * jal; }\n#include <emissivemap_fragment>');
    };
    spireMat.customProgramCacheKey = () => 'kmt-spire-2';
    spireMat.color.setHex(0xd2aa80);
    this.spireMat = spireMat;
    const marble = new T.MeshStandardMaterial({ color: 0xece7dc, roughness: 0.35 });
    this.mats = [stone, marble, spireMat];
    this.stone = stone;

    // sandstone: buff, pink and pale-yellow (DOCUMENTED colours; values ILLUSTRATIVE)
    this.PAL_REAL = [0xcda57c, 0xdbb68e, 0x9c7856, 0x7a5a40, 0xc29a72, 0xe0bf98];
    this.PAL_PLAIN = [0xd9d4ca, 0xe0dbd2, 0xbdb6aa, 0xa8a297, 0xd2ccc1, 0xe6e1d8];
    this.instSets = [];
    this.solids = [];
    const dummy = new T.Object3D();
    const inst = (geo, list, setter, cIdx) => {
      if (!list.length) return null;
      const m = new T.InstancedMesh(geo, stone, list.length);
      const idx = [], jit = [];
      list.forEach((it, i) => {
        setter(it);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        idx.push(it.c != null ? it.c : cIdx);
        jit.push([(rnd() - 0.5) * 0.04, (rnd() - 0.5) * 0.05]);
      });
      m.castShadow = true; m.receiveShadow = true;
      m.instanceMatrix.needsUpdate = true;
      m.setColorAt(0, new T.Color(1, 1, 1));
      scene.add(m);
      this.solids.push(m);
      this.instSets.push({ mesh: m, idx: idx, jit: jit });
      return m;
    };
    inst(gBox, boxes, (b) => { dummy.position.set(b.x, b.y, b.z); dummy.rotation.set(b.rx, 0, b.rz); dummy.scale.set(b.sx, b.sy, b.sz); });
    const lat = (it) => { dummy.position.set(it.x, it.y, it.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(it.r, it.h, it.r); };
    inst(gAm, amalakas, lat, 1);
    inst(gMini, miniAm, lat, 1);
    inst(gKal, kalashas, lat, 4);
    inst(gGh, ghantas, lat, 0);
    const spireMesh = new T.Mesh(buildSpires(), spireMat);
    spireMesh.castShadow = true; spireMesh.receiveShadow = true;
    scene.add(spireMesh);
    this.spireMesh = spireMesh;
    this.solids.push(spireMesh);
    inst(gFig, figures, (f) => {
      dummy.position.set(f.x, f.y, f.z);
      dummy.rotation.set(f.ax === 'x' ? f.tilt : 0, 0, f.ax === 'z' ? f.tilt : 0);
      dummy.scale.set(f.ax === 'z' ? 0.3 : 0.12 * f.d, f.h, f.ax === 'z' ? 0.12 * f.d : 0.3);
    }, 5);
    this.figSet = this.instSets[this.instSets.length - 1];
    this.figCat = figures.map((f) => f.cat || 'int');
    const pil = (it) => { dummy.position.set(it.x, it.y + it.h / 2, it.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(it.r, it.h, it.r); };
    inst(gP8, pillars8, pil, 1);
    inst(gP16, pillars16, pil, 1);

    // marble liṅga
    const linga = new T.Mesh(new T.CylinderGeometry(0.27, 0.29, 0.55, 32), marble);
    linga.position.set(LX, F + 0.55 + 0.275, 0);
    const cap = new T.Mesh(new T.SphereGeometry(0.27, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), marble);
    cap.scale.set(1, 0.45, 1);
    cap.position.set(LX, F + 1.1, 0);
    linga.castShadow = cap.castShadow = true;
    scene.add(linga, cap);

    // great-hall ceiling: three corbelled courses around a circular centre (DOCUMENTED; size ESTIMATED)
    const ringMat = new T.MeshStandardMaterial({ color: 0xc9a27d, roughness: 0.9, side: T.DoubleSide });
    ringMat.userData.keepDouble = true;
    for (let k = 0; k < 3; k++) {
      const ring = new T.Mesh(new T.CylinderGeometry(1.6 - k * 0.35, 1.6 - k * 0.35, 0.28, 48, 1, true), ringMat);
      ring.position.set(MX, F + 5.4 - 0.14 - k * 0.28, 0);
      scene.add(ring);
    }
    const disc = new T.Mesh(new T.CircleGeometry(0.7, 48), new T.MeshStandardMaterial({ color: 0x8c6c50, roughness: 1 }));
    disc.rotation.x = Math.PI / 2;
    disc.position.set(MX, F + 5.38, 0);
    scene.add(disc);
    this.mats.push(disc.material, ringMat);

    // makara-toraṇa of four loops at the porch front pillars (DOCUMENTED; simplified)
    const torMat = new T.MeshStandardMaterial({ color: 0xe6c8a3, roughness: 0.85 });
    this.mats.push(torMat);
    // the second toraṇa, at the entrance to the great hall (position ESTIMATED; two toranas are DOCUMENTED by Krishna Deva); its form copies the first (COMPARATIVE)
    // and it hangs between the first pair of mandapa pillars, under the great-hall door lintel (F + 3.6) (ESTIMATED)
    for (const tp of [[X(537) + 0.25, Hp(18.5) - 0.05, F + 2.75], [X(398) + 0.25, Hp(18) - 0.05, F + 2.2]]) {
      const cy = tp[2];
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * (i + 0.5) / 4;
        const loop = new T.Mesh(new T.TorusGeometry(0.3, 0.065, 8, 24, Math.PI), torMat);
        loop.position.set(tp[0], cy + Math.sin(a) * tp[1], Math.cos(a) * tp[1]);
        loop.rotation.set(Math.PI / 2 - a, Math.PI / 2, 0);
        loop.castShadow = true;
        scene.add(loop);
      }
    }
    this.torX = [X(537) + 0.25, X(398) + 0.25];

    // ---- ground, sky, trees (ILLUSTRATIVE) ----
    const groundMat = new T.MeshStandardMaterial({ color: 0x9b8f63, roughness: 1 });
    const ground = new T.Mesh(new T.PlaneGeometry(800, 800), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    this.groundMat = groundMat;
    const skyMat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false,
      uniforms: { top: { value: new T.Color(0x6f9fcf) }, bot: { value: new T.Color(0xe8e2d4) } },
      vertexShader: 'varying float vy; void main(){ vy = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying float vy; void main(){ gl_FragColor = vec4(mix(bot, top, clamp(pow(max(vy,0.0),0.6),0.0,1.0)), 1.0); }'
    });
    const sky = new T.Mesh(new T.SphereGeometry(400, 32, 16), skyMat);
    scene.add(sky);
    this.sky = sky;
    const trees = new T.Group();
    const trunkM = new T.MeshStandardMaterial({ color: 0x5b4632, roughness: 1 });
    const leafM = new T.MeshStandardMaterial({ color: 0x55703a, roughness: 1 });
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2, d = 46 + rnd() * 34;
      const x = 18 + Math.cos(a) * d, z = Math.sin(a) * d * 0.8;
      if (x > 40 && Math.abs(z) < 12) continue;
      const h = 4 + rnd() * 4;
      const t = new T.Mesh(new T.CylinderGeometry(0.22, 0.32, h, 7), trunkM);
      t.position.set(x, h / 2, z);
      for (let j = 0; j < 3; j++) {
        const c = new T.Mesh(new T.IcosahedronGeometry(1.6 + rnd() * 1.2, 1), leafM);
        c.position.set(x + (rnd() - 0.5) * 2, h + 0.8 + rnd() * 1.4, z + (rnd() - 0.5) * 2);
        c.castShadow = true;
        trees.add(c);
      }
      t.castShadow = true;
      trees.add(t);
    }
    scene.add(trees);
    this.trees = trees;

    // ---- people (ILLUSTRATIVE) ----
    const skinM = new T.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.8 });
    const hairM = new T.MeshStandardMaterial({ color: 0x1b1612, roughness: 0.9 });
    const clothM = { white: new T.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 1 }), madder: new T.MeshStandardMaterial({ color: 0x8e2f25, roughness: 1 }), indigo: new T.MeshStandardMaterial({ color: 0x33406b, roughness: 1 }), ochre: new T.MeshStandardMaterial({ color: 0xb9852f, roughness: 1 }) };
    this.mats.push(hairM, skinM, clothM.white, clothM.madder, clothM.indigo, clothM.ochre);
    const person = (h, female, lower, upper, pose) => {
      const g = new T.Group();
      const s = h / 1.65;
      const add = (geo, m, x, y, z, rx, rz) => { const me = new T.Mesh(geo, m); me.position.set(x * s, y * s, z * s); if (rx) me.rotation.x = rx; if (rz) me.rotation.z = rz; me.scale.setScalar(s); me.castShadow = true; g.add(me); return me; };
      if (female) add(new T.CylinderGeometry(0.15, 0.25, 0.92, 12), clothM[lower], 0, 0.46, 0);
      else {
        add(new T.CylinderGeometry(0.055, 0.05, 0.42, 6), skinM, -0.08, 0.21, 0);
        add(new T.CylinderGeometry(0.055, 0.05, 0.42, 6), skinM, 0.08, 0.21, 0);
        add(new T.CylinderGeometry(0.17, 0.2, 0.55, 12), clothM[lower], 0, 0.7, 0);
      }
      add(new T.CylinderGeometry(0.15, 0.13, 0.5, 12), skinM, 0, female ? 1.15 : 1.22, 0);
      add(new T.BoxGeometry(0.33, 0.06, 0.05), clothM[upper], 0, female ? 1.2 : 1.28, 0.06, 0, 0.55);
      add(new T.SphereGeometry(0.11, 14, 10), skinM, 0, female ? 1.5 : 1.57, 0);
      add(new T.SphereGeometry(0.065, 10, 8), hairM, 0, female ? 1.55 : 1.62, -0.07);
      if (pose === 'anjali') {
        add(new T.CylinderGeometry(0.04, 0.04, 0.42, 6), skinM, -0.12, 1.2, 0.12, -1.0, 0.3);
        add(new T.CylinderGeometry(0.04, 0.04, 0.42, 6), skinM, 0.12, 1.2, 0.12, -1.0, -0.3);
      } else {
        add(new T.CylinderGeometry(0.04, 0.04, 0.55, 6), skinM, -0.2, 1.15, 0, 0, 0.12);
        add(new T.CylinderGeometry(0.04, 0.04, 0.55, 6), skinM, 0.2, 1.15, 0, 0, -0.12);
      }
      return g;
    };
    const people = new T.Group();
    this.walkers = [];
    const pathLen = (p) => { let l = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; l += Math.hypot(b[0] - a[0], b[1] - a[1]); } return l; };
    const addWalker = (path, y, t0, h, female, lo, up) => {
      const g = person(h, female, lo, up, 'anjali');
      people.add(g);
      this.walkers.push({ g: g, path: path, len: pathLen(path), s: t0, y: y, x: path[0][0], z: path[0][1], speed: 0.7 });
    };
    // ambulatory circuit, clockwise with the sanctum on the right (east leg runs through the antarala)
    const AE = X(236), AW = X(115), AS = 3.17;
    const amb = [[AE, -AS], [AE, AS], [6.85, AS], [6.85, 2.3], [AW, 2.2], [AW, -2.2], [6.85, -2.3], [6.85, -AS]];
    this.ambPath = amb;
    addWalker(amb, F, 0, 1.6, false, 'white', 'ochre');
    addWalker(amb, F, 9, 1.52, true, 'madder', 'white');
    const jag = [[42, -13], [42, 13], [-6.5, 13], [-6.5, -13]];
    addWalker(jag, J, 0, 1.66, false, 'white', 'madder');
    addWalker(jag, J, 30, 1.54, true, 'indigo', 'white');
    addWalker(jag, J, 62, 1.6, true, 'ochre', 'white');
    addWalker(jag, J, 95, 1.68, false, 'white', 'white');
    const priest = person(1.66, false, 'white', 'white', 'anjali');
    priest.position.set(LX + 1.15, F, 0); priest.rotation.y = -Math.PI / 2;
    people.add(priest);
    this.staticPeople = [[LX + 1.15, 0, F]];
    const pot = new T.Mesh(new T.SphereGeometry(0.11, 12, 10), new T.MeshStandardMaterial({ color: 0x8c6239, roughness: 0.6 }));
    pot.position.set(LX + 0.85, F + 1.12, 0.12);
    people.add(pot);
    this.mats.push(pot.material);
    for (const p of [[X(355), -0.8, false, 'white', 'madder'], [X(358), 0.8, true, 'indigo', 'white']]) {
      const g = person(p[2] ? 1.55 : 1.65, p[2], p[3], p[4], 'anjali');
      g.position.set(p[0], F, p[1]); g.rotation.y = -Math.PI / 2;
      people.add(g);
      this.staticPeople.push([p[0], p[1], F]);
    }
    const flowerM = new T.MeshStandardMaterial({ color: 0xd98aa0, roughness: 0.8 });
    this.mats.push(flowerM);
    for (let i = 0; i < 9; i++) {
      const fl = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), flowerM);
      fl.position.set(X(DOOR[1]) + 0.35 + (i % 3) * 0.13, F + 0.06, -0.15 + Math.floor(i / 3) * 0.13);
      people.add(fl);
    }
    const lampM = new T.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.7 });
    const flameM = new T.MeshBasicMaterial({ color: 0xffc46a });
    this.mats.push(lampM, flameM);
    const lamp = new T.Mesh(new T.CylinderGeometry(0.09, 0.05, 0.06, 12), lampM);
    lamp.position.set(LX + 0.85, F + 0.58, -0.5);
    const flame = new T.Mesh(new T.SphereGeometry(0.035, 8, 6), flameM);
    flame.scale.set(1, 1.8, 1);
    flame.position.set(LX + 0.85, F + 0.66, -0.5);
    const lampLight = new T.PointLight(0xffb060, 3.0, 7, 2);
    lampLight.position.set(LX + 0.85, F + 0.8, -0.5);
    people.add(lamp, flame, lampLight);
    people.visible = false;
    scene.add(people);
    this.people = people;

    const scaleFig = person(1.70, false, 'white', 'white', 'rest');
    scaleFig.position.set(52.5, 0, -5.5);
    scaleFig.rotation.y = -Math.PI / 2;
    scene.add(scaleFig);
    this.scaleFig = scaleFig;

    for (const c of col) O(c.x0, c.x1, c.y0, c.y1, c.z0, c.z1);
    for (const m of this.mats) m.clippingPlanes = [];
    this.labelDefs = [
      [1, 'Jagati (terrace)', 40, J + 0.4, -12.5, 'out'],
      [2, 'Entrance stair', L + 3.8, F - 1.4, 2.6, 'out'],
      [3, 'Ardhamandapa (porch)', X(509), F + 0.8, 0, 'in'],
      [4, 'Mandapa (hall)', X(435), F + 2.7, 0, 'in'],
      [5, 'Mahamandapa (great hall)', MX, F + 0.8, 0, 'in'],
      [6, 'Transept balcony', MX, F + 2.6, -(Hp(124) + 1.0), 'out'],
      [7, 'Antarala (vestibule)', X(255), F + 2.9, 0, 'in'],
      [8, 'Garbhagriha and liṅga', LX, F + 1.6, 0, 'in'],
      [9, 'Pradakṣiṇā-patha (ambulatory)', X(160), F + 2.4, 3.17, 'in'],
      [10, 'Shikhara and its 84 smaller replicas', SX, K.HTOP + 0.9, 0, 'out'],
      [11, 'Urushringa', SX, 28.0, -7.0, 'out'],
      [12, 'Adhiṣṭhāna (moulded base)', X(110), J + 2.4, -Hp(108) - 0.8, 'out'],
      [13, 'Rear (west) balcony', -0.8, F + 2.6, 0, 'out'],
      [14, 'Makara-toraṇa', L + 0.6, F + 4.9, 0, 'out'],
      [15, 'Scale figure, 1.70 m', 52.5, 1.95, -5.5, 'out']
    ];
    // iconography markers: [key, text, x, y, z, in/out, category, item]
    const ip = this.icoPts, bx = X(125) + 0.4;
    const icoDefs = [
      ['A', 'Projections: gods, surasundarīs', bx, F + 2.6, Hp(86) + 0.75, 'out', 'proj', 'A'],
      ['B', 'Recesses: vyālas, nāgīs', bx + 0.72, F + 1.0, Hp(86) + 0.6, 'out', 'rec', 'B'],
      ['C', 'Transept–sanctum recesses', 13.5, F + 3.1, Hp(86) + 0.75, 'out', 'jun', 'C'],
      ['F', 'Processional friezes', X(233), J + 1.2, Hp(108.5) + 0.5, 'out', 'frz', 'F'],
      ['G', 'Entrance toraṇa', L + 0.6, F + 4.9, 0, 'out', 'tor', 'G'],
      ['H', 'Second toraṇa', X(398) + 0.35, F + 3.85, 0, 'in', 'tor', 'H'],
      ['I', 'Sanctum doorway', X(228) + 0.35, F + 3.35, 0, 'in', 'door', 'I']
    ];
    for (const m of this.icoMat) icoDefs.push([m[0], 'Basement niche', ip[m[0]][0], ip[m[0]][1], ip[m[0]][2], 'out', 'mat', 'E']);
    this.icoDefs = icoDefs;
    return { spires: spires, figs: figs };
  }

  // ---------- rendering ----------
  init(T) {
    this.T = T;
    const canvas = this.canvasEl, wrap = this.wrap;
    canvas.tabIndex = 0;
    const renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer = renderer;
    const small = Math.min(window.innerWidth || 1200, window.innerHeight || 900) < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.localClippingEnabled = true;
    const scene = new T.Scene();
    this.scene = scene;
    const camera = new T.PerspectiveCamera(40, 1, 0.05, 1200);
    camera.rotation.order = 'YXZ';
    this.camera = camera;
    const hemi = new T.HemisphereLight(0xeef3ff, 0x8a7558, 1.0);
    scene.add(hemi);
    this.hemi = hemi;
    const sun = new T.DirectionalLight(0xfff0d8, 3.0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 2048 : 4096, small ? 2048 : 4096);
    const sc = sun.shadow.camera;
    sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 20; sc.far = 320;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.035;
    sun.target.position.set(20, 8, 0);
    scene.add(sun, sun.target);
    this.sun = sun;

    const res = this.buildScene(T, scene);

    // numbered labels
    const labelGroup = new T.Group();
    this.labels = [];
    const allDefs = this.labelDefs.map((d) => ({ id: d[0], text: d[1], x: d[2], y: d[3], z: d[4], inside: d[5] === 'in', disc: '#e8b27a', ico: false }))
      .concat(this.icoDefs.map((d) => ({ id: d[0], text: d[1], x: d[2], y: d[3], z: d[4], inside: d[5] === 'in', disc: '#' + this.ICOCOL[d[6]].toString(16).padStart(6, '0'), ico: true, item: d[7] })));
    for (const d of allDefs) {
      const cv = document.createElement('canvas');
      const ctx = cv.getContext('2d');
      const font = '600 40px Inter, system-ui, sans-serif';
      ctx.font = font;
      const text = d.text;
      const tw = Math.ceil(ctx.measureText(text).width);
      cv.width = tw + 112; cv.height = 76;
      ctx.font = font;
      ctx.fillStyle = 'rgba(34,26,19,0.88)';
      const r = 38, w = cv.width, h = cv.height;
      ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.arcTo(w, 0, w, r, r); ctx.arcTo(w, h, w - r, h, r); ctx.lineTo(r, h); ctx.arcTo(0, h, 0, h - r, r); ctx.arcTo(0, 0, r, 0, r); ctx.fill();
      ctx.fillStyle = d.disc;
      ctx.beginPath(); ctx.arc(38, 38, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = d.ico ? '#ffffff' : '#221a13'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (String(d.id).length > 1) ctx.font = '700 30px Inter, system-ui, sans-serif';
      ctx.fillText(String(d.id), 38, 40);
      ctx.font = font;
      ctx.fillStyle = '#fffaf2'; ctx.textAlign = 'left';
      ctx.fillText(text, 76, 40);
      const tex = new T.CanvasTexture(cv);
      tex.colorSpace = T.SRGBColorSpace;
      const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true, sizeAttenuation: false }));
      sp.center.set(0, 0.5);
      sp.position.set(d.x, d.y, d.z);
      sp.renderOrder = 10;
      sp.userData = { aspect: cv.width / cv.height, id: d.id, inside: d.inside, ico: d.ico, item: d.item };
      labelGroup.add(sp);
      this.labels.push(sp);
    }
    scene.add(labelGroup);
    // leader lines and anchor dots for labels that had to move to avoid overlapping
    const nL = this.labels.length;
    const leadGeo = new T.BufferGeometry();
    leadGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(nL * 6), 3));
    const leaders = new T.LineSegments(leadGeo, new T.LineBasicMaterial({ color: 0x221a13, depthTest: false, transparent: true, opacity: 0.85 }));
    const dotGeo = new T.BufferGeometry();
    dotGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(nL * 3), 3));
    const dots = new T.Points(dotGeo, new T.PointsMaterial({ color: 0x221a13, size: 7, sizeAttenuation: false, depthTest: false, transparent: true }));
    for (const o of [leaders, dots]) { o.renderOrder = 9; o.frustumCulled = false; scene.add(o); }
    leadGeo.setDrawRange(0, 0); dotGeo.setDrawRange(0, 0);
    this.ray = new T.Ray();
    this.box3 = new T.Box3();
    this.hitV = new T.Vector3();

    // clipping planes
    this.secPlane = new T.Plane(new T.Vector3(0, 0, -1), 0.05);
    this.planPlane = new T.Plane(new T.Vector3(0, -1, 0), this.K.F + 1.2);
    // section fill: stencil capping, so every cut solid shows one flat fill exactly on the cutting plane
    const makeCap = (plane, capGeo) => {
      const grp = new T.Group();
      const sm = (side, op) => new T.MeshBasicMaterial({ side: side, colorWrite: false, depthWrite: false, depthTest: false, clippingPlanes: [plane], stencilWrite: true, stencilFunc: T.AlwaysStencilFunc, stencilFail: op, stencilZFail: op, stencilZPass: op });
      const back = sm(T.BackSide, T.IncrementWrapStencilOp), front = sm(T.FrontSide, T.DecrementWrapStencilOp);
      for (const m of this.solids) {
        for (const mat of [back, front]) {
          const c = m.isInstancedMesh ? new T.InstancedMesh(m.geometry, mat, m.count) : new T.Mesh(m.geometry, mat);
          if (m.isInstancedMesh) c.instanceMatrix = m.instanceMatrix;
          c.renderOrder = 1;
          c.frustumCulled = false;
          grp.add(c);
        }
      }
      const capMat = new T.MeshStandardMaterial({ color: 0x9a4a32, roughness: 1, metalness: 0, stencilWrite: true, stencilRef: 0, stencilFunc: T.NotEqualStencilFunc, stencilFail: T.ReplaceStencilOp, stencilZFail: T.ReplaceStencilOp, stencilZPass: T.ReplaceStencilOp });
      const cap = new T.Mesh(capGeo, capMat);
      cap.renderOrder = 1.1;
      cap.onAfterRender = (r) => r.clearStencil();
      grp.add(cap);
      grp.visible = false;
      scene.add(grp);
      return grp;
    };
    const secGeo = new T.PlaneGeometry(160, 120); secGeo.translate(18, 40, 0.05);
    const planGeo = new T.PlaneGeometry(160, 120); planGeo.rotateX(-Math.PI / 2); planGeo.translate(18, this.K.F + 1.2, 0);
    this.secCap = makeCap(this.secPlane, secGeo);
    this.planCap = makeCap(this.planPlane, planGeo);

    // orbit controller
    const v0 = this.VIEWS[0];
    this.ctl = { th: v0.th, ph: v0.ph, r: v0.r, tx: v0.t[0], ty: v0.t[1], tz: v0.t[2] };
    this.goal = null;
    this.walkPos = { x: 53, z: 0, y: 0, yaw: Math.PI / 2, pitch: 0 };
    const ctl = this.ctl;
    const ptrs = new Map();
    let lastPinch = 0, lastMid = null, panning = false;
    const onDown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      canvas.focus({ preventScroll: true });
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      panning = e.button === 2 || e.shiftKey;
      this.goal = null;
      canvas.style.cursor = 'grabbing';
    };
    const pan = (dx, dy) => {
      const k = ctl.r * 0.0016;
      const rx = -Math.sin(ctl.th), rz = Math.cos(ctl.th);
      ctl.tx -= (dx * rx) * k; ctl.tz -= (dx * rz) * k;
      ctl.ty += dy * k;
    };
    const onMove = (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1) {
        if (this.state.mode === 'walk') {
          const w = this.walkPos;
          w.yaw -= dx * 0.004;
          w.pitch = Math.max(-1.2, Math.min(1.2, w.pitch - dy * 0.004));
        } else if (panning) pan(dx, dy);
        else {
          ctl.th += dx * 0.006;
          ctl.ph = Math.min(1.85, Math.max(0.02, ctl.ph - dy * 0.006));
        }
      } else if (ptrs.size === 2 && this.state.mode !== 'walk') {
        const a = Array.from(ptrs.values());
        const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        const mid = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
        if (lastPinch) ctl.r = Math.min(260, Math.max(0.5, ctl.r * (lastPinch / d)));
        if (lastMid) pan((mid.x - lastMid.x) / 2, (mid.y - lastMid.y) / 2);
        lastPinch = d; lastMid = mid;
      }
    };
    const onUp = (e) => {
      const p = ptrs.get(e.pointerId);
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) { lastPinch = 0; lastMid = null; }
      canvas.style.cursor = 'grab';
      // a click (not a drag) on an iconography marker opens its entry
      if (p && this.state.ico && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 6) {
        const cr = canvas.getBoundingClientRect(), k = cr.width / (canvas.clientWidth || 1) || 1;
        const mx = (e.clientX - cr.left) / k, my = (e.clientY - cr.top) / k;
        const hit = this.pickMarker(mx, my);
        if (hit) this.setState({ icoSel: hit, tab: 'ico' });
      }
    };
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey) && document.activeElement !== canvas && !document.fullscreenElement) {
        clearTimeout(this.wheelTimer); if (!this.state.wheelNote) this.setState({ wheelNote: true });
        this.wheelTimer = setTimeout(() => this.setState({ wheelNote: false }), 1600);
        return;
      }
      e.preventDefault();
      if (this.state.mode === 'walk') return;
      this.goal = null;
      ctl.r = Math.min(260, Math.max(0.5, ctl.r * Math.exp(e.deltaY * 0.0012)));
    };
    const onCtx = (e) => e.preventDefault();
    const keyMap = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'sl', KeyD: 'sr', ArrowLeft: 'tl', ArrowRight: 'tr' };
    const onKey = (down) => (e) => {
      const k = keyMap[e.code];
      if (!k || this.state.mode !== 'walk') return;
      e.preventDefault();
      this.keys[k] = down;
    };
    const kd = onKey(true), ku = onKey(false);
    const onBlur = () => { this.keys = {}; };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onCtx);
    canvas.addEventListener('keydown', kd);
    canvas.addEventListener('keyup', ku);
    canvas.addEventListener('blur', onBlur);
    this.unbind = () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onCtx);
      canvas.removeEventListener('keydown', kd);
      canvas.removeEventListener('keyup', ku);
      canvas.removeEventListener('blur', onBlur);
    };

    const resize = () => {
      const w = Math.max(1, wrap.clientWidth), h = Math.max(1, wrap.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    if (window.ResizeObserver) { this.ro = new ResizeObserver(resize); this.ro.observe(wrap); }

    // sky-lit ambient light from the gradient sky (image-based lighting)
    this.pmrem = new T.PMREMGenerator(renderer);
    this.envScene = new T.Scene();
    this.envScene.add(new T.Mesh(new T.SphereGeometry(50, 32, 16), this.sky.material));
    this._ap = null;
    this.syncState();

    let last = performance.now(), occT = 0, hudT = 0;
    // adaptive quality: if frames are slow (phones, older laptops), step down resolution and shadow detail
    const perf = { t: 0, n: 0, level: 0 };
    const degrade = () => {
      perf.level++;
      if (perf.level === 1) { renderer.setPixelRatio(1); resize(); }
      else if (perf.level === 2) { sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
      else if (perf.level === 3) { renderer.setPixelRatio(0.75); resize(); for (const set of this.instSets) set.mesh.castShadow = set.mesh.count > 2000 || set.mesh === this.instSets[0].mesh; }
    };
    const tmp = new T.Vector3(), tmp2 = new T.Vector3();
    const tick = () => {
      if (this.dead) return;
      const now = performance.now();
      const dt = Math.min(0.5, (now - last) / 1000);
      perf.t += now - last; perf.n++;
      if (perf.t > 2500) { if (perf.t / perf.n > 34 && perf.level < 3) degrade(); perf.t = 0; perf.n = 0; }
      last = now;
      this.syncState();
      const s = this.state;
      if (s.mode === 'walk') {
        const w = this.walkPos;
        const k = this.keys, p = this.pad;
        const fwd = (k.f ? 1 : 0) - (k.b ? 1 : 0) + p.f;
        const str = (k.sr ? 1 : 0) - (k.sl ? 1 : 0);
        const turn = (k.tl ? 1 : 0) - (k.tr ? 1 : 0) + p.t;
        w.yaw += turn * 1.5 * dt;
        if (fwd || str) {
          // walking pace 1.4 m/s whatever the frame rate; collisions checked in steps of at most 5 cm
          const dist = 1.4 * dt;
          const fx = -Math.sin(w.yaw), fz = -Math.cos(w.yaw);
          const rx = Math.cos(w.yaw), rz = -Math.sin(w.yaw);
          const mx = fx * fwd + rx * str, mz = fz * fwd + rz * str;
          const ml = Math.hypot(mx, mz) || 1;
          const n = Math.max(1, Math.ceil(dist / 0.05));
          for (let i = 0; i < n; i++) if (!this.tryMove(w.x + (mx / ml) * dist / n, w.z + (mz / ml) * dist / n)) break;
        }
        camera.fov = 70;
        camera.position.set(w.x, w.y + 1.6, w.z);
        camera.rotation.set(w.pitch, w.yaw, 0);
      } else {
        const g = this.goal;
        if (g) {
          const kk = 1 - Math.pow(1 - 0.09, dt * 60);
          ctl.th += (g.th - ctl.th) * kk; ctl.ph += (g.ph - ctl.ph) * kk; ctl.r += (g.r - ctl.r) * kk;
          ctl.tx += (g.tx - ctl.tx) * kk; ctl.ty += (g.ty - ctl.ty) * kk; ctl.tz += (g.tz - ctl.tz) * kk;
          if (Math.abs(g.th - ctl.th) + Math.abs(g.ph - ctl.ph) + Math.abs(g.r - ctl.r) * 0.01 + Math.abs(g.tx - ctl.tx) * 0.01 < 0.0008) this.goal = null;
        }
        const sp = Math.sin(ctl.ph);
        camera.fov = 40;
        camera.position.set(ctl.tx + ctl.r * sp * Math.cos(ctl.th), ctl.ty + ctl.r * Math.cos(ctl.ph), ctl.tz + ctl.r * sp * Math.sin(ctl.th));
        camera.up.set(0, 1, 0);
        camera.lookAt(ctl.tx, ctl.ty, ctl.tz);
      }
      camera.updateProjectionMatrix();
      // walkers
      if (s.inUse) {
        for (const wk of this.walkers) {
          wk.s = (wk.s + wk.speed * dt) % wk.len;
          let d = wk.s;
          for (let i = 0; i < wk.path.length; i++) {
            const a = wk.path[i], b = wk.path[(i + 1) % wk.path.length];
            const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
            if (d <= seg) {
              const u = d / seg;
              wk.x = a[0] + (b[0] - a[0]) * u; wk.z = a[1] + (b[1] - a[1]) * u;
              wk.g.position.set(wk.x, wk.y, wk.z);
              wk.g.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
              break;
            }
            d -= seg;
          }
        }
      }
      // labels: scale, cut and occlusion
      occT += dt;
      const doOcc = occT > 0.16;
      if (doOcc) occT = 0;
      const Kc = this.K, cp = camera.position;
      const camInside = s.mode === 'walk' ? this.walkPos.y > Kc.F - 0.5 : (cp.x > -0.5 && cp.x < Kc.L + 0.5 && Math.abs(cp.z) < Kc.HW + 0.5 && cp.y > Kc.F && cp.y < Kc.JT);
      const lh = 2 * 0.036 * Math.tan(camera.fov * Math.PI / 360);
      for (const sp of this.labels) {
        const id = sp.userData.id;
        // numbered labels follow the Labels toggle; iconography markers replace them while that layer is on
        let vis = sp.userData.ico ? !!s.ico : !!s.labels && !s.ico;
        if (vis && sp.userData.inside && !camInside && !s.section && !s.plan) vis = false;
        if (id === 15 && !s.scale) vis = false;
        if (vis && s.section && sp.position.z > 0.05) vis = false;
        if (vis && s.plan && !sp.userData.inside && sp.position.y > this.K.F + 1.2) vis = false;
        const dist = camera.position.distanceTo(sp.position);
        if (dist < 1.5) vis = false;
        sp.scale.set(lh * sp.userData.aspect, lh, 1);
        if (vis && doOcc) sp.userData.occ = this.occluded(sp.position, camera.position, dist);
        if (sp.userData.occ) vis = false;
        sp.visible = vis;
      }
      // keep labels from overlapping: shift a later label down by whole label heights until it fits
      {
        const Wd = renderer.domElement.clientWidth || 1, Ht = renderer.domElement.clientHeight || 1;
        const hpx = 0.036 * Ht, placed = [];
        const lpa = leadGeo.attributes.position, dpa = dotGeo.attributes.position;
        let nLead = 0;
        // overlay boxes at the top of the view (layer note at left, iconography key at right) are obstacles:
        // a label under one slides sideways clear of it, with a leader back to its point
        const obst = [];
        if (this.wrap) {
          const cr = renderer.domElement.getBoundingClientRect(), k = cr.width / Wd || 1;
          for (const el of this.wrap.children) {
            if (el.tagName !== 'DIV' || el.style.top !== '12px') continue;
            const nr = el.getBoundingClientRect();
            obst.push([(nr.left - cr.left) / k - 6, (nr.top - cr.top) / k - 6, (nr.right - cr.left) / k + 6, (nr.bottom - cr.top) / k + 6]);
          }
        }
        for (const sp of this.labels) {
          sp.center.y = 0.5; sp.center.x = 0; sp.userData.rect = null;
          if (!sp.visible) continue;
          tmp.copy(sp.position).project(camera);
          if (tmp.z > 1) { sp.visible = false; continue; }
          const x = (tmp.x * 0.5 + 0.5) * Wd, y = (-tmp.y * 0.5 + 0.5) * Ht, wpx = hpx * sp.userData.aspect;
          let shift = 0;
          for (const k of [0, 1, -1, 2, -2, 3]) {
            const top = y - hpx / 2 + k * hpx * 1.1;
            if (!placed.some((r) => x < r[2] && x + wpx > r[0] && top < r[3] && top + hpx > r[1])) { shift = k; break; }
            shift = k;
          }
          const top = y - hpx / 2 + shift * hpx * 1.1;
          let dx = 0;
          for (const r of obst) {
            if (!(x + dx < r[2] && x + dx + wpx > r[0] && top < r[3] && top + hpx > r[1])) continue;
            const right = r[2] - x, left = r[0] - wpx - x;
            dx = x + right + wpx <= Wd ? right : x + left >= 0 ? left : right;
          }
          placed.push([x + dx, top, x + dx + wpx, top + hpx]);
          sp.userData.rect = [x + dx, top, x + dx + wpx, top + hpx];
          sp.center.y = 0.5 + shift * 1.1;
          if (dx !== 0) {
            // horizontal leader from the true anchor to the near end of the label, now clear of the overlay
            sp.center.x = -dx / wpx;
            tmp2.set(((dx > 0 ? x + dx : x + dx + wpx) / Wd) * 2 - 1, -(((top + hpx / 2) / Ht) * 2 - 1), tmp.z).unproject(camera);
            lpa.setXYZ(nLead * 2, sp.position.x, sp.position.y, sp.position.z);
            lpa.setXYZ(nLead * 2 + 1, tmp2.x, tmp2.y, tmp2.z);
            dpa.setXYZ(nLead, sp.position.x, sp.position.y, sp.position.z);
            nLead++;
          } else if (shift !== 0) {
            // vertical leader from the true anchor to the edge of the moved label, under its number disc
            const ye = shift > 0 ? top : top + hpx;
            tmp2.set(((x + 0.5 * hpx) / Wd) * 2 - 1, -((ye / Ht) * 2 - 1), tmp.z).unproject(camera);
            lpa.setXYZ(nLead * 2, sp.position.x, sp.position.y, sp.position.z);
            lpa.setXYZ(nLead * 2 + 1, tmp2.x, tmp2.y, tmp2.z);
            dpa.setXYZ(nLead, sp.position.x, sp.position.y, sp.position.z);
            nLead++;
          }
        }
        lpa.needsUpdate = true; dpa.needsUpdate = true;
        leadGeo.setDrawRange(0, nLead * 2); dotGeo.setDrawRange(0, nLead);
      }
      hudT += dt;
      if (hudT > 0.5) {
        hudT = 0;
        let hud;
        if (s.mode === 'walk') {
          const w = this.walkPos;
          const where = w.y > this.K.F - 0.3 ? 'temple floor' : (w.y > this.K.J - 0.3 && w.y < this.K.J + 0.3 ? 'terrace' : (w.y < 0.3 ? 'ground' : 'stair'));
          hud = 'Walk · eye 1.6 m · pace 1.4 m/s · on the ' + where + ' (' + this.fmtLen(w.y) + ' above ground)\nClick the view, then use WASD or the arrow keys, or the pad';
        } else {
          hud = (s.section ? 'Long section on the axis · ' : '') + (s.plan ? 'Plan cut 1.2 m above the floor · ' : '') + 'camera ' + this.fmtLen(Math.max(0, camera.position.y)) + ' above ground';
        }
        if (hud !== this.state.hud) this.setState({ hud: hud });
      }
      renderer.render(scene, camera);
      this.raf = requestAnimationFrame(tick);
    };
    tick();
    this.setState({ ready: true, spires: res.spires, figs: res.figs });
  }

  occluded(p, cam, dist) {
    const s = this.state, ray = this.ray, bx = this.box3, hv = this.hitV;
    ray.origin.copy(cam);
    ray.direction.subVectors(p, cam).normalize();
    const lim = dist - 0.4, yCut = this.K.F + 1.2;
    for (const b of this.occBoxes) {
      let x0 = b[0], y0 = b[1], z0 = b[2], x1 = b[3], y1 = b[4], z1 = b[5];
      if (s.section) z1 = Math.min(z1, 0.05);
      if (s.plan) y1 = Math.min(y1, yCut);
      if (z1 <= z0 || y1 <= y0) continue;
      if (p.x > x0 && p.x < x1 && p.y > y0 && p.y < y1 && p.z > z0 && p.z < z1) continue;
      bx.min.set(x0, y0, z0); bx.max.set(x1, y1, z1);
      if (ray.intersectBox(bx, hv) && hv.distanceTo(cam) < lim) return true;
    }
    return false;
  }

  applyLook() {
    const T = this.T, plain = this.state.look === 'plain';
    const pal = plain ? this.PAL_PLAIN : this.PAL_REAL;
    const c = new T.Color();
    for (const set of this.instSets) {
      const icoOn = !!this.state.ico && set === this.figSet;
      for (let i = 0; i < set.idx.length; i++) {
        if (icoOn) c.setHex(this.ICOCOL[this.figCat[i]] || pal[set.idx[i]]);
        else {
          c.setHex(pal[set.idx[i]]);
          if (!plain && set.idx[i] !== 3) c.offsetHSL(0, set.jit[i][0], set.jit[i][1]);
        }
        set.mesh.setColorAt(i, c);
      }
      set.mesh.instanceColor.needsUpdate = true;
    }
    this.uTex.value = plain ? 0 : 1;
    if (this.spireMat) this.spireMat.color.setHex(plain ? 0xd9d4ca : 0xd2aa80);
    this.sky.visible = !plain;
    this.trees.visible = !plain;
    this.groundMat.color.setHex(plain ? 0xcfcdc4 : 0x8a7f55);
    this.scene.background = plain ? new T.Color(0xe4e8ea) : null;
  }

  applyClip() {
    const s = this.state;
    const planes = [];
    if (s.section) planes.push(this.secPlane);
    if (s.plan) planes.push(this.planPlane);
    const cut = planes.length > 0;
    this.cutOn = cut;
    this.uCut.value = 0;
    if (this.secCap) { this.secCap.visible = !!s.section; this.planCap.visible = !!s.plan && !s.section; }
    for (const m of this.mats) {
      m.clippingPlanes = planes;
      m.clipShadows = true;
      m.side = m.userData.keepDouble ? this.T.DoubleSide : this.T.FrontSide;
      m.shadowSide = this.T.FrontSide;
      m.needsUpdate = true;
    }
  }

  applyLayers() {
    this.people.visible = !!this.state.inUse;
    this.scaleFig.visible = !!this.state.scale;
  }

  updateSun() {
    const p = this.sunPos(this.state.hour, this.state.date);
    const d = p.dir;
    const tgt = this.sun.target.position;
    this.sun.position.set(tgt.x + d[0] * 160, tgt.y + d[1] * 160, tgt.z + d[2] * 160);
    const el = p.el * 180 / Math.PI;
    const up = Math.max(0, Math.min(1, Math.sin(p.el) * 3));
    this.sun.intensity = el > 0 ? 3.6 * up : 0;
    this.sun.color.setHSL(0.09, 0.6 * (1 - up) + 0.2, 0.75 + 0.15 * up);
    this.hemi.intensity = 0.1 + 0.3 * Math.max(0, Math.min(1, Math.sin(p.el) * 2 + 0.2)) + (this.cutOn ? 0.5 : 0);
    if (this.sky) {
      const u = this.sky.material.uniforms;
      u.top.value.setHSL(0.58, 0.45, 0.25 + 0.35 * up);
      u.bot.value.setHSL(0.08, 0.35 + 0.3 * (1 - up), 0.55 + 0.3 * up);
    }
    if (this.pmrem && this.envScene) {
      if (this.envRT) this.envRT.dispose();
      this.envRT = this.pmrem.fromScene(this.envScene, 0.04, 0.1, 200);
      this.scene.environment = this.state.look === 'plain' ? null : this.envRT.texture;
    }
    const az = p.az * 180 / Math.PI;
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const lab = dirs[Math.round(az / 22.5) % 16];
    const txt = el > 0 ? 'Sun ' + el.toFixed(0) + '° high, bearing ' + az.toFixed(0) + '° (' + lab + '), for 24.85° N' : 'Sun below the horizon';
    if (txt !== this.state.sunText) this.setState({ sunText: txt });
  }

  goView(id) {
    const v = this.VIEWS.find((x) => x.id === id);
    if (!v) return;
    if (id === 'walk') {
      this.keys = {};
      this.setState({ view: id, mode: 'walk' });
      if (this.canvasEl) this.canvasEl.focus({ preventScroll: true });
      return;
    }
    const patch = { view: id, mode: 'orbit' };
    if (id === 'section') { patch.section = true; patch.plan = false; }
    else if (id === 'plancut') { patch.plan = true; patch.section = false; }
    else { patch.section = false; patch.plan = false; }
    if (this.ctl) {
      let th = v.th;
      while (th - this.ctl.th > Math.PI) th -= Math.PI * 2;
      while (th - this.ctl.th < -Math.PI) th += Math.PI * 2;
      this.goal = { th: th, ph: v.ph, r: v.r, tx: v.t[0], ty: v.t[1], tz: v.t[2] };
    }
    this.setState(patch);
  }

  renderVals() {
    const s = this.state || {};
    const K = this.K, f = (m) => this.fmtLen(m);
    const PXA = K.L / 525, PXZ = K.HW / 147;
    const tagCls = (t) => 'tag t-' + t;
    const views = this.VIEWS.map((v) => ({ label: v.label, cls: s.view === v.id ? 'vbtn on' : 'vbtn', pick: () => this.goView(v.id) }));
    const tg = (label, key, on, flip) => ({ label: label, cls: on ? 'vbtn on' : 'vbtn', pressed: on ? 'true' : 'false', flip: flip || (() => this.setState({ [key]: !s[key] })) });
    const toggles = [
      tg('Section cut', 'section', !!s.section),
      tg('Plan cut 1.2 m', 'plan', !!s.plan),
      tg('Labels', 'labels', !!s.labels),
      tg('Scale figure', 'scale', !!s.scale),
      tg('As built', 'asBuilt', !!s.asBuilt),
      tg('In use', 'inUse', !!s.inUse),
      tg('Period colour', 'colour', !!s.colour),
      tg('Iconography', 'ico', !!s.ico),
      tg(s.look === 'plain' ? 'Look: plain' : 'Look: realistic', 'look', s.look === 'plain', () => this.setState({ look: s.look === 'plain' ? 'real' : 'plain' })),
      tg(s.units === 'ft' ? 'Units: imperial' : 'Units: metric', 'units', s.units === 'ft', () => this.setState({ units: s.units === 'ft' ? 'm' : 'ft' }))
    ];
    const notes = [];
    if (s.asBuilt) notes.push('AS BUILT: none of the sources checked records a lost structural part of the Kandariya itself, so nothing is added.');
    if (s.colour) notes.push('PERIOD COLOUR: no paint or plaster is recorded for this temple in the sources checked, so the stone stays unpainted.');
    if (s.ico) notes.push('ICONOGRAPHY: colours show where each kind of figure is recorded; the figures themselves are generic shapes. Numbered labels are hidden while this layer is on. Click a lettered marker for its sources.');
    if (s.inUse) notes.push('IN USE: people are ILLUSTRATIVE. Devotees walk round keeping the sanctum on their right (pradakṣiṇā, clockwise: COMPARATIVE [7]). The priest at the liṅga with water, flowers and a lamp is ILLUSTRATIVE.');
    const tabs = [['facts', 'Facts'], ['disc', 'Discrepancies'], ['elems', 'Model elements'], ['ico', 'Iconography'], ['labels', 'Labels and layers'], ['sources', 'Sources']].map((t) => ({ label: t[1], cls: s.tab === t[0] ? 'tab on' : 'tab', sel: s.tab === t[0] ? 'true' : 'false', pick: () => this.setState({ tab: t[0] }) }));
    const F = (k, v, tag, src) => ({ k: k, v: v, tag: tag, cls: tagCls(tag), src: src });
    const facts = [
      F('Date', 'Krishna Deva (ASI) assigns it, as a plausible inference, to the latter part of the Chandela king Vidyādhara\'s reign, c. 1025–50 CE. The ASI\'s website attributes it to king Gaṇḍa.', 'DOCUMENTED', '[2] [5]'),
      F('Deity and image', 'Śiva. A marble liṅga stands in the sanctum.', 'DOCUMENTED', '[1]'),
      F('Length, external', f(109 * K.FT) + ' (109 ft).', 'MEASURED', '[1]'),
      F('Width, external', 'About ' + f(59.5 * K.FT) + ' (59½ ft) in Cunningham; Fergusson and Shukla give 60 ft, which the model uses.', 'MEASURED', '[1] [3] [4]'),
      F('Height above ground', f(K.HTOP) + ' (116½ ft).', 'MEASURED', '[1]'),
      F('Height above its own floor', f(88 * K.FT) + ' (88 ft).', 'MEASURED', '[1]'),
      F('Floor level above ground', f(K.F) + ' (116½ − 88 = 28½ ft), worked out from the two heights above.', 'MEASURED', '[1]'),
      F('Terrace (jagati) and base', 'It stands on a high terrace and has the loftiest moulded basement of all the Khajuraho temples. The sources checked give no terrace height: the model uses ' + f(K.J) + ' for the terrace and the rest of the rise for the base.', 'ESTIMATED', '[2]'),
      F('Orientation', 'The halls and sanctum lie on one east–west axis. The sources checked do not say which end holds the entrance; the model puts it at the east.', 'ESTIMATED', '[2]'),
      F('Spires', 'The grand śikhara is decorated with an ascending series of 84 smaller replicas of itself. Model: 1 main spire plus ' + ((s.spires || 85) - 1) + ' smaller ones; their grouping and the curve of the tower are estimated.', 'DOCUMENTED', '[2]'),
      F('Roofs', 'Each part has its own pinnacled roof, rising in regular gradation from the low pyramid of the entrance to the lofty spire of the sanctum.', 'DOCUMENTED', '[1]'),
      F('Plan', 'Porch, hall, great hall with transepts, vestibule and sanctum, with a passage round the sanctum lit by three open porticoes at the back and sides: a large double cross.', 'DOCUMENTED', '[1] [3]'),
      F('Ground plan used', "Cunningham's survey plan as published by Fergusson (1910), fig. 342, 50 ft to 1 in. Walls, openings and pillar positions in the model are scaled from it.", 'MEASURED', '[4]'),
      F('Sanctum cell', 'About ' + f(2 * 21.5 * PXZ) + ' wide by ' + f(58 * PXA) + ' long, read from the plan. The east doorway, frame included, is about ' + f(2 * 18.5 * PXZ) + ' wide.', 'ESTIMATED', '[4]'),
      F('Ambulatory', 'A narrow passage, ' + f(0.6) + '–' + f(1.0) + ' wide, between the stepped sanctum wall and outer walls about ' + f(30.5 * PXZ) + ' thick, read from the plan.', 'ESTIMATED', '[4]'),
      F('Great hall', 'Interior about ' + f(2 * 63.5 * PXZ) + ' wide by ' + f(90 * PXA) + ' long, read from the plan. Cunningham describes four central pillars; the plan also shows two in each transept window.', 'DOCUMENTED', '[1] [4]'),
      F('Halls', 'The halls are enclosed by sloping balustrades (kakṣāsana).', 'DOCUMENTED', '[2]'),
      F('Makara-toraṇas', 'Kandariya is the only temple at Khajuraho with two makara-toraṇas.', 'DOCUMENTED', '[2]'),
      F('Wall sculpture', 'Three sculptural bands run round the walls: gods and goddesses, mithunas and surasundarīs on the projections; vyālas and nāgīs in the recesses.', 'DOCUMENTED', '[1] [2]'),
      F('Erotic groups', 'The principal groups are in the recesses between the pillars of the transept and the sanctum.', 'DOCUMENTED', '[1]'),
      F('Basement niches', 'The Seven Mothers, with Gaṇeśa at one end and Vīrabhadra at the other; at Khajuraho found only here and at the Viśvanātha.', 'DOCUMENTED', '[2]'),
      F('Processional friezes', 'Two rows in the basement mouldings: elephants and horses, warriors, hunters, acrobats, musicians, dancers, devotees and erotic couples.', 'DOCUMENTED', '[2]'),
      F('Sanctum doorway', 'Over the centre of the entrance to the sanctum: a small figure of Śiva, with Brahmā and Viṣṇu to the right and left.', 'DOCUMENTED', '[1]'),
      F('Sculpture count', 'Cunningham counted 226 statues inside and 646 outside, 872 in all. This model shows ' + (s.figs || 0) + ' schematic blocks, not a figure-by-figure count.', 'DOCUMENTED', '[1]'),
      F('Material', 'Fine-grained sandstone in shades of buff, pink or pale yellow.', 'DOCUMENTED', '[2]'),
      F('Terrace projections', 'The terrace projects on the sides and the rear to match the transepts; it is the only temple at Khajuraho whose platform does this.', 'DOCUMENTED', '[2]'),
      F('Shared terrace', 'It shares its platform with a small ruined Śiva temple (the Mahādeva) and the Devī Jagadambī temple. Neither is modelled.', 'DOCUMENTED', '[2]'),
      F('Site', 'About 24.85° N, 79.92° E. The sun model uses this latitude.', 'DOCUMENTED', '[6]')
    ];
    const disc = [
      { k: 'Width', v: 'About 59½ ft (Cunningham) [1]; 60 ft (Fergusson, Shukla) [3][4].', used: '60 ft. The half-foot is within the precision of the published plan.' },
      { k: 'Date and builder', v: 'Krishna Deva: probably late in Vidyādhara\'s reign, c. 1025–50 [2]. The ASI\'s website: king Gaṇḍa [5].', used: 'Both are shown. The model is one phase, so the dating does not change the geometry.' },
      { k: 'Drawing against stated size', v: 'Scaled so its length is 109 ft, the plan [4] gives a width of 61 ft, against the stated 60 ft [3]: a 1.7% difference.', used: 'Each axis is scaled to its own measured figure: length to 109 ft, width to 60 ft.' },
      { k: 'Spire count', v: '84 smaller replicas round the grand śikhara [2].', used: '84 smaller spires plus the main one, 85 peaks in all. Their grouping is estimated.' },
      { k: 'Hall pillars', v: 'Cunningham describes four central pillars [1].', used: 'As drawn on the plan [4]: four central pillars and two in each transept window, with pilasters at the window jambs.' },
      { k: 'Second makara-toraṇa', v: 'Two are recorded [2]; the sources checked do not say where the second stands.', used: 'At the entrance to the great hall (ESTIMATED).' }
    ];
    const E = (k, tags, v) => ({ k: k, tags: tags.map((t) => ({ t: t, cls: tagCls(t) })), v: v });
    const elems = [
      E('Overall envelope', ['MEASURED'], f(109 * K.FT) + ' × ' + f(60 * K.FT) + ', ' + f(K.HTOP) + ' high to the finial [1][3].'),
      E('Ground plan', ['MEASURED'], "Walls, openings, cell, ambulatory, hall, transepts, porch and pillar positions are scaled from Cunningham's plan [4]. Readings are to about one pixel, which is 6 cm on the ground."),
      E('Moulded base outline', ['MEASURED', 'ESTIMATED'], 'The stepped outline is read from the plan [4]. The profile, which steps in from that outline to the wall line, is estimated.'),
      E('Wall and ceiling heights', ['ESTIMATED'], 'Walls ' + f(5.6) + ' high. Ceilings range from ' + f(4.2) + ' in the porch to ' + f(5.4) + ' in the great hall.'),
      E('Terrace (jagati)', ['DOCUMENTED', 'ESTIMATED'], 'The side and rear projections are documented [2]. Its height and outline are estimated, and it is cut short where it continues to the neighbouring shrines.'),
      E('Stairs', ['ESTIMATED'], 'Step counts and riser heights are estimated.'),
      E('Basement mouldings', ['DOCUMENTED', 'ESTIMATED'], 'The two processional friezes are documented [2]. The moulding profile is schematic.'),
      E('Balconies', ['DOCUMENTED', 'ESTIMATED'], 'The pillared balconies of the nave, transept and sanctum are documented [1], with sloping balustrades [2]. Their sizes, seats and eaves are estimated.'),
      E('Great-hall pillars and ceiling', ['MEASURED', 'DOCUMENTED', 'ESTIMATED'], 'Pillar positions are from the plan [4]; four central pillars are documented [1]. The ceiling is estimated.'),
      E('Vestibule pillars and roof', ['MEASURED', 'ESTIMATED'], 'Two pillars, as shown on the plan [4]. Their form and the roof are estimated.'),
      E('Liṅga', ['DOCUMENTED', 'ESTIMATED'], 'A marble liṅga [1]. Its size and pedestal are estimated; it is drawn as a plain shape.'),
      E('Hall roofs', ['DOCUMENTED', 'ESTIMATED'], 'Each part has its own roof, rising in gradation to the spire [1]. Their heights are estimated.'),
      E('Śikhara', ['MEASURED', 'DOCUMENTED', 'ESTIMATED'], 'The height is measured [1]. The 84 smaller replicas are documented [2]. How they are grouped, and the curve of the profile, are estimated.'),
      E('Spire surface lattice (jāla)', ['COMPARATIVE'], 'A mesh of small arch motifs, the usual surface of a Nagara spire. It is drawn as a pattern, not carved.'),
      E('Wall projections', ['ESTIMATED'], 'The pier rhythm and the 0.28 m projection depth are estimated.'),
      E('Wall sculpture', ['DOCUMENTED', 'ESTIMATED'], 'The three bands are documented [1][2]. Each figure is a generic standing form in a niche, not a copy of a particular carving.'),
      E('Makara-toraṇas', ['DOCUMENTED', 'COMPARATIVE', 'ESTIMATED'], 'Two are documented [2]. Both are simplified; the second copies the first (COMPARATIVE), and its position at the great-hall entrance is ESTIMATED.'),
      E('Iconography layer', ['DOCUMENTED', 'ESTIMATED'], 'Colours each wall figure by the kind of figure recorded for its zone: projections, recesses, the stretch between transept and sanctum, and the basement niches [1][2]. Which modelled figure falls in which zone depends on the estimated bays. See the Iconography tab.'),
      E('Sanctum doorway', ['DOCUMENTED', 'ESTIMATED'], 'Śiva with Brahmā and Viṣṇu over the entrance is documented [1]. The frame is drawn as three steps.'),
      E('Textures and colours', ['ILLUSTRATIVE'], 'Generated sandstone tones follow the documented buff, pink and pale-yellow stone [2]. They are not taken from photographs.'),
      E('Ground and trees', ['ILLUSTRATIVE'], 'Generic, with no species identified. Present-day lawns are not shown.'),
      E('People, dress, offerings', ['ILLUSTRATIVE', 'COMPARATIVE'], 'The figures are illustrative. Walking round with the sanctum on the right (pradakṣiṇā) is comparative [7].'),
      E('Scale figure', ['ILLUSTRATIVE'], 'A person 1.70 m tall, standing by the terrace stair.')
    ];
    const legend = (this.labelDefs || [
      [1, 'Jagati (terrace)'], [2, 'Entrance stair'], [3, 'Ardhamandapa (porch)'], [4, 'Mandapa (hall)'], [5, 'Mahamandapa (great hall)'], [6, 'Transept balcony'], [7, 'Antarala (vestibule)'], [8, 'Garbhagriha and liṅga'], [9, 'Pradakṣiṇā-patha (ambulatory)'], [10, 'Shikhara and its 84 smaller replicas'], [11, 'Urushringa'], [12, 'Adhiṣṭhāna (moulded base)'], [13, 'Rear balcony'], [14, 'Makara-toraṇa'], [15, 'Scale figure, 1.70 m']
    ]).map((d) => ({ n: d[0], t: d[1] }));
    const sources = [
      [1, 'A. Cunningham, Four Reports Made during the Years 1862-63-64-65, Archaeological Survey of India Reports vol. II (1871), pp. 419–420, and plate XCVII', 'https://archive.org/details/india.history.resource.87434'],
      [2, 'Krishna Deva, Khajuraho (Archaeological Survey of India, World Heritage Series)', 'https://archive.org/details/khajuraho00kris'],
      [3, 'D. N. Shukla, Vāstu-Śāstra (1960): dimensions and the double-cross plan, quoted from an earlier survey', 'https://www.wisdomlib.org/hinduism/book/vastu-shastra-5-temple-architecture/d/doc1112606.html'],
      [4, 'J. Fergusson, History of Indian and Eastern Architecture (1910), fig. 342: "Plan of Kandarya Mahâdeva, Khajurâho (from a plan by Gen. Cunningham), scale 50 ft to 1 in", public domain', 'https://commons.wikimedia.org/wiki/File:1910_sketch_of_plan,_Kandariya_Mahadeva_Temple,_Khajuraho.jpg'],
      [5, 'Archaeological Survey of India, "World Heritage Sites: Khajuraho"', 'https://asi.nic.in/pages/WorldHeritageKhajuraho'],
      [6, 'UNESCO World Heritage List no. 240, Khajuraho Group of Monuments (coordinates of the Western Group)', 'https://whc.unesco.org/en/list/240/maps'],
      [7, 'Encyclopaedia Britannica, "pradakshina"', 'https://www.britannica.com/topic/pradakshina']
    ].map((x) => ({ n: x[0], t: x[1], url: x[2] }));
    const css = (n) => '#' + n.toString(16).padStart(6, '0');
    const icoItems = this.ICO.map((it) => ({
      key: it.key, title: it.title, text: it.text, model: it.model, src: it.src,
      tags: it.tags.map((t) => ({ t: t, cls: tagCls(t) })),
      dot: 'display: inline-flex; width: 26px; height: 26px; flex: 0 0 26px; border-radius: 50%; color: #fff; align-items: center; justify-content: center; font: 700 13px Inter, system-ui, sans-serif; background: ' + css(this.ICOCOL[it.cat]),
      box: s.icoSel === it.key ? 'display: flex; flex-direction: column; gap: 5px; padding: 10px; border-radius: 10px; background: #f5e9d6; border: 1px solid #d9b98d' : 'display: flex; flex-direction: column; gap: 5px; padding: 10px; border-radius: 10px; border: 1px solid #efe5d6'
    }));
    const icoSelItem = icoItems.find((it) => it.key === s.icoSel) || null;
    const icoKey = [['proj', 'Projections: deities, mithunas, surasundarīs'], ['rec', 'Recesses: vyālas, nāgīs'], ['jun', 'Transept–sanctum recesses: erotic groups'], ['mat', 'Basement niches: Mothers, Gaṇeśa, Vīrabhadra'], ['int', 'Not identified']]
      .map((k) => ({ t: k[1], sw: 'display: inline-block; width: 12px; height: 12px; flex: 0 0 12px; border-radius: 3px; background: ' + css(this.ICOCOL[k[0]]) }));
    const hr = Math.floor(s.hour || 9), mn = Math.round(((s.hour || 9) - hr) * 60);
    const walkPad = (fv, tv) => () => { this.pad.f = fv; this.pad.t = tv; };
    return {
      views: views, toggles: toggles, tabs: tabs, facts: facts, disc: disc, elems: elems, legend: legend, sources: sources,
      tabIco: s.tab === 'ico', icoItems: icoItems, icoSel: icoSelItem, hasIcoSel: !!icoSelItem, showIco: !!s.ico, icoKey: icoKey,
      tabFacts: s.tab === 'facts', tabDisc: s.tab === 'disc', tabElems: s.tab === 'elems', tabLabels: s.tab === 'labels', tabSources: s.tab === 'sources',
      setWrap: this.setWrap, setCanvas: this.setCanvas,
      loading: !s.ready && !s.failed, failed: !!s.failed,
      hour: s.hour, hourText: (hr < 10 ? '0' : '') + hr + ':' + (mn < 10 ? '0' : '') + mn,
      date: s.date, sunText: s.sunText || '',
      setHour: (e) => this.setState({ hour: parseFloat(e.target.value) }),
      setDate: (e) => this.setState({ date: e.target.value }),
      hud: s.hud || 'Loading…',
      showNote: notes.length > 0, noteText: notes.join('\n\n'),
      walk: s.mode === 'walk', wheelNote: !!s.wheelNote,
      padF: walkPad(1, 0), padB: walkPad(-1, 0), padL: walkPad(0, 1), padR: walkPad(0, -1),
      padStop: () => { this.pad.f = 0; this.pad.t = 0; }
    };
  }
}

export function start(host) { return mount(host, MARKUP, Component); }
