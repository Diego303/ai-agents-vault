/**
 * frontmatter.ts
 * Normalizes inconsistent frontmatter from the Obsidian vault.
 */

/** Status mappings: Spanish/English → canonical English */
const STATUS_MAP: Record<string, string> = {
  completo: 'complete',
  complete: 'complete',
  evergreen: 'complete',
  current: 'current',
  volatile: 'volatile',
  draft: 'draft',
  outdated: 'outdated',
  obsoleto: 'outdated',
};

/** Status → color class */
const STATUS_COLORS: Record<string, { color: string; label: string; filled: boolean }> = {
  complete: { color: 'green', label: 'Complete', filled: true },
  current: { color: 'blue', label: 'Current', filled: true },
  volatile: { color: 'orange', label: 'Volatile', filled: true },
  outdated: { color: 'red', label: 'Outdated', filled: true },
  draft: { color: 'gray', label: 'Draft', filled: false },
};

/** Difficulty → color */
const DIFFICULTY_COLORS: Record<string, { color: string; label: string }> = {
  beginner: { color: 'green', label: 'Beginner' },
  intermediate: { color: 'blue', label: 'Intermediate' },
  advanced: { color: 'orange', label: 'Advanced' },
  expert: { color: 'red', label: 'Expert' },
};

/** Ecosystem tool → badge style */
const ECOSYSTEM_BADGES: Record<string, { lightBg: string; lightText: string; darkBg: string; darkText: string; darkBorder: string }> = {
  architect: { lightBg: '#dbeafe', lightText: '#1d4ed8', darkBg: 'rgba(30,64,175,0.3)', darkText: '#60a5fa', darkBorder: 'rgba(30,64,175,0.5)' },
  vigil: { lightBg: '#fee2e2', lightText: '#b91c1c', darkBg: 'rgba(185,28,28,0.3)', darkText: '#f87171', darkBorder: 'rgba(185,28,28,0.5)' },
  licit: { lightBg: '#dcfce7', lightText: '#15803d', darkBg: 'rgba(21,128,61,0.3)', darkText: '#4ade80', darkBorder: 'rgba(21,128,61,0.5)' },
  intake: { lightBg: '#f3e8ff', lightText: '#7e22ce', darkBg: 'rgba(126,34,206,0.3)', darkText: '#c084fc', darkBorder: 'rgba(126,34,206,0.5)' },
};

export function normalizeStatus(raw: string | undefined): { color: string; label: string; filled: boolean } | null {
  if (!raw) return null;
  const canonical = STATUS_MAP[raw.toLowerCase().trim()];
  if (!canonical) return null;
  return STATUS_COLORS[canonical] || null;
}

export function normalizeDifficulty(raw: string | undefined): { color: string; label: string } | null {
  if (!raw) return null;
  return DIFFICULTY_COLORS[raw.toLowerCase().trim()] || null;
}

export function getEcosystemBadge(tag: string): typeof ECOSYSTEM_BADGES[string] | null {
  return ECOSYSTEM_BADGES[tag.toLowerCase()] || null;
}

/**
 * Extract title from frontmatter, falling back to first H1, then filename.
 */
export function resolveTitle(
  frontmatterTitle: string | undefined,
  body: string,
  filename: string,
): string {
  if (frontmatterTitle?.trim()) return frontmatterTitle.trim();

  // Try to find first H1 in body
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // Fallback to filename, prettified
  return filename
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Parse related field: removes quotes and wikilink brackets.
 * Input: ["[[nota1]]", "[[nota2#section]]"]
 * Output: ["nota1", "nota2#section"]
 */
export function parseRelated(related: string[] | undefined): string[] {
  if (!related || !Array.isArray(related)) return [];
  return related.map(r => {
    const clean = r.replace(/^["']|["']$/g, '').trim();
    // Remove [[ and ]]
    return clean.replace(/^\[\[|\]\]$/g, '');
  });
}

/**
 * Parse the `up` field (parent MOC wikilink).
 * Input: "[[moc-agentes]]"
 * Output: "moc-agentes"
 */
export function parseUp(up: string | undefined): string | null {
  if (!up) return null;
  const clean = up.replace(/^["']|["']$/g, '').trim();
  const match = clean.match(/^\[\[([^\]|#]+)/);
  return match ? match[1] : clean;
}
