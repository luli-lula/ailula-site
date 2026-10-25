// Keeps the camera out of the giant sequoia: outside the bark of the trunk and outside the crown.
import { SEQUOIA, trunkRadius } from './sequoia';

type P = { x: number; y: number; z: number };
const BARK_MARGIN = 1.2;
const CROWN_LOW = 19;
const CROWN_HIGH = SEQUOIA.totalHeight + 3;

// Rough outer radius of the crown at height y: widest low down where the big limbs reach out, narrowing to the top.
export function crownRadius(y: number): number {
  if (y <= CROWN_LOW || y >= CROWN_HIGH) return 0;
  return 9.5 * Math.pow(Math.sin((Math.PI * (y - CROWN_LOW)) / (CROWN_HIGH - CROWN_LOW)), 0.6);
}

export function keepOutsideTree(p: P): P {
  if (p.y < 0 || p.y > CROWN_HIGH) return p;
  const r = Math.hypot(p.x, p.z);
  const angle = Math.atan2(p.z, p.x);
  const trunk = p.y < SEQUOIA.trunkHeight ? trunkRadius(p.y, angle) * 1.1 + BARK_MARGIN : 0;
  const crown = crownRadius(p.y) ? crownRadius(p.y) + 1 : 0;
  const need = Math.max(trunk, crown);
  if (r >= need) return p;
  const k = need / Math.max(r, 1e-3);
  return r < 1e-3 ? { x: need, y: p.y, z: 0 } : { x: p.x * k, y: p.y, z: p.z * k };
}
