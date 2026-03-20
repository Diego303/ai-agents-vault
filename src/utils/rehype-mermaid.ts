/**
 * rehype-mermaid.ts
 * Rehype plugin that transforms ```mermaid code blocks into
 * <div class="mermaid"> elements for client-side rendering.
 */
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

export function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.tagName !== 'pre') return;

      // Find <code class="language-mermaid"> inside <pre>
      // Shiki may output classes like ["shiki", "github-dark", ...] on <pre>
      // and ["language-mermaid"] on <code>, or Astro may use "astro-code"
      const codeEl = node.children.find(
        (child): child is Element => {
          if (child.type !== 'element' || child.tagName !== 'code') return false;
          const cn = child.properties?.className;
          if (!cn) return false;
          const classes = Array.isArray(cn) ? cn : [cn];
          return classes.some(c => typeof c === 'string' && c.includes('mermaid'));
        },
      );

      if (!codeEl) return;

      // Extract the text content from the code element
      let mermaidCode = '';
      visit(codeEl, 'text', (textNode: any) => {
        mermaidCode += textNode.value;
      });

      // Replace the <pre> with a <div class="mermaid">
      const mermaidDiv: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['mermaid-wrapper'],
        },
        children: [
          {
            type: 'element',
            tagName: 'pre',
            properties: {
              className: ['mermaid'],
            },
            children: [{ type: 'text', value: mermaidCode }],
          },
        ],
      };

      (parent as Element).children.splice(index, 1, mermaidDiv);
    });
  };
}

export default rehypeMermaid;
