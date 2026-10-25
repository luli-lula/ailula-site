import * as THREE from 'three';

// The hero redwood: tapered, fluted, with a flared root base. Units are metres.
export const TRUNK_HEIGHT = 118;
const BASE_RADIUS = 4.5;
const TOP_RADIUS = 0.15;

export function trunkRadiusAt(y: number, angle = 0): number {
  const t = Math.min(1, Math.max(0, y / TRUNK_HEIGHT));
  const taper = BASE_RADIUS + (TOP_RADIUS - BASE_RADIUS) * Math.pow(t, 1.6);
  const flare = 1 + 0.75 * Math.exp(-y / 2.2) * (0.75 + 0.25 * Math.sin(angle * 5 + 0.7));
  const fluting = 1 + 0.035 * Math.sin(angle * 13 + y * 0.05) + 0.02 * Math.sin(angle * 29 - y * 0.11);
  return taper * flare * fluting;
}

export function loadBarkMaterial(loader: THREE.TextureLoader, repeat: THREE.Vector2): THREE.MeshStandardMaterial {
  const tex = (name: string, srgb = false) => {
    const t = loader.load(`/assets/bark/metasequoia_bark_${name}_2k.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.copy(repeat);
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return new THREE.MeshStandardMaterial({
    map: tex('diff', true),
    normalMap: tex('nor_gl'),
    normalScale: new THREE.Vector2(1.4, 1.4),
    roughnessMap: tex('rough'),
    aoMap: tex('ao'),
    aoMapIntensity: 1.0,
    color: new THREE.Color('#e9c3ad'), // nudge metasequoia toward coast-redwood red
  });
}

export function createTrunkGeometry(radialSegments = 128, heightSegments = 360): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(1, 1, TRUNK_HEIGHT, radialSegments, heightSegments, true);
  geo.translate(0, TRUNK_HEIGHT / 2, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = pos.getY(i);
    const angle = Math.atan2(z, x);
    const r = trunkRadiusAt(y, angle);
    pos.setXYZ(i, Math.cos(angle) * r, y, Math.sin(angle) * r);
    // Keep texel size roughly constant as the trunk tapers: v runs in metres.
    uv.setY(i, y / 3);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createTrunk(material: THREE.MeshStandardMaterial): THREE.Mesh {
  const mesh = new THREE.Mesh(createTrunkGeometry(), material);
  mesh.name = 'hero-trunk';
  return mesh;
}

// Cheaper trunks for the surrounding forest; fog does most of the work at distance.
export function createForestTrunks(material: THREE.Material, count: number, seed = 3): THREE.InstancedMesh {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  // Columnar trunk that only narrows to a point in its top 15%, where the fog hides it.
  const geo = new THREE.CylinderGeometry(1, 1, 1, 24, 12, true);
  geo.translate(0, 0.5, 0);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = y < 0.85 ? 1 - 0.45 * y : (1 - 0.45 * 0.85) * (1 - (y - 0.85) / 0.15) + 0.02;
    p.setX(i, p.getX(i) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(geo, material, count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 18 + rnd() * 160;
    const r = 1.6 + rnd() * 2.8;
    const h = 98 + rnd() * 5; // pointed tops vanish into the densest fog just under the cloud layer
    m.compose(
      new THREE.Vector3(Math.cos(a) * d, -1, Math.sin(a) * d),
      new THREE.Quaternion(),
      new THREE.Vector3(r, h, r),
    );
    mesh.setMatrixAt(i, m);
  }
  return mesh;
}
