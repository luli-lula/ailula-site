// Footprint map: switch views, and name the lit place under the pointer (or keyboard focus).
export function mountMap(root: HTMLElement) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';
  const tip = root.querySelector<HTMLElement>('[data-map-tip]')!;
  root.querySelectorAll<HTMLButtonElement>('[data-view-pick]').forEach((b) =>
    b.addEventListener('click', () => {
      root.querySelectorAll('[data-view-pick]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      // SVG elements have no .hidden property: toggle the attribute itself.
      root.querySelectorAll<SVGElement>('[data-map-view]').forEach((v) => v.toggleAttribute('hidden', v.dataset.mapView !== b.dataset.viewPick));
      tip.textContent = '';
    }),
  );
  const show = (e: Event) => {
    const lit = (e.target as Element).closest<SVGElement>('.lit');
    if (lit) tip.textContent = lit.getAttribute('aria-label') ?? '';
  };
  root.addEventListener('pointerover', show);
  root.addEventListener('focusin', show);
  root.addEventListener('click', show);
}
