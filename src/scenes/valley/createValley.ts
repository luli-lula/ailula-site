import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import gsap from 'gsap';
import type { Lang } from '../../lib/i18n';
import { timeline } from '../../data/timeline';
import { palette, type Palette, type Season } from './palette';
import { HOME_VIEW, ZONES, type ZoneId } from './zones';
import { createSequoia, SEQUOIA, trunkRadius } from './sequoia';
import { keepOutsideTree } from './clearance';

export interface Part {
  group: THREE.Object3D;
  setPalette(p: Palette, night: boolean, season: Season): void;
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
  // Visitors who asked their system for less motion get a still island and instant camera cuts.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, high ? 2 : 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.type = THREE.PCFShadowMap;

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

  const years = timeline.map((m) => m.start);
  const sequoia = createSequoia(pal, years);
  scene.add(sequoia.group);

  const ctx = { quality: opts.quality, night };
  const parts: Part[] = [
    { group: sequoia.group, setPalette: (p, n) => sequoia.setPalette(p, n), update: (_t, dt) => sequoia.update(dt), picks: [{ object: sequoia.pickTree, zone: 'tree' }] },
    ...(opts.extraParts ?? []).map((build) => build(pal, ctx)),
  ];
  for (const part of parts.slice(1)) scene.add(part.group);

  // Year tags on the sequoia's rings, revealed as the camera rises past them when the tree is open.
  const TAG_ANGLE = Math.atan2(17, 13) + 0.35; // just beside the tree view's line of sight
  const ringTags = sequoia.ringHeights.map((y, i) => {
    const el = document.createElement('span');
    el.className = 'ring-tag';
    const year = years[i];
    el.textContent = year >= 2026 ? (opts.lang === 'zh' ? '现在' : 'now') : String(year);
    const obj = new CSS2DObject(el);
    const r = trunkRadius(y, TAG_ANGLE) * 1.18;
    obj.position.set(Math.cos(TAG_ANGLE) * r, y, Math.sin(TAG_ANGLE) * r);
    scene.add(obj);
    return { el, y };
  });

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
  controls.minDistance = 7; // clearance.ts keeps the camera out of the tree itself
  controls.maxDistance = 200;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.38;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.35;
  controls.update();
  // Grabbing the view cancels any flight in progress, so a drag always works.
  controls.addEventListener('start', () => flight?.kill());

