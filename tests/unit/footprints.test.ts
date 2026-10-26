import { readdirSync, readFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { describe, expect, test } from 'vitest';

const fp = JSON.parse(readFileSync('src/data/footprints.json', 'utf8')) as { countries: string[]; places: string[] };
const world = JSON.parse(readFileSync('src/data/geo/world.json', 'utf8'));
const countryIds = new Set((feature(world, world.objects.units) as any).features.map((f: any) => f.properties.id));
const units = new Map<string, Set<string>>();
for (const file of readdirSync('src/data/geo').filter((f) => /^[A-Z]{3}\.json$/.test(f))) {
  const t = JSON.parse(readFileSync(`src/data/geo/${file}`, 'utf8'));
  units.set(file.slice(0, 3), new Set((feature(t, t.objects.units) as any).features.map((f: any) => f.properties.id)));
}

describe('footprints', () => {
  test('every visited country exists on the map', () => {
    for (const c of fp.countries) expect(countryIds, c).toContain(c);
  });
  test('every visited place exists in its country’s boundaries', () => {
    for (const p of fp.places) {
      const [iso, id] = p.split(':');
      expect(units.get(iso), p).toBeDefined();
      expect(units.get(iso)!, p).toContain(id);
    }
  });
});
