#!/usr/bin/env node
/**
 * Run one CI chunk (fresh Cypress session) by id from config/ci-chunks.js.
 *
 * Usage:
 *   node scripts/run-ci-chunk.js ui-homepage
 *   DEVICE=mobile node scripts/run-ci-chunk.js seo-category-a
 */
const { spawnSync } = require('child_process');
const path = require('path');
const chunks = require('../config/ci-chunks');

const ROOT = path.resolve(__dirname, '..');
const chunkId = process.argv[2];

if (!chunkId) {
  console.error('Usage: node scripts/run-ci-chunk.js <chunk-id>');
  console.error('Example: DEVICE=mobile node scripts/run-ci-chunk.js ui-homepage');
  process.exit(1);
}

const allChunks = [...chunks.ui, ...chunks.seo];
const chunk = allChunks.find((entry) => entry.id === chunkId);

if (!chunk) {
  console.error(`Unknown chunk id: ${chunkId}`);
  console.error('Available:', allChunks.map((entry) => entry.id).join(', '));
  process.exit(1);
}

const specArg = chunk.specs.map((spec) => `"${spec}"`).join(',');
const device = (process.env.DEVICE || 'desktop').toLowerCase();

console.log(`\n=== CI chunk: ${chunk.label} (${chunkId}) — ${device} ===\n`);

const result = spawnSync(`npm run cypress:run -- --spec ${specArg}`, {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DEVICE: device },
});

process.exit(result.status ?? 1);
