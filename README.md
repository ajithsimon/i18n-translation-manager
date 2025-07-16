# i18n-translation-manager

[![CI/CD Pipeline](https://github.com/ajithsimon/i18n-translation-manager/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/ajithsimon/i18n-translation-manager/actions)
![npm version](https://badge.fury.io/js/i18n-translation-manager.svg)
![Node.js Version](https://img.shields.io/node/v/i18n-translation-manager.svg)
![License](https://img.shields.io/npm/l/i18n-translation-manager.svg)

🌍 **Universal automated translation management tool for i18n projects with dynamic language detection**

A powerful, framework-agnostic library that simplifies managing translations across multiple languages in **any** project using JSON locale files. Works with Vue.js, React, Angular, Next.js, Nuxt, Svelte, Node.js, and more!

## Features

- ✅ **Dynamic Language Detection**: Automatically detects all languages from your locale files
- ✅ **Automatic Translation**: Uses Google Translate to automatically translate missing keys
- 🔄 **Sync Translations**: Keep all language files in sync with your source language
- ➕ **Add New Keys**: Add new translation keys and automatically translate them to all languages
- 🌍 **Add New Languages**: Add new languages with automatic translation through Web UI
- 📊 **Translation Status**: Check completeness of translations across all languages
- 🎯 **Nested Key Support**: Handles nested JSON objects with dot notation
- 🚀 **CLI & Web GUI**: Both command-line and web-based interfaces
- � **Real-time Progress**: Live progress tracking with Server-Sent Events (SSE)
- �🔧 **Framework-Agnostic**: Works with Vue.js, React, Angular, Next.js, Nuxt, Svelte, Node.js, and any project using JSON locale files
- 📦 **Universal**: Can be used across multiple projects, frameworks, and teams
- 🔷 **TypeScript Support**: Full TypeScript implementation with type definitions
- ⚡ **Optimized Performance**: Efficient API calls with 25-key batch processing

## Installation

```bash
# Install globally for CLI usage
npm install -g i18n-translation-manager

# Or install locally in your project
npm install --save-dev i18n-translation-manager
```

## Quick Start

### 1. Initialize Configuration

```bash
# In your project root
i18n-translate init
```

This creates an `i18n.config.js` file with default settings for Vue.js projects (easily customizable for other frameworks):

```javascript
export default {
  // Path to your locale files (relative to project root)
  localesPath: './src/i18n/locales',  // Vue.js default
  
  // Default source language for translations
  defaultSourceLang: 'en',
  
  // Translation service (currently supports 'google-free')
  translationService: 'google-free',
  
  // Optional: Rate limiting for translation API
  rateLimiting: {
    batchSize: 5,
    delayBetweenBatches: 1000
  }
};
```

### 2. Use the CLI

```bash
# Sync all translations from English to other languages
i18n-translate sync

# Sync from a different source language
i18n-translate sync de

# Add a new translation key
i18n-translate add "button.save" "Save changes"

# Check translation status
i18n-translate check

# Start web GUI server
i18n-translate server 3001
```

### 3. Use the Web Interface

```bash
# Start the web server
i18n-translate server

# Open http://localhost:3001 in your browser
```

## Configuration

The `i18n.config.js` file supports the following options:

```javascript
export default {
  // Required: Path to locale files
  localesPath: './src/i18n/locales',
  
  // Default source language
  defaultSourceLang: 'en',
  
  // Translation service
  translationService: 'google-free',
  
  // File naming pattern (optional)
  filePattern: '{lang}.json',
  
  // Exclude certain files (optional)
  excludeFiles: ['index.js', 'README.md'],
  
  // Rate limiting settings (optional)
  rateLimiting: {
    batchSize: 5,
    delayBetweenBatches: 1000
  }
};
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `i18n-translate init` | Create configuration file |
| `i18n-translate sync [source-lang]` | Sync all translations |
| `i18n-translate add <key> <text> [lang]` | Add new translation key |
| `i18n-translate check [source-lang]` | Check translation status |
| `i18n-translate server [port]` | Start web GUI server |
| `i18n-translate help` | Show help information |

## Framework Support

This tool is **framework-agnostic** and works with any project that uses JSON locale files:

### Common Framework Configurations

| Framework | Typical Path | i18n Library |
|-----------|-------------|--------------|
| 🟢 **Vue.js** | `./src/i18n/locales` | vue-i18n |
| ⚛️ **React** | `./public/locales` | react-i18next |
| 🅰️ **Angular** | `./src/assets/i18n` | Angular i18n |
| ⚡ **Next.js** | `./public/locales` | next-i18next |
| 💚 **Nuxt.js** | `./lang` | @nuxtjs/i18n |
| 🔶 **Svelte** | `./src/lib/i18n` | svelte-i18n |
| 🟢 **Node.js** | `./locales` | i18next |

### Quick Setup for Popular Frameworks

```javascript
// i18n.config.js - Choose the path for your framework
export default {
  localesPath: './src/i18n/locales',  // Vue.js
  // localesPath: './public/locales',     // React/Next.js  
  // localesPath: './src/assets/i18n',    // Angular
  // localesPath: './lang',               // Nuxt.js
  // localesPath: './src/lib/i18n',       // Svelte
  // localesPath: './locales',            // Node.js
  
  defaultSourceLang: 'en'
};
```

## Important Details

### Translation Service
- Uses Google Translate's free web interface
- No API key required
- Supports 100+ languages
- Built-in rate limiting with 25-key batch processing
- Real-time progress tracking with Server-Sent Events

### Dynamic Language Detection
The system automatically detects supported languages by scanning `.json` files in your locales directory:
- **Add a new language**: Just create a new `.json` file
- **Remove a language**: Delete the corresponding `.json` file  
- **System updates automatically**: CLI, server, and web UI recognize changes immediately

### Programmatic Usage
```javascript
import { TranslationManager } from 'i18n-translation-manager';

const config = {
  localesPath: './src/i18n/locales',
  defaultSourceLang: 'en'
};

const manager = new TranslationManager(config);

// Sync translations
await manager.syncTranslations('en');

// Add new key
await manager.addKey('button.cancel', 'Cancel', 'en');

// Check status
const status = manager.getTranslationStatus('en');
console.log(status);
```

### Package.json Integration
```json
{
  "scripts": {
    "translate:sync": "i18n-translate sync",
    "translate:add": "i18n-translate add",
    "translate:check": "i18n-translate check",
    "translate:server": "i18n-translate server"
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details.
