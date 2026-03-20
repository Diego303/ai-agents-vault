/**
 * Content Collection config for Astro 5 Content Layer API.
 * Defines the vault collection with permissive schema to handle
 * inconsistent frontmatter from the Obsidian vault.
 *
 * Known vault quirks handled:
 * - Template files have null values in arrays (aliases: [null])
 * - Template files have {{date:YYYY-MM-DD}} placeholders
 * - Some files have null for string fields (category: null)
 * - Dates can be Date objects or strings
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Coerce nulls out of string arrays (YAML `- ` with no value → null) */
const stringArray = z
  .array(z.union([z.string(), z.null()]))
  .optional()
  .default([])
  .transform(arr => arr.filter((v): v is string => typeof v === 'string' && v.length > 0));

/** Coerce null/undefined strings */
const optString = z
  .union([z.string(), z.null()])
  .optional()
  .transform(v => (typeof v === 'string' && v.length > 0 ? v : undefined));

/** Coerce dates from Date objects, strings, or template placeholders */
const optDate = z.any().optional().transform(v => {
  if (v === null || v === undefined) return undefined;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  const str = String(v).trim();
  // Skip Obsidian template placeholders like {{date:YYYY-MM-DD}}
  if (str.startsWith('{{')) return undefined;
  // Validate ISO date format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return undefined;
});

const vault = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/vault',
  }),
  schema: z.object({
    title: optString,
    aliases: stringArray,
    tags: stringArray,
    created: optDate,
    updated: optDate,
    category: optString,
    status: optString,
    difficulty: optString,
    related: stringArray,
    up: optString,
  }).passthrough(),
});

export const collections = { vault };
