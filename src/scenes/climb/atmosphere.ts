import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// Height-dependent fog, light shafts, the sea of fog and the sky above it.
export const CLOUD_LAYER = 104;

const FOREST_FOG = new THREE.Color('#aeb9ae');
const DAWN_FOG = new THREE.Color('#c9cfc4');
const CLOUD_FOG = new THREE.Color('#e8ebe8');

export function fogDensityAt(h: number): number {
  if (h < 8) return 0.016;
  if (h < 70) return 0.016 + ((h - 8) / 62) * 0.008;
  if (h < CLOUD_LAYER) return 0.024 + ((h - 70) / (CLOUD_LAYER - 70)) * 0.04;
  if (h < CLOUD_LAYER + 6) return 0.064 - ((h - CLOUD_LAYER) / 6) * 0.062;
  return 0.0015;
}

function shaftMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: 0.16 }, uColor: { value: new THREE.Color('#fff2d6') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
        float len = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        gl_FragColor = vec4(uColor, edge * len * uOpacity);
      }`,
  });
}

function cloudMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uColor: { value: CLOUD_FOG.clone() } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vWorld;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uColor; varying vec2 vUv; varying vec3 vWorld;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
      void main() {
        vec2 p = vWorld.xz * 0.012 + vec2(uTime * 0.004, uTime * 0.002);
        float n = fbm(p);
        float dist = length(vWorld.xz);
        float fade = 1.0 - smoothstep(900.0, 1400.0, dist);
        float a = 0.93 + 0.07 * smoothstep(0.3, 0.7, n);
        vec3 col = mix(uColor, vec3(1.0, 0.97, 0.92), smoothstep(0.3, 0.8, n));
        gl_FragColor = vec4(col, a * fade);
      }`,
  });
}

export interface Atmosphere {
  update(cameraY: number, time: number): void;
  ready: Promise<void>;
}

export function createAtmosphere(scene: THREE.Scene, renderer: THREE.WebGLRenderer, sunDir: THREE.Vector3): Atmosphere {
  scene.fog = new THREE.FogExp2(FOREST_FOG.getHex(), fogDensityAt(0));
  scene.background = FOREST_FOG.clone();

  // Light shafts slanting down from the sun through the forest.
  const shafts = new THREE.Group();
  const mat = shaftMaterial();
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, -0.5, 0);
  for (let i = 0; i < 9; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    const w = 3 + Math.random() * 5;
    mesh.scale.set(w, 140, 1);
    mesh.position.set(-30 + i * 9 + Math.random() * 6, 95, -18 - Math.random() * 30);
    mesh.lookAt(mesh.position.clone().add(new THREE.Vector3(0, 0, 1)));
    mesh.rotation.z = Math.atan2(sunDir.x, sunDir.y) * 0.6;
    shafts.add(mesh);
  }
  scene.add(shafts);

  // Sea of fog: seen from below as a ceiling, from above as a cloud floor.
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 1, 1), cloudMaterial());
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.y = CLOUD_LAYER + 2;
  clouds.renderOrder = 2;
  scene.add(clouds);
  const underside = clouds.clone();
  underside.position.y = CLOUD_LAYER - 2;
  scene.add(underside);

  let sky: THREE.Texture | null = null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const ready = new HDRLoader()
    .loadAsync('/assets/sky/kloofendal_38d_partly_cloudy_puresky_1k.hdr')
    .then((hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      sky = hdr;
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      scene.environmentIntensity = 0.55;
    });

  const fog = scene.fog as THREE.FogExp2;
  const tmp = new THREE.Color();

  return {
    ready,
    update(cameraY, time) {
      fog.density = fogDensityAt(cameraY);
      const above = cameraY > CLOUD_LAYER + 3;
      if (cameraY < 30) tmp.copy(DAWN_FOG).lerp(FOREST_FOG, cameraY / 30);
      else tmp.copy(FOREST_FOG).lerp(CLOUD_FOG, Math.min(1, Math.max(0, (cameraY - 60) / (CLOUD_LAYER - 60))));
      fog.color.copy(tmp);
      scene.background = above && sky ? sky : tmp.clone();
      scene.backgroundIntensity = above ? 1.5 : 1;
      scene.environmentIntensity = above ? 1.0 : 0.55;
      (clouds.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
      // The cloud planes ignore fog, so only show them once the climber is close to the layer.
      clouds.visible = underside.visible = cameraY > CLOUD_LAYER - 10;
      const shaftFade = 1 - Math.min(1, Math.max(0, (cameraY - 55) / 40));
      mat.uniforms.uOpacity.value = 0.16 * shaftFade;
      shafts.visible = shaftFade > 0.01;
    },
  };
}
