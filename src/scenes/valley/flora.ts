import * as THREE from 'three';
import type { Part } from './createValley';
import { distToPath, heightAt, insideIsland } from './island';
import { faceted, jitter, material, merge, mesh, rng } from './lowpoly';
import type { Palette, Season } from './palette';
import { SEQUOIA } from './sequoia';
import { ZONES } from './zones';

// Mariposa Grove understory, simplified: white firs and sugar pines (evergreen), Pacific dogwood
// (the only thing that changes with the seasons), sword ferns, wildflowers, granite rocks and the
// grey fallen sequoia logs that lie all over the real grove.

const KEEP_CLEAR = ZONES.filter((z) => z.id !== 'tree').flatMap((z) => [new THREE.Vector2(z.view.target[0], z.view.target[2]), new THREE.Vector2(z.view.position[0], z.view.position[2])]);

function spots(count: number, rnd: () => number, opts: { minR: number; maxR: number; clear: number; pathClear: number }) {
  const out: THREE.Vector3[] = [];
  let tries = 0;
  while (out.length < count && tries++ < count * 60) {
    const a = rnd() * Math.PI * 2;
    const r = opts.minR + Math.sqrt(rnd()) * (opts.maxR - opts.minR);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!insideIsland(x, z, 2.5)) continue;
    if (distToPath(x, z) < opts.pathClear) continue;
    if (KEEP_CLEAR.some((c) => Math.hypot(c.x - x, c.y - z) < opts.clear)) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 2.2)) continue;
    out.push(new THREE.Vector3(x, heightAt(x, z), z));
  }
  return out;
}

function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, at: THREE.Matrix4[], shadows = true) {
  const m = new THREE.InstancedMesh(geo, mat, at.length);
  at.forEach((mx, i) => m.setMatrixAt(i, mx));
  m.castShadow = m.receiveShadow = shadows;
  m.computeBoundingSphere();
  return m;
}

const trs = (p: THREE.Vector3, rotY: number, s: number, sy = s) =>
  new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(s, sy, s));

