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
        !page.includes('/pathway/') && !page.includes('/camps/'),
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
