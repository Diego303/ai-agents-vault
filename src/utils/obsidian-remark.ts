/**
 * obsidian-remark.ts
 * Custom remark plugins to transform Obsidian-flavored markdown to standard HTML.
 *
 * Handles: wikilinks, callouts, highlights, embeds, block-refs, inline tags.
 */
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import { resolveWikilink, headingToAnchor } from './vault-loader.js';
import type { Root, Text, Paragraph, Blockquote, PhrasingContent, RootContent } from 'mdast';

// ─── HTML escaping (prevent XSS from user-authored content) ─────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── SVG Icons for callouts (16×16, stroke only) ───────────────────────────

const CALLOUT_ICONS: Record<string, string> = {
  abstract: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  tip: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>',
  success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  question: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  failure: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  danger: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  bug: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l1.88 1.88M14.12 3.88L16 2"/><path d="M9 7.13v-1a3 3 0 116 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>',
  example: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31M14 9.3V1.99M8.5 2h7M14 9.3a6.5 6.5 0 11-4 0M5.52 16h12.96"/></svg>',
  quote: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>',
};

const CHEVRON_SVG = '<svg class="callout-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

// ─── Callout regex ──────────────────────────────────────────────────────────
// Matches: [!type], [!type]+, [!type]-, [!type] Title, [!type]- Title, etc.
const CALLOUT_REGEX = /^\[!(\w+)\]([+-])?\s*(.*)?$/;

// ─── Wikilink regex ─────────────────────────────────────────────────────────
// [[target]], [[target|alias]], [[target#section]], [[target#section|alias]]
const WIKILINK_REGEX = /!?\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

// ─── Highlight regex ────────────────────────────────────────────────────────
const HIGHLIGHT_REGEX = /==([^=]+)==/g;

// ─── Block reference regex ──────────────────────────────────────────────────
const BLOCK_REF_REGEX = /\s*\^([\w-]+)\s*$/;

// ─── Inline tag regex ───────────────────────────────────────────────────────
// Matches #tag but not inside URLs, headings, or at start of line (heading markers)
// Tag must start with a letter or underscore (not digit)
const INLINE_TAG_REGEX = /(?:^|\s)#([a-zA-Z_][\w/-]*)/g;

// ─── Helper: split a text node by regex, replacing matches ──────────────────

type NodeLike = PhrasingContent;

function splitTextByRegex(
  text: string,
  regex: RegExp,
  replacer: (match: RegExpExecArray) => NodeLike[],
): NodeLike[] {
  const result: NodeLike[] = [];
  let lastIndex = 0;
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');

  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: text.slice(lastIndex, match.index) } as Text);
    }
    result.push(...replacer(match));
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.slice(lastIndex) } as Text);
  }

  return result;
}

// ─── Plugin 1: Callouts ─────────────────────────────────────────────────────

export function remarkObsidianCallouts() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      if (!parent || index === undefined) return;

      // Get first paragraph
      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== 'paragraph') return;

      // Get first text content
      const firstInline = firstChild.children[0];
      if (!firstInline) return;

      let firstText = '';
      if (firstInline.type === 'text') {
        firstText = firstInline.value;
      } else {
        return; // Not a callout
      }

      // Check first line for callout pattern
      const lines = firstText.split('\n');
      const firstLine = lines[0];
      const match = firstLine.match(CALLOUT_REGEX);
      if (!match) return;

      const type = match[1].toLowerCase();
      const modifier = match[2] as '+' | '-' | undefined;
      const title = match[3]?.trim() || '';
      const isFoldable = modifier === '+' || modifier === '-';
      const isOpen = modifier === '+';

      const icon = CALLOUT_ICONS[type] || CALLOUT_ICONS.info;
      const displayTitle = escapeHtml(title || type.charAt(0).toUpperCase() + type.slice(1));

      // Remove the callout marker from the first text line
      const remainingLines = lines.slice(1);
      if (remainingLines.length > 0) {
        (firstInline as Text).value = remainingLines.join('\n');
      } else if (firstChild.children.length > 1) {
        // Remove the first text node, keep the rest
        firstChild.children.shift();
      } else {
        // The entire first paragraph was just the callout marker
        node.children.shift();
      }

      // Build callout HTML
      if (isFoldable) {
        // Wrap in <details>/<summary>
        const openAttr = isOpen ? ' open' : '';
        const titleHtml: RootContent = {
          type: 'html' as const,
          value: `<details class="callout callout-${type}"${openAttr}><summary class="callout-title">${CHEVRON_SVG}<span class="callout-icon">${icon}</span><span>${displayTitle}</span></summary><div class="callout-content"><div class="callout-content-inner">`,
        };
        const closeHtml: RootContent = {
          type: 'html' as const,
          value: `</div></div></details>`,
        };

        // Replace the blockquote with: title HTML + content + close HTML
        const newNodes: RootContent[] = [titleHtml, ...node.children, closeHtml];
        parent.children.splice(index, 1, ...newNodes);
        return;
      }

      // Non-foldable callout: keep as div
      const titleHtml: RootContent = {
        type: 'html' as const,
        value: `<div class="callout callout-${type}"><div class="callout-title"><span class="callout-icon">${icon}</span><span>${displayTitle}</span></div><div class="callout-content">`,
      };
      const closeHtml: RootContent = {
        type: 'html' as const,
        value: `</div></div>`,
      };

      parent.children.splice(index, 1, titleHtml, ...node.children, closeHtml);
    });
  };
}

