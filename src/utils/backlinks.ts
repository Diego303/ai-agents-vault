/**
 * backlinks.ts
 * Pre-computes backlinks for every note in the vault.
 * A backlink is: "nota X enlaza a nota Y" → Y tiene un backlink desde X.
 */
import type { CollectionEntry } from 'astro:content';

export interface BacklinkEntry {
  /** Slug of the note that contains the link */
  slug: string;
  /** Title of the linking note */
  title: string;
  /** Context: the line/paragraph where the link appears (truncated) */
  context: string;
}

const WIKILINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]*)?\|?[^\]]*\]\]/g;

// Module-level cache: computed once per build, reused across all pages
let cachedMap: Map<string, BacklinkEntry[]> | null = null;

/**
 * Build a map of targetFilename → BacklinkEntry[]
 * Cached at module level — only computed once per build.
 */
export function computeBacklinks(
  allNotes: CollectionEntry<'vault'>[],
): Map<string, BacklinkEntry[]> {
  if (cachedMap) return cachedMap;

  const backlinks = new Map<string, BacklinkEntry[]>();

  for (const note of allNotes) {
    const body = note.body || '';
    const sourceSlug = note.id.replace(/\.md$/, '');
    const sourceTitle =
      note.data.title ||
      sourceSlug.split('/').pop()?.replace(/-/g, ' ') ||
      sourceSlug;

    // Find all wikilinks in this note's body
    let match: RegExpExecArray | null;
    const re = new RegExp(WIKILINK_RE.source, 'g');

    while ((match = re.exec(body)) !== null) {
      const target = match[1].trim().toLowerCase();

      // Extract context: the line containing this link
      const lineStart = body.lastIndexOf('\n', match.index) + 1;
      const lineEnd = body.indexOf('\n', match.index);
      let context = body
        .slice(lineStart, lineEnd === -1 ? undefined : lineEnd)
        .trim();

      // Clean up context: remove markdown syntax, truncate
      context = context
        .replace(/>\s*\[![^\]]*\][+-]?\s*/g, '') // callout markers
        .replace(/[#*_~`>]/g, '')                 // markdown chars
        .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, _t, alias) => alias || _t)
        .trim()
        .slice(0, 120);

      if (context.length === 120) context += '…';

      const entry: BacklinkEntry = { slug: sourceSlug, title: sourceTitle, context };

      const existing = backlinks.get(target);
      if (existing) {
        // Avoid duplicate backlinks from the same source
        if (!existing.some(e => e.slug === sourceSlug)) {
          existing.push(entry);
        }
      } else {
        backlinks.set(target, [entry]);
      }
    }
  }

  cachedMap = backlinks;
  return backlinks;
}

/**
 * Get backlinks for a specific note.
 * Matches by filename (case-insensitive), same as Obsidian's shortest-path.
 */
export function getBacklinksForNote(
  backlinksMap: Map<string, BacklinkEntry[]>,
  slug: string,
): BacklinkEntry[] {
  const filename = slug.split('/').pop()?.toLowerCase() || '';
  return backlinksMap.get(filename) || [];
}
