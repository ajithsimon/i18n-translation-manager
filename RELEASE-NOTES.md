# Release Notes

## Version 3.0.0 - Smart Sync: Intelligent Change Detection 🚀
*Released: December 23, 2025*

### 🎉 Major Release Highlights

This is a **major release** introducing **Smart Sync**, a revolutionary feature that dramatically improves translation performance for large projects by automatically detecting which keys have been modified.

### ✨ Smart Sync: The Game Changer

#### **Intelligent Change Detection**
- **Automatic Detection**: Identifies modified translation keys since last sync
- **Selective Translation**: Only translates changed keys, not the entire project
- **Cache-Based Tracking**: Maintains state in `.i18n-sync-cache.json`
- **200x Performance Boost**: Typical workflows are dramatically faster

#### **How It Works**
```bash
# First sync - establishes baseline
i18n-translate sync
# Creates cache: .i18n-sync-cache.json

# Modify 5 keys in English

# Second sync - only translates changes
i18n-translate sync
# Translates: 5 keys × 7 languages = 35 translations (instead of 7,000!)
```

### 📊 Performance Comparison

**Scenario: 1000 keys, 7 languages, modify 5 keys**

| Version | Keys Translated | API Calls | Time | Improvement |
|---------|----------------|-----------|------|-------------|
| **v2.x** | 7,000 | 7,000 | ~7 min | - |
| **v3.0** | 35 | 35 | ~2 sec | **200x faster** ⚡ |

**Real-World Impact:**
- Modify 1% of keys → 99% reduction in API calls
- Modify 5% of keys → 95% reduction in API calls
- Modify 10% of keys → 90% reduction in API calls

### 🎯 Key Features

#### **Smart Detection Categories**
The system accurately categorizes changes:

1. **📝 Modified Keys** - Existing keys with changed values
   ```
   "save": "Save" → "Save Changes"
   ```

2. **🆕 New Keys** - Keys added to source language
   ```
   Added: "buttons.refresh": "Refresh Page"
   ```

3. **➕ Missing Keys** - Keys not in target language
   ```
   Missing in French: "buttons.submit"
   ```

#### **Cache System**
- **Location**: `<localesPath>/.i18n-sync-cache.json`
- **Auto-Generated**: Created after first successful sync
- **Auto-Ignored**: Automatically added to `.gitignore`
- **Safe**: Each developer maintains their own local cache

#### **Force Mode (Backward Compatible)**
Original force mode still available for complete re-translation:
```bash
i18n-translate sync --force  # Re-translates ALL keys
```

**When to use force mode:**
- Testing translation quality
- Debugging translation issues
- After switching translation services
- Cache is corrupted or outdated

### 🔄 Breaking Changes

#### **Default Sync Behavior**
- **v2.x**: Always translated all missing keys
- **v3.0**: Uses smart detection by default

**Impact**: Positive! Your syncs are now much faster with no code changes needed.

#### **Migration Path**
**No changes required!** The tool automatically:
1. Creates cache on first sync
2. Uses smart detection on subsequent syncs
3. Falls back to full sync if no cache exists

### 🛠️ Technical Improvements

#### **Code Refactoring**
- **Improved Counting Logic**: Accurate categorization of change types
- **TypeScript Modernization**: Updated to `moduleResolution: "bundler"`
- **Better Error Handling**: Enhanced cache loading and validation
- **Optimized Performance**: Reduced redundant operations

#### **Enhanced Reporting**
Detailed progress messages:
```
🎯 Processing ar...
📝 Found 3 modified key(s) in source
🆕 Found 2 new key(s) in source
➕ Found 1 missing key(s) in target
📋 Total: 6 key(s) to translate in ar.json
```

### 📚 New Documentation

#### **Comprehensive Guide**
- **[SMART-SYNC.md](docs/SMART-SYNC.md)**: Complete guide to smart sync
  - How it works
  - Performance comparisons
  - Best practices
  - Troubleshooting
  - Migration guide

#### **Updated README**
- Smart sync feature documentation
- Performance metrics
- Usage examples
- Cache management guide

### 🎨 User Experience

#### **Faster Development Workflow**
```bash
# Before (v2.x)
# Modify 5 keys → Wait 7 minutes

# After (v3.0)
# Modify 5 keys → Wait 2 seconds ⚡
```

#### **Clear Progress Reporting**
```
📝 Found 3 modified key(s) in source
🆕 Found 2 new key(s) in source
📋 Total: 5 key(s) to translate

🔄 Translating 5 keys from en to zh...
  ✓ buttons.save: "Save Changes" → "保存更改"
  ✓ buttons.delete: "Delete" → "删除"
  ...

💾 Sync state saved to cache
🎉 Translation sync completed!
```

