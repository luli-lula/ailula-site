import * as THREE from 'three';
import { BloomEffect, DepthOfFieldEffect, EffectComposer, EffectPass, NoiseEffect, BlendFunction, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { CLOUD_LAYER, createAtmosphere } from '../climb/atmosphere';
import { addGroundCover, loadModels } from '../climb/foliage';
import { loadBarkMaterial } from '../climb/trunk';
import { buttress, redwoodTree } from './redwood';

export type Quality = 'high' | 'low';
const MAX_H = 115;
const HERO_HEIGHT = 112;
const HERO_RADIUS = 2.6;

// Camera path: low on the forest floor looking up, then rising beside the trunk (which sits in the
// left third of the frame like a film shot), then out above the cloud layer.
const camY = (h: number) => 1.4 + h * ((CLOUD_LAYER + 14) / MAX_H);
const camAngle = (h: number) => 0.2 + h * 0.012;
// Limbs start ~42% up and reach ~13 m out, so the camera backs away as it reaches the crown.
const camDist = (h: number) => {
  if (h < 8) return 16 - h * 0.5;
  if (h < 34) return 12;
  if (h < 52) return 12 + ((h - 34) / 18) * 14;
  if (h < 104) return 26;
  return 26 + (h - 104) * 2.2;
};
const lookLift = (h: number) => (h < 10 ? 22 - h * 2 : h > 104 ? -4 - (h - 104) * 0.4 : 2);
const fovAt = (h: number) => (h < 10 ? 52 - h * 1.0 : 42);

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

// EZ-Tree gives each trunk section a 0..1 v; re-map to metres so bark texels stay the same size everywhere.
function remapBarkUVs(tree: THREE.Object3D) {
  const mesh = (tree as any).branchesMesh as THREE.Mesh;
  const p = mesh.geometry.attributes.position as THREE.BufferAttribute;
  const uv = mesh.geometry.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) uv.setY(i, (p.getY(i) + Math.hypot(p.getX(i), p.getZ(i))) / 3);
  uv.needsUpdate = true;
}

