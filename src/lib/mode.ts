// Hi-Fi (3D scenes) vs Lo-Fi (plain pages). A manual choice wins, except without WebGL.
export type Mode = 'hifi' | 'lofi';
export const MODE_STORAGE_KEY = 'ailula-mode';

export interface ModeEnv {
  webgl: boolean;
  reducedMotion: boolean;
  lowPower: boolean;
  stored: Mode | null;
}

export function detectMode(env: ModeEnv): { mode: Mode; auto: boolean } {
  if (!env.webgl) return { mode: 'lofi', auto: true };
  if (env.stored) return { mode: env.stored, auto: false };
  if (env.reducedMotion || env.lowPower) return { mode: 'lofi', auto: true };
  return { mode: 'hifi', auto: false };
}
