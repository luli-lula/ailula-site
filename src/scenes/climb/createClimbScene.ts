import * as THREE from 'three';
import { yearToHeight } from '../../lib/timeline';
import { CLOUD_LAYER, createAtmosphere } from './atmosphere';
import { addBranches, addDistantCrowns, addGroundCover, loadModels, type Limb } from './foliage';
import { createForestTrunks, createTrunk, loadBarkMaterial } from './trunk';

export type BranchSpec = { id: string; year: number; side: 'left' | 'right'; kind: 'experience' | 'project' | 'post' };
export type Quality = 'high' | 'low';

export interface ClimbScene {
  setHeight(m: number): void;
  anchor(id: string): { x: number; y: number; visible: boolean };
  resize(): void;
  dispose(): void;
  ready: Promise<void>;
  fps(): number;
}

const MAX_H = 115;

// Camera path: start on the forest floor looking up, spiral up the trunk, break out above the fog.
export const worldY = (h: number) => 1.7 + h * ((CLOUD_LAYER + 17) / MAX_H);
const cameraAngle = (h: number) => 0.3 + h * 0.018;
const heightAtWorldY = (y: number) => (y - 1.7) / ((CLOUD_LAYER + 17) / MAX_H);
const cameraDistance = (h: number) => {
  const t = h / MAX_H;
  return t > 0.9 ? 11 + (t - 0.9) * 180 : 16 - t * 5;
};
const lookLift = (h: number) => (h < 12 ? 18 - h * 1.3 : h > 108 ? -3 : 2.4);

export function limbAngle(spec: BranchSpec): number {
  const a = cameraAngle(yearToHeight(spec.year));
  return spec.side === 'right' ? a - 0.85 : a + 0.85;
}

export function createClimbScene(canvas: HTMLCanvasElement, branches: BranchSpec[], quality: Quality = 'high'): ClimbScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 1.5 : 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
  const sunDir = new THREE.Vector3(0.45, 1, -0.55).normalize();

  scene.add(new THREE.HemisphereLight('#e3ece6', '#3a2a1d', 0.7));
  const sun = new THREE.DirectionalLight('#ffe0b5', 2.4);
  sun.position.copy(sunDir).multiplyScalar(200);
  scene.add(sun);

  const loader = new THREE.TextureLoader();
  const bark = loadBarkMaterial(loader, new THREE.Vector2(5, 1));
  scene.add(createTrunk(bark));
  const forestBark = loadBarkMaterial(loader, new THREE.Vector2(2, 20));
  scene.add(createForestTrunks(forestBark, quality === 'high' ? 70 : 30));

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(800, 64),
    new THREE.MeshStandardMaterial({ color: '#2c2118', roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const atmosphere = createAtmosphere(scene, renderer, sunDir);

  let limbs: Limb[] = [];
  const models = loadModels().then((m) => {
    addGroundCover(scene, m.fern, quality === 'high' ? 90 : 35);
    limbs = addBranches(
      scene,
      bark,
      m.fir,
      branches.map((b) => ({ id: b.id, height: worldY(yearToHeight(b.year)) + 1.5, angle: limbAngle(b) })),
      (y) => cameraAngle(heightAtWorldY(y)),
    );
    addDistantCrowns(scene, m.fir, CLOUD_LAYER);
  });

  let target = 0;
  let current = 0;
  const look = new THREE.Vector3();
  const place = (h: number) => {
    const a = cameraAngle(h);
    const d = cameraDistance(h);
    const y = worldY(h);
    camera.position.set(Math.cos(a) * d, y, Math.sin(a) * d);
    look.set(0, y + lookLift(h), 0);
    camera.lookAt(look);
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  let frames = 0;
  let fps = 0;
  let last = performance.now();
  let raf = 0;
  const clock = new THREE.Clock();
  const tick = () => {
    current += (target - current) * 0.08;
    place(current);
    atmosphere.update(camera.position.y, clock.getElapsedTime());
    renderer.render(scene, camera);
    frames++;
    const now = performance.now();
    if (now - last > 1000) {
      fps = (frames * 1000) / (now - last);
      frames = 0;
      last = now;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const v = new THREE.Vector3();
  return {
    ready: Promise.all([atmosphere.ready, models]).then(() => undefined),
    setHeight(m) {
      target = Math.min(MAX_H, Math.max(0, m));
    },
    anchor(id) {
      const limb = limbs.find((l) => l.id === id);
      if (!limb) return { x: 0, y: 0, visible: false };
      v.copy(limb.tip).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      return { x: ((v.x + 1) / 2) * canvas.clientWidth, y: ((1 - v.y) / 2) * canvas.clientHeight, visible };
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      renderer.dispose();
    },
    fps: () => fps,
  };
}
