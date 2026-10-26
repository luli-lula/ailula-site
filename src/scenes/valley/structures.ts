import * as THREE from 'three';
import type { Part } from './createValley';
import { heightAt, PATHS } from './island';
import { faceted, jitter, material, merge, mesh, rng } from './lowpoly';
import type { Palette, Season } from './palette';
import { trunkRadius } from './sequoia';
import { ZONES, type ZoneId } from './zones';

// Built places in the valley. Every one is a clickable section of the site.

const WOOD = '#a57a52';
const DARK_WOOD = '#5a4438';
const ROOF = '#6b4f45';
const WINDOW = '#ffd38a';

const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z).toNonIndexed();
const strip = (g: THREE.BufferGeometry) => {
  for (const n of Object.keys(g.attributes)) if (n !== 'position') g.deleteAttribute(n);
  return g.index ? g.toNonIndexed() : g;
};
// A gable roof: a triangular prism with its ridge along x.
function gable(length: number, width: number, height: number) {
  const shape = new THREE.Shape([new THREE.Vector2(-width / 2, 0), new THREE.Vector2(width / 2, 0), new THREE.Vector2(0, height)]);
  const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  g.translate(0, 0, -length / 2);
  g.rotateY(Math.PI / 2);
  return g;
}
const zoneAt = (id: ZoneId) => {
  const t = ZONES.find((z) => z.id === id)!.view.target;
  return new THREE.Vector3(t[0], heightAt(t[0], t[2]), t[2]);
};
const facing = (from: THREE.Vector3) => Math.atan2(-from.x, -from.z); // turn the front (+z) towards the sequoia