### 🧪 Testing

**Thoroughly tested scenarios:**
- ✅ Fresh sync (no cache) - establishes baseline
- ✅ No changes - shows "up to date"
- ✅ Single modified key - translates only that key
- ✅ Multiple modified keys - batches efficiently
- ✅ New key added - detects and translates
- ✅ Mixed changes - categorizes accurately
- ✅ Failed translations - retries on next sync
- ✅ Force mode - complete re-translation

### 🔍 Cache Management

#### **Automatic Git Integration**
```gitignore
# Auto-added to .gitignore
**/.i18n-sync-cache.json
```

#### **Manual Cache Operations**
```bash
# View cache
cat src/i18n/locales/.i18n-sync-cache.json

# Clear cache (force fresh sync)
rm src/i18n/locales/.i18n-sync-cache.json
i18n-translate sync

# Or use force mode
i18n-translate sync --force
```

### 🌟 Why This Matters

#### **For Small Projects (100 keys)**
- Modest improvement: 10-20 seconds saved per sync
- Benefit: Smoother development workflow

#### **For Medium Projects (500 keys)**
- Significant improvement: 1-2 minutes saved per sync
- Benefit: Much faster iteration cycles

#### **For Large Projects (1000+ keys)**
- **Massive improvement: 5-10 minutes saved per sync**
- **Benefit: Game-changing productivity boost**
- **Impact: Team can make translation updates frequently without waiting**

### 🚀 Upgrade Instructions

```bash
# Update to v3.0.0
npm install -g i18n-translation-manager@3.0.0

# Or in your project
npm install --save-dev i18n-translation-manager@3.0.0

# First sync (establishes cache)
i18n-translate sync

# Future syncs are now smart!
i18n-translate sync  # Only translates changes
```

### 💡 Best Practices

1. **Regular Syncs**: Run sync frequently to keep translations up-to-date
2. **Review Changes**: Check git diff before committing translations
3. **Trust the Cache**: Let smart detection do its job
4. **Force When Needed**: Use `--force` for testing or debugging only
5. **Team Workflow**: Each developer's cache tracks their own changes

### 🐛 Bug Fixes & Improvements

- Fixed TypeScript deprecation warning (moduleResolution)
- Improved counting logic for overlapping changes
- Enhanced error messages for failed translations
- Better handling of missing target keys
- Optimized cache loading and saving

### 🎯 What's Next

Future enhancements under consideration:
- Translation memory for better quality
- Multi-service support (DeepL, AWS Translate)
- Translation validation and review workflows
- Automated translation testing
- CLI interactive mode

### 🙏 Acknowledgments

Thanks to all users who requested faster sync times for large projects. This release directly addresses that need with a 200x performance improvement!

---

## Version 2.3.3 - Critical UI Fixes & Enhanced Status Display
*Released: July 18, 2025*

### 🐛 Critical Bug Fixes

#### **Translation Status Display**
- **Fixed Missing Source Language**: English (source language) now appears in Translation Status overview
- **Complete Language Coverage**: Status page shows all supported languages including the source language
- **100% Source Completeness**: Source language correctly displays as 100% complete

#### **Web Interface Parameter Alignment**
- **Fixed Add Key Functionality**: Resolved parameter mismatch between frontend and backend
- **API Consistency**: Synchronized `keyPath`/`sourceValue` parameters across web UI and server
- **Error Resolution**: Eliminated "keyPath and sourceValue are required" errors

### 🔧 Technical Improvements

#### **Frontend-Backend Synchronization**
- **Parameter Naming**: Aligned web interface to use correct API parameter names
- **Error Handling**: Improved validation and error messages for key addition
- **Status Reporting**: Enhanced translation status endpoint to include source language

#### **User Experience Enhancements**
- **Complete Overview**: Users can now see status of ALL languages in their project
- **Visual Consistency**: Source language properly represented with completion metrics
- **Reduced Confusion**: Clear display of translation completeness across all supported languages

### 📊 Impact on Users

- **Web UI Users**: Add key functionality now works correctly without parameter errors
- **Status Monitoring**: Complete visibility into all language translation status
- **Project Management**: Better oversight of translation completeness across the entire project

---

## Version 2.3.2 - Package Optimization & Build Improvements
*Released: July 16, 2025*

### 📡 Real-time Progress Tracking

#### **Live Translation Feedback**
- **Server-Sent Events (SSE)**: Real-time progress updates during translation operations
- **Live Progress Bars**: Visual progress indicators with percentage completion
- **Timestamped Logs**: Real-time translation logs with detailed status updates
- **Session Management**: Unique session IDs for tracking individual translation processes

