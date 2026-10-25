import * as THREE from 'three';
import type { Part } from './createValley';
import { heightAt, PATHS } from './island';
import { faceted, jitter, material, merge, mesh, rng } from './lowpoly';
import type { Palette } from './palette';
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

export function createStructures(p: Palette, ctx: { quality: 'high' | 'low' }): Part {
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

  // Garden: raised beds and a little glasshouse — the writing.
  {
    const at = zoneAt('garden');
    const g = new THREE.Group();
    g.position.copy(at);
    g.rotation.y = facing(at);
    const beds: THREE.BufferGeometry[] = [];
    const greens: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 2.6;
      beds.push(strip(box(2, 0.5, 3.6, x, 0, -1)));
      for (let k = 0; k < 6; k++) {
        const s = new THREE.IcosahedronGeometry(0.28 + rnd() * 0.15, 0);
        s.translate(x + (rnd() - 0.5) * 1.3, 0.65, -1 + (k - 2.5) * 0.55);
        greens.push(strip(s));
      }
    }
    const house = strip(box(3, 2.4, 2.4, 0, 0, 2.4));
    const roofG = strip(gable(3.2, 2.6, 1.1).translate(0, 2.4, 2.4));
    g.add(mesh(faceted(merge(beds), rnd, 0.12), darkMat), mesh(faceted(merge(greens), rnd, 0.25), material('#6c9a55')));
    const glass = material('#d8efe9', { transparent: true, opacity: 0.35, roughness: 0.1, emissive: WINDOW, emissiveIntensity: 0 });
    g.add(mesh(faceted(merge([house, roofG]), rnd, 0), glass, false));
    // Frame edges so the glasshouse reads clearly.
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(merge([house, roofG])), new THREE.LineBasicMaterial({ color: '#f4efe6' }));
    g.add(edges);
    group.add(g);
    picks.push({ object: g, zone: 'garden' });
    glass.userData.glow = true;
    group.userData.glass = glass;
    addLight(at.clone().add(new THREE.Vector3(0, 1.5, 0)), 10, 12);
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
    const r = trunkRadius(2, Math.PI / 2) * 0.5;
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

  // The dog: cream-coloured, napping near the plaza, tail wagging.
  const dog = new THREE.Group();
  {
    const at = zoneAt('dog');
    dog.position.copy(at);
    dog.rotation.y = facing(at) + 0.8;
    const fur = material('#efe3cc');
    const furDark = material('#c9b493');
    const body = faceted(jitter(new THREE.IcosahedronGeometry(0.55, 1).scale(1.5, 0.75, 0.85), 0.04, rnd).translate(0, 0.55, 0), rnd, 0.06);
    const head = faceted(new THREE.IcosahedronGeometry(0.34, 1).translate(0.85, 0.95, 0), rnd, 0.06);
    const snout = faceted(strip(new THREE.ConeGeometry(0.17, 0.35, 6).rotateZ(-Math.PI / 2).translate(1.22, 0.9, 0)), rnd, 0.05);
    const ears = faceted(merge([new THREE.ConeGeometry(0.11, 0.3, 4).rotateX(0.4).translate(0.82, 1.25, 0.18), new THREE.ConeGeometry(0.11, 0.3, 4).rotateX(-0.4).translate(0.82, 1.25, -0.18)].map(strip)), rnd, 0.05);
    const legs = faceted(merge([[0.5, 0.25], [0.5, -0.25], [-0.5, 0.25], [-0.5, -0.25]].map(([x, z]) => strip(box(0.16, 0.4, 0.16, x, 0, z)))), rnd, 0.05);
    dog.add(mesh(body, fur), mesh(head, fur), mesh(snout, furDark), mesh(ears, furDark), mesh(legs, fur));
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
    setPalette(_next, night) {
      glowMat.emissiveIntensity = night ? 1.6 : 0.2;
      lampMat.emissiveIntensity = night ? 2.2 : 0.05;
      (group.userData.glass as THREE.MeshStandardMaterial).emissiveIntensity = night ? 0.35 : 0;
      ((group.userData.hollowGlow as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = night ? 1.4 : 0.05;
      for (const l of nightLights) l.intensity = night ? (l.userData.on as number) : 0;
    },
    update(t) {
      const tail = dog.userData.tail as THREE.Mesh;
      tail.rotation.x = Math.sin(t * 9) * 0.45;
    },
  };
}