// The three garden beds change with the seasons: seedlings in spring; lettuce, carrots, staked tomatoes
// and squash in summer; cabbages, carrots and pumpkins in autumn; straw and snow in winter. Sunflowers
// grow along the side. Everything of one colour is merged into one mesh per season.
const CROP = { leaf: '#6c9a55', sprout: '#9cc46a', purple: '#7a4f8a', carrotTop: '#5e8f45', orange: '#e3812b', red: '#d2402f', yellow: '#f2c230', stalk: '#6f8a3a', seed: '#5b3a1e', straw: '#d8c58a', snow: '#f4f6f8', stake: '#8a6a45' };
type CropColour = keyof typeof CROP;
function buildCrops(rnd: () => number): Record<Season, THREE.Group> {
  const BED_X = [-2.6, 0, 2.6], TOP = 0.5;
  const season = (parts: Partial<Record<CropColour, THREE.BufferGeometry[]>>) => {
    const grp = new THREE.Group();
    for (const [c, geos] of Object.entries(parts)) if (geos!.length) grp.add(mesh(faceted(merge(geos!.map(strip)), rnd, 0.18), material(CROP[c as CropColour])));
    return grp;
  };
  const rows = (x: number, n: number, f: (px: number, pz: number) => void) => {
    for (let r = 0; r < 2; r++) for (let k = 0; k < n; k++) f(x + (r - 0.5) * 0.9 + (rnd() - 0.5) * 0.15, -1 + (k - (n - 1) / 2) * (3.2 / n));
  };
  const ball = (r: number, x: number, y: number, z: number, sy = 1) => new THREE.IcosahedronGeometry(r, 0).scale(1, sy, 1).translate(x, y, z);
  const cone = (r: number, h: number, x: number, y: number, z: number, seg = 5) => new THREE.ConeGeometry(r, h, seg).translate(x, y + h / 2, z);
  const stick = (h: number, x: number, z: number, w = 0.06) => new THREE.BoxGeometry(w, h, w).translate(x, TOP + h / 2, z);
  const sunflower = (x: number, z: number, h: number, droop: boolean, out: Partial<Record<CropColour, THREE.BufferGeometry[]>>) => {
    out.stalk!.push(stick(h, x, z, 0.08));
    const head = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10).rotateX(droop ? 0.4 : Math.PI / 2 - 0.2).translate(x, TOP + h, z + 0.1);
    const centre = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 8).rotateX(droop ? 0.4 : Math.PI / 2 - 0.2).translate(x, TOP + h - 0.01, z + 0.14);
    (droop ? out.seed! : out.yellow!).push(head);
    out.seed!.push(centre);
  };
  const SIDE = [-2.4, -1.2, 0, 1.2];

  const spring = { sprout: [] as THREE.BufferGeometry[], leaf: [] as THREE.BufferGeometry[], carrotTop: [] as THREE.BufferGeometry[], stake: [] as THREE.BufferGeometry[], stalk: [] as THREE.BufferGeometry[] };
  rows(BED_X[0], 5, (x, z) => spring.leaf.push(ball(0.16, x, TOP + 0.1, z, 0.6)));
  rows(BED_X[1], 7, (x, z) => spring.carrotTop.push(cone(0.06, 0.25, x, TOP, z, 4)));
  rows(BED_X[2], 4, (x, z) => { spring.sprout.push(cone(0.12, 0.22, x, TOP, z)); });
  for (const z of [-2.2, -1, 0.2]) spring.stake.push(stick(1.3, BED_X[1] + 0.95, z));
  for (const z of SIDE) spring.stalk.push(stick(0.5, 4.2, z, 0.06));

  const summer = { leaf: [] as THREE.BufferGeometry[], carrotTop: [] as THREE.BufferGeometry[], orange: [] as THREE.BufferGeometry[], stake: [] as THREE.BufferGeometry[], red: [] as THREE.BufferGeometry[], yellow: [] as THREE.BufferGeometry[], stalk: [] as THREE.BufferGeometry[], seed: [] as THREE.BufferGeometry[] };
  rows(BED_X[0], 4, (x, z) => summer.leaf.push(ball(0.34 + rnd() * 0.08, x, TOP + 0.22, z, 0.7)));
  rows(BED_X[1], 6, (x, z) => { summer.carrotTop.push(cone(0.12, 0.45, x, TOP, z, 4)); summer.orange.push(ball(0.08, x, TOP + 0.02, z)); });
  for (const z of [-2.2, -1, 0.2]) {
    summer.stake.push(stick(1.5, BED_X[2], z));
    summer.leaf.push(ball(0.38, BED_X[2], TOP + 0.9, z, 1.3));
    for (let k = 0; k < 4; k++) summer.red.push(ball(0.11, BED_X[2] + (rnd() - 0.5) * 0.6, TOP + 0.5 + rnd() * 0.9, z + (rnd() - 0.5) * 0.5));
  }
  for (let k = 0; k < 3; k++) summer.yellow.push(ball(0.09, BED_X[2] + 0.75, TOP + 0.15, -2 + k * 1.2));
  for (const z of SIDE) sunflower(4.2, z, 1.9 + rnd() * 0.4, false, summer);

  const autumn = { leaf: [] as THREE.BufferGeometry[], purple: [] as THREE.BufferGeometry[], carrotTop: [] as THREE.BufferGeometry[], orange: [] as THREE.BufferGeometry[], stake: [] as THREE.BufferGeometry[], stalk: [] as THREE.BufferGeometry[], seed: [] as THREE.BufferGeometry[] };
  rows(BED_X[0], 4, (x, z) => (rnd() < 0.5 ? autumn.purple : autumn.leaf).push(ball(0.36, x, TOP + 0.24, z, 0.75)));
  rows(BED_X[1], 5, (x, z) => { autumn.carrotTop.push(cone(0.1, 0.35, x, TOP, z, 4)); autumn.orange.push(ball(0.09, x, TOP + 0.02, z)); });
  for (const [x, z, r] of [[-0.3, -2.1, 0.42], [0.35, -1, 0.5], [-0.25, 0.2, 0.38]]) autumn.orange.push(ball(r, BED_X[2] + x, TOP + r * 0.55, z, 0.7));
  autumn.leaf.push(ball(0.3, BED_X[2] + 0.5, TOP + 0.15, -0.4, 0.4));
  for (const z of SIDE) sunflower(4.2, z, 1.7 + rnd() * 0.3, true, autumn);

  const winter = { straw: [] as THREE.BufferGeometry[], snow: [] as THREE.BufferGeometry[], stake: [] as THREE.BufferGeometry[] };
  for (const x of BED_X) {
    winter.straw.push(new THREE.BoxGeometry(1.9, 0.12, 3.5).translate(x, TOP + 0.06, -1));
    winter.snow.push(new THREE.BoxGeometry(1.7, 0.08, 3.2).translate(x, TOP + 0.16, -1.05));
  }
  for (const z of SIDE) winter.stake.push(stick(0.9, 4.2, z, 0.07));

  return { spring: season(spring), summer: season(summer), autumn: season(autumn), winter: season(winter) };
}

