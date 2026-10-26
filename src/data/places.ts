// lula's story told by the places she has lived, newest first; the last chapter is the roots.
// Work comes from her CV, life from her answers and public posts. A city she has not named yet is null
// (shown as 待补充 while developing, left out of the built site). coords: [longitude, latitude].
import type { Lang } from '../lib/i18n';

export interface Chapter {
  id: string;
  city: Record<Lang, string> | null;
  region: 'cn' | 'us';
  coords?: [number, number];
  years: Record<Lang, string>;
  work: Record<Lang, string> | null;
  life: Record<Lang, string> | null;
}

export const chapters: Chapter[] = [
  {
    id: 'upstate-ny',
    city: { zh: '纽约州上州（奥尔巴尼一带）', en: 'Upstate New York (around Albany)' },
    region: 'us',
    coords: [-73.76, 42.65],
    years: { zh: '2024 至今', en: '2024–now' },
    work: {
      zh: '离开大厂后自学 Next.js，做自己的产品；做过 AI 产品顾问（到 2026 年 7 月）。现在在做一个 auto-research 工具，业余做植物收集 App Floradex 和这个网站。',
      en: 'After leaving big tech I taught myself Next.js and built my own products, and worked as an AI product consultant (until July 2026). Now I am building an auto-research tool, and on the side Floradex and this site.',
    },
    life: {
      zh: '2024 年搬到纽约州。12 月起在 Wild Ones 首府地区分会做志愿者；2025 年夏天拿到驾照，9 月成为 Cornell Master Gardener 志愿者。家里有一只狗，叫 DouDou。',
      en: 'Moved to New York in 2024. Volunteering with Wild Ones Capital Region since December; got my driver’s license in summer 2025 and became a Cornell Master Gardener volunteer that September. At home there is a dog called DouDou.',
    },
  },
  {
    id: 'trip',
    city: null,
    region: 'cn',
    years: { zh: '2023–2024', en: '2023–2024' },
    work: {
      zh: '携程 · AI 与创新 高级产品经理：为大模型生成的行程搭建评测框架，优化 300 万+ POI 数据。',
      en: 'Trip.com · Senior PM, AI & Innovation: built the evaluation framework for LLM-generated itineraries and improved 3M+ POIs.',
    },
    life: null,
  },
  {
    id: 'shopee',
    city: null,
    region: 'cn',
    years: { zh: '2020–2023', en: '2020–2023' },
    work: {
      zh: 'Shopee · ShopeeFood 物流策略 高级产品经理：派单团队的创始成员，从零搭建印尼的订单分配，业务增长到日均 100 万单以上。',
      en: 'Shopee · Senior PM, ShopeeFood logistics strategy: a founding member of the dispatch team, building order assignment for Indonesia from scratch as it grew past 1M daily orders.',
    },
    life: null,
  },
  {
    id: 'didi',
    city: null,
    region: 'cn',
    years: { zh: '2018–2020', en: '2018–2020' },
    work: {
      zh: '滴滴出行 · 地图与导航 产品经理：把路网拓扑和交通规则编进路径规划，司机违章下降 63%。',
      en: 'DiDi · PM, Map & Navigation: encoded road topology and traffic rules into routing, cutting driver violations by 63%.',
    },
    life: null,
  },
  {
    id: 'beijing',
    city: { zh: '北京', en: 'Beijing' },
    region: 'cn',
    coords: [116.4, 39.9],
    years: { zh: '2017–2018', en: '2017–2018' },
    work: {
      zh: 'Esri 北京研发中心 · ArcGIS Earth 产品实习：3D 可视化功能的迭代测试和用户社区支持。',
      en: 'Esri Beijing R&D Center · Product intern, ArcGIS Earth: sprint QA for 3D visualization and community support.',
    },
    life: null,
  },
  {
    id: 'guangzhou',
    city: { zh: '广州', en: 'Guangzhou' },
    region: 'cn',
    coords: [113.26, 23.13],
    years: { zh: '2011–2018', en: '2011–2018' },
    work: {
      zh: '中山大学地理信息系统本科、地图学与地理信息系统硕士。2014 年 Esri 中国 GIS 软件开发大赛全国一等奖；硕士论文研究监控摄像头对犯罪的影响。',
      en: 'B.S. in GIS and M.S. in Cartography and GIS at Sun Yat-sen University. First prize in the 2014 Esri China GIS software competition; a thesis on how CCTV cameras affect crime.',
    },
    life: null,
  },
  {
    id: 'roots',
    city: { zh: '河南', en: 'Henan' },
    region: 'cn',
    coords: [113.65, 34.0],
    years: { zh: '18 岁以前', en: 'Until I was 18' },
    work: null,
    life: null,
  },
];
