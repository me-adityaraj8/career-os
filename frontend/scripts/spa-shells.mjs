// Copies the built app shell to dist/<route>/index.html for every top-level
// route in App.tsx, so a static host serves a real page when someone opens or
// refreshes a deep link. Vercel's multi-service mode has no SPA fallback rewrite.
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';

const routes = [...readFileSync('src/App.tsx', 'utf8').matchAll(/path="\/([a-z-]+)"/g)].map((m) => m[1]);
for (const route of routes) {
  mkdirSync(`dist/${route}`, { recursive: true });
  copyFileSync('dist/index.html', `dist/${route}/index.html`);
}
console.log(`spa-shells: ${routes.length} routes -> ${routes.join(', ')}`);
