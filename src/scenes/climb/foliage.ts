import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TRUNK_HEIGHT, trunkRadiusAt } from './trunk';

export interface Models {
  fern: THREE.Object3D;
  fir: THREE.Object3D;
}

export async function loadModels(): Promise<Models> {
  const loader = new GLTFLoader();
  const [fern, fir] = await Promise.all([
    loader.loadAsync('/assets/fern_02/fern_02_1k.gltf'),
    loader.loadAsync('/assets/fir_sapling/fir_sapling_1k.gltf'),
  ]);
  for (const g of [fern.scene, fir.scene]) {
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m) m.side = THREE.DoubleSide;
    });
  }
  // fir_sapling ships three variants side by side; keep the first as the spray template.
  const spray = fir.scene.getObjectByName('fir_sapling_a') ?? fir.scene;
  return { fern: fern.scene, fir: spray };
}

function normalised(template: THREE.Object3D, size: number): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(template);
  const dim = box.getSize(new THREE.Vector3());
  const k = size / Math.max(dim.x, dim.y, dim.z);
  const holder = new THREE.Group();
  const c = template.clone();
  c.position.set(0, 0, 0);
  c.scale.setScalar(k);
  holder.add(c);
  return holder;
}

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

export function addGroundCover(scene: THREE.Scene, fern: THREE.Object3D, count: number): void {
  const rnd = rng(17);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 6 + Math.pow(rnd(), 0.7) * 40;
    const f = normalised(fern, 0.9 + rnd() * 1.1);
    f.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    f.rotation.y = rnd() * Math.PI * 2;
    scene.add(f);
  }
}

export interface Limb {
  id: string;
  height: number;
  angle: number;
  tip: THREE.Vector3;
}

// A horizontal limb with a foliage spray at its tip. Redwood limbs droop slightly toward the end.
function addLimb(scene: THREE.Scene, material: THREE.Material, fir: THREE.Object3D, height: number, angle: number, length: number, rnd: () => number): THREE.Vector3 {
  const r0 = trunkRadiusAt(height, angle) * 0.92;
  const start = new THREE.Vector3(Math.cos(angle) * r0, height, Math.sin(angle) * r0);
  const dir = new THREE.Vector3(Math.cos(angle), -0.16, Math.sin(angle)).normalize();
  const tip = start.clone().addScaledVector(dir, length);

  const thick = 0.12 + length * 0.025;
  const geo = new THREE.CylinderGeometry(thick * 0.35, thick, length, 10, 1);
  geo.translate(0, length / 2, 0);
  const limb = new THREE.Mesh(geo, material);
  limb.position.copy(start);
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  scene.add(limb);

  for (let k = 0; k < 5; k++) {
    const spray = normalised(fir, length * (0.5 + rnd() * 0.3));
    const along = 0.3 + k * 0.17;
    spray.position.copy(start).addScaledVector(dir, length * along);
    // Lay the sapling on its side so it reads as a flat spray hanging off the limb.
    spray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dir.x, -0.35, dir.z).normalize());
    spray.rotateY(rnd() * Math.PI);
    scene.add(spray);
  }
  return tip;
}

export function addBranches(
  scene: THREE.Scene,
  barkMaterial: THREE.Material,
  fir: THREE.Object3D,
  specs: { id: string; height: number; angle: number }[],
  cameraAngleAt: (worldY: number) => number,
): Limb[] {
  const rnd = rng(29);
  const limbs: Limb[] = specs.map((s) => ({
    ...s,
    tip: addLimb(scene, barkMaterial, fir, s.height, s.angle, s.height > 95 ? Math.max(4, 2 + (TRUNK_HEIGHT - s.height) * 0.25) : 7 + rnd() * 2, rnd),
  }));

  // Unlabelled limbs: sparse low down (redwoods self-prune), dense in the crown.
  for (let i = 0; i < 90; i++) {
    const t = Math.pow(rnd(), 0.45);
    const h = 25 + t * (TRUNK_HEIGHT - 27);
    const len = h > 95 ? 2 + (TRUNK_HEIGHT - h) * 0.12 : 4 + rnd() * 4;
    const angle = rnd() * Math.PI * 2;
    // Keep the camera's climbing path clear so it never flies through foliage.
    const gap = Math.atan2(Math.sin(angle - cameraAngleAt(h)), Math.cos(angle - cameraAngleAt(h)));
    if (Math.abs(gap) < 0.7 && h < 108) continue;
    addLimb(scene, barkMaterial, fir, h, angle, len, rnd);
  }
  const top = normalised(fir, 10);
  top.position.set(0, TRUNK_HEIGHT - 7, 0);
  scene.add(top);
  return limbs;
}

// Neighbouring crowns that poke through the sea of fog.
export function addDistantCrowns(scene: THREE.Scene, fir: THREE.Object3D, cloudY: number): void {
  const rnd = rng(41);
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 45 + rnd() * 260;
    const c = normalised(fir, 30 + rnd() * 16);
    c.position.set(Math.cos(a) * d, cloudY - 8 + rnd() * 6, Math.sin(a) * d);
    c.rotation.y = rnd() * Math.PI;
    scene.add(c);
  }
}