#### **Enhanced User Experience**
- **No More Terminal Watching**: Users see progress directly in the web interface
- **Real-time Status Updates**: Live feedback on translation batches and completion
- **Progress Callbacks**: Backend support for progress tracking throughout translation pipeline

### 🎛️ Simplified Interface

#### **Streamlined Configuration**
- **Removed Batch Size Selection**: Eliminated confusing batch size dropdown from UI
- **Optimized Default**: Automatic 25-key batch processing for optimal performance
- **Cleaner Interface**: Simplified add language form with essential options only

#### **Performance Optimizations**
- **5x Faster Processing**: Increased batch size from 5 to 25 keys per batch
- **Better API Limits**: Optimal batch size prevents rate limiting while maximizing speed
- **Improved Reliability**: Balanced batch processing for stable translation operations

### 📁 Comprehensive Sample Project

#### **Ready-to-Test Environment**
- **500+ Translation Keys**: Realistic, comprehensive test data from real applications
- **Multiple Domains**: UI, forms, navigation, business workflows, and error messages
- **Pre-configured Setup**: Complete example project structure for immediate testing
- **Documentation**: Detailed README with usage examples and testing scenarios

### 🔧 Technical Improvements

#### **Backend Enhancements**
- Added SSE endpoint `/api/progress/:sessionId` for real-time communication
- Implemented progress callback system in translation methods
- Enhanced `addNewLanguage()` and `translateMissingKeys()` with progress tracking
- Added client connection management with automatic cleanup

#### **Code Quality**
- Removed deprecated `startBatchTranslation` function
- Cleaned up unused UI components and JavaScript
- Streamlined codebase with modern SSE-based approach
- Improved TypeScript types for progress callbacks

### 🆙 Upgrade Guide

#### **Breaking Changes**
- None - this is a backward-compatible patch release

#### **New Features Available**
1. **Real-time Progress**: Automatic when using web interface
2. **Optimized Performance**: Automatic with new 25-key batch default
3. **Sample Project**: Available in `examples/sample-project/`

#### **Migration Notes**
- No configuration changes required
- Existing projects continue to work without modification
- New batch size default (25) improves performance automatically

---

## Version 2.3.0 - Enhanced Translation Experience
*Released: January 2025*

### 🎯 Major Improvements

#### **Optimized Add Language Performance**
- **3x Faster Language Addition**: Eliminated redundant API calls when adding new languages
- **Accurate Progress Feedback**: Web UI now shows actual translation counts instead of "0 keys translated"
- **Enhanced API Response**: `/api/add-language` endpoint now returns `keysTranslated` and `totalKeys`

#### **Improved User Experience**
- **Real-time Translation Feedback**: See exactly how many keys were translated
- **Streamlined Workflow**: No more redundant translation-status API calls
- **Better Error Handling**: Enhanced error messages and recovery

### 🔧 Technical Enhancements

#### **API Optimizations**
- Modified `addNewLanguage()` method to return translation statistics
- Enhanced server endpoint responses with detailed translation data
- Removed unnecessary batch translation calls for new languages

#### **Web UI Improvements**
- Updated add language workflow to use API response data directly
- Eliminated unnecessary translation-status and translate-batch API calls
- Improved progress indicators with accurate counts

### 🐛 Bug Fixes
- **Fixed**: New languages showing "0 keys translated" in web UI
- **Fixed**: Automatic translation not working when adding languages via web UI
- **Fixed**: Web UI making unnecessary API calls after successful language addition

### 📊 Performance Metrics
- **API Calls Reduced**: From 3 calls to 1 call when adding languages
- **Response Time**: 3x faster language addition process
- **User Experience**: Immediate accurate feedback instead of delayed status updates

### 🚀 Migration Guide
No breaking changes. This is a purely additive release that improves existing functionality.

---

## Version 2.2.0 - TypeScript Foundation
*Released: December 2024*

### 🔷 Complete TypeScript Migration

#### **Full TypeScript Support**
- **Complete Rewrite**: Entire codebase migrated from JavaScript to TypeScript
- **Strict Type Checking**: Enhanced code quality with comprehensive type validation
- **Type Definitions**: Full IntelliSense support for IDE users
- **Source Maps**: Better debugging experience with source map generation

#### **Enhanced Developer Experience**
- **Type Safety**: Compile-time error detection and prevention
- **Better IntelliSense**: Rich autocomplete and documentation in IDEs
- **Improved Maintainability**: Clearer code structure with defined interfaces

### 🛠️ Technical Implementation

