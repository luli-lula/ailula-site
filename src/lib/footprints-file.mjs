// Checks and tidies what the footprint editor saves: country codes, and "ISO:unitId" places.
export function normalizeFootprints(input) {
  const countries = Array.isArray(input?.countries) ? input.countries : null;
  const places = Array.isArray(input?.places) ? input.places : null;
  if (!countries || !places) throw new Error('countries and places must be lists');
  for (const c of countries) if (typeof c !== 'string' || !/^[A-Z]{3}$/.test(c)) throw new Error(`not a country code: ${c}`);
  for (const p of places) if (typeof p !== 'string' || !/^[A-Z]{3}:[A-Za-z0-9]{1,40}$/.test(p)) throw new Error(`not a place id: ${p}`);
  return { countries: [...new Set(countries)].sort(), places: [...new Set(places)].sort() };
}
