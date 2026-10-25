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

const FIRST_YEAR = 2011;
const LAST_YEAR = 2026;
const RING_LOW = 4;
const RING_HIGH = 28;

// One ring per timeline entry: the trunk is the timeline, the roots are 2011 (GIS at university), the crown is now.
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
    const y0 = 21 + (i / limbCount) * 12 + rnd() * 2;
    const reach = 3 + rnd() * 2.5 - (i / limbCount) * 1.2;
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
  for (const c of crownSpots) addClump(c, 2.4 + rnd() * 1.1);
  for (let i = 0; i < 14; i++) {
    // Clumps stack up the upper trunk and narrow towards the top: a tall, ragged dome.
    const t = i / 13;
    const a = rnd() * Math.PI * 2, y = 25 + t * 16 + rnd() * 1.5, d = (1 - t * 0.6) * (2.2 + rnd() * 2.2);
    addClump(new THREE.Vector3(Math.cos(a) * d, y, Math.sin(a) * d), (2.9 - t * 1.0) + rnd() * 0.9);
  }
  addClump(new THREE.Vector3(0.4, SEQUOIA.totalHeight - 2.2, -0.3), 2.2);
  const crownMat = material(p.sequoiaCrown);
  group.add(mesh(merge(clumps), crownMat));

  // Growth rings for the timeline years. Hidden in the home view (they read as tape around the trunk);
  // they fade in, thin and warm, only while the tree's story is open.
  const ringHeights = ringHeightsFor(years);
  const rings = ringHeights.map((y) => {
    const g = new THREE.TorusGeometry(trunkRadius(y, 0) * 1.05, 0.022, 3, 36);
    g.rotateX(Math.PI / 2);
    g.translate(0, y, 0);
    return faceted(g, rnd, 0);
  });
  const ringMat = material('#f0c890', { emissive: '#ffcf86', emissiveIntensity: 0.6, transparent: true, opacity: 0, depthWrite: false });
  const ringMesh = mesh(merge(rings), ringMat, false);
  ringMesh.visible = false;
  group.add(ringMesh);

  let isNight = false;
  let highlighted = false;
  const paintRings = () => {
    ringMat.emissiveIntensity = isNight ? 1.3 : 0.6;
  };
  // Fade towards the target each frame.
  const fadeRings = (dt: number) => {
    const target = highlighted ? 0.8 : 0;
    const next = ringMat.opacity + (target - ringMat.opacity) * Math.min(1, dt * 2.5);
    ringMat.opacity = Math.abs(next - target) < 0.01 ? target : next;
    ringMesh.visible = ringMat.opacity > 0;
  };

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
      isNight = night;
      paintRings();
    },
    update: fadeRings,
    ringOpacity: () => ringMat.opacity,
    // While the tree's story is open, its rings glow like a timeline.
    setHighlight(on: boolean) {
      highlighted = on;
      paintRings();
    },
  };
}
