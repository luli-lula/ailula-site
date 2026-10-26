// The land of each map view as a static SVG file, drawn behind the points by FootprintMap and RouteMap.
import type { APIRoute } from 'astro';
import { landPath, SIZE, VIEWS, type ViewId } from '../../lib/geo';

export const getStaticPaths = () => VIEWS.map((view) => ({ params: { view } }));

export const GET: APIRoute = ({ params }) => {
  const id = params.view as ViewId;
  const [w, h] = SIZE[id];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path d="${landPath(id)}" fill="#efe7d6" stroke="#c9bda4" stroke-width="0.6"/></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
