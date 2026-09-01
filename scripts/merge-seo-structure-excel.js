#!/usr/bin/env node
/**
 * Combine the per-device seo-structure-report.xlsx files (downloaded from
 * the seo-desktop and seo-mobile CI artifacts) into one workbook, so the
 * report email attaches a single file covering both devices.
 *
 * Usage: node scripts/merge-seo-structure-excel.js <out.xlsx> <in1.xlsx> [in2.xlsx ...]
 * Silently no-ops (exit 0, no file written) if none of the inputs exist —
 * a UI-only run has no SEO results to merge.
 */
const path = require('path');
const { mergeSeoStructureExcelFiles } = require('../helpers/seoStructureExcel');

async function main() {
  const [outputPath, ...sourcePaths] = process.argv.slice(2);
  if (!outputPath || !sourcePaths.length) {
    console.error('Usage: node scripts/merge-seo-structure-excel.js <out.xlsx> <in1.xlsx> [in2.xlsx ...]');
    process.exit(1);
  }

  const resolvedOutput = path.resolve(process.cwd(), outputPath);
  const resolvedSources = sourcePaths.map((p) => path.resolve(process.cwd(), p));

  const written = await mergeSeoStructureExcelFiles(resolvedSources, resolvedOutput);
  if (!written) {
    console.log('No seo-structure-report.xlsx found in any source — nothing to merge.');
    return;
  }
  console.log(`Merged ${resolvedSources.length} source file(s) into ${written}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
