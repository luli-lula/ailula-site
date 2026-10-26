// Writing topics: a small fixed set so the garden can be filtered. Each post has one or two.
import type { Lang } from './i18n';

export const TOPICS = ['product', 'books', 'movies', 'life', 'projects', 'tools', 'travel'] as const;
export type Topic = (typeof TOPICS)[number];

const LABELS: Record<Topic, Record<Lang, string>> = {
  product: { en: 'Product', zh: '产品' },
  books: { en: 'Books', zh: '读书' },
  movies: { en: 'Movies', zh: '电影' },
  life: { en: 'Life', zh: '生活' },
  projects: { en: 'Projects', zh: '项目' },
  tools: { en: 'Tools', zh: '工具' },
  travel: { en: 'Travel', zh: '旅行' },
};

export const topicLabel = (t: Topic, lang: Lang) => LABELS[t][lang];
