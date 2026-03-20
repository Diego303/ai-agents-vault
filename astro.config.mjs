// @ts-check
import { defineConfig } from 'astro/config';
import remarkObsidian from './src/utils/obsidian-remark.js';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeMermaid from './src/utils/rehype-mermaid.js';
import sitemap from '@astrojs/sitemap';

const base = '/ai-agents-vault/';

export default defineConfig({
  site: 'https://Diego303.github.io',
  base,

  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  integrations: [
    sitemap(),
  ],

  markdown: {
    remarkPlugins: [
      [remarkObsidian, { base }],
      remarkGfm,
      remarkMath,
    ],
    rehypePlugins: [
      [rehypeKatex, { strict: false, output: 'htmlAndMathml' }],
      rehypeMermaid,
    ],
    shikiConfig: {
      themes: {
        light: 'github-dark',
        dark: 'github-dark',
      },
    },
  },

  vite: {
    ssr: {
      noExternal: [],
    },
  },
});