// ─── Plugin 2: Wikilinks ────────────────────────────────────────────────────

export function remarkObsidianWikilinks(base: string = '/') {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      // Skip text inside links (already processed) or code
      if (parent.type === 'link' || parent.type === 'code' || parent.type === 'inlineCode') return;

      const text = node.value;
      if (!text.includes('[[')) return;

      const re = new RegExp(WIKILINK_REGEX.source, 'g');
      const nodes = splitTextByRegex(text, re, (match) => {
        const fullMatch = match[0];
        const isEmbed = fullMatch.startsWith('!');
        const target = match[1].trim();
        const section = match[2]?.trim();
        const alias = match[3]?.trim();

        if (isEmbed) {
          // Embed: render as a styled reference block (Phase A simplified)
          const resolved = resolveWikilink(target);
          const href = resolved ? `${base}${resolved.slug}/` : '#';
          const label = escapeHtml(alias || target);
          const brokenClass = resolved ? '' : ' wikilink-broken';
          return [{
            type: 'html',
            value: `<div class="embed-ref${brokenClass}"><a href="${escapeHtml(href)}" class="embed-link">📄 ${label}</a></div>`,
          }] as NodeLike[];
        }

        // Regular wikilink
        const resolved = resolveWikilink(target);
        const sectionAnchor = section ? `#${headingToAnchor(section)}` : '';
        const href = resolved ? `${base}${resolved.slug}/${sectionAnchor}` : `#${sectionAnchor}`;
        const brokenClass = resolved ? '' : ' wikilink-broken';

        // Display text priority: alias > "target > section" > target
        let displayText = alias || target;
        if (!alias && section) {
          displayText = `${target} > ${section}`;
        }

        return [{
          type: 'link',
          url: href,
          data: {
            hProperties: {
              className: `wikilink${brokenClass}`,
            },
          },
          children: [{ type: 'text', value: displayText }],
        }] as NodeLike[];
      });

      if (nodes.length === 1 && nodes[0].type === 'text' && (nodes[0] as Text).value === text) {
        return; // No changes
      }

      parent.children.splice(index, 1, ...nodes);
    });
  };
}

// ─── Plugin 3: Highlights ───────────────────────────────────────────────────

export function remarkObsidianHighlights() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      if (parent.type === 'code' || parent.type === 'inlineCode') return;

      const text = node.value;
      if (!text.includes('==')) return;

      const re = new RegExp(HIGHLIGHT_REGEX.source, 'g');
      const nodes = splitTextByRegex(text, re, (match) => {
        return [{
          type: 'html',
          value: `<mark class="highlight">${escapeHtml(match[1])}</mark>`,
        }] as NodeLike[];
      });

      if (nodes.length === 1 && nodes[0].type === 'text' && (nodes[0] as Text).value === text) {
        return;
      }

      parent.children.splice(index, 1, ...nodes);
    });
  };
}

// ─── Plugin 4: Block References ─────────────────────────────────────────────

export function remarkObsidianBlockRefs() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      const lastChild = node.children[node.children.length - 1];
      if (!lastChild || lastChild.type !== 'text') return;

      const match = lastChild.value.match(BLOCK_REF_REGEX);
      if (!match) return;

      const blockId = match[1];
      // Remove the ^block-id from text
      (lastChild as Text).value = lastChild.value.replace(BLOCK_REF_REGEX, '');

      // Add id to the paragraph
      node.data = node.data || {};
      (node.data as any).hProperties = (node.data as any).hProperties || {};
      (node.data as any).hProperties.id = blockId;
    });
  };
}

// ─── Plugin 5: Inline Tags ─────────────────────────────────────────────────

export function remarkObsidianTags(base: string = '/') {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      // Don't process tags inside links, code, or headings
      if (
        parent.type === 'link' ||
        parent.type === 'code' ||
        parent.type === 'inlineCode' ||
        parent.type === 'heading'
      ) return;

      const text = node.value;
      if (!text.includes('#')) return;

      const re = new RegExp(INLINE_TAG_REGEX.source, 'g');
      let hasMatch = false;
      const testRe = new RegExp(INLINE_TAG_REGEX.source, 'g');
      if (!testRe.test(text)) return;

      const nodes = splitTextByRegex(text, re, (match) => {
        hasMatch = true;
        const tag = match[1];
        const prefix = match[0].startsWith('#') ? '' : match[0][0]; // preserve leading whitespace
        const result: NodeLike[] = [];
        if (prefix) {
          result.push({ type: 'text', value: prefix } as Text);
        }
        result.push({
          type: 'html',
          value: `<a href="${base}tags/${escapeHtml(tag)}/" class="tag-pill">#${escapeHtml(tag)}</a>`,
        } as NodeLike);
        return result;
      });

      if (!hasMatch) return;

      parent.children.splice(index, 1, ...nodes);
    });
  };
}

// ─── Combined Plugin ────────────────────────────────────────────────────────

/**
 * Main plugin: applies all Obsidian transformations in the correct order.
 * Order matters: callouts first (modifies blockquotes), then inline transforms.
 */
export function remarkObsidian(options?: { base?: string }) {
  const base = options?.base || '/';
  return (tree: Root) => {
    remarkObsidianCallouts()(tree);
    remarkObsidianWikilinks(base)(tree);
    remarkObsidianHighlights()(tree);
    remarkObsidianBlockRefs()(tree);
    remarkObsidianTags(base)(tree);
  };
}

export default remarkObsidian;
