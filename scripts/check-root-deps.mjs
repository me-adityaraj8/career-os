/**
 * Guards against drift between backend/package.json and the root
 * package.json, which exists only so the Vercel serverless function can
 * resolve the backend's runtime dependencies from the repo root.
 */
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const backend = read('../backend/package.json').dependencies ?? {};
const root = read('../package.json').dependencies ?? {};

const problems = [];
for (const [name, want] of Object.entries(backend)) {
  if (root[name] !== want) problems.push(`  ${name}: backend=${want} root=${root[name] ?? '(missing)'}`);
}
for (const name of Object.keys(root)) {
  if (!(name in backend)) problems.push(`  ${name}: present at root but not in backend`);
}

if (problems.length) {
  console.error('Root and backend dependencies have drifted:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`Root dependencies match backend (${Object.keys(backend).length} packages).`);