  // Auto-rotate only while idle: any pointer movement holds the island still so labels are easy to hit.
  let focused: ZoneId | null = null;
  let idleTimer = 0;
  const onActivity = () => {
    controls.autoRotate = false;
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => { if (!focused && !reduced) controls.autoRotate = true; }, 8000);
  };
  addEventListener('pointermove', onActivity, { passive: true });
  addEventListener('pointerdown', onActivity, { passive: true });

  // Clicking scene objects (the tree, the cabin...) selects their zone.
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt: [number, number] | null = null;
  canvas.addEventListener('pointerdown', (e) => (downAt = [e.clientX, e.clientY]));
  // Hover: a hand cursor and a highlighted label over anything that opens a place.
  const labelFor = (zone: ZoneId) => labelsEl.querySelector<HTMLElement>(`.valley-label[data-zone="${zone}"]`);
  let hovered: ZoneId | null = null;
  let hoverQueued = false;
  canvas.addEventListener('pointermove', (e) => {
    if (hoverQueued || e.pointerType === 'touch') return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const picks = parts.flatMap((p) => p.picks ?? []);
      const hit = ray.intersectObjects(picks.map((p) => p.object), true)[0];
      const zone = hit ? picks.find((p) => p.object === hit.object || p.object.getObjectById(hit.object.id))?.zone ?? null : null;
      if (zone === hovered) return;
      if (hovered) labelFor(hovered)?.classList.remove('hover');
      hovered = zone;
      if (zone) labelFor(zone)?.classList.add('hover');
      canvas.style.cursor = zone ? 'pointer' : '';
    });
  });
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

  // Camera flights travel in an arc around the sequoia (cylindrical coordinates around its axis), never
  // through it. Any running flight is killed first so rapid clicks never stack.
  let flight: gsap.core.Timeline | null = null;
  const fly = (position: number[], target: number[], duration = reduced ? 0 : 1.6) => {
    flight?.kill();
    controls.autoRotate = false;
    const from = { r: Math.hypot(camera.position.x, camera.position.z), a: Math.atan2(camera.position.z, camera.position.x), y: camera.position.y };
    const toA = Math.atan2(position[2], position[0]);
    const da = Math.atan2(Math.sin(toA - from.a), Math.cos(toA - from.a));
    const to = { r: Math.hypot(position[0], position[2]), a: from.a + da, y: position[1] };
    const bulge = (Math.abs(da) / Math.PI) * 10; // swing wider the further round the tree we go
    const path = { t: 0 };
    flight = gsap.timeline({ defaults: { duration, ease: 'power2.inOut' } });
    flight.to(path, {
      t: 1,
      onUpdate: () => {
        const t = path.t;
        const r = from.r + (to.r - from.r) * t + bulge * Math.sin(Math.PI * t);
        const a = from.a + (to.a - from.a) * t;
        camera.position.set(Math.cos(a) * r, from.y + (to.y - from.y) * t, Math.sin(a) * r);
      },
    }, 0);
    flight.to(controls.target, { x: target[0], y: target[1], z: target[2] }, 0);
    return flight;
  };
  let rising = false; // true once the tree flight reaches the roots and starts climbing
  const focus = (id: ZoneId | null) => {
    focused = id;
    rising = false;
    sequoia.setHighlight(id === 'tree');
    document.documentElement.dataset.zone = id ?? '';
    if (!id) {
      fly(homePosition(), HOME_VIEW.target);
      return;
    }
    const z = ZONES.find((zz) => zz.id === id)!;
    const f = fly(z.view.position, z.view.target);
    if (id === 'tree') {
      // Rise slowly along the trunk past the ring bands, from the roots (2017) to the crown (now).
      // Start close on the lowest rings (2017), then rise and pull back until the whole crown (now) is in view.
      const top = sequoia.ringHeights.at(-1)!;
      const rise = reduced ? 0 : 5.5;
      f.to(camera.position, { x: 30, y: top + 12, z: 38, duration: rise, ease: 'sine.inOut', onStart: () => (rising = true) }, '>');
      f.to(controls.target, { y: top + 2, duration: rise, ease: 'sine.inOut' }, '<');
    }
  };

  const applyPalette = () => {
    pal = palette(season, night);
    (scene.background as THREE.Color).set(pal.sky);
    (scene.fog as THREE.Fog).color.set(pal.fog);
    hemi.color.set(pal.ambient);
    hemi.groundColor.set(pal.ground);
    hemi.intensity = night ? 0.75 : 1.1;
    sun.color.set(pal.sun);
    sun.intensity = night ? 0.9 : 2.4;
    renderer.toneMappingExposure = night ? 1.25 : 1.05;
    parts.forEach((p) => p.setPalette(pal, night, season));
    document.documentElement.dataset.season = season;
    document.documentElement.dataset.night = String(night);
  };
  applyPalette();

  let portrait = false;
  // Space covered by an open panel (px); the view centre shifts so the focused place stays visible.
  let inset = { right: 0, bottom: 0 };
  const applyInset = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!inset.right && !inset.bottom) camera.clearViewOffset();
    else camera.setViewOffset(w, h, inset.right / 2, inset.bottom / 2, w, h);
  };
  const homePosition = () => (portrait ? HOME_VIEW.position.map((v) => v * 1.4) : HOME_VIEW.position);
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return; // hidden (Lo-Fi): keep the last good size, resume() re-measures
    const wasPortrait = portrait;
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    // Tall phone screens: wider lens, and the home view pulls back so the whole island fits.
    portrait = w / h < 0.8;
    camera.fov = portrait ? 48 : 35;
    (scene.fog as THREE.Fog).near = portrait ? 150 : 90;
    (scene.fog as THREE.Fog).far = portrait ? 380 : 260;
    camera.updateProjectionMatrix();
    applyInset();
    // Rotating a phone re-frames the island when nothing is focused.
    if (!focused && wasPortrait !== portrait) camera.position.set(...(homePosition() as [number, number, number]));
  };
  resize();
  addEventListener('resize', resize);

  // On small screens labels can collide. A less important label first tries a spot just above or below;
  // if all are taken it fades (its 3D object stays clickable, and keyboard focus brings it back). Labels
  // that overhang an edge slide inside the screen; a label whose place is off screen fades. The top bar,
  // the hint and an open panel count as taken space. All rects are read first, then all styles written,
  // so this costs one layout. A few times a second.
  const PRIORITY: ZoneId[] = ['tree', 'greenhouse', 'workshop', 'hollow', 'garden', 'lookout', 'dog'];
  const EDGE = 8;
  const root = labelsEl.parentElement ?? labelsEl;
  const declutter = () => {
    const bounds = labelsEl.getBoundingClientRect();
    type Box = { left: number; right: number; top: number; bottom: number };
    const kept: Box[] = [...root.querySelectorAll<HTMLElement>('.valley-brand, .valley-controls, .valley-hint, .vpanel:not([hidden])')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0);
    const measured = PRIORITY.map((id) => labelsEl.querySelector<HTMLElement>(`.valley-label[data-zone="${id}"]`))
      .filter((el): el is HTMLElement => !!el)
      .map((el) => ({ el, r: el.getBoundingClientRect(), dx: Number(el.dataset.dx ?? 0), dy: Number(el.dataset.dy ?? 0) }));
    const collides = (b: Box) => kept.some((k) => b.left < k.right + 4 && k.left < b.right + 4 && b.top < k.bottom + 2 && k.top < b.bottom + 2);
    for (const { el, r, dx, dy } of measured) {
      if (!r.width) continue;
      const left = r.left - dx, right = r.right - dx, top = r.top - dy, bottom = r.bottom - dy;
      const centre = (left + right) / 2;
      const onScreen = centre > bounds.left && centre < bounds.right;
      const x = Math.max(bounds.left + EDGE - left, 0) + Math.min(bounds.right - EDGE - right, 0);
      const step = r.height + 4;
      const y = onScreen ? [0, -step, step].find((o) => !collides({ left: left + x, right: right + x, top: top + o, bottom: bottom + o })) : undefined;
      const hidden = y === undefined;
      if (!hidden) kept.push({ left: left + x, right: right + x, top: top + y, bottom: bottom + y });
      el.dataset.dx = String(x);
      el.dataset.dy = String(y ?? 0);
      el.style.marginLeft = x ? `${x}px` : '';
      el.style.marginTop = y ? `${y}px` : '';
      el.style.opacity = hidden ? '0' : '';
      el.style.pointerEvents = hidden ? 'none' : '';
    }
  };

  // One render loop at most: a frame is only scheduled when none is pending. The loop stops while the
  // tab is hidden or the page is in Lo-Fi (paused), and restarts on return.
  let raf = 0;
  let paused = false;
  let frames = 0;
  let last = performance.now();
  let elapsed = 0;
  let firstFrame: () => void = () => {};
  const ready = new Promise<void>((r) => (firstFrame = r));
  const tick = () => {
    raf = 0;
    if (paused || document.hidden) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    // Reduced motion: decorative motion (clouds, the dog's tail) holds still; fades still run on dt.
    parts.forEach((p) => p.update?.(reduced ? 0 : elapsed, dt));
    controls.update();
    const safe = keepOutsideTree(camera.position);
    if (safe !== camera.position) camera.position.set(safe.x, safe.y, safe.z);
    for (const tag of ringTags) tag.el.classList.toggle('on', focused === 'tree' && rising && camera.position.y >= tag.y - 3);
    if (frames % 6 === 0) declutter();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    if (frames++ === 0) firstFrame();
    raf = requestAnimationFrame(tick);
  };
  const schedule = () => {
    if (raf || paused || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : schedule()));
  schedule();

  return {
    scene,
    sequoiaHeight: SEQUOIA.totalHeight,
    ready,
    setSeason(s: Season) { season = s; applyPalette(); },
    setInset(next: { right: number; bottom: number }) { inset = next; applyInset(); },
    setNight(n: boolean) { night = n; applyPalette(); },
    focus,
    select,
    onSelect(cb: (id: ZoneId) => void) { selectHandlers.push(cb); },
    pause() { paused = true; stop(); flight?.kill(); },
    resume() { paused = false; resize(); schedule(); },
    frames: () => frames,
    ringOpacity: () => sequoia.ringOpacity(),
    cameraPosition: () => camera.position.toArray() as [number, number, number],
    drawCalls: () => renderer.info.render.calls,
    cameraTarget: () => controls.target.toArray() as [number, number, number],
    dispose() { paused = true; stop(); flight?.kill(); clearTimeout(idleTimer); controls.dispose(); renderer.dispose(); },
  };
}
