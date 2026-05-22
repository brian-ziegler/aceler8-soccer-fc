import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const site =
  process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://aceler8fc.com';

export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/pathway/') &&
        !page.includes('/camps/') &&
        !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname;

        // Homepage
        if (path === '/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }

        // Programs — registration info changes frequently
        if (path === '/programs/') {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }

        // Coaches index — key trust signal
        if (path === '/coaches/') {
          return { ...item, priority: 0.8, changefreq: 'monthly' };
        }

        // Individual coach bios
        if (path.startsWith('/coaches/')) {
          return { ...item, priority: 0.6, changefreq: 'monthly' };
        }

        // Player profiles
        if (path.startsWith('/players/')) {
          return { ...item, priority: 0.5, changefreq: 'monthly' };
        }

        // Core informational pages
        if (['/about/', '/teams/', '/contact/'].includes(path)) {
          return { ...item, priority: 0.7, changefreq: 'monthly' };
        }

        // Schedule — content changes as dates are confirmed
        if (path === '/schedule/') {
          return { ...item, priority: 0.6, changefreq: 'weekly' };
        }

        // Everything else (tournament-directors, etc.)
        return { ...item, priority: 0.3, changefreq: 'monthly' };
      },
    }),
  ],
  build: {
    format: 'directory',
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
});
