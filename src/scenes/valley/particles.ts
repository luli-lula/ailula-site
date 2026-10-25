import * as THREE from 'three';
import type { Part } from './createValley';
import { rng } from './lowpoly';
import type { Season } from './palette';

// Seasonal air: dogwood petals in spring, pollen (fireflies at night) in summer, falling leaves in
// autumn, snow in winter. Stars come out at night.

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// `top` is where particles start: petals and leaves come from the dogwood understory (the sequoia is
// evergreen and sheds neither), snow falls from high above.
interface Mode { color: string; size: number; fall: number; sway: number; glow: boolean; top: number }
const MODES: Record<Season | 'fireflies', Mode> = {
  spring: { color: '#fbf3f0', size: 0.45, fall: 0.5, sway: 1.2, glow: false, top: 7 },
  summer: { color: '#f3e7a0', size: 0.22, fall: 0.05, sway: 0.6, glow: false, top: 12 },
  fireflies: { color: '#e9ff8a', size: 0.5, fall: 0, sway: 0.9, glow: true, top: 6 },
  autumn: { color: '#d9792f', size: 0.5, fall: 0.8, sway: 1.6, glow: false, top: 7 },
  winter: { color: '#ffffff', size: 0.38, fall: 1.8, sway: 0.5, glow: false, top: 42 },
};

export function createParticles(_p: unknown, ctx: { quality: 'high' | 'low' }): Part {
  const rnd = rng(31);
  const count = ctx.quality === 'high' ? 700 : 260;
  const group = new THREE.Group();
  group.name = 'particles';
  const tex = dotTexture();

  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  let top = 7;
  const reset = (i: number, anywhere: boolean) => {
    // Keep clear of the sequoia's crown column.
    const a = rnd() * Math.PI * 2, r = 9 + Math.sqrt(rnd()) * 25;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = anywhere ? rnd() * top : top - rnd() * 2;
    pos[i * 3 + 2] = Math.sin(a) * r;
  };
  for (let i = 0; i < count; i++) { reset(i, true); seed[i] = rnd() * 100; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ map: tex, transparent: true, depthWrite: false, size: 0.4, sizeAttenuation: true, color: '#ffffff' });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  group.add(points);

  // Stars on a far dome.
  const starPos = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, y = Math.abs(u);
    const s = Math.sqrt(1 - y * y);
    starPos.set([Math.cos(th) * s * 400, y * 400 + 20, Math.sin(th) * s * 400], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ map: tex, color: '#fdf6e3', size: 2.2, sizeAttenuation: true, transparent: true, depthWrite: false, fog: false }));
  stars.visible = false;
  group.add(stars);

  // Falling petals, leaves and snow are motion: off for visitors who asked for less of it.
  points.visible = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mode = MODES.spring;
  return {
    group,
    setPalette(_next, night, season) {
      mode = season === 'summer' && night ? MODES.fireflies : MODES[season];
      if (top !== mode.top) {
        top = mode.top;
        for (let i = 0; i < count; i++) reset(i, true);
      }
      mat.color.set(mode.color);
      mat.size = mode.size;
      mat.blending = mode.glow ? THREE.AdditiveBlending : THREE.NormalBlending;
      mat.needsUpdate = true;
      stars.visible = night;
    },
    update(t, dt) {
      for (let i = 0; i < count; i++) {
        const k = i * 3, s = seed[i];
        pos[k] += Math.sin(t * 0.7 + s) * mode.sway * dt;
        pos[k + 2] += Math.cos(t * 0.6 + s * 1.3) * mode.sway * dt;
        pos[k + 1] -= mode.fall * dt * (0.6 + (s % 1));
        if (mode.fall === 0) pos[k + 1] += Math.sin(t * 1.3 + s) * 0.4 * dt;
        if (pos[k + 1] < 0) reset(i, false);
      }
      geo.attributes.position.needsUpdate = true;
      if (mode.glow) mat.opacity = 0.65 + 0.35 * Math.sin(t * 3);
      else mat.opacity = 0.95;
    },
  };
}