export function createClimb2(canvas: HTMLCanvasElement, quality: Quality = 'high') {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, depth: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 1.25 : 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // done in the effect pass
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.3, 2500);
  const sunDir = new THREE.Vector3(0.55, 1, -0.35).normalize();

  scene.add(new THREE.HemisphereLight('#dfe9e2', '#3b2c1f', 0.55));
  const sun = new THREE.DirectionalLight('#ffe2b8', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 400 });
  scene.add(sun, sun.target);

  const loader = new THREE.TextureLoader();
  const bark = loadBarkMaterial(loader, new THREE.Vector2(4, 1));
  bark.side = THREE.FrontSide;

  // Hero redwood.
  const hero = redwoodTree({ seed: 7, height: HERO_HEIGHT, radius: HERO_RADIUS, detail: 'hero' }, bark);
  remapBarkUVs(hero);
  scene.add(hero, buttress(HERO_RADIUS, bark));

  // Surrounding grove: a few unique trees, cloned (shared geometry) around the hero.
  const rnd = rng(11);
  const unique = Array.from({ length: quality === 'high' ? 6 : 3 }, (_, i) => {
    const t = redwoodTree({ seed: 100 + i * 17, height: 95 + rnd() * 20, radius: 1.6 + rnd() * 1.6, detail: 'far' }, bark);
    remapBarkUVs(t);
    return t;
  });
  const count = quality === 'high' ? 34 : 16;
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 16 + Math.pow(rnd(), 0.8) * 110;
    const src = unique[i % unique.length];
    const t = src.clone();
    const k = 0.85 + rnd() * 0.3;
    t.scale.setScalar(k);
    t.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
    t.rotation.y = rnd() * Math.PI * 2;
    scene.add(t);
    const r = ((src as any).options.branch.radius[0] as number) * k;
    const b = buttress(r, bark);
    b.position.copy(t.position);
    scene.add(b);
  }

  // Forest floor: needle litter texture, ferns.
  const tex = (n: string, srgb = false) => {
    const t = loader.load(`/assets/ground/forest_floor_${n}_1k.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(60, 60);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(400, 64),
    new THREE.MeshStandardMaterial({ map: tex('diff', true), normalMap: tex('nor_gl'), roughnessMap: tex('rough'), color: '#c9b6a2' }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const atmosphere = createAtmosphere(scene, renderer, sunDir);
  // EZ-Tree leaf materials sway with a uTime uniform; collect them once.
  const windMaterials: THREE.Material[] = [];
  scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m && m.name === 'leaves' && !windMaterials.includes(m)) windMaterials.push(m);
  });
  const models = loadModels().then((m) => {
    addGroundCover(scene, m.fern, quality === 'high' ? 220 : 80);
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o !== ground) o.castShadow = o.receiveShadow = true;
    });
  });

  // Post-processing: AO grounds the trunks, DOF and grain make it read as a photograph.
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));
  if (quality === 'high') {
    const ao = new N8AOPostPass(scene, camera, 1, 1);
    ao.configuration.aoRadius = 3;
    ao.configuration.distanceFalloff = 1.5;
    ao.configuration.intensity = 2.5;
    ao.configuration.halfRes = true;
    composer.addPass(ao);
  }
  const dof = new DepthOfFieldEffect(camera, { worldFocusDistance: 12, worldFocusRange: 10, bokehScale: quality === 'high' ? 2.5 : 0 });
  const effects = [
    new BloomEffect({ intensity: 0.35, luminanceThreshold: 0.8, mipmapBlur: true }),
    ...(quality === 'high' ? [dof] : []),
    new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
    new VignetteEffect({ offset: 0.3, darkness: 0.55 }),
    new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false }),
  ];
  (effects.at(-1) as NoiseEffect).blendMode.opacity.value = 0.08;
  composer.addPass(new EffectPass(camera, ...effects));

  let target = 0, current = 0;
  const look = new THREE.Vector3();
  const right = new THREE.Vector3();
  const place = (h: number) => {
    const a = camAngle(h), d = camDist(h), y = camY(h);
    camera.position.set(Math.cos(a) * d, y, Math.sin(a) * d);
    // Aim a little to the right of the trunk so it sits in the left third of the frame.
    right.set(Math.sin(a), 0, -Math.cos(a));
    look.set(0, y + lookLift(h), 0).addScaledVector(right, h < 10 ? 0 : 4.5);
    camera.lookAt(look);
    if (Math.abs(camera.fov - fovAt(h)) > 0.01) {
      camera.fov = fovAt(h);
      camera.updateProjectionMatrix();
    }
    dof.cocMaterial.worldFocusDistance = Math.max(6, d - 1);
    // Keep the shadow box centred on what the camera sees.
    sun.target.position.set(0, y, 0);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 150);
  };

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  let raf = 0, frames = 0, fps = 0, last = performance.now();
  const clock = new THREE.Clock();
  const tick = () => {
    current += (target - current) * 0.08;
    place(current);
    const tSec = clock.getElapsedTime();
    atmosphere.update(camera.position.y, tSec);
    // This grove needs more visibility than the v1 fog curve: thin it out below the canopy.
    const fog = scene.fog as THREE.FogExp2;
    if (camera.position.y < CLOUD_LAYER - 20) fog.density *= 0.45;
    for (const m of windMaterials) {
      const sh = m.userData.shader;
      if (sh?.uniforms?.uTime) sh.uniforms.uTime.value = tSec;
    }
    composer.render();
    frames++;
    const now = performance.now();
    if (now - last > 1000) { fps = (frames * 1000) / (now - last); frames = 0; last = now; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    ready: Promise.all([atmosphere.ready, models]).then(() => undefined),
    setHeight(m: number) { target = Math.min(MAX_H, Math.max(0, m)); },
    resize,
    fps: () => fps,
    dispose() { cancelAnimationFrame(raf); composer.dispose(); renderer.dispose(); },
  };
}
