// The footprint map's base layer (outlines and city-level lines), one static file per view.
import type { APIRoute } from 'astro';
import { baseSvg, VIEWS, type ViewId } from '../../lib/footprint';
import { visits } from '../../lib/visits';

export const getStaticPaths = () => VIEWS.map((view) => ({ params: { view } }));

export const GET: APIRoute = ({ params }) => new Response(baseSvg(params.view as ViewId, visits()), { headers: { 'Content-Type': 'image/svg+xml' } });
