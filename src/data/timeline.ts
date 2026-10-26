// lula's path, from her CV ("Lu Li · CV (general draft)") and her own blog posts. Nothing here is guessed;
// anything not in those sources stays out. Each entry becomes a growth ring on the valley's sequoia.
import type { Lang } from '../lib/i18n';

export interface Milestone {
  start: number; // the ring's year
  years: string;
  title: Record<Lang, string>;
  detail: Record<Lang, string>;
}

export const timeline: Milestone[] = [
  {
    start: 2011,
    years: '2011–2015',
    title: { zh: '中山大学 · 地理信息系统 本科', en: 'B.S. in Geographic Information System, Sun Yat-sen University' },
    detail: {
      zh: '2014 年 Esri 中国 GIS 软件开发大赛全国一等奖：一款校园导航 App，补上通用地图在校园里的空白——访客导览、学生服务地图、夜间安全路线。',
      en: 'First Prize, 2014 Esri China GIS Software Development Competition, for a campus navigation app: visitor tours, a student services map and safer night routes.',
    },
  },
  {
    start: 2015,
    years: '2015–2018',
    title: { zh: '中山大学 · 地图学与地理信息系统 硕士', en: 'M.S. in Cartography and GIS, Sun Yat-sen University' },
    detail: {
      zh: '论文研究警用监控摄像头对犯罪的影响（苏州姑苏区），2020 年发表于《地理科学》。',
      en: 'Thesis on how police CCTV cameras affect crime in Gusu District, Suzhou; published in Scientia Geographica Sinica (2020).',
    },
  },
  {
    start: 2017,
    years: '2017–2018',
    title: { zh: 'Esri · ArcGIS Earth 产品实习', en: 'Esri · Product intern, ArcGIS Earth' },
    detail: { zh: '北京研发中心，3D 可视化功能的迭代测试和用户社区支持。', en: 'Beijing R&D Center: sprint QA for 3D visualization features and community support.' },
  },
  {
    start: 2018,
    years: '2018–2020',
    title: { zh: '滴滴出行 · 地图与导航 产品经理', en: 'DiDi · Product Manager, Map & Navigation' },
    detail: {
      zh: '把路网拓扑和交通规则编进路径规划，基础路网改为周更、动态图层分钟级更新；司机违章下降 63%，每年少交约 3,000 万元罚款。',
      en: 'Encoded road topology and traffic rules into routing; weekly base-map and minute-level rule updates cut driver violations by 63%, saving about RMB 30M a year in fines.',
    },
  },
  {
    start: 2020,
    years: '2020–2023',
    title: { zh: 'Shopee · ShopeeFood 物流策略 高级产品经理', en: 'Shopee · Senior PM, ShopeeFood Logistics Strategy' },
    detail: {
      zh: '派单团队的创始成员，从零搭建印尼的订单分配，业务增长到日均 100 万单以上；ETA 预估改为数据模型，5 分钟准确率提升 22%。',
      en: 'Founding member of the dispatch team: built order assignment for Indonesia from scratch as it grew past 1M daily orders; 5-minute ETA accuracy +22%.',
    },
  },
  {
    start: 2023,
    years: '2023–2024',
    title: { zh: '携程 · AI 与创新 高级产品经理', en: 'Trip.com · Senior PM, AI & Innovation' },
    detail: {
      zh: '为大模型生成的行程搭建评测框架，指导 AI 行程助手的模型迭代；优化 300 万+ POI 数据，减少绕路。',
      en: 'Built the evaluation framework for LLM-generated itineraries behind the AI Trip Planner; improved 3M+ POIs to cut route detours.',
    },
  },
  {
    start: 2024,
    years: '2024',
    title: { zh: '离开大厂，开始自己做产品', en: 'Left big tech to build my own products' },
    detail: {
      zh: '自学 Next.js，做出第一个独立产品；搬到纽约州；12 月起在 Wild Ones 首府地区分会做志愿者，设计活动海报和本土植物卡片。',
      en: 'Taught myself Next.js and shipped my first indie product; moved to upstate New York; from December, volunteering with Wild Ones Capital Region on posters and native plant cards.',
    },
  },
  {
    start: 2025,
    years: '2025–2026',
    title: { zh: '独立 AI 产品顾问 · 植物', en: 'Independent AI product consultant · plants' },
    detail: {
      zh: '为酒店 AI 智能体平台（到 2026 年 7 月）和 B2B 销售 CRM 做产品设计；开始做 iOS 植物 App WildCard；9 月成为 Cornell Master Gardener 志愿者。',
      en: 'Product design for an AI agent platform for hotels (until July 2026) and an LLM sales CRM; started WildCard, an iOS plant app; became a Cornell Master Gardener volunteer in September.',
    },
  },
  {
    start: 2026,
    years: '2026',
    title: { zh: '现在', en: 'Now' },
    detail: {
      zh: '在[公司]做一个 auto-research 工具；业余在做植物收集 App Floradex 和这个网站。',
      en: 'Building an auto-research tool at [company]; on the side, Floradex, a plant collection app, and this site.',
    },
  },
];
