// Bhaja Cave 12 chaitya hall. Units: metres. z runs from the entrance (z = 0) to the back of the apse.
// Measured figures: J. Fergusson & J. Burgess, The Cave Temples of India (1880), pp. 224-225;
// Gazetteer of the Bombay Presidency, Poona (1885). Everything else is tagged Estimated or Hypothetical.
import { start } from './viewer.js';

const FT = 0.3048, IN = 0.0254;
const L = 59 * FT;                 // 17.98 length, front to back of apse (Measured)
const W = 26 * FT + 8 * IN;        // 8.13 width (Measured, F&B)
const H = 26 * FT + 5 * IN;        // 8.05 height to crown of vault (Measured)
const PH = 11 * FT + 4 * IN;       // 3.45 pillar height (Measured)
const RAKE = 5 * IN;               // 0.127 inward rake each side (Measured)
const NAVE_BASE = 16 * FT + 4 * IN, NAVE_TOP = 15 * FT + 6 * IN; // 4.98, 4.72 (Measured)
const LEDGE = 7 * FT + 5 * IN;     // 2.26 above pillar tops (Measured)
const PD = 0.5;                    // pillar diameter (Estimated)
const R = NAVE_TOP / 2;            // vault radius 2.36
const SPRING = H - R;              // vault springs here so the crown sits at the measured height
const AR = W / 2;                  // apse radius (outer)
const ZA = -(L - AR);              // centre of the apse

