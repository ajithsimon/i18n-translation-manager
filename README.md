# i18n-translation-manager

🌍 **Universal automated translation management tool for i18n projects with dynamic language detection**

A powerful, framework-agnostic library that simplifies managing translations across multiple languages in **any** project using JSON locale files. Works with Vue.js, React, Angular, Next.js, Nuxt, Svelte, Node.js, and more!

## Features

- ✅ **Dynamic Language Detection**: Automatically detects all languages from your locale files
- ✅ **Automatic Translation**: Uses Google Translate to automatically translate missing keys
- 🔄 **Sync Translations**: Keep all language files in sync with your source language
- ➕ **Add New Keys**: Add new translation keys and automatically translate them to all languages
- 📊 **Translation Status**: Check completeness of translations across all languages
- 🎯 **Nested Key Support**: Handles nested JSON objects with dot notation
- 🚀 **CLI & Web GUI**: Both command-line and web-based interfaces
- 🔧 **Framework-Agnostic**: Works with Vue.js, React, Angular, Next.js, Nuxt, Svelte, Node.js, and any project using JSON locale files
- 📦 **Universal**: Can be used across multiple projects, frameworks, and teams

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

## Configuration Options

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

## Programmatic Usage

You can also use the library programmatically in your Node.js scripts:

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

## API Server

The library includes an Express.js server for the web interface and API access:

```javascript
import { TranslationServer } from 'i18n-translation-manager/lib/server.js';

const config = {
  localesPath: './src/i18n/locales',
  defaultSourceLang: 'en'
};

const server = new TranslationServer(config, 3001);
server.start();
```

### API Endpoints

- `GET /api/languages` - Get supported languages
- `GET /api/status/:lang?` - Get translation status
- `POST /api/sync` - Sync translations
- `POST /api/add-key` - Add new translation key
- `GET /api/health` - Health check

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

This tool is **framework-agnostic** and works with any project that uses JSON locale files. Here are common configurations:

### 🟢 Vue.js (vue-i18n)
```javascript
// i18n.config.js
export default {
  localesPath: './src/i18n/locales',
  defaultSourceLang: 'en'
};
```
**Structure:** `src/i18n/locales/en.json`, `src/i18n/locales/de.json`

### ⚛️ React (react-i18next)
```javascript
// i18n.config.js
export default {
  localesPath: './public/locales',
  defaultSourceLang: 'en'
};
```
**Structure:** `public/locales/en.json`, `public/locales/de.json`

### 🅰️ Angular (Angular i18n)
```javascript
// i18n.config.js
export default {
  localesPath: './src/assets/i18n',
  defaultSourceLang: 'en'
};
```
**Structure:** `src/assets/i18n/en.json`, `src/assets/i18n/de.json`

### ⚡ Next.js (next-i18next)
```javascript
// i18n.config.js
export default {
  localesPath: './public/locales',
  defaultSourceLang: 'en'
};
```
**Structure:** `public/locales/en.json`, `public/locales/de.json`

### 💚 Nuxt.js (@nuxtjs/i18n)
```javascript
// i18n.config.js
export default {
  localesPath: './lang',
  defaultSourceLang: 'en'
};
```
**Structure:** `lang/en.json`, `lang/de.json`

### 🔶 Svelte (svelte-i18n)
```javascript
// i18n.config.js
export default {
  localesPath: './src/lib/i18n',
  defaultSourceLang: 'en'
};
```
**Structure:** `src/lib/i18n/en.json`, `src/lib/i18n/de.json`

### 🟢 Node.js (i18next)
```javascript
// i18n.config.js
export default {
  localesPath: './locales',
  defaultSourceLang: 'en'
};
```
**Structure:** `locales/en.json`, `locales/de.json`

### 🎯 Custom Projects
```javascript
// i18n.config.js
export default {
  localesPath: './assets/translations',
  defaultSourceLang: 'en',
  excludeFiles: ['metadata.json', 'config.json']
};
```

## Examples

### Basic Vue.js Project

```bash
# 1. Install the package
npm install --save-dev i18n-translation-manager

# 2. Initialize configuration
npx i18n-translate init

# 3. Sync translations
npx i18n-translate sync

# 4. Add new keys
npx i18n-translate add "user.welcome" "Welcome back!"

# 5. Start web interface
npx i18n-translate server
```

### React with react-i18next

```bash
# 1. Install the package
npm install --save-dev i18n-translation-manager

# 2. Create config for React structure
echo 'export default { localesPath: "./public/locales", defaultSourceLang: "en" }' > i18n.config.js

# 3. Sync translations
npx i18n-translate sync

# 4. Start web interface
npx i18n-translate server
```

### Angular Project

```bash
# 1. Install the package
npm install --save-dev i18n-translation-manager

# 2. Create config for Angular structure
echo 'export default { localesPath: "./src/assets/i18n", defaultSourceLang: "en" }' > i18n.config.js

# 3. Sync translations
npx i18n-translate sync
```

### Next.js Project

```bash
# 1. Install the package
npm install --save-dev i18n-translation-manager

# 2. Create config for Next.js structure
echo 'export default { localesPath: "./public/locales", defaultSourceLang: "en" }' > i18n.config.js

# 3. Sync translations
npx i18n-translate sync
```

### Custom Project Structure

```javascript
// i18n.config.js
export default {
  localesPath: './assets/translations',
  defaultSourceLang: 'de',
  excludeFiles: ['metadata.json']
};
```

### Multiple Teams/Projects

Each project can have its own configuration:

```bash
# Project A (Vue.js with English source)
cd project-a
echo 'export default { localesPath: "./src/i18n/locales", defaultSourceLang: "en" }' > i18n.config.js

# Project B (React with German source) 
cd project-b
echo 'export default { localesPath: "./public/locales", defaultSourceLang: "de" }' > i18n.config.js

# Both can use the same tool
i18n-translate sync
```

## Integration with Package.json

Add scripts to your `package.json`:

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

## Project Structure Support

The tool works with any project structure:

```
your-project/
├── src/i18n/locales/          # Vue.js standard
│   ├── en.json
│   ├── de.json
│   └── es.json
│
├── public/locales/            # React i18next standard
│   ├── en.json
│   ├── de.json
│   └── es.json
│
├── assets/translations/       # Custom structure
│   ├── english.json
│   ├── german.json
│   └── spanish.json
│
└── i18n.config.js            # Configuration
```

## Dynamic Language Detection

The system automatically detects supported languages by scanning `.json` files in your locales directory. No need to manually configure language lists!

- **Add a new language**: Just create a new `.json` file
- **Remove a language**: Delete the corresponding `.json` file  
- **System updates automatically**: CLI, server, and web UI recognize changes immediately

## Translation Service

Currently uses Google Translate's free web interface:
- ✅ No API key required
- ✅ Supports 100+ languages
- ✅ Handles nested JSON structures
- ✅ Built-in rate limiting
- ⚠️ For production use, consider upgrading to Google Translate API with authentication

## Troubleshooting

### Configuration Issues
- Ensure `i18n.config.js` exists in your project root
- Check that `localesPath` points to correct directory
- Verify locale files are valid JSON

### Translation API Issues
- Rate limiting prevents being blocked by Google
- Failed translations fall back to original text
- Check internet connection for translation service

### Missing Translations
- Verify source language file exists and has content
- Use `i18n-translate check` to see current status
- Ensure proper JSON formatting in locale files

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details.

## Support

For teams at DIH: Contact the development team for support and custom configurations.

For external users: Please open an issue on the GitHub repository.
