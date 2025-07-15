# TypeScript Development Guide

This project now includes full TypeScript support for improved type safety and developer experience.

## TypeScript Features

- ✅ **Full Type Safety**: Complete TypeScript rewrite with proper interfaces and types
- ✅ **Type Definitions**: Exported .d.ts files for all public APIs
- ✅ **Backward Compatible**: Existing JavaScript usage continues to work
- ✅ **Enhanced IDE Support**: Better IntelliSense, auto-completion, and error detection
- ✅ **Build Pipeline**: Automated TypeScript compilation with source maps

## Development Setup

### Building the Project

```bash
# Build TypeScript to JavaScript
npm run build

# Build and watch for changes
npm run build:watch
```

### Using TypeScript Types

```typescript
import { TranslationManager, TranslationConfig, TranslationStatus } from 'i18n-translation-manager';

// Configuration with full type safety
const config: TranslationConfig = {
  localesPath: './src/i18n/locales',
  defaultSourceLang: 'en',
  rateLimiting: {
    batchSize: 10,
    delayBetweenBatches: 500
  }
};

// Create manager with typed configuration
const manager = new TranslationManager(config);

// Get typed translation status
const status: TranslationStatus = manager.getTranslationStatus('en', 'fr');
console.log(`French translation is ${status.completeness}% complete`);
```

### Server API with TypeScript

```typescript
import { TranslationServer, ServerConfig } from 'i18n-translation-manager';

const serverConfig: ServerConfig = {
  localesPath: './locales',
  defaultSourceLang: 'en'
};

const server = new TranslationServer(serverConfig, 3000);
await server.start();
```

## Available Types

### Core Interfaces

```typescript
interface TranslationConfig {
  localesPath?: string;
  defaultSourceLang?: string;
  translationService?: string;
  filePattern?: string;
  excludeFiles?: string[];
  rateLimiting?: {
    batchSize: number;
    delayBetweenBatches: number;
  };
}

interface TranslationStatus {
  language: string;
  total: number;
  translated: number;
  missing: number;
  completeness: number;
}

interface SupportedLanguages {
  [key: string]: string;
}

interface TranslationData {
  [key: string]: any;
}
```

### Server Types

```typescript
interface ServerConfig extends TranslationConfig {
  // Additional server-specific config can be added here
}
```

## File Structure

```
src/
├── index.ts        # Main TranslationManager class
├── server.ts       # Express server with API endpoints
└── cli.ts          # Command-line interface

dist/               # Compiled JavaScript output
├── index.js        # Compiled main module
├── index.d.ts      # Type definitions
├── server.js       # Compiled server
├── server.d.ts     # Server type definitions
├── cli.js          # Compiled CLI
└── *.js.map        # Source maps for debugging
```

## Development Commands

```bash
# Development
npm run build          # Compile TypeScript
npm run build:watch    # Compile and watch for changes
npm run dev           # Build and run CLI
npm run server:dev    # Build and run development server

# Production
npm run start         # Run compiled CLI
npm run server        # Run compiled server

# Release
npm run release:patch  # Build and release patch version
npm run release:minor  # Build and release minor version
npm run release:major  # Build and release major version
```

## Backward Compatibility

Existing JavaScript projects will continue to work without changes. The package provides:

- **Compiled JavaScript**: The main entry point is compiled JS with type definitions
- **Legacy Exports**: Backward-compatible export paths
- **Same API**: All public methods and properties remain unchanged

## Migration from JavaScript

If you're using this package in a TypeScript project, you can gradually adopt types:

```typescript
// Before (JavaScript)
const manager = new TranslationManager({
  localesPath: './locales'
});

// After (TypeScript with types)
import { TranslationManager, TranslationConfig } from 'i18n-translation-manager';

const config: TranslationConfig = {
  localesPath: './locales'
};
const manager = new TranslationManager(config);
```

## Benefits of TypeScript Version

1. **Type Safety**: Catch errors at compile time instead of runtime
2. **Better IDE Support**: Enhanced auto-completion and IntelliSense
3. **Self-Documenting**: Types serve as inline documentation
4. **Refactoring Safety**: Easier to refactor with confidence
5. **Modern JavaScript**: Uses latest ES features with proper typing
6. **Production Ready**: Compiled output is optimized for Node.js environments

## Contributing

When contributing to the TypeScript codebase:

1. Write TypeScript source files in the `src/` directory
2. Add proper type annotations and interfaces
3. Run `npm run build` to compile before testing
4. Ensure all existing tests pass
5. Add type tests for new features

The TypeScript migration maintains 100% backward compatibility while providing a modern, type-safe development experience.
