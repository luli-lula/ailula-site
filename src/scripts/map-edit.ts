// Footprint editor (dev only): tick countries and cities in the list or click them on the map; the map
// lights up at once and the choice is saved to src/data/footprints.json through /__footprints.
type State = { countries: string[]; places: string[] };

const status = document.querySelector<HTMLElement>('[data-status]')!;
const tip = document.querySelector<HTMLElement>('[data-tip]')!;
const countries = new Set<string>();
const places = new Set<string>();

const say = (text: string, kind: '' | 'ok' | 'err' = '') => {
  status.textContent = text;
  status.className = `status ${kind}`;
};

function paint() {
  document.querySelectorAll<HTMLInputElement>('[data-country]').forEach((b) => (b.checked = countries.has(b.dataset.country!)));
  document.querySelectorAll<HTMLInputElement>('[data-place]').forEach((b) => (b.checked = places.has(b.dataset.place!)));
  document.querySelectorAll<SVGElement>('[data-country-shape]').forEach((s) => s.classList.toggle('on', countries.has(s.dataset.countryShape!)));
  document.querySelectorAll<SVGElement>('[data-place-shape]').forEach((s) => s.classList.toggle('on', places.has(s.dataset.placeShape!)));
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const n = [...places].filter((p) => p.startsWith(`${el.dataset.count}:`)).length;
    el.textContent = n ? `${n} 个城市` : '';
  });
  document.querySelectorAll<HTMLElement>('[data-group-count]').forEach((el) => {
    const n = [...el.closest('details')!.querySelectorAll<HTMLInputElement>('[data-place]')].filter((b) => b.checked).length;
    el.textContent = n ? `${n}` : '';
  });
  document.querySelectorAll<HTMLElement>('[data-geo]').forEach((b) => (b.hidden = !countries.has(b.dataset.geo!)));
  say(`去过 ${countries.size} 个国家和地区，${places.size} 个城市`, 'ok');
}

let timer = 0;
function save() {
  clearTimeout(timer);
  timer = window.setTimeout(async () => {
    say('保存中…');
    const res = await fetch('/__footprints', { method: 'POST', body: JSON.stringify({ countries: [...countries], places: [...places] }) });
    if (!res.ok) return say(`没有保存：${await res.text()}`, 'err');
    paint();
  }, 250);
}

function setPlace(id: string, on: boolean) {
  if (on) {
    places.add(id);
    countries.add(id.split(':')[0]); // a city means the country too
  } else places.delete(id);
}
function setCountry(id: string, on: boolean) {
  if (on) return void countries.add(id);
  const its = [...places].filter((p) => p.startsWith(`${id}:`));
  if (its.length && !confirm(`取消这个国家，也会取消它的 ${its.length} 个城市。确定吗？`)) return;
  countries.delete(id);
  its.forEach((p) => places.delete(p));
}

document.addEventListener('change', (e) => {
  const b = e.target as HTMLInputElement;
  if (b.dataset.place) setPlace(b.dataset.place, b.checked);
  else if (b.dataset.country) setCountry(b.dataset.country, b.checked);
  else return;
  paint();
  save();
});

document.addEventListener('click', (e) => {
  const t = e.target as Element;
  const unit = t.closest<SVGElement>('[data-place-shape]');
  const country = t.closest<SVGElement>('[data-country-shape]');
  if (unit) setPlace(unit.dataset.placeShape!, !places.has(unit.dataset.placeShape!));
  else if (country) setCountry(country.dataset.countryShape!, !countries.has(country.dataset.countryShape!));
  else return;
  paint();
  save();
});

document.addEventListener('pointerover', (e) => {
  const shape = (e.target as Element).closest('[data-place-shape], [data-country-shape]');
  tip.textContent = shape?.querySelector('title')?.textContent ?? '';
});

document.querySelectorAll<HTMLButtonElement>('[data-view-pick]').forEach((b) =>
  b.addEventListener('click', () => {
    document.querySelectorAll('[data-view-pick]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.querySelectorAll<SVGElement>('[data-map-view]').forEach((v) => v.toggleAttribute('hidden', v.dataset.mapView !== b.dataset.viewPick));
  }),
);

// Search: show matching rows, and open the groups that contain a match.
const search = document.querySelector<HTMLInputElement>('[data-search]')!;
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  document.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => {
    const match = !q || row.dataset.text!.toLowerCase().includes(q) || !!row.querySelector(`[data-row][data-text*="${CSS.escape(q)}" i]`);
    row.hidden = !match;
    if (row.tagName === 'DETAILS') (row as HTMLDetailsElement).open = !!q && match;
  });
});

// One more country's city-level boundaries, downloaded on demand; the page reloads with them.
document.querySelectorAll<HTMLButtonElement>('[data-geo]').forEach((b) =>
  b.addEventListener('click', async () => {
    b.disabled = true;
    say(`正在下载 ${b.dataset.geo} 的城市边界…`);
    const res = await fetch(`/__geo?iso=${b.dataset.geo}`, { method: 'POST' });
    if (!res.ok) {
      b.disabled = false;
      return say(`下载失败：${await res.text()}`, 'err');
    }
    location.reload();
  }),
);

const res = await fetch('/__footprints');
const state = (await res.json()) as State;
state.countries.forEach((c) => countries.add(c));
state.places.forEach((p) => places.add(p));
paint();