start(api => {
  const { THREE } = api;
  const rock = api.mat(0xb3a794), rockDark = api.mat(0x9c907e), teak = api.mat(0x6b4426), wood = api.mat(0x8a5a32, { transparent: true, opacity: 0.88 });
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const place = (o, x, y, z) => { o.position.set(x, y, z); return o; };

  // Floor and the rock mass beside and behind the hall (shown as a cut section).
  api.add(place(box(W + 3, 0.4, L + 1.5, rockDark), 0, -0.2, -L / 2 - 0.25));
  for (const s of [-1, 1]) {
    const layer = s > 0 ? 'shell-right' : null;
    api.add(place(box(1.5, H + 1.2, L - AR, rock), s * (W / 2 + 0.75), (H + 1.2) / 2, -(L - AR) / 2), layer);
    // aisle ceiling (Estimated) and the plain wall above the pillars up to the ledge
    api.add(place(box(W / 2 - NAVE_TOP / 2 - PD / 2, 0.25, L - AR), s * (W / 2 + NAVE_TOP / 2 + PD / 2) / 2, PH + 0.125, -(L - AR) / 2), layer).material = rock;
    api.add(place(box(0.45, SPRING - PH, L - AR, rock), s * (R + 0.225), PH + (SPRING - PH) / 2, -(L - AR) / 2), layer);
    api.add(place(box(1.0, SPRING - PH + 0.3, L - AR, rock), s * (W / 2 - 0.2), PH + (SPRING - PH) / 2, -(L - AR) / 2), layer);
  }
  // apse: outer wall, triforium ring and half-dome over the stupa
  const apseWall = new THREE.Mesh(new THREE.CylinderGeometry(AR + 0.75, AR + 0.75, H + 1.2, 48, 1, false, Math.PI / 2, Math.PI), rock);
  apseWall.material.side = THREE.DoubleSide;
  api.add(place(apseWall, 0, (H + 1.2) / 2, ZA));
  const tri = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.45, R + 0.45, SPRING - PH, 48, 1, false, Math.PI / 2, Math.PI), api.mat(0xb3a794, { side: THREE.DoubleSide }));
  api.add(place(tri, 0, PH + (SPRING - PH) / 2, ZA));

  // Barrel vault in two halves so the near half can be cut away.
  for (const s of [-1, 1]) {
    // Cylinder axis turned onto z; theta pi/2..pi is the upper right quarter, pi..3pi/2 the upper left.
    const g = new THREE.CylinderGeometry(R, R, L - AR, 40, 1, true, s > 0 ? Math.PI / 2 : Math.PI, Math.PI / 2);
    const vault = new THREE.Mesh(g, api.mat(0xbcb09c, { side: THREE.DoubleSide }));
    vault.rotation.x = Math.PI / 2;
    api.add(place(vault, 0, SPRING, -(L - AR) / 2), s > 0 ? 'shell-right' : null);
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 20, Math.PI, Math.PI, 0, Math.PI / 2), api.mat(0xbcb09c, { side: THREE.DoubleSide }));
  api.add(place(dome, 0, SPRING, ZA));
  // Rock above the vault (cut away with the near half).
  api.add(place(box(W + 3, 1.2, L + 1.5, rock), 0, H + 0.6, -L / 2 - 0.25), 'shell-right');

  // Teak ribs (Documented); spacing Estimated; the first four from the front are missing.
  const ribN = 18, ribStep = (L - AR - 0.6) / ribN;
  for (let i = 0; i < ribN; i++) {
    if (i < 4) continue;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(R - 0.08, 0.08, 6, 32, Math.PI), teak);
    api.add(place(rib, 0, SPRING, -0.3 - i * ribStep));
  }

  // 27 octagonal pillars raking inward: 11 a side, 5 round the apse (spacing Estimated).
  const pillar = (x, z, tiltX, tiltZ) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(PD / 2, PD / 2, PH, 8), api.mat(0xb0a592));
    p.position.set(x + tiltX / 2, PH / 2, z + tiltZ / 2);
    p.rotation.z = -Math.atan2(tiltX, PH);
    p.rotation.x = Math.atan2(tiltZ, PH);
    return p;
  };
  const baseX = NAVE_BASE / 2 + PD / 2;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 11; i++) {
      const z = -1.0 - i * ((L - AR - 1.0) / 10.5);
      api.add(pillar(s * baseX, z, -s * RAKE, 0), s > 0 ? 'pillars-right' : null);
    }
  }
  for (let k = 1; k <= 5; k++) {
    const a = Math.PI * k / 6; // 30..150 degrees round the back
    const x = Math.cos(a) * baseX, z = ZA - Math.sin(a) * baseX;
    const ix = -Math.cos(a) * RAKE, iz = Math.sin(a) * RAKE;
    api.add(pillar(x, z, ix, iz));
  }

  // Stupa: 11 ft across, drum 4 ft, dome 6 ft (Measured); box capital sizes Estimated.
  const sr = 11 * FT / 2, drumH = 4 * FT, domeH = 6 * FT;
  const stone = api.mat(0xd8ccb4);
  api.add(place(new THREE.Mesh(new THREE.CylinderGeometry(sr, sr, drumH, 48), stone), 0, drumH / 2, ZA));
  const domeM = new THREE.Mesh(new THREE.SphereGeometry(sr, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), stone);
  domeM.scale.y = domeH / sr; api.add(place(domeM, 0, drumH, ZA));
  const top = drumH + domeH;
  api.add(place(box(0.7, 0.35, 0.7, stone), 0, top + 0.15, ZA));
  api.add(place(box(1.0, 0.45, 1.0, stone), 0, top + 0.55, ZA));
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(7 * IN / 2, 7 * IN / 2, 0.02, 20), api.mat(0x1c1b19));
  api.add(place(hole, 0, top + 0.79, ZA));

  // Timber front (Hypothetical form; the four floor sockets, the arch mortices and ~170 pin holes are Documented).
  const front = 'timber';
  for (const x of [-2.9, -1.0, 1.0, 2.9]) api.add(place(box(0.28, SPRING + 0.4, 0.28, wood), x, (SPRING + 0.4) / 2, 0.1), front);
  api.add(place(box(W - 0.6, 0.3, 0.3, wood), 0, SPRING + 0.2, 0.1), front);
  api.add(place(box(W - 0.6, 0.25, 0.25, wood), 0, PH, 0.1), front);
  for (let i = -3; i <= 3; i++) api.add(place(box(0.08, R * 0.95 * Math.cos(Math.asin(Math.min(0.98, Math.abs(i) / 3.4))), 0.08, wood), i * 0.6, SPRING + 0.4 + R * 0.45, 0.15), front);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(R + 0.25, 0.22, 8, 40, Math.PI), api.mat(0xbcb09c));
  api.add(place(arch, 0, SPRING, 0.05));
  for (const x of [-2.9, -1.0, 1.0, 2.9]) api.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12), api.mat(0x2a2620)), x, 0.016, 0.1));

  api.add(api.person(0.6, -5.5, 0.4));

  // Labels with evidence tags (metric and imperial). Short on the model; the full figures are in the facts table.
  api.label('Height 8.05 m (26 ft 5 in)', 'Measured', [-0.6, H + 0.1, -5]);
  api.label('Stupa 3.35 m (11 ft) across', 'Measured', [0, drumH + domeH * 0.6, ZA + sr]);
  api.label('27 octagonal pillars, 3.45 m (11 ft 4 in)', 'Measured', [-baseX, PH + 0.2, -2]);
  api.label('Length 18.0 m (59 ft)', 'Measured', [-W / 2, 0.3, -L / 2]);
  api.label('Width 8.13 m (26 ft 8 in)', 'Measured', [0, 0.2, 1.2]);
  api.label('Teak ribs; first four lost by 1880', 'Documented', [0.8, H - 0.2, -9]);
  api.label('Wooden front', 'Hypothetical', [-2.6, SPRING + 1.6, 0.3], front);
  api.label('Ledge 2.26 m (7 ft 5 in) above pillars', 'Measured', [-R - 0.2, SPRING, -11]);
  api.label('Nave 4.98 m (16 ft 4 in) at the base', 'Measured', [0, 0.9, -3.5]);
  api.label('Aisle 1.04 m (3 ft 5 in)', 'Measured', [-(W / 2 - 0.5), 1.8, -8]);
  api.label('Floor sockets for the front', 'Documented', [1.0, 0.25, 0.6]);
  api.label('Box on the stupa: sizes', 'Estimated', [0.6, top + 0.9, ZA]);
  api.label('Pillar spacing', 'Estimated', [-baseX, 0.8, -10]);
  api.label('Person 1.7 m (5 ft 7 in)', 'Illustrative', [0.6, 1.9, -5.5]);

  return {
    target: [0, 2.6, -10], camera: [15, 14, 2.5], sun: [45, 60, 10],
    phone: { target: [0, 2.4, -9.5], camera: [12, 15, 5] }, minDistance: 4, maxDistance: 70,
    toggles: [
      { text: 'Cutaway', layer: 'cut', on: true, hides: 'shell-right' },
      { text: 'Timber front (hypothetical)', layer: front, on: true },
    ],
  };
});
