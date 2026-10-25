import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import gsap from 'gsap';
import type { Lang } from '../../lib/i18n';
import { timeline } from '../../data/timeline';
import { palette, type Palette, type Season } from './palette';
import { HOME_VIEW, ZONES, type ZoneId } from './zones';
import { createSequoia, SEQUOIA } from './sequoia';

export interface Part {
  group: THREE.Object3D;
  setPalette(p: Palette, night: boolean): void;
  update?(t: number, dt: number): void;
  // Objects that select a zone when clicked.
  picks?: { object: THREE.Object3D; zone: ZoneId }[];
}

export type PartBuilder = (p: Palette, ctx: { quality: 'high' | 'low'; night: boolean }) => Part;

export interface ValleyOptions {
  lang: Lang;
  quality: 'high' | 'low';
  season: Season;
  night: boolean;
  extraParts?: PartBuilder[];
}

export function createValley(canvas: HTMLCanvasElement, labelsEl: HTMLElement, opts: ValleyOptions) {
  const high = opts.quality === 'high';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, high ? 2 : 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const labelRenderer = new CSS2DRenderer({ element: labelsEl });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 800);
  camera.position.set(...HOME_VIEW.position);

  let season = opts.season;
  let night = opts.night;
  let pal = palette(season, night);

  scene.background = new THREE.Color(pal.sky);
  scene.fog = new THREE.Fog(pal.fog, 90, 260);

  const hemi = new THREE.HemisphereLight(pal.ambient, pal.ground, 1.1);
  const sun = new THREE.DirectionalLight(pal.sun, 2.4);
  sun.position.set(40, 70, 30);
  sun.castShadow = high;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 220 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.05;
  sun.shadow.radius = 3;
  scene.add(hemi, sun);

  const years = timeline.map((m) => m.year).concat(2026).filter((y, i, a) => a.indexOf(y) === i);
  const sequoia = createSequoia(pal, years);
  scene.add(sequoia.group);

  const ctx = { quality: opts.quality, night };
  const parts: Part[] = [
    { group: sequoia.group, setPalette: (p, n) => sequoia.setPalette(p, n), picks: [{ object: sequoia.pickTree, zone: 'tree' }] },
    ...(opts.extraParts ?? []).map((build) => build(pal, ctx)),
  ];
  for (const part of parts.slice(1)) scene.add(part.group);

  // Labels: pill buttons pinned to each zone.
  const selectHandlers: ((id: ZoneId) => void)[] = [];
  const select = (id: ZoneId) => selectHandlers.forEach((h) => h(id));
  for (const z of ZONES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'valley-label';
    b.dataset.zone = z.id;
    b.textContent = z.label[opts.lang];
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      select(z.id);
    });
    const obj = new CSS2DObject(b);
    obj.position.set(...z.anchor);
    scene.add(obj);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(...HOME_VIEW.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 12;
  controls.maxDistance = 120;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.38;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;
  controls.update();

  // Clicking scene objects (the tree, the cabin...) selects their zone.
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt: [number, number] | null = null;
  canvas.addEventListener('pointerdown', (e) => (downAt = [e.clientX, e.clientY]));
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; // was a drag
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const picks = parts.flatMap((p) => p.picks ?? []);
    const hit = ray.intersectObjects(picks.map((p) => p.object), true)[0];
    if (!hit) return;
    const pick = picks.find((p) => p.object === hit.object || p.object.getObjectById(hit.object.id));
    if (pick) select(pick.zone);
  });

  // Camera flights. Any running flight is killed first so rapid clicks never stack.
  let flight: gsap.core.Timeline | null = null;
  const fly = (position: number[], target: number[], duration = 1.6) => {
    flight?.kill();
    controls.autoRotate = false;
    flight = gsap.timeline({ defaults: { duration, ease: 'power2.inOut' }, onUpdate: () => controls.update() });
    flight.to(camera.position, { x: position[0], y: position[1], z: position[2] }, 0);
    flight.to(controls.target, { x: target[0], y: target[1], z: target[2] }, 0);
    return flight;
  };
  const focus = (id: ZoneId | null) => {
    document.documentElement.dataset.zone = id ?? '';
    if (!id) {
      fly(HOME_VIEW.position, HOME_VIEW.target).eventCallback('onComplete', () => (controls.autoRotate = true));
      return;
    }
    const z = ZONES.find((zz) => zz.id === id)!;
    const f = fly(z.view.position, z.view.target);
    if (id === 'tree') {
      // Rise slowly along the trunk past the ring bands, from the roots (2017) to the crown (now).
      const top = sequoia.ringHeights.at(-1)! + 6;
      f.to(camera.position, { y: top + 4, duration: 5, ease: 'sine.inOut' }, '>');
      f.to(controls.target, { y: top, duration: 5, ease: 'sine.inOut' }, '<');
    }
  };

  const applyPalette = () => {
    pal = palette(season, night);
    (scene.background as THREE.Color).set(pal.sky);
    (scene.fog as THREE.Fog).color.set(pal.fog);
    hemi.color.set(pal.ambient);
    hemi.groundColor.set(pal.ground);
    hemi.intensity = night ? 0.45 : 1.1;
    sun.color.set(pal.sun);
    sun.intensity = night ? 0.55 : 2.4;
    renderer.toneMappingExposure = night ? 1.25 : 1.05;
    parts.forEach((p) => p.setPalette(pal, night));
    document.documentElement.dataset.season = season;
    document.documentElement.dataset.night = String(night);
  };
  applyPalette();

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    // Keep the whole sequoia in frame on tall phone screens.
    camera.fov = w / h < 0.8 ? 50 : 35;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let raf = 0;
  let running = true;
  const tick = () => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    parts.forEach((p) => p.update?.(t, dt));
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  // Stop rendering while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { clock.getDelta(); raf = requestAnimationFrame(tick); }
  });
  raf = requestAnimationFrame(tick);

  return {
    scene,
    sequoiaHeight: SEQUOIA.totalHeight,
    ready: Promise.resolve(),
    setSeason(s: Season) { season = s; applyPalette(); },
    setNight(n: boolean) { night = n; applyPalette(); },
    focus,
    onSelect(cb: (id: ZoneId) => void) { selectHandlers.push(cb); },
    drawCalls: () => renderer.info.render.calls,
    dispose() { cancelAnimationFrame(raf); running = false; renderer.dispose(); },
  };
}
