import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    // Para agrupar posts en series ordenadas
    series: z.string().optional(),
    seriesPart: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
