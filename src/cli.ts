#!/usr/bin/env node

import { TranslationManager, TranslationConfig } from './index.js';
import { TranslationServer } from './server.js';
import path from 'path';
import fs from 'fs';

// Find configuration file
function findConfig(): string | null {
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
async function loadConfig(): Promise<TranslationConfig> {
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
async function runCLI(): Promise<void> {
  try {
    const config = await loadConfig();
    const translationManager = new TranslationManager(config);
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      showHelp();
      return;
    }

    const command = args[0];

    switch (command) {
      case 'sync':
        const forceFlag = args.includes('--force') || args.includes('-f');
        const sourceLang = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-') && arg !== 'sync');
        await translationManager.syncTranslations(sourceLang, forceFlag);
        break;
        
      case 'status':
        const statusSourceLang = args[1];
        translationManager.checkTranslations(statusSourceLang);
        break;
        
      case 'add-key':
        if (args.length < 3) {
          console.error('❌ Usage: i18n-translate add-key <key-path> <source-value> [source-lang]');
          process.exit(1);
        }
        const keyPath = args[1]!;
        const sourceValue = args[2]!;
        const addKeySourceLang = args[3];
        await translationManager.addKey(keyPath, sourceValue, addKeySourceLang);
        break;
        
      case 'add-language':
        if (args.length < 3) {
          console.error('❌ Usage: i18n-translate add-language <source-language> <new-language>');
          process.exit(1);
        }
        const sourceLanguage = args[1]!;
        const newLanguage = args[2]!;
        await translationManager.addNewLanguage(sourceLanguage, newLanguage);
        break;
        
      case 'server':
        const port = args[1] ? parseInt(args[1]) : 3001;
        if (isNaN(port)) {
          console.error('❌ Invalid port number');
          process.exit(1);
        }
        
        const server = new TranslationServer(config, port);
        await server.start();
        break;
        
      case 'languages':
        const languages = translationManager.getSupportedLanguages();
        console.log('🌍 Supported languages:');
        Object.keys(languages).forEach(lang => {
          console.log(`  ${lang}`);
        });
        break;
        
      case 'config':
        console.log('📋 Current configuration:');
        console.log(JSON.stringify(config, null, 2));
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
🌍 i18n Translation Manager - Universal translation tool for any framework

Usage: i18n-translate <command> [options]

Commands:
  sync [source-lang] [--force]        Sync translations from source language to all others
  status [source-lang]            Show translation status for all languages
  add-key <key> <value> [lang]    Add new translation key to all languages
  add-language <source> <target>  Add new language by cloning from source
  server [port]                   Start web server (default port: 3001)
  languages                       List all supported languages
  config                          Show current configuration
  help                           Show this help message

Examples:
  i18n-translate sync                    # Smart sync: only modified/new keys
  i18n-translate sync en                 # Smart sync from English
  i18n-translate sync --force            # Force re-translate ALL keys
  i18n-translate sync en --force         # Force re-translate from English
  i18n-translate status                  # Show translation status
  i18n-translate add-key "app.title" "My App"
  i18n-translate add-language en fr      # Add French by cloning English
  i18n-translate server 3000            # Start server on port 3000

Smart Detection (Default):
  Automatically detects which English keys have been modified since last sync
  and only translates those keys. Perfect for large projects!
  
  Example: In a 1000-key project with 7 languages:
  - Modify 5 keys → Only translates 35 items (5 × 7) instead of 7000!
  - Cache stored in: .i18n-sync-cache.json

Force Mode:
  Use --force flag to re-translate ALL keys (ignores cache).
  Useful for: testing translations, changing translation service, or debugging.

Configuration:
  Place a config file in your project root:
  - i18n.config.js/json
  - translation.config.js/json

Configuration options:
  {
    "localesPath": "./src/i18n/locales",     // Path to locale files
    "defaultSourceLang": "en",               // Default source language
    "translationService": "google-free",     // Translation service
    "excludeFiles": [],                      // Files to exclude
    "rateLimiting": {
      "batchSize": 5,                        // Translations per batch
      "delayBetweenBatches": 1000           // Delay in milliseconds
    }
  }

🌐 Works with: Vue.js, React, Angular, Next.js, Nuxt, Svelte, Node.js, and any framework using JSON locale files
  `);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

// Run CLI
runCLI().catch((error) => {
  console.error('❌ Fatal error:', (error as Error).message);
  process.exit(1);
});
