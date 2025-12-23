# Smart Sync - Intelligent Change Detection

## Overview

Smart Sync is an intelligent translation synchronization feature that dramatically improves performance for large translation projects by only translating keys that have actually changed.

## The Problem

In traditional translation sync systems:
- **1000 keys × 7 languages = 7000 API calls** every sync
- Takes several minutes to complete
- Wastes API quota on unchanged translations
- No differentiation between modified and unchanged content

## The Solution

Smart Sync uses a cache-based change detection system:

```bash
# First sync - establishes baseline
i18n-translate sync
# Creates: .i18n-sync-cache.json

# Modify only 5 keys in English

# Second sync - only translates changes
i18n-translate sync
# Translates: 5 keys × 7 languages = 35 API calls
# Result: 200x faster! ⚡
```

## How It Works

### 1. Cache Creation

After each successful sync, a cache file is created:

```json
{
  "lastSync": "2025-12-23T03:18:51.131Z",
  "sourceLang": "en",
  "sourceData": {
    "app.title": "My App",
    "app.welcome": "Welcome",
    "buttons.save": "Save"
  }
}
```

**Location:** `<localesPath>/.i18n-sync-cache.json`

### 2. Change Detection

On the next sync, the system:

1. **Loads cache** - Gets previous source state
2. **Compares** - Checks current vs cached values
3. **Identifies changes:**
   - ✨ **New keys** - Added to source language
   - 🔄 **Modified keys** - Value changed in source
   - ❌ **Missing keys** - Not in target language or empty

### 3. Selective Translation

Only translates the identified keys:

```
🎯 Processing ar...
📝 Found 3 modified key(s) in source
➕ Found 2 new/missing key(s)
📋 Total: 5 key(s) to translate in ar.json
```

## Performance Comparison

### Scenario: 1000 keys, 7 languages, modify 5 keys

| Mode | Keys Translated | API Calls | Time (approx) |
|------|----------------|-----------|---------------|
| **Without Smart Sync** | 1000 × 7 | 7,000 | ~7 minutes |
| **With Smart Sync** | 5 × 7 | 35 | ~2 seconds |
| **Improvement** | - | **200x less** | **210x faster** |

### Real-World Benefits

- **1000 keys → 5 changed** = 99.5% reduction in API calls
- **1000 keys → 50 changed** = 95% reduction
- **1000 keys → 100 changed** = 90% reduction

## Usage

### Default Mode (Smart Sync)

```bash
# Automatically uses cache-based detection
i18n-translate sync

# Specify source language
i18n-translate sync en
```

### Force Mode

Force mode ignores the cache and re-translates everything:

```bash
# Re-translate ALL keys
i18n-translate sync --force
```

**When to use force mode:**
- First time setup (no cache exists yet)
- Testing translation quality
- After switching translation services
- Debugging translation issues
- When cache is corrupted or outdated

## Cache Management

### Cache Location

The cache file is stored in your locales directory:

```
src/i18n/locales/
├── en.json
├── fr.json
├── de.json
└── .i18n-sync-cache.json  ← Cache file
```

### Git Integration

The cache file is automatically ignored by git (`.gitignore`):

```gitignore
# i18n Translation Manager cache files
**/.i18n-sync-cache.json
```

**Why?** Each developer's local cache tracks their own changes.

### Clearing Cache

To force a complete re-sync:

```bash
# Option 1: Use force mode
i18n-translate sync --force

# Option 2: Delete cache manually
rm src/i18n/locales/.i18n-sync-cache.json
i18n-translate sync
```

## Detection Scenarios

### Scenario 1: New Key Added

**Before:**
```json
// en.json
{
  "app": {
    "title": "My App"
  }
}
```

**After:**
```json
// en.json
{
  "app": {
    "title": "My App",
    "description": "New description"  ← NEW
  }
}
```

**Result:**
```
➕ Found 1 new/missing key(s)
📋 Total: 1 key(s) to translate
```

### Scenario 2: Value Modified

**Before:**
```json
// en.json - cached
{
  "buttons": {
    "save": "Save"
  }
}
```

**After:**
```json
// en.json - current
{
  "buttons": {
    "save": "Save Changes"  ← MODIFIED
  }
}
```

**Result:**
```
📝 Found 1 modified key(s) in source
📋 Total: 1 key(s) to translate
```

### Scenario 3: Multiple Changes

**Changes:**
- 3 keys modified
- 2 new keys added
- 1 key missing in target

**Result:**
```
📝 Found 3 modified key(s) in source
➕ Found 3 new/missing key(s)
📋 Total: 6 key(s) to translate
```

## Best Practices

### 1. Regular Syncs

```bash
# After modifying English translations
git diff src/i18n/locales/en.json  # Review changes
i18n-translate sync                 # Smart sync
git add src/i18n/locales/          # Commit all languages
```

### 2. Team Workflow

