// Map views drawn at build time (no map library reaches the browser). Land only, no political borders.
// The land of each view is a static file (/maps/<view>.svg) so pages carry only their points.
// Data: Natural Earth 1:110m land via world-atlas (public domain).
import { geoConicEqualArea, geoEqualEarth, geoPath, type GeoPermissibleObjects, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';

export type ViewId = 'world' | 'cn' | 'us';
export type LonLat = [number, number];
export const VIEWS: ViewId[] = ['world', 'cn', 'us'];
export const SIZE: Record<ViewId, [number, number]> = { world: [960, 470], cn: [760, 560], us: [760, 470] };

/* eslint-disable @typescript-eslint/no-explicit-any */
const land = feature(land110 as any, (land110 as any).objects.land) as unknown as GeoPermissibleObjects;
const box = (w: number, s: number, e: number, n: number): GeoPermissibleObjects =>
  ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[w, s], [w, n], [e, n], [e, s], [w, s]]] } }) as any; // clockwise, as d3 expects

function projection(id: ViewId): GeoProjection {
  const [w, h] = SIZE[id];
  const fit: [[number, number], [number, number]] = [[8, 8], [w - 8, h - 8]];
  const p =
    // Centred on the Pacific so the move from China to New York crosses the ocean, not Eurasia.
    id === 'world' ? geoEqualEarth().rotate([-150, 0]).fitSize([w, h], { type: 'Sphere' } as any)
    : id === 'cn' ? geoConicEqualArea().parallels([25, 47]).rotate([-105, 0]).fitExtent(fit, box(73, 18, 135, 53.5))
    : geoConicEqualArea().parallels([29.5, 45.5]).rotate([96, 0]).fitExtent(fit, box(-125, 24, -66.5, 49.5));
  return p.clipExtent([[0, 0], [w, h]]);
}

export function landPath(id: ViewId) {
  return geoPath(projection(id)).digits(1)(land) ?? '';
}

export function projector(id: ViewId) {
  const p = projection(id);
  const [w, h] = SIZE[id];
  return (c: LonLat): [number, number] | null => {
    const xy = p(c);
    return xy && xy[0] >= 0 && xy[0] <= w && xy[1] >= 0 && xy[1] <= h ? [Math.round(xy[0] * 10) / 10, Math.round(xy[1] * 10) / 10] : null;
  };
}
