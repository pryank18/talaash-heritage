// Kandariya Mahadeva temple, Khajuraho. Units: metres. x runs along the axis, entrance (east) at +x.
// Measured: A. Cunningham, ASI Reports vol. II (1871), p. 419: 109 ft long, about 59 1/2 ft wide,
// 116 1/2 ft above the ground, 88 ft above its own floor. Plan order after Cunningham's plan
// (J. Fergusson 1910, fig. 342). Everything else is tagged Estimated.
import { start } from './viewer.js';

const FT = 0.3048;
const LEN = 109 * FT;              // 33.22 (Measured)
const WID = 59.5 * FT;             // 18.14 (Measured; Fergusson gives 60 ft)
const TOP = 116.5 * FT;            // 35.51 above ground (Measured)
const FLOOR = TOP - 88 * FT;       // 8.69: floor above ground (difference of two measured heights)
const WALL = 7.5;                  // wall height above the floor (Estimated)

start(api => {
  const { THREE } = api;
  const stone = api.mat(0xd9b98c), stoneDark = api.mat(0xc7a172), terrace = api.mat(0xbfae94), dark = api.mat(0x6b5a45);
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || stone);
  const place = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const X0 = LEN / 2;              // east end
  const F = FLOOR;

  // Terrace and moulded base (split between the two is Estimated; total height Measured).
  const TER = 3.6;
  api.add(place(box(LEN + 14, TER, WID + 12, terrace), -1, TER / 2, 0));
  const steps = 10;
  for (let i = 0; i < steps; i++) api.add(place(box(1.0, (i + 1) * (F - TER) / steps, 4.2, stoneDark), X0 + 3.6 - i * 0.55, TER + (i + 1) * (F - TER) / steps / 2, 0));
  for (let i = 0; i < 8; i++) api.add(place(box(1.4, (i + 1) * TER / 8, 5.2, terrace), X0 + 12 - i * 1.0, (i + 1) * TER / 16, 0));

  // Chambers along the axis, east to west: [name, x from, x to, width]. Proportions Estimated.
  const parts = [
    ['portico', X0, X0 - 4.4, 6.4],
    ['hall', X0 - 4.4, X0 - 10.6, 9.6],
    ['great hall', X0 - 10.6, X0 - 18.6, 12.4],
    ['vestibule', X0 - 18.6, X0 - 20.6, 9.0],
    ['sanctum block', X0 - 20.6, -X0, 13.6],
  ];
  // Moulded base under the whole plan, up to the floor.
  for (const [, a, b, w] of parts) api.add(place(box(a - b, F - TER, w + 1.2, stoneDark), (a + b) / 2, TER + (F - TER) / 2, 0));
  // Transepts: one pair on the great hall, one pair on the ambulatory, plus the rear one (the "double cross").
  const gx = X0 - 14.6, sx = X0 - 26.9;
  for (const s of [-1, 1]) {
    api.add(place(box(4.6, F - TER, WID / 2 - 5.6, stoneDark), gx, TER + (F - TER) / 2, s * (5.6 + (WID / 2 - 5.6) / 2)));
    api.add(place(box(4.2, F - TER, WID / 2 - 6.8, stoneDark), sx, TER + (F - TER) / 2, s * (6.8 + (WID / 2 - 6.8) / 2)));
  }
  api.add(place(box(1.6, F - TER, 4.2, stoneDark), -X0 - 0.2, TER + (F - TER) / 2, 0));

  // Walls (open plan view when the roofs are hidden).
  const wallRing = (x, z, lx, lz, t) => {
    api.add(place(box(lx, WALL, t), x, F + WALL / 2, z - lz / 2 + t / 2));
    api.add(place(box(lx, WALL, t), x, F + WALL / 2, z + lz / 2 - t / 2));
    api.add(place(box(t, WALL, lz), x - lx / 2 + t / 2, F + WALL / 2, z));
  };
  wallRing(X0 - 7.5, 0, 6.2, 9.6, 0.9);
  wallRing(X0 - 14.6, 0, 8.0, 12.4, 1.2);
  wallRing(X0 - 27, 0, 12.8, 13.6, 1.9);   // ambulatory outer wall about 1.9 m thick (reading from the plan, Estimated)
  // sanctum cell: walls round a cell about 2.7 x 3.7 m (reading from the plan, Estimated)
  for (const s of [-1, 1]) api.add(place(box(1.1, WALL, 1.9, stoneDark), X0 - 25.3, F + WALL / 2, s * 2.0)); // door gap to the east
  api.add(place(box(1.1, WALL, 5.9, stoneDark), X0 - 29.5, F + WALL / 2, 0));
  for (const s of [-1, 1]) api.add(place(box(5.3, WALL, 1.1, stoneDark), X0 - 27.4, F + WALL / 2, s * 2.4));
  for (const s of [-1, 1]) {
    // balcony openings: low parapets with pillars on the transepts
    for (const [x, half] of [[gx, WID / 2], [sx, WID / 2]]) {
      api.add(place(box(4.0, 1.0, 0.4), x, F + 0.5, s * (half - 0.3)));
      for (const dx of [-1.6, 1.6]) api.add(place(box(0.45, WALL, 0.45), x + dx, F + WALL / 2, s * (half - 0.3)));
    }
  }
  for (const dz of [-2.6, 2.6]) api.add(place(box(0.5, WALL - 1, 0.5), X0 - 0.4, F + (WALL - 1) / 2, dz));
  // Liṅga in the sanctum as a plain labelled shape (no image).
  api.add(place(box(1.3, 0.35, 1.3, api.mat(0x8f7a5f)), X0 - 27.4, F + 0.18, 0), 'inside');
  api.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.9, 24), api.mat(0xf2efe8)), X0 - 27.4, F + 0.8, 0), 'inside');

  // Roofs (layer "roofs"): each part has its own roof, rising in steps to the tower over the sanctum.
  const R = 'roofs';
  const pyramid = (x, w, d, base, h, n) => {
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n;
      api.add(place(box(w * k, h / n * 0.8, d * k, i % 2 ? stone : stoneDark), x, base + h / n * (i + 0.4), 0), R);
    }
  };
  const roofBase = F + WALL;
  pyramid(X0 - 2.2, 4.4, 6.4, roofBase, 3.2, 6);
  pyramid(X0 - 7.5, 6.2, 9.6, roofBase, 6.0, 9);
  pyramid(X0 - 14.6, 8.0, 12.4, roofBase, 9.5, 12);
  // Tower: curved profile built from stacked courses. The number and grouping of the smaller
  // attached spires (uruśṛṅgas) are Estimated: they are not taken from a measured drawing.
  const tower = (cx, cz, half, h0, h1, sideTowers, layer) => {
    const n = 26;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const w = 2 * half * (1 - 0.72 * Math.pow(t, 1.35));
      const y = h0 + (h1 - h0) * t;
      const hh = (h1 - h0) / n * 0.86;
      api.add(place(box(w, hh, w, i % 2 ? stone : stoneDark), cx, y + hh / 2, cz), layer);
      api.add(place(box(w * 1.12, hh, w * 0.34, stone), cx, y + hh / 2, cz), layer);
      api.add(place(box(w * 0.34, hh, w * 1.12, stone), cx, y + hh / 2, cz), layer);
    }
    const wTop = 2 * half * 0.28;
    const am = new THREE.Mesh(new THREE.CylinderGeometry(wTop * 0.62, wTop * 0.62, wTop * 0.22, 28), stoneDark);
    api.add(place(am, cx, h1 + wTop * 0.11, cz), layer);
    const fin = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.01, 0), new THREE.Vector2(wTop * 0.28, 0.1), new THREE.Vector2(wTop * 0.18, wTop * 0.4), new THREE.Vector2(0.01, wTop * 0.62)], 20), stone);
    api.add(place(fin, cx, h1 + wTop * 0.22, cz), layer);
    if (sideTowers) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        tower(cx + dx * half * 0.78, cz + dz * half * 0.78, half * 0.42, h0, h0 + (h1 - h0) * 0.62, false, layer);
        tower(cx + dx * half * 0.62, cz + dz * half * 0.62, half * 0.32, h0 + (h1 - h0) * 0.3, h0 + (h1 - h0) * 0.78, false, layer);
      }
      for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) tower(cx + dx * half * 0.72, cz + dz * half * 0.72, half * 0.26, h0, h0 + (h1 - h0) * 0.42, false, layer);
    }
  };
  const towerTop = TOP - 2.6; // course top; amalaka and finial carry it to the measured 35.5 m
  tower(X0 - 27, 0, 6.6, roofBase, towerTop, true, R);
  tower(X0 - 19.6, 0, 3.4, roofBase, roofBase + 12, false, R);

  api.add(api.person(X0 + 9, 3.2, -0.6));
  api.add(api.person(X0 - 1.2, 2.0, -0.4)).position.y = F;

  // Labels.
  api.label('Marble liṅga in the sanctum (Cunningham)', 'Documented', [X0 - 27.4, F + 2.0, 0], 'inside');
  api.label('Length 33.2 m (109 ft)', 'Measured', [0, F + 0.4, WID / 2 + 1.2]);
  api.label('Width about 18.1 m (59½ ft); Fergusson gives 60 ft', 'Measured', [gx, F + 1.6, -WID / 2 - 0.4]);
  api.label('Top 35.5 m (116½ ft) above the ground', 'Measured', [X0 - 27, TOP + 0.6, 0], R);
  api.label('Floor 8.7 m (28½ ft) up; tower 26.8 m (88 ft) above it', 'Measured', [X0 - 1, F + 0.1, -4.4]);
  api.label('Terrace height and the base mouldings', 'Estimated', [X0 + 6, TER + 0.2, -WID / 2 - 3]);
  api.label('Portico, hall, great hall, vestibule, sanctum: plan after Cunningham', 'Documented', [X0 - 9, F + WALL + 7.5, 0], R);
  api.label('Sizes of each chamber, wall and roof heights', 'Estimated', [X0 - 7.5, roofBase + 1, 5.6], R);
  api.label('Two pairs of transepts with balconies: the "double cross" plan', 'Documented', [sx, F + 2.2, WID / 2 + 0.6]);
  api.label('Smaller spires: number and grouping', 'Estimated', [X0 - 22, roofBase + 13, 6.5], R);
  api.label('Amalaka and finial at the top', 'Estimated', [X0 - 27, TOP - 1.4, 2.4], R);
  api.label('Person 1.7 m (5 ft 7 in) for scale', 'Illustrative', [X0 + 9, 2.1, 3.2]);

  return {
    target: [-2, 15, 0], camera: [60, 30, 54], minDistance: 8, maxDistance: 140,
    toggles: [
      { text: 'Roofs and tower', layer: R, on: true, hides: 'inside' },
    ],
  };
});
