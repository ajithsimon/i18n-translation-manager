#!/usr/bin/env node

import { minify } from 'html-minifier-terser';
import fs from 'fs';
import path from 'path';

const inputFile = path.join(process.cwd(), 'web/index.html');
const outputFile = path.join(process.cwd(), 'web/index.html');

const html = fs.readFileSync(inputFile, 'utf8');

const minified = await minify(html, {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  minifyCSS: true,
  minifyJS: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  removeOptionalTags: false,
  keepClosingSlash: true
});

// Only overwrite if we got significant savings
const originalSize = html.length;
const minifiedSize = minified.length;
const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

console.log(`HTML minification: ${originalSize} → ${minifiedSize} bytes (${savings}% smaller)`);

if (minifiedSize < originalSize) {
  fs.writeFileSync(outputFile, minified, 'utf8');
  console.log('✅ Web interface minified successfully');
} else {
  console.log('⚠️ No significant savings, keeping original file');
}
