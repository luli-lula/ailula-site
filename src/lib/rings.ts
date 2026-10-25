// Tree-ring geometry for the ring compass. Wider rings mark years of big change.
export const RING_WIDTHS: Record<number, number> = {
  2017: 10, 2018: 7, 2019: 6, 2020: 7, 2021: 5,
  2022: 5, 2023: 8, 2024: 16, 2025: 14, 2026: 8,
};

function lcg(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

// Irregular closed ring: 3rd/5th harmonic wobble plus seeded jitter, slightly squashed.
export function ringPath(radius: number, wobble: number, phase: number, seed: number): string {
  const rnd = lcg(seed);
  let d = '';
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r =
      radius +
      wobble * Math.sin(a * 3 + phase) +
      wobble * 0.6 * Math.sin(a * 5 + phase * 2) +
      (rnd() - 0.5) * wobble * 0.3;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r * 0.94).toFixed(1)}`;
  }
  return d + 'Z';
}

export function ringRadii(scale: number): { year: number; radius: number }[] {
  let total = 0;
  return Object.entries(RING_WIDTHS)
    .map(([year, w]) => ({ year: Number(year), w }))
    .sort((a, b) => a.year - b.year)
    .map(({ year, w }) => ({ year, radius: (total += w) * scale }));
}
