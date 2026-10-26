// The footprint map, drawn at build time: a dark world where every country is an outline, countries lula
// has been to are divided into their city-level units, and the units she has been to are lit.
// Boundaries come from src/data/geo/ (see scripts/build-geo.mjs). Visits are passed in (src/lib/visits.ts reads
// src/data/footprints.json), so the editor can use these drawings without reloading every time it saves.
import { geoAlbersUsa, geoConicEqualArea, geoEqualEarth, geoPath, type GeoPermissibleObjects, type GeoProjection } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { Lang } from './i18n';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ViewId = 'world' | 'cn' | 'us';
export const VIEWS: ViewId[] = ['world', 'cn', 'us'];
export const SIZE: Record<ViewId, [number, number]> = { world: [960, 470], cn: [760, 560], us: [760, 470] };

type Topo = any;
type Unit = { id: string; en: string; zh?: string; pen?: string; pzh?: string };
const geoFiles = import.meta.glob<Topo>('../data/geo/*.json', { eager: true, import: 'default' });
const topo = (name: string): Topo | undefined => geoFiles[`../data/geo/${name}.json`];
const worldTopo = topo('world');
const countries = feature(worldTopo, worldTopo.objects.units) as any;

// Short Chinese names for countries whose Natural Earth name is the formal one.
const SHORT_ZH: Record<string, string> = { CHN: '中国', KOR: '韩国', PRK: '朝鲜', RUS: '俄罗斯', GBR: '英国' };
export const countryName = (id: string, lang: Lang) => {
  const f = countries.features.find((c: any) => c.properties.id === id);
  return lang === 'zh' ? SHORT_ZH[id] ?? f?.properties.zh ?? id : f?.properties.en ?? id;
};
export const unitName = (u: Unit, lang: Lang) => (lang === 'zh' && u.zh ? u.zh : u.en);

// Countries with city-level boundaries on file, and their units.
export const unitCountries = Object.keys(geoFiles).map((k) => k.match(/([A-Z]{3})\.json$/)?.[1]).filter(Boolean) as string[];
export function unitsOf(iso: string): { geo: any; units: Unit[] } | null {
  const t = topo(iso);
  if (!t) return null;
  const geo = feature(t, t.objects.units) as any;
  return { geo, units: geo.features.map((f: any) => f.properties) };
}

export interface Visits { countries: Set<string>; places: Set<string> }
export const toVisits = (data: { countries: string[]; places: string[] }): Visits => ({
  countries: new Set([...data.countries, ...data.places.map((p) => p.split(':')[0])]),
  places: new Set(data.places),
});

function projection(view: ViewId): GeoProjection {
  const [w, h] = SIZE[view];
  if (view === 'world') return geoEqualEarth().rotate([-150, 0]).fitSize([w, h], { type: 'Sphere' } as any).clipExtent([[0, 0], [w, h]]);
  if (view === 'cn') {
    const box = { type: 'Polygon', coordinates: [[[73, 18], [73, 53.5], [135, 53.5], [135, 18], [73, 18]]] } as any;
    return geoConicEqualArea().parallels([25, 47]).rotate([-105, 0]).fitExtent([[8, 8], [w - 8, h - 8]], box).clipExtent([[0, 0], [w, h]]);
  }
  return geoAlbersUsa().fitExtent([[8, 8], [w - 8, h - 8]], feature(topo('USA'), topo('USA').objects.units) as any);
}

// Which countries a view draws subdivided: the US view only knows the US (Albers USA projects nothing else).
const viewCountries = (view: ViewId, v: Visits) => [...v.countries].filter((c) => unitCountries.includes(c) && (view !== 'us' || c === 'USA'));

