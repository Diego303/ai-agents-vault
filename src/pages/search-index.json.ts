/**
 * search-index.json.ts
 * Generates a static JSON search index at build time.
 */
import { getCollection } from 'astro:content';

export async function GET() {
  const notes = await getCollection('vault');

  const index = notes.map(note => {
    const slug = note.id.replace(/\.md$/, '');
    const filename = slug.split('/').pop() || slug;
    const folder = slug.split('/')[0] || '';

    // Title: frontmatter → first H1 → filename
    let title = note.data.title;
    if (!title && note.body) {
      const h1Match = note.body.match(/^#\s+(.+)$/m);
      if (h1Match) title = h1Match[1].trim();
    }
    if (!title) {
      title = filename.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // Excerpt: first meaningful paragraph (strip markdown)
    let excerpt = '';
    if (note.body) {
      const lines = note.body.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed &&
          !trimmed.startsWith('#') &&
          !trimmed.startsWith('>') &&
          !trimmed.startsWith('---') &&
          !trimmed.startsWith('```') &&
          !trimmed.startsWith('|')
        ) {
          excerpt = trimmed
            .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, a) => a || t)
            .replace(/[=*_~`#[\]]/g, '')
            .slice(0, 200);
          break;
        }
      }
    }

    return {
      slug,
      title,
      tags: note.data.tags || [],
      folder,
      excerpt,
    };
  });

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
}
