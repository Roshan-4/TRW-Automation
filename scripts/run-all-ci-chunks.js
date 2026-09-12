#!/usr/bin/env node
/**
 * Run every CI chunk locally in fresh Cypress sessions (desktop then mobile).
 * Mirrors the GitHub Actions matrix without parallelism — avoids cumulative
 * session slowdown and keeps each batch under a manageable runtime.
 *
 * Usage:
 *   node scripts/run-all-ci-chunks.js           # all UI + SEO chunks
 *   node scripts/run-all-ci-chunks.js ui          # UI chunks only
 *   node scripts/run-all-ci-chunks.js seo         # SEO chunks only
 *   node scripts/run-all-ci-chunks.js ui-homepage # one chunk, both devices
 *   DEVICE=mobile node scripts/run-all-ci-chunks.js seo-category-a
 */
const { spawnSync } = require('child_process');
const path = require('path');
const chunks = require('../config/ci-chunks');

const ROOT = path.resolve(__dirname, '..');
const filter = process.argv[2] || 'all';
const devicesEnv = process.env.DEVICES;
const devices = devicesEnv
  ? devicesEnv.split(',').map((item) => item.trim()).filter(Boolean)
  : ['desktop', 'mobile'];

const allChunks = [...chunks.ui, ...chunks.seo];

const resolveChunks = () => {
  if (filter === 'all') {
    return allChunks;
  }
  if (filter === 'ui') {
    return chunks.ui;
  }
  if (filter === 'seo') {
    return chunks.seo;
  }
  const match = allChunks.find((entry) => entry.id === filter);
  if (!match) {
    console.error(`Unknown filter: ${filter}`);
    console.error('Use all | ui | seo | <chunk-id>');
    console.error('Available:', allChunks.map((entry) => entry.id).join(', '));
    process.exit(1);
  }
  return [match];
};

const runChunk = (chunkId, device) => {
  console.log(`\n=== ${chunkId} (${device}) ===\n`);
  const env = { ...process.env, DEVICE: device };
  const result = spawnSync('node', ['scripts/run-ci-chunk.js', chunkId], {
    cwd: ROOT,
    stdio: 'inherit',
    env,
  });
  return result.status ?? 1;
};

const main = () => {
  const selected = resolveChunks();
  let exitCode = 0;
  let runIndex = 0;

  selected.forEach((chunk) => {
    devices.forEach((device) => {
      runIndex += 1;
      console.log(`\n--- Batch ${runIndex}/${selected.length * devices.length}: ${chunk.label} [${device}] ---`);
      const status = runChunk(chunk.id, device);
      if (status !== 0) {
        exitCode = status;
        console.error(`\nChunk ${chunk.id} [${device}] finished with failing test(s).\n`);
      }
    });
  });

  process.exit(exitCode);
};

main();
