import * as THREE from 'three';
import { faceted, jitter, material, merge, mesh, rng } from './lowpoly';
import type { Palette } from './palette';

// The giant sequoia at the centre of the valley, modelled on the Grizzly Giant: a huge buttressed,
// fluted cinnamon trunk with a fire-scar cavity at its base, bare for most of its height, then a few
// massive limbs bending upward into rounded clumps of evergreen foliage.
export const SEQUOIA = {
  trunkHeight: 34,
  totalHeight: 44,
  baseRadius: 3.7,
  // Tallest of the other trees (white firs / sugar pines) in flora.ts.
  maxOtherTreeHeight: 15,
};

const FIRST_YEAR = 2017;
const LAST_YEAR = 2026;
const RING_LOW = 6;
const RING_HIGH = 28;

// One ring band per timeline year: the trunk is the timeline, roots are 2017, the crown is now.
export function ringHeightsFor(years: number[]): number[] {
  return years.map((y) => RING_LOW + ((y - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR)) * (RING_HIGH - RING_LOW));
}

export function trunkRadius(y: number, angle: number): number {
  const taper = 2.75 - (y / SEQUOIA.trunkHeight) * 1.15;
  const flare = 1.75 * Math.exp(-y / 2.6) * (0.8 + 0.2 * Math.sin(angle * 4 + 0.5));
  const flutes = 1 + 0.07 * Math.sin(angle * 9) + 0.03 * Math.sin(angle * 17 + y * 0.3);
  return (taper + flare) * flutes;
}

// Fire scar: an arch facing +z (towards the default camera), widest at the ground.
const SCAR_HALF_ANGLE = 0.42;
const scarHeightAt = (angle: number) => {
  const d = Math.abs(Math.atan2(Math.sin(angle - Math.PI / 2), Math.cos(angle - Math.PI / 2)));
  return d > SCAR_HALF_ANGLE ? -1 : 7.5 * (1 - (d / SCAR_HALF_ANGLE) ** 1.6);
};

export function createSequoia(p: Palette, years: number[]) {
  const rnd = rng(1914);
  const group = new THREE.Group();
  group.name = 'sequoia';

  // Trunk, with the scar pushed inwards and darkened.
  const radial = 18, rows = 16;
  const trunkGeo = new THREE.CylinderGeometry(1, 1, SEQUOIA.trunkHeight, radial, rows, false);
  trunkGeo.translate(0, SEQUOIA.trunkHeight / 2, 0);
  const tp = trunkGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i);
    const angle = Math.atan2(z, x);
    let r = trunkRadius(y, angle);
    if (y < scarHeightAt(angle)) r *= 0.5;
    const len = Math.hypot(x, z) || 1;
    if (y >= SEQUOIA.trunkHeight - 0.01) r *= 0.82; // round off the top into the crown
    tp.setXYZ(i, (x / len) * r, y, (z / len) * r);
  }
  jitter(trunkGeo, 0.12, rnd, [1, 0.3, 1]);
  const scarShade = (c: THREE.Vector3) => (c.y < scarHeightAt(Math.atan2(c.z, c.x)) + 0.4 ? 0.17 : 1);
  const bark = faceted(trunkGeo, rnd, 0.2, (c) => scarShade(c) * (0.92 + 0.08 * Math.sin(Math.atan2(c.z, c.x) * 9)));

  // Massive limbs high on the trunk, bending upward.
  const limbs: THREE.BufferGeometry[] = [];
  const crownSpots: THREE.Vector3[] = [];
  const limbCount = 7;
  for (let i = 0; i < limbCount; i++) {
    const a = (i / limbCount) * Math.PI * 2 + rnd() * 0.6;
    const y0 = 22 + rnd() * 9;
    const reach = 4 + rnd() * 3.5;
    const r0 = trunkRadius(y0, a) * 0.85;
    const start = new THREE.Vector3(Math.cos(a) * r0, y0, Math.sin(a) * r0);
    // Old sequoia limbs are thick and crooked: a kink sideways, then a turn upwards.
    const side = (rnd() - 0.5) * 1.2;
    const at = (t: number, lift: number) => new THREE.Vector3(Math.cos(a + side * t) * (r0 + reach * t), y0 + lift, Math.sin(a + side * t) * (r0 + reach * t));
    const mid = at(0.55, 0.4 + rnd());
    const end = at(1, 3.5 + rnd() * 2.5);
    end.y += 0;
    const radius = 0.95 - i * 0.05;
    limbs.push(faceted(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 7, radius, 6, false), rnd, 0.15));
    crownSpots.push(end);
  }
  const limbGeo = merge([bark, ...limbs]);
  const barkMat = material(p.sequoiaBark);
  group.add(mesh(limbGeo, barkMat));

  // Crown: rounded clumps at the limb ends, around the trunk top and a domed top (old sequoias are round-topped).
  const clumps: THREE.BufferGeometry[] = [];
  const addClump = (c: THREE.Vector3, r: number) => {
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.scale(1, 0.72, 1);
    jitter(g, r * 0.28, rnd);
    g.translate(c.x, c.y, c.z);
    clumps.push(faceted(g, rnd, 0.22, (cc) => 0.82 + 0.25 * Math.min(1, Math.max(0, (cc.y - c.y) / r + 0.5))));
  };
  for (const c of crownSpots) addClump(c, 3.2 + rnd() * 1.6);
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, y = 28 + rnd() * 9, d = 2 + rnd() * 3;
    addClump(new THREE.Vector3(Math.cos(a) * d, y, Math.sin(a) * d), 3.2 + rnd() * 1.4);
  }
  addClump(new THREE.Vector3(0.4, SEQUOIA.totalHeight - 3.4, -0.3), 4.2);
  const crownMat = material(p.sequoiaCrown);
  group.add(mesh(merge(clumps), crownMat));

  // Faint ring bands: the timeline years climbing the trunk.
  const ringHeights = ringHeightsFor(years);
  const rings = ringHeights.map((y) => {
    const g = new THREE.TorusGeometry(trunkRadius(y, 0) * 1.06, 0.035, 3, 28);
    g.rotateX(Math.PI / 2);
    g.translate(0, y, 0);
    return faceted(g, rnd, 0);
  });
  const ringMat = material('#d9a978', { emissive: '#ffd08a', emissiveIntensity: 0, transparent: true, opacity: 0.55 });
  group.add(mesh(merge(rings), ringMat, false));

  return {
    group,
    height: SEQUOIA.totalHeight,
    ringHeights,
    hollowAnchor: new THREE.Vector3(0, 2.6, trunkRadius(2.6, Math.PI / 2) * 0.7),
    // Things the pointer can pick to select a zone.
    pickTree: group.children[0] as THREE.Mesh,
    setPalette(next: Palette, night: boolean) {
      barkMat.color.set(next.sequoiaBark);
      crownMat.color.set(next.sequoiaCrown);
      ringMat.emissiveIntensity = night ? 1.2 : 0;
      ringMat.opacity = night ? 0.9 : 0.55;
    },
  };
}
