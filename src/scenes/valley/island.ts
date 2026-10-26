import * as THREE from 'three';
import type { Part } from './createValley';
import { faceted, jitter, material, merge, mesh, rng } from './lowpoly';
import type { Palette } from './palette';
import { ZONES } from './zones';

// A floating island: gently rolling meadow on top, layered rock underneath, stone paths from the
// sequoia to every place, a creek that spills off the edge as a waterfall, and clouds drifting below.

export const ISLAND_RADIUS = 36;
const LOOKOUT = new THREE.Vector2(10, -19);

export function edgeRadius(a: number) {
  return ISLAND_RADIUS * (1 + 0.06 * Math.sin(3 * a + 0.4) + 0.04 * Math.sin(7 * a + 1.3));
}

// Creek: a gentle S from the north-west rim, past the garden, off the south-east edge.
const CREEK = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-30, 0, -14), new THREE.Vector3(-18, 0, -8), new THREE.Vector3(-6, 0, -12),
  new THREE.Vector3(8, 0, -6), new THREE.Vector3(20, 0, 2), new THREE.Vector3(26, 0, 14), new THREE.Vector3(30, 0, 20),
]);
const creekPts = CREEK.getSpacedPoints(80);
function distToCreek(x: number, z: number) {
  let d = Infinity;
  for (const p of creekPts) d = Math.min(d, Math.hypot(p.x - x, p.z - z));
  return d;
}

export function heightAt(x: number, z: number): number {
  const r = Math.hypot(x, z);
  let h = 0.5 * Math.sin(x * 0.18) * Math.cos(z * 0.15) + 0.3 * Math.sin(x * 0.41 + z * 0.33);
  // A low rise under the lookout so it has a view.
  h += 3.2 * Math.exp(-((x - LOOKOUT.x) ** 2 + (z - LOOKOUT.y) ** 2) / 70);
  // The sequoia stands on a slight mound.
  h += 0.9 * Math.exp(-(r * r) / 60);
  // The creek cuts a shallow bed.
  h -= 0.9 * Math.exp(-(distToCreek(x, z) ** 2) / 4);
  // Fall off towards the rim.
  const a = Math.atan2(z, x);
  const edge = edgeRadius(a);
  h -= Math.max(0, (r - edge * 0.82) / (edge * 0.18)) ** 2 * 1.2;
  return h;
}

export function insideIsland(x: number, z: number, margin = 3) {
  return Math.hypot(x, z) < edgeRadius(Math.atan2(z, x)) - margin;
}

// Paths: from the sequoia's base to each place (the tree and the hollow are the hub itself).
export const PATHS = ZONES.filter((z) => !['tree', 'hollow'].includes(z.id)).map((z) => {
  const end = new THREE.Vector3(z.view.target[0], 0, z.view.target[2]);
  const dir = end.clone().normalize();
  const start = dir.clone().multiplyScalar(5.5);
  const bend = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(2.5);
  const mid = start.clone().lerp(end, 0.5).add(bend);
  return new THREE.CatmullRomCurve3([start, mid, end]);
});
const pathPts = PATHS.flatMap((c) => c.getSpacedPoints(40));
export function distToPath(x: number, z: number) {
  let d = Infinity;
  for (const p of pathPts) d = Math.min(d, Math.hypot(p.x - x, p.z - z));
  return d;
}