export function createStructures(p: Palette, ctx: { quality: 'high' | 'low'; season: Season }): Part {
  const rnd = rng(2025);
  const group = new THREE.Group();
  group.name = 'structures';
  const woodMat = material(WOOD);
  const darkMat = material(DARK_WOOD);
  const roofMat = material(ROOF);
  const glowMat = material(WINDOW, { emissive: WINDOW, emissiveIntensity: 0.2 });
  const picks: { object: THREE.Object3D; zone: ZoneId }[] = [];
  const nightLights: THREE.PointLight[] = [];
  const addLight = (pos: THREE.Vector3, intensity: number, distance: number) => {
    if (ctx.quality === 'low') return;
    const l = new THREE.PointLight('#ffc278', 0, distance, 1.6);
    l.position.copy(pos);
    l.userData.on = intensity;
    nightLights.push(l);
    group.add(l);
  };

  // Workshop: a small cabin with a workbench and a glowing window — the projects.
  {
    const at = zoneAt('workshop');
    const g = new THREE.Group();
    g.position.copy(at);
    g.rotation.y = facing(at);
    const walls = faceted(strip(box(4.6, 2.6, 3.6)), rnd, 0.12, (c) => (Math.abs(c.y % 0.5) < 0.25 ? 1 : 0.9));
    const roof = gable(5.4, 4.4, 1.9).translate(0, 2.6, 0);
    const chimney = box(0.6, 1.6, 0.6, 1.3, 3, -0.6);
    const door = box(0.9, 1.7, 0.1, -0.8, 0, 1.82);
    const win = box(1.1, 0.8, 0.1, 1.1, 1.1, 1.82);
    const bench = merge([box(2.2, 0.12, 0.8, 0, 0.85, 2.9), box(0.12, 0.85, 0.7, -1, 0, 2.9), box(0.12, 0.85, 0.7, 1, 0, 2.9)].map(strip));
    g.add(mesh(walls, woodMat), mesh(faceted(strip(roof), rnd, 0.1), roofMat), mesh(faceted(strip(chimney), rnd, 0.1), material('#8d8378')));
    g.add(mesh(faceted(strip(door), rnd, 0), darkMat), mesh(faceted(strip(win), rnd, 0), glowMat, false), mesh(faceted(bench, rnd, 0.1), darkMat));
    group.add(g);
    picks.push({ object: g, zone: 'workshop' });
    addLight(at.clone().add(new THREE.Vector3(0, 2, 0)), 14, 14);
  }

  // Garden: raised beds and a writing hut — the writing.
  {
    const at = zoneAt('garden');
    const g = new THREE.Group();
    g.position.copy(at);
    g.rotation.y = facing(at);
    const beds = [0, 1, 2].map((i) => strip(box(2, 0.5, 3.6, (i - 1) * 2.6, 0, -1)));
    g.add(mesh(faceted(merge(beds), rnd, 0.12), darkMat));
    for (const [season, crops] of Object.entries(buildCrops(rnd))) {
      crops.name = `crops-${season}`;
      crops.visible = season === ctx.season;
      g.add(crops);
    }
    // The writing hut, after the lodge Virginia Woolf wrote in at the end of her garden: plank walls, a
    // mossy roof, a door and one window that glows at night.
    const hutAt = 2.4;
    const walls = faceted(strip(box(2.8, 2, 2.2, 0, 0, hutAt)), rnd, 0.1, (c) => (Math.abs(c.y % 0.4) < 0.2 ? 1 : 0.88));
    const hutRoof = faceted(strip(gable(3.3, 2.8, 1.2).translate(0, 2, hutAt)), rnd, 0.12);
    const hutDoor = faceted(strip(box(0.7, 1.45, 0.08, -0.7, 0, hutAt + 1.12)), rnd, 0);
    const hutWindow = faceted(strip(box(0.85, 0.6, 0.08, 0.55, 0.9, hutAt + 1.12)), rnd, 0);
    const step = faceted(strip(box(0.9, 0.12, 0.4, -0.7, 0, hutAt + 1.35)), rnd, 0.1);
    const windowMat = material('#45545c', { emissive: WINDOW, emissiveIntensity: 0 });
    g.add(mesh(walls, material('#b98d62')), mesh(hutRoof, material('#5f6e4c')), mesh(merge([hutDoor, step]), darkMat), mesh(hutWindow, windowMat, false));
    g.name = 'garden';
    group.add(g);
    picks.push({ object: g, zone: 'garden' });
    group.userData.hutWindow = windowMat;
    addLight(at.clone().add(new THREE.Vector3(0, 1.5, 0)), 10, 12);
  }

  // Greenhouse: a large glasshouse full of plants — the plant work (Floradex, WildCard, Wild Ones…).
  {
    const at = zoneAt('greenhouse');
    const g = new THREE.Group();
    g.position.copy(at);
    g.rotation.y = facing(at);
    const body = strip(box(6.4, 3, 4.2));
    const roof = strip(gable(6.4, 4.2, 1.7).translate(0, 3, 0));
    const glassHouse = merge([body, roof]);
    const glass = material('#dff1ec', { transparent: true, opacity: 0.32, roughness: 0.08, emissive: '#ffe0a3', emissiveIntensity: 0, depthWrite: false });
    g.add(mesh(faceted(glassHouse, rnd, 0), glass, false));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(glassHouse), new THREE.LineBasicMaterial({ color: '#f6f1e8' })));
    // Mullions every metre along the long walls.
    const bars = [];
    for (let x = -3; x <= 3; x += 1) bars.push(strip(box(0.06, 3, 0.06, x, 0, 2.1)), strip(box(0.06, 3, 0.06, x, 0, -2.1)));
    g.add(mesh(faceted(merge(bars), rnd, 0), material('#efe8dc'), false));
    // Plants inside: a bench of pots and a few tall specimens.
    const pots = [], leaves = [], blooms = [];
    for (let i = 0; i < 7; i++) {
      const x = -2.6 + i * 0.85;
      pots.push(strip(new THREE.CylinderGeometry(0.22, 0.17, 0.32, 6).translate(x, 0.95, -1.3)));
      const l = new THREE.IcosahedronGeometry(0.32 + rnd() * 0.18, 0);
      l.translate(x, 1.35 + rnd() * 0.2, -1.3);
      leaves.push(strip(l));
      if (i % 2 === 0) blooms.push(strip(new THREE.IcosahedronGeometry(0.12, 0).translate(x + 0.1, 1.65, -1.2)));
    }
    const bench = strip(box(6, 0.12, 0.8, 0, 0.75, -1.3));
    for (const [x, z, h] of [[-2, 1, 2.2], [1.6, 0.8, 1.8], [2.6, 1.2, 1.4]]) {
      leaves.push(strip(new THREE.ConeGeometry(0.55, h, 6).translate(x, h / 2 + 0.3, z)));
      pots.push(strip(new THREE.CylinderGeometry(0.4, 0.3, 0.5, 6).translate(x, 0.25, z)));
    }
    g.add(mesh(faceted(merge(pots), rnd, 0.15), material('#b0643c')), mesh(faceted(bench, rnd, 0.1), darkMat));
    g.add(mesh(faceted(merge(leaves), rnd, 0.25), material('#5f9a58')), mesh(faceted(merge(blooms), rnd, 0.1), material('#e88aa8'), false));
    group.add(g);
    picks.push({ object: g, zone: 'greenhouse' });
    group.userData.greenhouseGlass = glass;
    addLight(at.clone().add(new THREE.Vector3(0, 2, 0)), 12, 14);
  }

  // Lookout: a wooden tower on the rise at the island's edge — now and contact.
  {
    const at = zoneAt('lookout');
    const g = new THREE.Group();
    g.position.copy(at);
    g.rotation.y = facing(at);
    const posts = [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].map(([x, z]) => strip(box(0.25, 5.2, 0.25, x, 0, z)));
    const deck = strip(box(3.2, 0.25, 3.2, 0, 5.2, 0));
    const rails = [strip(box(3.2, 0.12, 0.12, 0, 6.2, 1.55)), strip(box(3.2, 0.12, 0.12, 0, 6.2, -1.55)), strip(box(0.12, 0.12, 3.2, 1.55, 6.2, 0)), strip(box(0.12, 0.12, 3.2, -1.55, 6.2, 0))];
    const roofT = strip(new THREE.ConeGeometry(2.6, 1.6, 4, 1).rotateY(Math.PI / 4).translate(0, 8.1, 0));
    const roofPosts = [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].map(([x, z]) => strip(box(0.14, 1.9, 0.14, x, 5.4, z)));
    const ladder = merge([strip(box(0.1, 5.2, 0.1, -0.4, 0, 1.4)), strip(box(0.1, 5.2, 0.1, 0.4, 0, 1.4)), ...[1, 2, 3, 4].map((k) => strip(box(0.8, 0.08, 0.08, 0, k * 1.1, 1.4)))]);
    g.add(mesh(faceted(merge([...posts, deck, ...rails, ...roofPosts, ladder]), rnd, 0.12), woodMat), mesh(faceted(roofT, rnd, 0.08), roofMat));
    // Telescope on the deck.
    const scope = strip(new THREE.CylinderGeometry(0.12, 0.18, 1.1, 6).rotateX(-1.1).translate(0.6, 5.95, -0.6));
    g.add(mesh(faceted(scope, rnd, 0.1), material('#3c4a52')));
    group.add(g);
    picks.push({ object: g, zone: 'lookout' });
    addLight(at.clone().add(new THREE.Vector3(0, 6, 0)), 8, 10);
  }

  // The tree hollow: warm light inside the fire scar — the cinema.
  {
    // Just in front of the scar's back wall so the whole opening (including its low part) picks 'hollow'.
    const r = trunkRadius(2, Math.PI / 2) * 0.5 + 0.35;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.2), new THREE.MeshStandardMaterial({ color: '#2a1810', emissive: WINDOW, emissiveIntensity: 0.05, side: THREE.DoubleSide, roughness: 1 }));
    glow.position.set(0, 2.1 + heightAt(0, 0), r - 0.15);
    group.add(glow);
    group.userData.hollowGlow = glow;
    picks.push({ object: glow, zone: 'hollow' });
    addLight(new THREE.Vector3(0, 2 + heightAt(0, 0), r + 1.5), 10, 9);
  }

  // Lanterns along the paths.
  const lanternPosts: THREE.BufferGeometry[] = [];
  const lanternLamps: THREE.BufferGeometry[] = [];
  for (const curve of PATHS) {
    for (const t of [0.35, 0.75]) {
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).multiplyScalar(1.4);
      const x = pt.x + side.x, z = pt.z + side.z, y = heightAt(x, z);
      lanternPosts.push(strip(box(0.12, 1.5, 0.12, x, y, z)));
      lanternLamps.push(strip(box(0.32, 0.38, 0.32, x, y + 1.5, z)));
    }
  }
  const lampMat = material(WINDOW, { emissive: WINDOW, emissiveIntensity: 0.1 });
  group.add(mesh(faceted(merge(lanternPosts), rnd, 0.1), darkMat), mesh(faceted(merge(lanternLamps), rnd, 0), lampMat, false));

  // The dog is DouDou, lula's black tricolour shepherd: black coat, white chest, muzzle and paws, tail wagging.
  const dog = new THREE.Group();
  {
    const at = zoneAt('dog');
    dog.position.copy(at);
    dog.rotation.y = facing(at) + 0.8;
    const fur = material('#262321');
    const white = material('#f1ece2');
    const body = faceted(jitter(new THREE.IcosahedronGeometry(0.55, 1).scale(1.5, 0.75, 0.85), 0.04, rnd).translate(0, 0.55, 0), rnd, 0.06);
    const head = faceted(new THREE.IcosahedronGeometry(0.34, 1).translate(0.85, 0.95, 0), rnd, 0.06);
    const snout = faceted(strip(new THREE.ConeGeometry(0.17, 0.35, 6).rotateZ(-Math.PI / 2).translate(1.22, 0.9, 0)), rnd, 0.05);
    const ears = faceted(merge([new THREE.ConeGeometry(0.11, 0.3, 4).rotateX(0.4).translate(0.82, 1.25, 0.18), new THREE.ConeGeometry(0.11, 0.3, 4).rotateX(-0.4).translate(0.82, 1.25, -0.18)].map(strip)), rnd, 0.05);
    const legs = faceted(merge([[0.5, 0.25], [0.5, -0.25], [-0.5, 0.25], [-0.5, -0.25]].map(([x, z]) => strip(box(0.16, 0.4, 0.16, x, 0, z)))), rnd, 0.05);
    const chest = faceted(new THREE.IcosahedronGeometry(0.3, 1).scale(0.8, 1.1, 1).translate(0.62, 0.62, 0), rnd, 0.05);
    dog.add(mesh(body, fur), mesh(head, fur), mesh(snout, white), mesh(chest, white), mesh(ears, fur), mesh(legs, white));
    const tail = mesh(faceted(strip(new THREE.ConeGeometry(0.08, 0.6, 5).translate(0, 0.3, 0)), rnd, 0.05), fur);
    tail.position.set(-0.8, 0.75, 0);
    tail.rotation.z = 0.9;
    dog.add(tail);
    dog.userData.tail = tail;
    group.add(dog);
    picks.push({ object: dog, zone: 'dog' });
  }

  return {
    group,
    picks,
    setPalette(_next, night, season) {
      for (const s of ['spring', 'summer', 'autumn', 'winter'] as const) group.getObjectByName(`crops-${s}`)!.visible = s === season;
      glowMat.emissiveIntensity = night ? 1.6 : 0.2;
      lampMat.emissiveIntensity = night ? 2.2 : 0.05;
      (group.userData.hutWindow as THREE.MeshStandardMaterial).emissiveIntensity = night ? 1.3 : 0;
      (group.userData.greenhouseGlass as THREE.MeshStandardMaterial).emissiveIntensity = night ? 0.45 : 0;
      ((group.userData.hollowGlow as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = night ? 1.4 : 0.05;
      for (const l of nightLights) l.intensity = night ? (l.userData.on as number) : 0;
    },
    update(t) {
      const tail = dog.userData.tail as THREE.Mesh;
      tail.rotation.x = Math.sin(t * 9) * 0.45;
    },
  };
}