#### **Build System**
- **TypeScript 5.8.3**: Latest TypeScript with ES2022 target
- **ES Modules**: Full ESNext module support with dynamic imports
- **Declaration Files**: Type definitions included for npm package consumers
- **Backward Compatibility**: Compiled JavaScript maintains full compatibility

#### **Type System**
```typescript
interface TranslationConfig {
  localesPath?: string;
  defaultSourceLang?: string;
  translationService?: string;
  rateLimiting?: RateLimitConfig;
}

interface TranslationStatus {
  language: string;
  total: number;
  translated: number;
  missing: number;
  completeness: number;
}
```

### 📦 Package Improvements
- **Type Definitions**: Full TypeScript support for package consumers
- **Better Documentation**: Enhanced JSDoc comments and type annotations
- **Improved API**: Cleaner interfaces and better error handling

### 🚀 Migration Guide
- **For JavaScript Users**: No changes required - package remains fully backward compatible
- **For TypeScript Users**: Import types for enhanced development experience:
  ```typescript
  import { TranslationManager, TranslationConfig } from 'i18n-translation-manager';
  ```

---

## Version 2.1.0 - Enhanced Web Interface
*Released: November 2024*

### 🌍 Advanced Language Management

#### **Web UI Language Addition**
- **Add New Languages**: Full web interface support for adding new languages
- **Automatic Translation**: New languages are automatically translated from source
- **Batch Processing**: Configurable batch sizes for translation processing
- **Progress Tracking**: Real-time progress indicators for translation operations

#### **Enhanced Translation Features**
- **Batch Translation API**: New `/api/translate-batch` endpoint for large datasets
- **Improved Status Reporting**: Better translation status tracking and reporting
- **Language Detection**: Enhanced automatic language detection from locale files

### 🎯 User Experience Improvements
- **Intuitive Interface**: Streamlined web UI for language management
- **Visual Progress**: Real-time translation progress with detailed logs
- **Error Handling**: Better error messages and recovery options

### 📊 Performance Features
- **Configurable Batching**: Adjust batch sizes based on your needs
- **Rate Limiting**: Built-in rate limiting to prevent API overload
- **Memory Optimization**: Improved memory usage for large translation sets

---

## Version 2.0.0 - Universal Framework Support
*Released: October 2024*

### 🚀 Major Framework Expansion

#### **Universal Compatibility**
- **Framework Agnostic**: Works with Vue.js, React, Angular, Next.js, Nuxt, Svelte, Node.js
- **Dynamic Detection**: Automatically detects languages from any JSON locale structure
- **Flexible Configuration**: Customizable paths and settings for any project structure

#### **Enhanced CLI**
- **Improved Commands**: More intuitive CLI commands and options
- **Better Help System**: Comprehensive help and examples
- **Configuration Management**: Easy setup and configuration for different frameworks

### 🔧 Technical Improvements
- **Modular Architecture**: Better code organization and maintainability
- **Enhanced Error Handling**: More robust error handling and recovery
- **Performance Optimizations**: Faster file processing and translation operations

---

## Version 1.x.x - Foundation Releases
*Released: 2024*

### 🌱 Initial Development
- **Core Translation Engine**: Basic translation functionality with Google Translate
- **Vue.js Support**: Initial support for Vue.js projects
- **CLI Interface**: Command-line tool for translation management
- **Web Interface**: Basic web GUI for translation operations
- **JSON Locale Support**: Support for standard JSON locale file structures

### 📈 Evolution
- Multiple iterations improving stability and feature set
- Community feedback integration
- Performance improvements
- Bug fixes and stability enhancements

---

## 🔮 Upcoming Features

### Version 2.4.0 (Planned)
- **Translation Service Options**: Support for multiple translation services (Azure, AWS, DeepL)
- **Advanced Caching**: Intelligent caching for faster repeat translations
- **Custom Translation Rules**: User-defined translation rules and overrides
- **Bulk Operations**: Enhanced bulk translation and management features

### Future Roadmap
- **Plugin System**: Extensible plugin architecture for custom integrations
- **Team Collaboration**: Multi-user support with role-based permissions
- **Translation Memory**: Smart translation memory for consistency
- **Advanced Analytics**: Detailed translation analytics and reporting

---

## 📞 Support & Resources

- **Documentation**: [GitHub Repository](https://github.com/ajithsimon/i18n-translation-manager)
- **Bug Reports**: [GitHub Issues](https://github.com/ajithsimon/i18n-translation-manager/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/ajithsimon/i18n-translation-manager/discussions)
- **npm Package**: [npmjs.com/package/i18n-translation-manager](https://www.npmjs.com/package/i18n-translation-manager)
