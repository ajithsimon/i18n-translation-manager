#!/usr/bin/env node

import { TranslationManager } from '../index.js';
import path from 'path';
import fs from 'fs';

// Find configuration file
function findConfig() {
  const possiblePaths = [
    path.join(process.cwd(), 'i18n.config.js'),
    path.join(process.cwd(), 'i18n.config.json'),
    path.join(process.cwd(), 'translation.config.js'),
    path.join(process.cwd(), 'translation.config.json')
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

// Load configuration
async function loadConfig() {
  const configPath = findConfig();
  
  if (!configPath) {
    // Default configuration for Vue.js projects
    return {
      localesPath: './src/i18n/locales',
      defaultSourceLang: 'en',
      translationService: 'google-free'
    };
  }

  if (configPath.endsWith('.js')) {
    const config = await import(configPath);
    return config.default || config;
  } else {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
}

// Main CLI function
async function runCLI() {
  try {
    const config = await loadConfig();
    const translationManager = new TranslationManager(config);
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'sync':
        const sourceLang = args[1] || config.defaultSourceLang;
        await translationManager.syncTranslations(sourceLang);
        break;
        
      case 'add':
        if (args.length < 3) {
          console.error('Usage: i18n-translate add <key.path> <"Source text"> [source-lang]');
          process.exit(1);
        }
        const keyPath = args[1];
        const sourceValue = args[2];
        const addSourceLang = args[3] || config.defaultSourceLang;
        await translationManager.addKey(keyPath, sourceValue, addSourceLang);
        break;
        
      case 'check':
        const checkLang = args[1] || config.defaultSourceLang;
        translationManager.checkTranslations(checkLang);
        break;
        
      case 'server':
        const port = args[1] || 3001;
        const { TranslationServer } = await import('../lib/server.js');
        const server = new TranslationServer(config, port);
        server.start();
        break;
        
      case 'init':
        await createConfig();
        break;
        
      default:
        showHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Create configuration file
async function createConfig() {
  const configTemplate = `export default {
  // Path to your locale files (relative to project root)
  localesPath: './src/i18n/locales',
  
  // Default source language for translations
  defaultSourceLang: 'en',
  
  // Translation service (currently supports 'google-free')
  translationService: 'google-free',
  
  // Optional: Custom file naming pattern
  // filePattern: '{lang}.json',
  
  // Optional: Exclude certain files
  // excludeFiles: ['index.js', 'README.md'],
  
  // Optional: Rate limiting for translation API
  // rateLimiting: {
  //   batchSize: 5,
  //   delayBetweenBatches: 1000
  // }
};
`;

  const configPath = path.join(process.cwd(), 'i18n.config.js');
  
  if (fs.existsSync(configPath)) {
    console.log('⚠️  Configuration file already exists at:', configPath);
    return;
  }
  
  fs.writeFileSync(configPath, configTemplate, 'utf8');
  console.log('✅ Created configuration file:', configPath);
  console.log('📝 Edit the configuration file to match your project structure');
}

// Show help
function showHelp() {
  console.log(`
🌍 i18n Translation Manager

Commands:
  i18n-translate sync [source-lang]        - Sync all translations
  i18n-translate add <key> <text> [lang]   - Add new translation key
  i18n-translate check [source-lang]       - Check translation status
  i18n-translate server [port]             - Start web GUI server
  i18n-translate init                      - Create configuration file
  i18n-translate help                      - Show this help

Examples:
  i18n-translate init                      - Set up configuration
  i18n-translate sync                      - Sync from default source language
  i18n-translate sync de                   - Sync from German
  i18n-translate add "button.save" "Save"  - Add new key
  i18n-translate server 3001               - Start web UI on port 3001

Configuration:
  Create i18n.config.js in your project root to customize settings.
  Run 'i18n-translate init' to generate a template configuration.

Note: This tool uses Google Translate's free API. For production use,
consider using the official Google Translate API with proper authentication.
  `);
}

// Run CLI
runCLI().catch(console.error);
