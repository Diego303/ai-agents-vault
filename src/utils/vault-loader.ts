/**
 * vault-loader.ts
 * Scans the vault directory and builds a map for wikilink resolution.
 * Uses Obsidian's "shortest path" convention: [[filename]] resolves
 * to the first file matching that name regardless of directory.
 */
import fs from 'node:fs';
import path from 'node:path';
import { MOC_MAP } from './moc-mapping.js';

export interface NoteEntry {
  /** Filename without extension (e.g. "transformer-architecture") */
  filename: string;
  /** Full slug path for URL (e.g. "01-fundamentos-ia/transformer-architecture") */
  slug: string;
  /** Filesystem path relative to vault root */
  relativePath: string;
}

const VAULT_BASE = path.resolve('src/content/vault');
const EXCLUDED_DIRS = new Set(['templates', 'assets']);

let noteMapCache: Map<string, NoteEntry[]> | null = null;
let slugMapCache: Map<string, NoteEntry> | null = null;

function scanDirectory(dir: string, entries: NoteEntry[]): void {
  let items: fs.Dirent[];
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (!EXCLUDED_DIRS.has(item.name) && !item.name.startsWith('.')) {
        scanDirectory(fullPath, entries);
      }
      continue;
    }

    if (!item.name.endsWith('.md')) continue;

    const filename = item.name.replace(/\.md$/, '');
    const relativePath = path.relative(VAULT_BASE, fullPath).replace(/\\/g, '/');
    const slug = relativePath.replace(/\.md$/, '');

    entries.push({ filename, slug, relativePath });
  }
}

/**
 * Returns a map of filename (lowercase) → NoteEntry[]
 * Multiple entries if different folders have files with the same name.
 */
export function getNoteMap(): Map<string, NoteEntry[]> {
  if (noteMapCache) return noteMapCache;

  const entries: NoteEntry[] = [];
  scanDirectory(VAULT_BASE, entries);

  const map = new Map<string, NoteEntry[]>();
  for (const entry of entries) {
    const key = entry.filename.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(key, [entry]);
    }
  }

  noteMapCache = map;
  return map;
}

/**
 * Returns a map of full slug → NoteEntry for direct slug lookups.
 */
export function getSlugMap(): Map<string, NoteEntry> {
  if (slugMapCache) return slugMapCache;

  const noteMap = getNoteMap();
  const map = new Map<string, NoteEntry>();

  for (const entries of noteMap.values()) {
    for (const entry of entries) {
      map.set(entry.slug, entry);
    }
  }

  slugMapCache = map;
  return map;
}

/**
 * Resolve a wikilink target to a slug.
 * Handles: "filename", "folder/filename", case-insensitive matching.
 */
export function resolveWikilink(target: string): NoteEntry | null {
  const noteMap = getNoteMap();
  const slugMap = getSlugMap();

  // Clean target: remove quotes, .md extension, trim
  const clean = target.replace(/^["']|["']$/g, '').replace(/\.md$/, '').trim();

  // Guard: empty or section-only targets
  if (!clean) return null;

  // Try exact slug match first (e.g. "01-fundamentos-ia/transformer-architecture")
  const exactSlug = slugMap.get(clean);
  if (exactSlug) return exactSlug;

  // Try case-insensitive slug match
  const lowerClean = clean.toLowerCase();
  for (const [slug, entry] of slugMap) {
    if (slug.toLowerCase() === lowerClean) return entry;
  }

  // Check virtual MOC pages
  const mocEntry = MOC_MAP.find(m => m.slug.toLowerCase() === lowerClean);
  if (mocEntry) {
    return { filename: mocEntry.slug, slug: mocEntry.slug, relativePath: mocEntry.slug };
  }

  // Obsidian shortest-path: try just the filename part
  const filename = clean.includes('/') ? clean.split('/').pop()! : clean;
  const matches = noteMap.get(filename.toLowerCase());

  if (!matches || matches.length === 0) return null;

  // If only one match, return it
  if (matches.length === 1) return matches[0];

  // Multiple matches: try to find the best one by path similarity
  const matchByPath = matches.find(m =>
    m.slug.toLowerCase().endsWith(lowerClean)
  );
  return matchByPath || matches[0];
}

/**
 * Generate a URL-safe anchor from a heading text.
 * Matches Astro's default github-slugger behavior:
 * lowercase, replace spaces with hyphens, strip non-alphanumeric.
 */
export function headingToAnchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep unicode letters, numbers, spaces, hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Invalidate caches (useful during development with HMR).
 */
export function invalidateCache(): void {
  noteMapCache = null;
  slugMapCache = null;
}
