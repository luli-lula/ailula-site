import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Shared helpers for the flat-shaded, low-poly look.

export function rng(seed: number) {
  let s = seed % 233280;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

// Nudge vertices so primitives look hand-made rather than perfect. Shared positions move together,
// so the surface stays closed.
export function jitter(geo: THREE.BufferGeometry, amount: number, rnd: () => number, axes: [number, number, number] = [1, 1, 1]) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const moved = new Map<string, [number, number, number]>();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let d = moved.get(key);
    if (!d) {
      d = [(rnd() - 0.5) * amount * axes[0], (rnd() - 0.5) * amount * axes[1], (rnd() - 0.5) * amount * axes[2]];
      moved.set(key, d);
    }
    p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
  }
  return geo;
}

// Non-indexed geometry with only position + a per-face shade in vertex colours (multiplied by the
// material colour), so many pieces can be merged into one mesh per palette role.
export function faceted(geo: THREE.BufferGeometry, rnd: () => number, spread = 0.12, shade?: (centroid: THREE.Vector3) => number) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name);
  const p = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Vector3();
  for (let f = 0; f < p.count; f += 3) {
    c.set(0, 0, 0);
    for (let k = 0; k < 3; k++) c.add(new THREE.Vector3(p.getX(f + k), p.getY(f + k), p.getZ(f + k)));
    c.multiplyScalar(1 / 3);
    const v = (1 - spread / 2 + rnd() * spread) * (shade ? shade(c) : 1);
    for (let k = 0; k < 3; k++) colors.set([v, v, v], (f + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function merge(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(geos, false);
  if (!g) throw new Error('merge failed: mismatched attributes');
  g.computeBoundingSphere();
  return g;
}

export function placed(geo: THREE.BufferGeometry, pos: THREE.Vector3Like, rotY = 0, scale: number | THREE.Vector3Like = 1) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(pos.x, pos.y, pos.z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
    typeof scale === 'number' ? new THREE.Vector3(scale, scale, scale) : new THREE.Vector3(scale.x, scale.y, scale.z),
  );
  return geo.clone().applyMatrix4(m);
}

export function material(color: string, opts: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, vertexColors: true, roughness: 0.92, metalness: 0, ...opts });
}

export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shadows = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = shadows;
  return m;
}
