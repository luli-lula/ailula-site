// Zoom and pan for an SVG map by moving its viewBox: wheel or trackpad zooms around the pointer, dragging
// pans, two fingers pinch. After a drag, svg.dataset.dragged is set until the next press, so click handlers
// can tell a pan from a click.
export interface Zoom { zoomIn(): void; zoomOut(): void; reset(): void; scale(): number }

const MAX = 16;
const STEP = 1.6;

export function zoomable(svg: SVGSVGElement, onScale: (k: number) => void = () => {}): Zoom {
  const [x0, y0, W, H] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number);
  let vb = { x: x0, y: y0, w: W, h: H };

  const apply = () => {
    vb.w = Math.min(W, Math.max(W / MAX, vb.w));
    vb.h = (vb.w * H) / W;
    vb.x = Math.min(x0 + W - vb.w, Math.max(x0, vb.x));
    vb.y = Math.min(y0 + H - vb.h, Math.max(y0, vb.y));
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    onScale(W / vb.w);
  };
  const toMap = (cx: number, cy: number) => {
    const r = svg.getBoundingClientRect();
    return [vb.x + ((cx - r.left) / r.width) * vb.w, vb.y + ((cy - r.top) / r.height) * vb.h];
  };
  const zoomAt = (k: number, cx: number, cy: number) => {
    const [px, py] = toMap(cx, cy);
    const w = Math.min(W, Math.max(W / MAX, vb.w / k));
    const f = w / vb.w;
    vb = { x: px - (px - vb.x) * f, y: py - (py - vb.y) * f, w, h: (w * H) / W };
    apply();
  };
  const centre = () => {
    const r = svg.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2] as const;
  };

  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY);
  }, { passive: false });

  // One pointer pans; two pinch.
  const down = new Map<number, { x: number; y: number }>();
  let travelled = 0;
  svg.addEventListener('pointerdown', (e) => {
    down.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (down.size === 1) { travelled = 0; delete svg.dataset.dragged; }
    // No pointer capture: it would send the click to the svg instead of the place under the pointer.
  });
  svg.addEventListener('pointermove', (e) => {
    const prev = down.get(e.pointerId);
    if (!prev) return;
    const r = svg.getBoundingClientRect();
    if (down.size === 1) {
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      travelled += Math.abs(dx) + Math.abs(dy);
      if (travelled > 4) svg.dataset.dragged = '1';
      vb.x -= (dx / r.width) * vb.w;
      vb.y -= (dy / r.height) * vb.h;
      apply();
    } else if (down.size === 2) {
      const [a, b] = [...down.entries()].map(([id, p]) => (id === e.pointerId ? { x: e.clientX, y: e.clientY } : p));
      const [pa, pb] = [...down.values()];
      const before = Math.hypot(pa.x - pb.x, pa.y - pb.y), after = Math.hypot(a.x - b.x, a.y - b.y);
      if (before > 0) zoomAt(after / before, (a.x + b.x) / 2, (a.y + b.y) / 2);
      svg.dataset.dragged = '1';
    }
    down.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  const up = (e: PointerEvent) => down.delete(e.pointerId);
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);

  return {
    zoomIn: () => zoomAt(STEP, ...centre()),
    zoomOut: () => zoomAt(1 / STEP, ...centre()),
    reset: () => { vb = { x: x0, y: y0, w: W, h: H }; apply(); },
    scale: () => W / vb.w,
  };
}
