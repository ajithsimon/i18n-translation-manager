#!/usr/bin/env node

import { minify } from 'html-minifier-terser';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const sourceFile = 'web/index.html';
const tempDir = 'web-optimized';
const targetFile = join(tempDir, 'index.html');

// Ensure target directory exists
if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

// Read source HTML
const html = readFileSync(sourceFile, 'utf8');

// Minify options
const options = {
  removeComments: true,
  removeCommentsFromCDATA: true,
  removeCDATASectionsFromCDATA: true,
  collapseWhitespace: true,
  collapseBooleanAttributes: true,
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  removeEmptyElements: false,
  removeOptionalTags: false,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  minifyJS: true,
  minifyCSS: true
};

// Minify HTML
const minifiedHtml = await minify(html, options);

// Write minified HTML
writeFileSync(targetFile, minifiedHtml, 'utf8');

const originalSize = html.length;
const minifiedSize = minifiedHtml.length;
const savedBytes = originalSize - minifiedSize;
const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

console.log(`✅ Web interface optimized:`);
console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
console.log(`   Minified: ${(minifiedSize / 1024).toFixed(1)}KB`);
console.log(`   Saved: ${(savedBytes / 1024).toFixed(1)}KB (${savedPercent}%)`);