export function createFlora(p: Palette, ctx: { quality: 'high' | 'low' }): Part {
  const rnd = rng(512);
  const group = new THREE.Group();
  group.name = 'flora';
  const few = ctx.quality === 'low';

  // White fir: stacked tiers on a short trunk. Unit height 1 (scaled per instance).
  const firTiers: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const g = new THREE.ConeGeometry(0.34 - k * 0.06, 0.38, 7, 1);
    g.translate(0, 0.22 + k * 0.2, 0);
    jitter(g, 0.03, rnd);
    firTiers.push(faceted(g, rnd, 0.16, (c) => 0.8 + c.y * 0.35));
  }
  const firGeo = merge(firTiers);
  const trunkGeo = faceted(new THREE.CylinderGeometry(0.03, 0.05, 0.3, 5).translate(0, 0.12, 0), rnd, 0.1);
  // Sugar pine: taller, sparser, flat-topped.
  // Tall, narrow fir for the rim (a slender silhouette rather than a second species model).
  const pineParts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 5; k++) {
    const g = new THREE.ConeGeometry(0.2 - k * 0.03, 0.3, 6, 1);
    g.translate(0, 0.35 + k * 0.15, 0);
    jitter(g, 0.025, rnd);
    pineParts.push(faceted(g, rnd, 0.16, (c) => 0.8 + c.y * 0.3));
  }
  const pineGeo = merge(pineParts);
  const pineTrunk = faceted(new THREE.CylinderGeometry(0.02, 0.035, 0.45, 5).translate(0, 0.2, 0), rnd, 0.1);

  // Firs keep to the back and the rim so the places in front stay visible from the home view.
  const CAMERA_ANGLE = Math.atan2(84, 72);
  const inFront = (pt: THREE.Vector3) => {
    const d = Math.abs(Math.atan2(Math.sin(Math.atan2(pt.z, pt.x) - CAMERA_ANGLE), Math.cos(Math.atan2(pt.z, pt.x) - CAMERA_ANGLE)));
    return d < 0.95; // keep the whole front wedge open, rim included
  };
  const firAt = spots(few ? 40 : 70, rnd, { minR: 14, maxR: 34, clear: 10, pathClear: 3 }).filter((pt) => !inFront(pt)).slice(0, few ? 20 : 34);
  const firM = firAt.map((pt) => trs(pt, rnd() * 6.28, 7 + rnd() * 5));
  const pineAt = spots(few ? 10 : 20, rnd, { minR: 26, maxR: 34, clear: 10, pathClear: 3 }).filter((pt) => !inFront(pt)).slice(0, few ? 3 : 6);
  const pineM = pineAt.map((pt) => trs(pt, rnd() * 6.28, 11 + rnd() * 3));
  const maxOther = Math.max(...firM.map((m) => new THREE.Vector3().setFromMatrixScale(m).y), ...pineM.map((m) => new THREE.Vector3().setFromMatrixScale(m).y));
  if (maxOther > SEQUOIA.maxOtherTreeHeight) console.warn('a tree is taller than the sequoia allows');

  const firMat = material(p.fir);
  const barkMat = material('#6e4a35');
  group.add(instanced(firGeo, firMat, firM), instanced(trunkGeo, barkMat, firM));
  group.add(instanced(pineGeo, firMat, pineM), instanced(pineTrunk, barkMat, pineM));

  // Pacific dogwood: small understory trees near the paths and plaza.
  const dogwoodAt = spots(few ? 10 : 18, rnd, { minR: 7.5, maxR: 26, clear: 5, pathClear: 1.6 });
  const dwTrunk = faceted(merge([
    new THREE.CylinderGeometry(0.06, 0.09, 1.4, 5).translate(0, 0.7, 0),
    new THREE.CylinderGeometry(0.03, 0.05, 0.9, 4).rotateZ(0.7).translate(0.3, 1.5, 0),
    new THREE.CylinderGeometry(0.03, 0.05, 0.9, 4).rotateZ(-0.6).translate(-0.28, 1.45, 0.1),
  ].map((g) => g.toNonIndexed())), rnd, 0.1);
  const dwCrown = merge([[0, 2.0, 0, 0.75], [0.55, 1.75, 0.2, 0.55], [-0.5, 1.8, -0.15, 0.5], [0.1, 1.7, -0.55, 0.5]].map(([x, y, z, r]) => {
    const g = new THREE.IcosahedronGeometry(r, 0);
    g.scale(1, 0.75, 1);
    jitter(g, 0.12, rnd);
    return faceted(g.translate(x, y, z), rnd, 0.2);
  }));
  const dwM = dogwoodAt.map((pt) => trs(pt, rnd() * 6.28, 1.6 + rnd() * 0.8));
  const dwBark = material('#7a6656');
  const dwLeaf = material(p.dogwood);
  const dwCrownMesh = instanced(dwCrown, dwLeaf, dwM);
  group.add(instanced(dwTrunk, dwBark, dwM), dwCrownMesh);

  // Sword ferns around the sequoia's mound and along paths.
  const fernGeo = merge(Array.from({ length: 6 }, (_, k) => {
    const g = new THREE.ConeGeometry(0.09, 0.9, 3, 1);
    g.translate(0, 0.45, 0);
    g.rotateZ(0.75);
    g.rotateY((k / 6) * Math.PI * 2 + rnd() * 0.4);
    return faceted(g, rnd, 0.2);
  }));
  const fernAt = spots(few ? 30 : 70, rnd, { minR: 5.8, maxR: 22, clear: 3, pathClear: 1.2 });
  const fernMat = material('#4f7d45');
  group.add(instanced(fernGeo, fernMat, fernAt.map((pt) => trs(pt, rnd() * 6.28, 0.8 + rnd() * 0.6)), false));

  // Wildflowers: lupine, poppy and yarrow colours in patches; not in winter.
  const flowerGeo = faceted(new THREE.IcosahedronGeometry(0.16, 0).translate(0, 0.25, 0), rnd, 0.1);
  const flowerAt = spots(few ? 50 : 120, rnd, { minR: 7, maxR: 30, clear: 2, pathClear: 1.1 });
  const flowerColors = ['#8e7cc3', '#e8833a', '#f2e6a6', '#f5f1ea'];
  const flowerMat = material('#ffffff');
  const flowers = instanced(flowerGeo, flowerMat, flowerAt.map((pt) => trs(pt, 0, 0.8 + rnd() * 0.6)), false);
  flowerAt.forEach((_, i) => flowers.setColorAt(i, new THREE.Color(flowerColors[i % flowerColors.length])));
  group.add(flowers);

  // Granite rocks.
  const rockGeo = faceted(jitter(new THREE.DodecahedronGeometry(0.8, 0), 0.35, rnd), rnd, 0.2);
  const rockAt = spots(few ? 10 : 22, rnd, { minR: 8, maxR: 33, clear: 4, pathClear: 1.4 });
  const rockMat = material('#9a958c');
  group.add(instanced(rockGeo, rockMat, rockAt.map((pt) => trs(pt, rnd() * 6.28, 0.6 + rnd() * 1.2, 0.5 + rnd() * 0.6))));

  // Fallen sequoia logs, weathered silver-grey (as in lula's Mariposa photos).
  const logGeo = faceted(jitter(new THREE.CylinderGeometry(0.55, 0.7, 7, 7, 3).rotateZ(Math.PI / 2), 0.12, rnd), rnd, 0.22);
  const logAt = spots(3, rnd, { minR: 12, maxR: 28, clear: 6, pathClear: 3.5 });
  const logMat = material('#b9b0a4');
  group.add(instanced(logGeo, logMat, logAt.map((pt) => trs(pt.clone().setY(pt.y + 0.45), rnd() * 6.28, 1))));

  return {
    group,
    setPalette(next, _night, season: Season) {
      firMat.color.set(season === 'winter' ? '#6d8f7a' : next.fir); // light snow dusting
      dwLeaf.color.set(next.dogwood);
      dwCrownMesh.visible = season !== 'winter'; // dogwoods stand bare in winter
      flowers.visible = season === 'spring' || season === 'summer';
      fernMat.color.set(season === 'winter' ? '#7f9a86' : '#4f7d45');
      rockMat.color.set(season === 'winter' ? '#c9c8c6' : '#9a958c');
    },
  };
}
