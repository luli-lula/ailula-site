// Known milestones only (from lula's own posts). Details are left as TODO, never guessed.
import type { Lang } from '../lib/i18n';

export interface Milestone {
  years: string;
  year: number;
  text: Record<Lang, string>;
  detailKnown: boolean;
}

export const timeline: Milestone[] = [
  { years: '2017', year: 2017, text: { zh: '开始学习做产品（产品课程、SQL）', en: 'Started learning product management (PM courses, SQL)' }, detailKnown: false },
  { years: '2018–2023', year: 2018, text: { zh: '在国内大厂做产品经理，策略产品方向，6 年换过 4 个团队', en: 'Product manager in Chinese big tech (strategy products); 4 teams in 6 years' }, detailKnown: false },
  { years: '2023', year: 2023, text: { zh: '第一次 gap', en: 'First career gap' }, detailKnown: false },
  { years: '2024', year: 2024, text: { zh: '离开大厂；自学 Next.js，开始做独立产品', en: 'Left big tech; taught myself Next.js and started building my own products' }, detailKnown: false },
  { years: '2025', year: 2025, text: { zh: '搬到纽约州乡下；成为 Cornell Master Gardener 学员；上线 ADHDFocus 和 CELPIP12', en: 'Moved to rural New York; Cornell Master Gardener trainee; shipped ADHDFocus and CELPIP12' }, detailKnown: false },
];
