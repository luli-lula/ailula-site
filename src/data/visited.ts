// Places lula has been to (not lived). Travel notes in the writing (kind: travel, with places) are added
// to the map automatically; this list is for places without a note yet. coords: [longitude, latitude].
import type { Lang } from '../lib/i18n';

export interface Visit { id: string; name: Record<Lang, string>; coords: [number, number]; when?: string; note?: Record<Lang, string> }

export const visited: Visit[] = [
  {
    id: 'mariposa',
    name: { zh: '优胜美地 · Mariposa Grove', en: 'Mariposa Grove, Yosemite' },
    coords: [-119.6, 37.5],
    note: { zh: '巨杉林。山谷中间那棵巨杉，就是照着这里的 Grizzly Giant 画的。', en: 'A grove of giant sequoias. The tree at the centre of the valley is drawn after its Grizzly Giant.' },
  },
];