// The base layer: country outlines (visited ones a shade lighter) and the city-level lines of visited countries.
export function baseSvg(view: ViewId, v: Visits) {
  const [w, h] = SIZE[view];
  // Whole pixels are enough for the small world view, and halve its file.
  const path = geoPath(projection(view)).digits(view === 'world' ? 0 : 1);
  const visited = { type: 'FeatureCollection', features: countries.features.filter((c: any) => v.countries.has(c.properties.id)) };
  const lines = viewCountries(view, v).map((iso) => path(mesh(topo(iso), topo(iso).objects.units, (a: any, b: any) => a !== b) as GeoPermissibleObjects) ?? '').join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">`
    + `<rect width="${w}" height="${h}" fill="#0b1220"/>`
    + (view === 'us' ? '' : `<path d="${path(countries) ?? ''}" fill="#141d2b" stroke="#2a3850" stroke-width="0.6"/>`)
    + `<path d="${path(visited as any) ?? ''}" fill="#1b283b" stroke="#3a4d6b" stroke-width="0.8"/>`
    + `<path d="${lines}" fill="none" stroke="#2f4260" stroke-width="0.35"/>`
    + '</svg>';
}

export interface LitShape { id: string; name: string; parent: string; d: string; whole?: boolean }

// The lit layer for a view: every visited unit, plus whole countries visited without any city ticked.
export function litShapes(view: ViewId, lang: Lang, v: Visits): LitShape[] {
  const path = geoPath(projection(view)).digits(1);
  const out: LitShape[] = [];
  for (const iso of v.countries) {
    if (view === 'us' && iso !== 'USA') continue;
    const units = unitsOf(iso);
    const lit = units?.geo.features.filter((f: any) => v.places.has(`${iso}:${f.properties.id}`)) ?? [];
    if (lit.length) {
      for (const f of lit) {
        const d = path(f);
        if (d) out.push({ id: `${iso}:${f.properties.id}`, name: unitName(f.properties, lang), parent: (lang === 'zh' ? f.properties.pzh : f.properties.pen) ?? countryName(iso, lang), d });
      }
    } else if (view !== 'us') {
      const c = countries.features.find((f: any) => f.properties.id === iso);
      const d = c && path(c);
      if (d) out.push({ id: iso, name: countryName(iso, lang), parent: '', d, whole: true });
    }
  }
  return out;
}

// Every country and every unit of a view, for the editor (dev only): the whole map is clickable there.
export function countryShapes(view: ViewId, lang: Lang) {
  if (view === 'us') return [];
  const path = geoPath(projection(view)).digits(1);
  return countries.features.map((f: any) => ({ id: f.properties.id as string, name: countryName(f.properties.id, lang), d: path(f) ?? '' })).filter((c: any) => c.d);
}
export const allCountries = (lang: Lang) =>
  countries.features.map((f: any) => ({ id: f.properties.id as string, name: countryName(f.properties.id, lang) })).sort((a: any, b: any) => a.name.localeCompare(b.name, lang === 'zh' ? 'zh-Hans-CN' : 'en'));

export function allShapes(view: ViewId, lang: Lang) {
  const path = geoPath(projection(view)).digits(1);
  const isos = view === 'us' ? ['USA'] : view === 'cn' ? ['CHN'] : unitCountries;
  return isos.flatMap((iso) => (unitsOf(iso)?.geo.features ?? []).map((f: any) => ({ id: `${iso}:${f.properties.id}`, name: unitName(f.properties, lang), d: path(f) ?? '' })).filter((s: any) => s.d));
}

export function stats(v: Visits) {
  const chn = unitsOf('CHN')!, usa = unitsOf('USA')!;
  const lit = (iso: string) => [...v.places].filter((p) => p.startsWith(`${iso}:`)).map((p) => p.split(':')[1]);
  const chnLit = new Set(lit('CHN')), usaLit = new Set(lit('USA'));
  return {
    countries: v.countries.size,
    countriesTotal: countries.features.length,
    chn: { cities: chnLit.size, citiesTotal: chn.units.length, provinces: new Set(chn.units.filter((u) => chnLit.has(u.id)).map((u) => u.pzh)).size, provincesTotal: new Set(chn.units.map((u) => u.pzh)).size },
    usa: { counties: usaLit.size, countiesTotal: usa.units.length, states: new Set(usa.units.filter((u) => usaLit.has(u.id)).map((u) => u.pen)).size },
  };
}
