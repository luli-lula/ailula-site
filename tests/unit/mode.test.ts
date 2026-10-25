import { describe, expect, test } from 'vitest';
import { MODE_STORAGE_KEY, detectMode } from '../../src/lib/mode';

const env = { webgl: true, reducedMotion: false, lowPower: false, stored: null } as const;

describe('detectMode', () => {
  test('capable browsers get hi-fi', () => {
    expect(detectMode({ ...env })).toEqual({ mode: 'hifi', auto: false });
  });

  test('no WebGL forces lo-fi even over a stored hi-fi preference', () => {
    expect(detectMode({ ...env, webgl: false, stored: 'hifi' })).toEqual({ mode: 'lofi', auto: true });
  });

  test('reduced motion and low power default to lo-fi', () => {
    expect(detectMode({ ...env, reducedMotion: true })).toEqual({ mode: 'lofi', auto: true });
    expect(detectMode({ ...env, lowPower: true })).toEqual({ mode: 'lofi', auto: true });
  });

  test('a stored choice beats auto-detection', () => {
    expect(detectMode({ ...env, reducedMotion: true, stored: 'hifi' })).toEqual({ mode: 'hifi', auto: false });
    expect(detectMode({ ...env, stored: 'lofi' })).toEqual({ mode: 'lofi', auto: false });
  });

  test('storage key is stable', () => {
    expect(MODE_STORAGE_KEY).toBe('ailula-mode');
  });
});