```bash
# Developer A modifies translations
git pull                            # Get latest
# Modify en.json
i18n-translate sync                 # Only translates A's changes
git add -A && git commit -m "..."
git push

# Developer B pulls changes
git pull                            # Gets translations
# Their local cache updates automatically
```

### 3. CI/CD Integration

```yaml
# .github/workflows/i18n.yml
name: Sync Translations
on:
  push:
    paths:
      - 'src/i18n/locales/en.json'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g i18n-translation-manager
      - run: i18n-translate sync
      - run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add src/i18n/locales/
          git commit -m "chore: sync translations [skip ci]"
          git push
```

## Technical Details

### Change Detection Algorithm

```typescript
private getModifiedKeys(currentSource: TranslationData, sourceLang: string): Set<string> {
  const cache = this.loadCache();
  
  // No cache = all keys considered modified
  if (!cache || cache.sourceLang !== sourceLang) {
    return new Set(this.getAllKeys(currentSource));
  }
  
  const currentFlat = this.flattenKeys(currentSource);
  const cachedFlat = cache.sourceData;
  const modifiedKeys = new Set<string>();
  
  // Find new or modified keys
  for (const key in currentFlat) {
    if (!(key in cachedFlat) || currentFlat[key] !== cachedFlat[key]) {
      modifiedKeys.add(key);
    }
  }
  
  return modifiedKeys;
}
```

### Cache Structure

```typescript
interface SyncCache {
  /** ISO timestamp of last sync */
  lastSync: string;
  
  /** Source language code */
  sourceLang: string;
  
  /** Flattened key-value pairs from source */
  sourceData: { [key: string]: string };
}
```

## Limitations

### 1. Single Source Language

Cache tracks only one source language at a time. Changing source language invalidates the cache:

```bash
# Sync from English (creates cache for 'en')
i18n-translate sync en

# Sync from French (invalidates cache, treats all as modified)
i18n-translate sync fr
```

### 2. No Deletion Detection

Deleted keys from source language are NOT automatically removed from target languages. Manual cleanup required:

```bash
# Option 1: Force sync with updated source
i18n-translate sync --force

# Option 2: Manually remove from target files
```

### 3. Value-Based Comparison Only

The system compares string values, not semantic meaning:

```json
// "Save" → "Save Now"  ← Detected (value changed)
// "colour" → "color"   ← Detected (spelling changed)
// "Save" → "save"      ← Detected (case changed)
```

## Troubleshooting

### Cache Not Working

**Symptoms:** Every sync translates all keys

**Solutions:**
```bash
# Check if cache exists
ls -la src/i18n/locales/.i18n-sync-cache.json

# Check cache contents
cat src/i18n/locales/.i18n-sync-cache.json | jq .

# Verify source language matches
jq .sourceLang src/i18n/locales/.i18n-sync-cache.json
```

### False Positives

**Symptoms:** Keys marked as modified when they haven't changed

**Causes:**
- Formatting changes (spaces, line breaks)
- Encoding differences
- Hidden characters

**Solution:**
```bash
# Validate JSON formatting
jq . src/i18n/locales/en.json > temp.json
mv temp.json src/i18n/locales/en.json
```

### Cache Corruption

**Symptoms:** JSON parse errors

**Solution:**
```bash
# Delete corrupted cache
rm src/i18n/locales/.i18n-sync-cache.json

# Recreate with fresh sync
i18n-translate sync
```

## Migration Guide

### From Force Mode to Smart Sync

If you've been using `--force` for every sync:

1. **Remove force flag from scripts:**
   ```bash
   # Before
   i18n-translate sync --force
   
   # After
   i18n-translate sync
   ```

2. **Do one final force sync to establish baseline:**
   ```bash
   i18n-translate sync --force
   ```

3. **Normal syncs will now be smart:**
   ```bash
   i18n-translate sync  # Fast, selective translation
   ```

## FAQ

**Q: Do I need to commit the cache file?**
A: No, it's gitignored. Each developer maintains their own local cache.

**Q: What if my cache gets out of sync?**
A: Just run `i18n-translate sync --force` to rebuild everything and create a fresh cache.

**Q: Can I use smart sync with multiple source languages?**
A: The cache tracks one source language at a time. Switching source language will trigger a full re-sync.

**Q: How does it handle nested keys?**
A: Keys are flattened using dot notation (e.g., `app.title`, `buttons.save`) for comparison.

**Q: Will this work with large projects (10,000+ keys)?**
A: Absolutely! That's exactly what it's designed for. The larger your project, the bigger the performance gain.

## Summary

Smart Sync is a game-changer for large translation projects:

✅ **200x faster** for typical workflows
✅ **99%+ reduction** in API calls
✅ **Automatic** - no configuration needed
✅ **Intelligent** - knows what changed
✅ **Safe** - force mode available as fallback

Start using it today - just run `i18n-translate sync`! 🚀
