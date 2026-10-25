import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lang = z.enum(['en', 'zh']);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lang,
    kind: z.enum(['essay', 'notes', 'weekly', 'old-notes']),
    maturity: z.enum(['seedling', 'growing', 'mature']),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    legacyPaths: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    // Optional: new projects whose dates lula has not given yet stay undated rather than guessed.
    date: z.coerce.date().optional(),
    lang,
    summary: z.string(),
    status: z.enum(['live', 'wip', 'paused', 'done']),
    // Grouping on the projects page and in the valley: plant work lives in the greenhouse.
    category: z.enum(['plants', 'learning', 'tools']).default('tools'),
    url: z.string().url().optional(),
    image: z.string().optional(),
    // Phone screenshots for app projects, shown as a strip on the project page.
    gallery: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    // Position inside its group (lower first); unordered projects follow, newest first.
    order: z.number().optional(),
    // Content lula still has to write; shown while developing, collected into CONTENT-TODO.md.
    todo: z.array(z.string()).default([]),
    // Drafts are kept in the repo but not listed or built.
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    legacyPaths: z.array(z.string()).default([]),
  }),
});

export const collections = { posts, projects };
