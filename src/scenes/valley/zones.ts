// Places in the valley. Each one is a section of the site; the camera flies to `view` when chosen.
export type ZoneId = 'tree' | 'hollow' | 'workshop' | 'garden' | 'lookout' | 'dog';
type V3 = [number, number, number];

export interface Zone { id: ZoneId; label: { en: string; zh: string }; anchor: V3; view: { position: V3; target: V3 } }

export const HOME_VIEW = { position: [72, 44, 84] as V3, target: [0, 8, 0] as V3 };

export const ZONES: Zone[] = [
  { id: 'tree', label: { en: 'The Sequoia · Story', zh: '巨杉 · 经历' }, anchor: [0, 30, 0], view: { position: [22, 20, 26], target: [0, 18, 0] } },
  { id: 'hollow', label: { en: 'Tree Hollow · Cinema', zh: '树洞 · 放映室' }, anchor: [0, 3.2, 5.2], view: { position: [5, 4.5, 16], target: [0, 2.6, 4] } },
  { id: 'workshop', label: { en: 'Workshop · Projects', zh: '工坊 · 项目' }, anchor: [-16, 5.2, 7], view: { position: [-28, 12, 24], target: [-16, 2.5, 7] } },
  { id: 'garden', label: { en: 'Garden · Writing', zh: '花园 · 写作' }, anchor: [15, 3.6, 10], view: { position: [28, 11, 27], target: [15, 1.2, 10] } },
  { id: 'lookout', label: { en: 'Lookout · Now', zh: '瞭望台 · 此刻' }, anchor: [10, 11, -19], view: { position: [26, 16, -32], target: [10, 7, -19] } },
  { id: 'dog', label: { en: 'Woof', zh: '汪' }, anchor: [6.5, 2.2, 13], view: { position: [12, 4.5, 21], target: [6.5, 0.8, 13] } },
];
