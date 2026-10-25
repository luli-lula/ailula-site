// Colours for the valley. The giant sequoia is evergreen, so its crown never changes;
// the seasons show in the Pacific dogwood understory, the ground and the sky.
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export interface Palette {
  sky: string; fog: string; ground: string; grass: string; path: string; rock: string;
  sequoiaBark: string; sequoiaCrown: string; fir: string; dogwood: string; water: string;
  sun: string; ambient: string;
}

const EVERGREEN = { sequoiaBark: '#b4552e', sequoiaCrown: '#3d6a3c', fir: '#4c7350' };

const DAY: Record<Season, Palette> = {
  spring: { ...EVERGREEN, sky: '#cfe2e6', fog: '#d9e6e4', ground: '#7d6a55', grass: '#93b56c', path: '#ddd2bb', rock: '#8c837a', dogwood: '#f6f3ea', water: '#86b8c6', sun: '#fff1d8', ambient: '#e6eeec' },
  summer: { ...EVERGREEN, sky: '#bcdcec', fog: '#d4e6ee', ground: '#7a6650', grass: '#7aa556', path: '#e2d6bc', rock: '#8f867c', dogwood: '#5c8c48', water: '#74b0c8', sun: '#fff4dc', ambient: '#e4eef2' },
  autumn: { ...EVERGREEN, sky: '#ead9c4', fog: '#eadfcf', ground: '#7b5d44', grass: '#b4a15c', path: '#d8c7a8', rock: '#8a7e72', dogwood: '#c4432c', water: '#7aa6b2', sun: '#ffe1b8', ambient: '#efe4d6' },
  winter: { ...EVERGREEN, sky: '#dde5ec', fog: '#e4eaf0', ground: '#8a8178', grass: '#eef2f4', path: '#c9ccd0', rock: '#9a958f', dogwood: '#6e5d4f', water: '#9cbccc', sun: '#f4f6ff', ambient: '#eef2f6' },
};

const NIGHT_TINT = '#1a2042';

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const c = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return '#' + ((c(16) << 16) | (c(8) << 8) | c(0)).toString(16).padStart(6, '0');
}

export function palette(season: Season, night: boolean): Palette {
  const day = DAY[season];
  if (!night) return day;
  // At night only the light changes: sky, fog and ambient fall to deep blue, the sun becomes moonlight.
  return { ...day, sky: mix(day.sky, NIGHT_TINT, 0.82), fog: mix(day.fog, NIGHT_TINT, 0.78), ambient: mix(day.ambient, NIGHT_TINT, 0.7), sun: '#a9b8ff' };
}
