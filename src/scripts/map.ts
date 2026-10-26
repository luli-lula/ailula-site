// Footprint map: switch views, and open a small card for a point (click, Enter or Space).
const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

export function mountMap(root: HTMLElement) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';
  const card = root.querySelector<HTMLElement>('[data-map-card]')!;
  const body = card.querySelector<HTMLElement>('[data-map-card-body]')!;
  root.querySelectorAll<HTMLButtonElement>('[data-view-pick]').forEach((b) =>
    b.addEventListener('click', () => {
      root.querySelectorAll('[data-view-pick]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      // SVG elements have no .hidden property: toggle the attribute itself.
      root.querySelectorAll<SVGElement>('[data-map-view]').forEach((v) => v.toggleAttribute('hidden', v.dataset.mapView !== b.dataset.viewPick));
      card.hidden = true;
    }),
  );
  const open = (el: Element) => {
    const c = JSON.parse((el as HTMLElement).dataset.card!) as { name: string; when?: string; text?: string; href?: string; link?: string };
    body.innerHTML = `<h3>${esc(c.name)}</h3>${c.when ? `<p>${esc(c.when)}</p>` : ''}${c.text ? `<p>${esc(c.text)}</p>` : ''}${c.href ? `<p><a href="${c.href}">${esc(c.link ?? '→')}</a></p>` : ''}`;
    card.hidden = false;
  };
  root.addEventListener('click', (e) => {
    const pt = (e.target as Element).closest('[data-point]');
    if (pt) open(pt);
    else if ((e.target as Element).closest('[data-map-card-close]')) card.hidden = true;
  });
  root.addEventListener('keydown', (e) => {
    const pt = (e.target as Element).closest?.('[data-point]');
    if (pt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(pt); }
  });
}
