// Footprint map: switch views, zoom and pan, name the lit place under the pointer, and load each view's
// base layer (outlines and city lines) as vectors the first time it is shown.
import { zoomable, type Zoom } from './zoom';

async function loadBase(svg: SVGSVGElement) {
  const g = svg.querySelector<SVGGElement>('[data-base-src]');
  if (!g || g.dataset.loaded) return;
  g.dataset.loaded = '1';
  const doc = new DOMParser().parseFromString(await (await fetch(g.dataset.baseSrc!)).text(), 'image/svg+xml');
  g.append(...[...doc.documentElement.children].map((n) => document.importNode(n, true)));
}

export function mountMap(root: HTMLElement) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = '1';
  const tip = root.querySelector<HTMLElement>('[data-map-tip]')!;
  const views = [...root.querySelectorAll<SVGSVGElement>('[data-map-view]')];
  // The glow is measured in map units, so it shrinks as the map zooms in.
  const zooms = new Map<SVGSVGElement, Zoom>(views.map((svg) => [svg, zoomable(svg, (k) => svg.querySelector('feGaussianBlur')?.setAttribute('stdDeviation', String(2.4 / k)))]));
  const visible = () => views.find((v) => !v.hasAttribute('hidden'))!;
  loadBase(visible());

  root.querySelectorAll<HTMLButtonElement>('[data-view-pick]').forEach((b) =>
    b.addEventListener('click', () => {
      root.querySelectorAll('[data-view-pick]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      // SVG elements have no .hidden property: toggle the attribute itself.
      views.forEach((v) => v.toggleAttribute('hidden', v.dataset.mapView !== b.dataset.viewPick));
      loadBase(visible());
      tip.textContent = '';
    }),
  );
  root.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      const z = zooms.get(visible())!;
      ({ in: z.zoomIn, out: z.zoomOut, reset: z.reset })[b.dataset.zoom as 'in' | 'out' | 'reset']();
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