function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, lift: number, steps: number) {
  const pos: number[] = [];
  const pts = curve.getSpacedPoints(steps);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const t = new THREE.Vector3().subVectors(b, a).normalize();
    const n = new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(width / 2);
    const quad = [a.clone().add(n), a.clone().sub(n), b.clone().add(n), b.clone().sub(n)].map((p) => {
      p.y = heightAt(p.x, p.z) + lift;
      return p;
    });
    const [p0, p1, p2, p3] = quad;
    pos.push(p0.x, p0.y, p0.z, p2.x, p2.y, p2.z, p1.x, p1.y, p1.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

// Water lies flat across the channel: every cross-section takes the height of the creek's centre line, so
// the surface sits in the bed and meets the banks instead of following them under the grass.
function waterRibbon(curve: THREE.Curve<THREE.Vector3>, width: number, lift: number, steps: number) {
  const pos: number[] = [];
  const pts = curve.getSpacedPoints(steps);
  const level = pts.map((q) => heightAt(q.x, q.z) + lift);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const t = new THREE.Vector3().subVectors(b, a).normalize();
    const n = new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(width / 2);
    const [p0, p1] = [a.clone().add(n), a.clone().sub(n)].map((q) => q.setY(level[i]));
    const [p2, p3] = [b.clone().add(n), b.clone().sub(n)].map((q) => q.setY(level[i + 1]));
    pos.push(p0.x, p0.y, p0.z, p2.x, p2.y, p2.z, p1.x, p1.y, p1.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

// Where a stone path crosses the creek: the point on the path closest to the creek, and the path's direction there.
function crossings() {
  const out: { at: THREE.Vector3; dir: THREE.Vector3 }[] = [];
  for (const path of PATHS) {
    const pts = path.getSpacedPoints(60);
    let best = { d: Infinity, i: 0 };
    pts.forEach((q, i) => { const d = distToCreek(q.x, q.z); if (d < best.d) best = { d, i }; });
    if (best.d > 1.2 || best.i < 2 || best.i > pts.length - 3) continue;
    out.push({ at: pts[best.i], dir: new THREE.Vector3().subVectors(pts[best.i + 1], pts[best.i - 1]).setY(0).normalize() });
  }
  return out;
}

export function createIsland(p: Palette): Part {
  const rnd = rng(77);
  const group = new THREE.Group();
  group.name = 'island';

  // Top: concentric rings of vertices so the meadow can roll.
  const rings = 14, seg = 64;
  const verts: number[] = [0, heightAt(0, 0), 0];
  for (let i = 1; i <= rings; i++) {
    for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      const r = (i / rings) * edgeRadius(a) + (i < rings ? (rnd() - 0.5) * 0.9 : 0);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      verts.push(x, heightAt(x, z), z);
    }
  }
  const idx: number[] = [];
  const v = (i: number, j: number) => (i === 0 ? 0 : 1 + (i - 1) * seg + (j % seg));
  for (let j = 0; j < seg; j++) idx.push(0, v(1, j + 1), v(1, j));
  for (let i = 1; i < rings; i++)
    for (let j = 0; j < seg; j++) idx.push(v(i, j), v(i, j + 1), v(i + 1, j), v(i, j + 1), v(i + 1, j + 1), v(i + 1, j));
  const top = new THREE.BufferGeometry();
  top.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  top.setIndex(idx);
  const grassMat = material(p.grass);
  group.add(mesh(faceted(top, rnd, 0.14), grassMat));

  // Underside: soil lip, then layered rock tapering to a point far below.
  const layers = [0, -1.6, -5, -10, -16, -23, -30];
  const scales = [1, 0.98, 0.86, 0.66, 0.44, 0.22, 0.04];
  const rim: number[] = [];
  const rimIdx: number[] = [];
  for (let l = 0; l < layers.length; l++) {
    for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      const r = edgeRadius(a) * scales[l] * (l === 0 ? 1 : 1 + (rnd() - 0.5) * 0.14);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      rim.push(x, l === 0 ? heightAt(x, z) - 0.05 : layers[l] + (rnd() - 0.5) * 1.5, z);
    }
  }
  for (let l = 0; l < layers.length - 1; l++)
    for (let j = 0; j < seg; j++) {
      const a = l * seg + j, b = l * seg + ((j + 1) % seg), c = (l + 1) * seg + j, d = (l + 1) * seg + ((j + 1) % seg);
      rimIdx.push(a, c, b, b, c, d);
    }
  const under = new THREE.BufferGeometry();
  under.setAttribute('position', new THREE.Float32BufferAttribute(rim, 3));
  under.setIndex(rimIdx);
  // Top band reads as soil, the rest as rock strata.
  const soilMat = material(p.ground);
  const rockMat = material(p.rock);
  const underFaceted = faceted(under, rnd, 0.2, (c) => (c.y > -1.8 ? 1 : 0.75 + 0.18 * Math.sin(c.y * 0.9)));
  // Split by height: soil lip vs rock.
  const pos = underFaceted.attributes.position as THREE.BufferAttribute;
  const soilTris: number[] = [], rockTris: number[] = [];
  for (let f = 0; f < pos.count; f += 3) {
    const avgY = (pos.getY(f) + pos.getY(f + 1) + pos.getY(f + 2)) / 3;
    (avgY > -1.2 ? soilTris : rockTris).push(f);
  }
  const pick = (tris: number[]) => {
    const g = new THREE.BufferGeometry();
    for (const name of ['position', 'color', 'normal']) {
      const src = underFaceted.attributes[name] as THREE.BufferAttribute;
      const out = new Float32Array(tris.length * 9);
      tris.forEach((f, k) => { for (let q = 0; q < 3; q++) for (let c = 0; c < 3; c++) out[k * 9 + q * 3 + c] = src.getComponent(f + q, c); });
      g.setAttribute(name, new THREE.BufferAttribute(out, 3));
    }
    return g;
  };
  group.add(mesh(pick(soilTris), soilMat), mesh(pick(rockTris), rockMat));

  // Stone paths.
  const pathMat = material(p.path);
  group.add(mesh(faceted(merge(PATHS.map((c) => ribbon(c, 1.9, 0.06, 26))), rnd, 0.18), pathMat, false));
  // A round flagstone plaza around the sequoia.
  const plaza = new THREE.RingGeometry(4.2, 6.4, 24, 1);
  plaza.rotateX(-Math.PI / 2);
  const pp = plaza.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pp.count; i++) pp.setY(i, heightAt(pp.getX(i), pp.getZ(i)) + 0.07);
  group.add(mesh(faceted(plaza, rnd, 0.22), pathMat, false));

  // Creek and waterfall.
  const waterMat = material(p.water, { transparent: true, opacity: 0.9, roughness: 0.2, metalness: 0.05 });
  const creekGeo = waterRibbon(CREEK, 2.4, 0.18, 90);
  const end = creekPts.at(-1)!;
  const fall = new THREE.PlaneGeometry(1.8, 18, 1, 6);
  fall.translate(0, -9, 0);
  fall.rotateY(-Math.atan2(end.z, end.x) + Math.PI / 2);
  const ea = Math.atan2(end.z, end.x);
  fall.translate(Math.cos(ea) * (edgeRadius(ea) + 0.2), heightAt(end.x, end.z) - 0.3, Math.sin(ea) * (edgeRadius(ea) + 0.2));
  jitter(fall, 0.25, rnd, [1, 0, 1]);
  const creek = mesh(faceted(merge([creekGeo, fall.toNonIndexed()].map((g) => { for (const n of Object.keys(g.attributes)) if (n !== 'position') g.deleteAttribute(n); return g; })), rnd, 0.1), waterMat, false);
  creek.name = 'creek';
  group.add(creek);

  // Stones along both banks.
  const bank: THREE.BufferGeometry[] = [];
  const bankPts = CREEK.getSpacedPoints(70);
  bankPts.forEach((q, i) => {
    if (i === 0 || i === bankPts.length - 1 || rnd() < 0.35) return;
    const t = new THREE.Vector3().subVectors(bankPts[i + 1], bankPts[i - 1]).normalize();
    const side = rnd() < 0.5 ? 1 : -1;
    const off = new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(side * (1.25 + rnd() * 0.35));
    const x = q.x + off.x, z = q.z + off.z;
    if (!insideIsland(x, z, 1.5)) return;
    const st = new THREE.IcosahedronGeometry(0.16 + rnd() * 0.22, 0);
    st.scale(1.2, 0.6, 1);
    bank.push(st.translate(x, heightAt(x, z) + 0.05, z));
  });
  const banks = mesh(faceted(merge(bank), rnd, 0.2), rockMat);
  banks.name = 'creek-banks';
  group.add(banks);

  // A wooden footbridge wherever a path crosses the creek.
  const plank = (len: number, w: number, h: number, x: number, y: number, z: number) => new THREE.BoxGeometry(len, h, w).translate(x, y, z).toNonIndexed();
  const bridgeGeos = crossings().map(({ at, dir }) => {
    const deckY = Math.max(heightAt(at.x - dir.x * 1.6, at.z - dir.z * 1.6), heightAt(at.x + dir.x * 1.6, at.z + dir.z * 1.6)) + 0.22;
    const parts = [plank(3.4, 1.5, 0.12, 0, 0, 0)];
    for (const sz of [-0.72, 0.72]) {
      parts.push(plank(3.4, 0.08, 0.08, 0, 0.62, sz));
      for (const px of [-1.5, 0, 1.5]) parts.push(plank(0.1, 0.1, 0.62, px, 0.31, sz));
    }
    const g = merge(parts.map((q) => { for (const n of Object.keys(q.attributes)) if (n !== 'position') q.deleteAttribute(n); return q; }));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(at.x, deckY, at.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(dir.z, dir.x)), new THREE.Vector3(1, 1, 1)));
    return g;
  });
  if (bridgeGeos.length) {
    const bridge = mesh(faceted(merge(bridgeGeos), rnd, 0.12), material('#9c7350'));
    bridge.name = 'bridge';
    group.add(bridge);
  }

  // Glints on the water that twinkle (still when the visitor asked for less motion).
  const glints: THREE.BufferGeometry[] = [];
  CREEK.getSpacedPoints(60).forEach((q, i, all) => {
    if (i === 0 || i === all.length - 1) return;
    const t = new THREE.Vector3().subVectors(all[i + 1], all[i - 1]).normalize();
    const off = (rnd() - 0.5) * 1.2;
    const x = q.x - t.z * off, z = q.z + t.x * off;
    const g = new THREE.PlaneGeometry(0.34, 0.07).rotateX(-Math.PI / 2).rotateY(rnd() * Math.PI);
    glints.push(g.translate(x, heightAt(q.x, q.z) + 0.2, z).toNonIndexed());
  });
  const glintMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.3, depthWrite: false });
  const glint = new THREE.Mesh(merge(glints.map((g) => { for (const n of Object.keys(g.attributes)) if (n !== 'position') g.deleteAttribute(n); return g; })), glintMat);
  glint.name = 'creek-glints';
  group.add(glint);

  // Clouds drifting around and below the island.
  const cloudMat = material('#ffffff', { transparent: true, opacity: 0.9 });
  const clouds: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const puffs: THREE.BufferGeometry[] = [];
    const n = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const g = new THREE.IcosahedronGeometry(2 + rnd() * 2.2, 0);
      g.scale(1.4, 0.7, 1);
      g.translate(k * 2.6 - n * 1.2, (rnd() - 0.5) * 0.8, (rnd() - 0.5) * 1.5);
      puffs.push(faceted(g, rnd, 0.08));
    }
    const c = mesh(merge(puffs), cloudMat, false);
    const a = rnd() * Math.PI * 2, d = 44 + rnd() * 26;
    c.position.set(Math.cos(a) * d, -8 + rnd() * 26, Math.sin(a) * d);
    c.userData = { a, d, speed: 0.01 + rnd() * 0.015 };
    clouds.push(c);
    group.add(c);
  }

  return {
    group,
    setPalette(next, night) {
      grassMat.color.set(next.grass);
      soilMat.color.set(next.ground);
      rockMat.color.set(next.rock);
      pathMat.color.set(next.path);
      waterMat.color.set(next.water);
      cloudMat.color.set(night ? '#8a90b4' : '#ffffff');
      cloudMat.opacity = night ? 0.55 : 0.9;
    },
    update(t) {
      glintMat.opacity = 0.3 + 0.22 * Math.sin(t * 2.3);
      for (const c of clouds) {
        const { a, d, speed } = c.userData as { a: number; d: number; speed: number };
        const aa = a + t * speed;
        c.position.x = Math.cos(aa) * d;
        c.position.z = Math.sin(aa) * d;
      }
    },
  };
}
