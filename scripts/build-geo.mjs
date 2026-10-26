// Builds the footprint map's boundaries into src/data/geo/ (committed, so site builds need no network).
//   node scripts/build-geo.mjs            world + China + USA
//   node scripts/build-geo.mjs KOR        one more country's second-level units (geoBoundaries)
// Sources (all free to publish):
//   world  Natural Earth 1:10m admin-0, China point of view (public domain)
//   CHN    prefecture level: geoBoundaries gbHumanitarian ADM2/ADM1 (OCHA, CC BY 3.0 IGO); Chinese names and
//          provinces from OCHA's gazetteer (scripts/data/chn-adm2-gazetteer.json)
//   USA    counties: us-atlas (US Census Bureau, public domain)
//   other  geoBoundaries gbOpen ADM2, falling back to gbHumanitarian
// Downloads are cached in .cache/geo/.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import mapshaper from 'mapshaper';
import { feature } from 'topojson-client';

const CACHE = new URL('../.cache/geo/', import.meta.url).pathname;
const OUT = new URL('../src/data/geo/', import.meta.url).pathname;
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

async function cached(name, url) {
  const file = CACHE + name;
  if (!existsSync(file)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return file;
}
const gbUrl = async (release, iso, level) => {
  const res = await fetch(`https://www.geoboundaries.org/api/current/${release}/${iso}/${level}/`);
  return res.ok ? (await res.json()).simplifiedGeometryGeoJSON : null;
};

// Simplify a GeoJSON file (features carry final properties) into TopoJSON with one object, "units".
async function simplify(geojsonFile, outFile, percent) {
  await mapshaper.runCommands(`-i "${geojsonFile}" name=units -simplify ${percent}% keep-shapes -o "${outFile}" format=topojson quantization=20000`);
  console.log(`${outFile.replace(OUT, 'src/data/geo/')}: ${Math.round(readFileSync(outFile).length / 1024)} KB`);
}

async function world() {
  const zip = await cached('ne_10m_admin_0_countries_chn.zip', 'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries_chn.zip');
  execFileSync('unzip', ['-o', '-q', zip, '-d', CACHE + 'ne']);
  await mapshaper.runCommands(
    `-i "${CACHE}ne/ne_10m_admin_0_countries_chn.shp" -each 'id=ADM0_A3, en=NAME_EN, zh=NAME_ZH' -filter-fields id,en,zh -rename-layers units -simplify 4% keep-shapes -o "${OUT}world.json" format=topojson precision=0.01`,
  );
  console.log(`src/data/geo/world.json: ${Math.round(readFileSync(OUT + 'world.json').length / 1024)} KB`);
}

// Planar point-in-polygon on longitude/latitude (fine at province scale, and indifferent to ring winding,
// which d3's spherical geoContains is not).
function inside([x, y], geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polys.some((rings) => {
    let hit = false;
    for (const ring of rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  });
}

// Planar centre of a unit: the mean of its largest ring's vertices (d3's geoCentroid depends on winding too).
function centre(geometry) {
  const rings = (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates).map((r) => r[0]);
  const ring = rings.reduce((a, b) => (b.length > a.length ? b : a));
  return [ring.reduce((n, p) => n + p[0], 0) / ring.length, ring.reduce((n, p) => n + p[1], 0) / ring.length];
}

async function china() {
  const adm2 = JSON.parse(readFileSync(await cached('CHN-ADM2.geojson', await gbUrl('gbHumanitarian', 'CHN', 'ADM2')), 'utf8'));
  const adm1 = JSON.parse(readFileSync(await cached('CHN-ADM1.geojson', await gbUrl('gbHumanitarian', 'CHN', 'ADM1')), 'utf8'));
  const gaz = JSON.parse(readFileSync(new URL('./data/chn-adm2-gazetteer.json', import.meta.url), 'utf8')).units;
  for (const f of adm2.features) {
    const name = f.properties.shapeName;
    let rows = gaz.filter((g) => g.en === name);
    // Five names repeat in two provinces (Suzhou, Taizhou, Fuzhou, Yichun, Yulin): pick the province the unit lies in.
    if (rows.length > 1) {
      const c = centre(f.geometry);
      const prov = adm1.features.find((p) => inside(c, p.geometry))?.properties.shapeName.toLowerCase();
      rows = rows.filter((g) => g.pen.toLowerCase() === prov);
    }
    if (rows.length !== 1) throw new Error(`CHN: cannot place ${name}`);
    const g = rows[0];
    f.properties = { id: g.pcode, en: g.en, zh: g.zh, pen: g.pen, pzh: g.pzh };
  }
  writeFileSync(CACHE + 'CHN-units.geojson', JSON.stringify(adm2));
  await simplify(CACHE + 'CHN-units.geojson', OUT + 'CHN.json', 12);
}

async function usa() {
  const topo = JSON.parse(readFileSync(new URL('../node_modules/us-atlas/counties-10m.json', import.meta.url), 'utf8'));
  const states = new Map(feature(topo, topo.objects.states).features.map((s) => [s.id, s.properties.name]));
  const counties = feature(topo, topo.objects.counties);
  for (const f of counties.features) {
    const state = states.get(f.id.slice(0, 2)) ?? '';
    f.properties = { id: f.id, en: f.properties.name, pen: state }; // English only: no Chinese county names
  }
  writeFileSync(CACHE + 'USA-units.geojson', JSON.stringify(counties));
  await simplify(CACHE + 'USA-units.geojson', OUT + 'USA.json', 2.5);
}

async function other(iso) {
  const url = (await gbUrl('gbOpen', iso, 'ADM2')) ?? (await gbUrl('gbHumanitarian', iso, 'ADM2'));
  if (!url) throw new Error(`${iso}: geoBoundaries has no second-level units`);
  const geo = JSON.parse(readFileSync(await cached(`${iso}-ADM2.geojson`, url), 'utf8'));
  for (const f of geo.features) f.properties = { id: f.properties.shapeID, en: f.properties.shapeName };
  writeFileSync(CACHE + `${iso}-units.geojson`, JSON.stringify(geo));
  await simplify(CACHE + `${iso}-units.geojson`, OUT + `${iso}.json`, 12);
}

const iso = process.argv[2]?.toUpperCase();
if (iso && !/^[A-Z]{3}$/.test(iso)) throw new Error(`not a country code: ${iso}`);
if (!iso) { await world(); await china(); await usa(); }
else if (iso === 'CHN') await china();
else if (iso === 'USA') await usa();
else await other(iso);
