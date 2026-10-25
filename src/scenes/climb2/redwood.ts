import * as THREE from 'three';
import { Tree } from '@dgreenheck/ez-tree';

// Coast-redwood shape on top of EZ-Tree's evergreen mode:
// a straight, barely tapering trunk; no limbs on the lower ~40% (redwoods self-prune);
// short, slightly drooping limbs; a narrow crown. Units are metres.
export interface RedwoodOptions { seed: number; height: number; radius: number; detail: 'hero' | 'far' }

export function redwoodTree(o: RedwoodOptions, bark: THREE.MeshStandardMaterial): Tree {
  const t = new Tree();
  const opt = t.options as any;
  opt.seed = o.seed;
  opt.type = 'evergreen';
  opt.bark.type = 'pine';
  opt.bark.textured = true;
  opt.branch.levels = 2;
  opt.branch.length = { 0: o.height, 1: o.height * 0.12, 2: o.height * 0.045, 3: 1 };
  opt.branch.radius = { 0: o.radius, 1: o.radius * 0.07, 2: o.radius * 0.035, 3: 0.1 };
  opt.branch.start = { 1: 0.42, 2: 0.25, 3: 0.3 };
  // Angle > 90° points the limb slightly downwards from the trunk.
  opt.branch.angle = { 1: 98, 2: 45, 3: 60 };
  opt.branch.children = { 0: o.detail === 'hero' ? 120 : 60, 1: o.detail === 'hero' ? 5 : 3, 2: 0 };
  opt.branch.gnarliness = { 0: 0.015, 1: 0.12, 2: 0.2, 3: 0 };
  opt.branch.force = { direction: { x: 0, y: 1, z: 0 }, strength: 0.002 };
  opt.branch.sections = { 0: o.detail === 'hero' ? 48 : 16, 1: 6, 2: 4, 3: 3 };
  opt.branch.segments = { 0: o.detail === 'hero' ? 40 : 14, 1: 5, 2: 3, 3: 3 };
  opt.branch.taper = { 0: 0.85, 1: 0.8, 2: 0.7, 3: 0.7 };
  opt.leaves.type = 'pine';
  opt.leaves.billboard = 'double';
  opt.leaves.count = o.detail === 'hero' ? 9 : 6;
  opt.leaves.start = 0.1;
  opt.leaves.size = o.height * 0.03;
  opt.leaves.sizeVariance = 0.35;
  opt.leaves.angle = 30;
  opt.leaves.tint = 0x8fa37c;
  opt.leaves.alphaTest = 0.45;
  t.generate();

  // Swap EZ-Tree's Phong bark for our physically based redwood bark (shared across trees).
  const branches = (t as any).branchesMesh as THREE.Mesh;
  (branches.material as THREE.Material).dispose();
  branches.material = bark;
  branches.castShadow = branches.receiveShadow = true;
  const leaves = (t as any).leavesMesh as THREE.Mesh;
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  return t;
}

// Redwood trunks flare and buttress at the ground: a lobed skirt hides EZ-Tree's plain cylinder base.
export function buttress(radius: number, material: THREE.Material): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius * 1.02, radius * 1.9, radius * 2.2, 64, 8, true);
  geo.translate(0, radius * 1.1, 0);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + 0.12 * Math.sin(a * 5 + 0.6) * (1 - y / (radius * 2.2)) + 0.04 * Math.sin(a * 13);
    p.setXYZ(i, x * k, y, z * k);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}
