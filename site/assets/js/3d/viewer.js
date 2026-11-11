// Talaash Heritage 3D model viewer (three.js, vendored; no CDN).
// A page supplies a build(api) function that adds meshes and labels; this file does
// the renderer, orbit and zoom (mouse and touch), labels with evidence tags, layer
// toggles and the no-WebGL fallback (the still image and the facts stay on the page).
import * as THREE from '../vendor/three/three.module.min.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

const TAGS = ['Measured', 'Documented', 'Comparative', 'Hypothetical', 'Reconstructed', 'Estimated', 'Illustrative'];

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

export function start(build) {
  const stage = document.getElementById('m3d-stage');
  if (!stage) return;
  if (!webglOK()) { stage.classList.add('no-webgl'); return; }

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'm3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D model. Drag to turn, pinch or scroll to zoom.');
  stage.insertBefore(renderer.domElement, stage.firstChild);
  stage.classList.add('webgl');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9e4da);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);

  scene.add(new THREE.HemisphereLight(0xfffaf0, 0x8a7f6c, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-40, 70, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -50; sc.right = 50; sc.top = 50; sc.bottom = -50; sc.near = 1; sc.far = 250;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = 'ground';
  scene.add(ground);

  const labelHost = stage.querySelector('.m3d-labels');
  const labels = [];
  const layers = {};

  const api = {
    THREE, scene,
    mat(color, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.92, metalness: 0 }, extra || {})); },
    add(mesh, layer) {
      mesh.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      (layer ? api.layer(layer) : scene).add(mesh);
      return mesh;
    },
    layer(name) {
      if (!layers[name]) { const g = new THREE.Group(); g.name = name; scene.add(g); layers[name] = g; }
      return layers[name];
    },
    label(text, tag, pos, layer) {
      if (!TAGS.includes(tag)) throw new Error('unknown evidence tag ' + tag);
      const el = document.createElement('div');
      el.className = 'm3d-label';
      el.innerHTML = '<span class="m3d-tag tag-' + tag.toLowerCase() + '">' + tag + '</span> ';
      el.appendChild(document.createTextNode(text));
      labelHost.appendChild(el);
      labels.push({ el, pos: new THREE.Vector3(pos[0], pos[1], pos[2]), layer });
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

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = view.minDistance || 3;
  controls.maxDistance = view.maxDistance || 200;
  controls.target.set(...view.target);
  if (stage.clientWidth / stage.clientHeight < 0.9) {
    // Narrow (phone) stage: step the camera back so the whole model fits.
    view.camera = view.camera.map((c, i) => view.target[i] + (c - view.target[i]) * 1.55);
  }
  camera.position.set(...view.camera);
  controls.update();

  // Layer toggles
  const bar = stage.parentElement.querySelector('.m3d-toggles');
  let showLabels = true;
  const mkBtn = (text, pressed, on) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'm3d-btn'; b.textContent = text;
    b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', () => { const v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); on(v); });
    bar.appendChild(b);
  };
  if (bar) {
    mkBtn('Labels', true, v => { showLabels = v; });
    (view.toggles || []).forEach(t => {
      const g = api.layer(t.layer);
      g.visible = t.on;
      mkBtn(t.text, t.on, v => { g.visible = v; if (t.hides) api.layer(t.hides).visible = !v; });
      if (t.hides) api.layer(t.hides).visible = !t.on;
    });
    const reset = document.createElement('button');
    reset.type = 'button'; reset.className = 'm3d-btn'; reset.textContent = 'Reset view';
    reset.addEventListener('click', () => { controls.target.set(...view.target); camera.position.set(...view.camera); controls.update(); });
    bar.appendChild(reset);
  }

  const v = new THREE.Vector3();
  // Labels are placed in priority order (the order the page adds them); a label that would
  // overlap one already shown, or fall outside the stage, is hidden until the view changes.
  function placeLabels() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const shown = [];
    const rc = stage.querySelector('.m3d-recon');
    const bottom = h - (rc ? rc.offsetHeight + 14 : 30);
    for (const L of labels) {
      const layerOn = !L.layer || (layers[L.layer] && layers[L.layer].visible);
      v.copy(L.pos).project(camera);
      let vis = showLabels && layerOn && v.z < 1 && v.z > -1;
      if (vis) {
        if (!L.w) { L.el.style.display = ''; L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; }
        let x = (v.x + 1) / 2 * w - L.w / 2, y = (1 - v.y) / 2 * h - L.h;
        if (x < 4) x = 4;
        if (x + L.w > w - 4) x = w - 4 - L.w;
        if (y < 36 || y + L.h > bottom || x < 0) vis = false;
        const r = { x, y, w: L.w, h: L.h };
        if (vis && shown.some(o => r.x < o.x + o.w + 3 && o.x < r.x + r.w + 3 && r.y < o.y + o.h + 2 && o.y < r.y + r.h + 2)) vis = false;
        if (vis) { shown.push(r); L.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; }
      }
      L.el.style.display = vis ? '' : 'none';
    }
  }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', () => { resize(); labels.forEach(L => { L.w = 0; }); });
  resize();

  (function loop() {
    controls.update();
    renderer.render(scene, camera);
    placeLabels();
    requestAnimationFrame(loop);
  })();
  stage.dataset.ready = '1';
}
