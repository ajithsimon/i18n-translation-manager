# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **📋 For detailed release information and migration guides, see [RELEASE-NOTES.md](RELEASE-NOTES.md)**

## [2.3.3] - 2025-07-17

### Fixed
- 🐛 **Translation Status UI**: Fixed source language tile (English) missing from Translation Status page
- 🐛 **Web Interface**: Fixed parameter name mismatch in add key functionality (keyPath/sourceValue vs key/value)
- 🔧 **API Consistency**: Improved error handling and parameter validation in key addition endpoint

### Improved
- 🎨 **User Experience**: Source language now properly displayed in status overview with 100% completeness
- 🔗 **Frontend-Backend Alignment**: Better synchronization between web UI and API parameter expectations
- 📊 **Status Reporting**: Complete language status overview now includes all supported languages

## [2.3.2] - 2025-07-16

### Changed
- Optimized npm package size by 45% (121KB → 67KB unpacked, 27KB → 17KB packed)
- Excluded source maps from production builds (saves ~30KB)
- Minified web interface HTML by 47% (27KB → 14KB)
- Streamlined package files to include only essential components

### Removed  
- Development documentation files (DEVELOPMENT.md, TYPESCRIPT.md) from npm package
- Source maps and declaration maps from production builds
- Unnecessary documentation reducing package bloat

### Technical
- Added production build pipeline with HTML minification
- Implemented selective file inclusion for npm packaging
- Enhanced build scripts for optimized releases

## [2.3.1] - 2025-07-15

### Added
- Real-time progress tracking with Server-Sent Events (SSE) for translation operations
- Live progress bars and timestamped logs during translation
- Sample project with 500+ realistic translation keys for testing and demonstration
- Progress callback system for translation methods

### Changed
- Optimized default batch size from 5 to 25 keys per batch for better performance
- Simplified web UI by removing batch size configuration field
- Streamlined translation interface with automatic optimal settings

### Removed
- Manual batch size selection from web interface (now uses optimized default)
- Deprecated `startBatchTranslation` function (replaced with SSE-based approach)

### Fixed
- Improved user experience with real-time feedback instead of terminal-only logs
- Enhanced translation reliability with optimized batch processing

## [2.3.0] - 2025-07-15

### Added
- Enhanced `/api/add-language` endpoint to return translation statistics (`keysTranslated`, `totalKeys`)
- Optimized web UI workflow for adding new languages

### Fixed
- Fixed automatic translation not working when adding new languages via web UI
- Fixed web UI showing "0 keys translated" instead of actual translation count
- Fixed redundant API calls in add language workflow

### Changed
- Modified `addNewLanguage()` method to return translation statistics
- Optimized web UI to use API response data directly instead of additional status calls
- Reduced API calls from 3 to 1 when adding new languages (3x performance improvement)

## [2.2.0] - 2025-07-15

### Added
- Full TypeScript support with strict type checking
- Comprehensive type definitions and interfaces
- TypeScript compilation pipeline with source maps
- Declaration files for npm package consumers

### Changed
- Migrated entire codebase from JavaScript to TypeScript
- Updated build system to use TypeScript compiler
- Enhanced API with proper type definitions

### Technical
- TypeScript 5.8.3 with ES2022 target
- ES Modules with dynamic imports
- Generated source maps for debugging
- Backward compatible compiled JavaScript output

## [2.1.0] - 2025-07-14

### Added
- Web UI support for adding new languages with automatic translation
- Batch translation processing for large translation sets
- Configurable batch sizes for translation processing
- Enhanced web interface for managing multiple languages

### Enhanced
- Streamlined process for adding and managing new languages
- Better handling of projects with large numbers of translation keys
- Improved web interface with real-time progress tracking

## [2.0.2] - 2025-07-14

### Fixed
- CI/CD pipeline permissions and authentication issues
- Package lock dependencies for CI/CD pipeline
- Automated release workflow improvements

### Documentation
- NPM authentication documentation for CI/CD
- Enhanced release documentation and process

## [2.0.1] - 2025-07-14

### Added
- Comprehensive CI/CD pipeline with automated testing, building, and publishing
- Automated version bumping and release management scripts
- GitHub Actions workflows for testing and deployment

### Improved
- Code cleanup and optimized project structure
- Streamlined documentation and removed repetitive examples
- Better file organization and build processes

### Technical
- Full automation of release and publishing process
- Integrated testing pipeline with automated checks
- Automated npm publishing with proper version management

## [2.0.0] - 2025-07-10 (Initial Release)

### Added
- Dynamic language detection from locale files
- Google Translate integration for automatic translation
- Translation synchronization between source and target languages
- Add new translation keys with automatic translation to all languages
- Translation status checking and completeness reporting
- Nested JSON object support with dot notation
- CLI interface with comprehensive commands
- Web GUI for translation management
- Framework agnostic support (Vue.js, React, Angular, Next.js, Nuxt, Svelte, Node.js)
- Universal project compatibility

### Core Features
- CLI commands: `sync`, `add`, `check`, `server`, `init`, `help`
- Web interface with real-time updates
- RESTful API for integration with other tools
- Flexible configuration system with `i18n.config.js`
- Built-in rate limiting for translation API calls
- Comprehensive error handling and fallback mechanisms

### Framework Support
- Vue.js with vue-i18n integration
- React with react-i18next compatibility
- Angular i18n patterns support
- Next.js with next-i18next integration
- Nuxt.js with @nuxtjs/i18n support
- Svelte with svelte-i18n compatibility
- Full Node.js application support

### API Endpoints
- `GET /api/languages` - Get supported languages
- `GET /api/status/:lang?` - Get translation status
- `POST /api/sync` - Sync translations
- `POST /api/add-key` - Add new translation key
- `GET /api/health` - Health check
