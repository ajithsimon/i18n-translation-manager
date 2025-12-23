import fs from 'fs';
import path from 'path';

/**
 * Configuration options for the Translation Manager
 */
export interface TranslationConfig {
  /** Path to locale files directory (relative to project root) */
  localesPath?: string;
  /** Default source language code (e.g., 'en') */
  defaultSourceLang?: string;
  /** Translation service to use (currently only 'google-free' supported) */
  translationService?: string;
  /** File naming pattern (default: '{lang}.json') */
  filePattern?: string;
  /** Files to exclude from language detection */
  excludeFiles?: string[];
  /** Rate limiting configuration for API calls */
  rateLimiting?: {
    /** Number of keys to translate per batch */
    batchSize: number;
    /** Delay in milliseconds between batches */
    delayBetweenBatches: number;
  };
}

/**
 * Translation status for a specific language
 */
export interface TranslationStatus {
  /** Language code */
  language: string;
  /** Total number of keys in source language */
  total: number;
  /** Number of translated keys */
  translated: number;
  /** Number of missing or outdated keys */
  missing: number;
  /** Completeness percentage (0-100) */
  completeness: number;
}

/**
 * Map of supported language codes
 */
export interface SupportedLanguages {
  [key: string]: string;
}

/**
 * Nested translation data structure
 */
export interface TranslationData {
  [key: string]: any;
}

/**
 * Progress callback data for translation operations
 */
export interface ProgressData {
  type: 'progress' | 'error' | 'complete';
  stage: string;
  message: string;
  progress: number;
  translated?: number;
  total?: number;
}

/**
 * Cache structure for tracking source language state
 * Used to detect which keys have been modified since last sync
 */
export interface SyncCache {
  /** Timestamp of last sync */
  lastSync: string;
  /** Source language code */
  sourceLang: string;
  /** Flattened key-value pairs from source at last sync */
  sourceData: { [key: string]: string };
}

export class TranslationManager {
  private config: Required<TranslationConfig>;
  private localesPath: string;
  private supportedLanguages: SupportedLanguages;
  private cacheFilePath: string;

  constructor(config: TranslationConfig = {}) {
    this.config = {
      localesPath: './src/i18n/locales',
      defaultSourceLang: 'en',
      translationService: 'google-free',
      filePattern: '{lang}.json',
      excludeFiles: [],
      rateLimiting: {
        batchSize: 25,
        delayBetweenBatches: 1000
      },
      ...config
    };
    
    this.localesPath = path.resolve(process.cwd(), this.config.localesPath);
    this.cacheFilePath = path.join(this.localesPath, '.i18n-sync-cache.json');
    this.supportedLanguages = this.detectSupportedLanguages();
  }

  /**
   * Dynamically detect supported languages from locale files in the locales directory
   * @returns Map of detected language codes
   */
  private detectSupportedLanguages(): SupportedLanguages {
    const languages: SupportedLanguages = {};
    
    try {
      if (!fs.existsSync(this.localesPath)) {
        console.warn(`⚠️  Locales directory not found: ${this.localesPath}`);
        return {};
      }

      const files = fs.readdirSync(this.localesPath);
      
      for (const file of files) {
        if (this.isValidLocaleFile(file)) {
          const langCode = file.replace('.json', '');
          languages[langCode] = langCode;
        }
      }
      
      this.logDetectedLanguages(languages);
      
    } catch (error) {
      console.error('❌ Error detecting languages:', (error as Error).message);
      console.warn(`⚠️  Please check that ${this.localesPath} exists and is accessible`);
      return {};
    }
    
    return languages;
  }

  /**
   * Check if a file is a valid locale file
   */
  private isValidLocaleFile(filename: string): boolean {
    return filename.endsWith('.json') && 
           !filename.startsWith('.') && 
           !this.config.excludeFiles.includes(filename);
  }

  /**
   * Log detected languages to console
   */
  private logDetectedLanguages(languages: SupportedLanguages): void {
    const count = Object.keys(languages).length;
    
    if (count === 0) {
      console.warn(`⚠️  No locale files found in ${this.localesPath}`);
      console.warn('   Please ensure you have .json files in your locales directory');
    } else {
      console.log(`🌍 Detected ${count} languages: ${Object.keys(languages).join(', ')}`);
    }
  }

  /**
   * Translate text using Google Translate's free API
   * @param text - Text to translate
   * @param targetLang - Target language code
   * @param sourceLang - Source language code (default: 'en')
   * @returns Translated text, or original text if translation fails
   */
  private async translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    try {
      const fetch = (await import('node-fetch')).default;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json() as any;
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      
      throw new Error('Invalid translation response');
    } catch (error) {
      console.warn(`⚠️  Translation failed for "${text}" to ${targetLang}:`, (error as Error).message);
      return text;
    }
  }

  /**
   * Recursively get all keys from nested translation object using dot notation
   * @param obj - Translation data object
   * @param prefix - Current key prefix for nested objects
   * @returns Array of all keys in dot notation (e.g., ['app.title', 'app.welcome'])
   */
  private getAllKeys(obj: TranslationData, prefix: string = ''): string[] {
    let keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        keys = keys.concat(this.getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Get value from nested object using dot notation
   * @param obj - Translation data object
   * @param path - Dot-notated path (e.g., 'app.title')
   * @returns Value at the specified path
   */
  private getValue(obj: TranslationData, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  /**
   * Set value in nested object using dot notation, creating intermediate objects as needed
   * @param obj - Translation data object
   * @param path - Dot-notated path (e.g., 'app.title')
   * @param value - Value to set
   */
  private setValue(obj: TranslationData, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Flatten nested translation object into key-value pairs
   * @param obj - Translation data object
   * @param prefix - Current key prefix for nested objects
   * @returns Flattened key-value pairs
   */
  private flattenKeys(obj: TranslationData, prefix: string = ''): { [key: string]: string } {
    const flattened: { [key: string]: string } = {};
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, this.flattenKeys(obj[key], fullKey));
      } else {
        flattened[fullKey] = String(obj[key]);
      }
    }
    
    return flattened;
  }

  /**
   * Load sync cache from file
   * @returns Cached data or null if not found or invalid
   */
  private loadCache(): SyncCache | null {
    try {
      if (!fs.existsSync(this.cacheFilePath)) {
        return null;
      }
      
      const content = fs.readFileSync(this.cacheFilePath, 'utf-8');
      return JSON.parse(content) as SyncCache;
    } catch (error) {
      console.warn('⚠️  Failed to load sync cache:', (error as Error).message);
      return null;
    }
  }

  /**
   * Save sync cache to file
   * @param cache - Cache data to save
   */
  private saveCache(cache: SyncCache): void {
    try {
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.warn('⚠️  Failed to save sync cache:', (error as Error).message);
    }
  }

  /**
   * Detect which keys have been modified by comparing current source with cache
   * @param currentSource - Current source language data
   * @param sourceLang - Source language code
   * @returns Set of modified key paths
   */
  private getModifiedKeys(currentSource: TranslationData, sourceLang: string): Set<string> {
    const cache = this.loadCache();
    
    if (!cache || cache.sourceLang !== sourceLang) {
      // No cache or different source language - consider all keys as modified
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

  /**
   * Load locale file from disk
   * @param lang - Language code
   * @returns Translation data object (empty object if file doesn't exist or has errors)
   */
  private loadLocale(lang: string): TranslationData {
    const filePath = path.join(this.localesPath, `${lang}.json`);
    
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error loading ${lang}.json:`, (error as Error).message);
      return {};
    }
  }

  /**
   * Save locale file to disk with formatted JSON
   * @param lang - Language code
   * @param data - Translation data to save
   */
  private saveLocale(lang: string, data: TranslationData): void {
    const filePath = path.join(this.localesPath, `${lang}.json`);
    
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`✅ Saved ${lang}.json`);
    } catch (error) {
      console.error(`❌ Error saving ${lang}.json:`, (error as Error).message);
    }
  }

  /**
   * Find missing or outdated translations in target language
   * Detects:
   * - Missing keys
   * - Empty values
   * - Values that match source (indicating they need translation or re-translation after source changed)
   * 
   * @param sourceData - Source language translation data
   * @param targetData - Target language translation data
   * @param sourceLang - Source language code
   * @param targetLang - Target language code
   * @returns Array of keys that need translation
   */
  private findMissingTranslations(
    sourceData: TranslationData, 
    targetData: TranslationData, 
    sourceLang: string, 
    targetLang: string
  ): string[] {
    const sourceKeys = this.getAllKeys(sourceData);
    const missing: string[] = [];
    
    for (const key of sourceKeys) {
      if (this.needsTranslation(key, sourceData, targetData, sourceLang, targetLang)) {
        missing.push(key);
      }
    }
    
    return missing;
  }

  /**
   * Check if a specific key needs translation
   */
  private needsTranslation(
    key: string,
    sourceData: TranslationData,
    targetData: TranslationData,
    sourceLang: string,
    targetLang: string
  ): boolean {
    const targetValue = this.getValue(targetData, key);
    const sourceValue = this.getValue(sourceData, key);
    
    // Missing or empty value
    if (targetValue === undefined || targetValue === null || targetValue === '') {
      return true;
    }
    
    // Value matches source (needs translation if not source language)
    if (targetLang !== sourceLang && targetValue === sourceValue) {
      return true;
    }
    
    return false;
  }

  /**
   * Translate missing or outdated keys in batches with rate limiting
   * @param sourceLang - Source language code
   * @param targetLang - Target language code
   * @param missingKeys - Array of keys to translate
   * @param sourceData - Source language data
   * @param targetData - Target language data
   * @param progressCallback - Optional callback for progress updates
   * @returns Updated target language data with translations
   */
  private async translateMissingKeys(
    sourceLang: string, 
    targetLang: string, 
    missingKeys: string[], 
    sourceData: TranslationData, 
    targetData: TranslationData,
    progressCallback?: (progress: ProgressData) => void
  ): Promise<TranslationData> {
    console.log(`\n🔄 Translating ${missingKeys.length} keys from ${sourceLang} to ${targetLang}...`);
    
    const { batchSize, delayBetweenBatches } = this.config.rateLimiting;
    const result = { ...targetData };
    const totalBatches = Math.ceil(missingKeys.length / batchSize);
    
    for (let i = 0; i < missingKeys.length; i += batchSize) {
      const batch = missingKeys.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      this.reportProgress(progressCallback, i, missingKeys.length, batchNumber, totalBatches, batch.length);
      
      await this.translateBatchKeys(batch, sourceData, result, sourceLang, targetLang);
      
      if (i + batchSize < missingKeys.length) {
        await this.delay(delayBetweenBatches);
      }
    }
    
    this.reportCompletion(progressCallback, missingKeys.length);
    return result;
  }

  /**
   * Translate a batch of keys
   */
  private async translateBatchKeys(
    batch: string[],
    sourceData: TranslationData,
    result: TranslationData,
    sourceLang: string,
    targetLang: string
  ): Promise<void> {
    const promises = batch.map(async (key) => {
      const sourceValue = this.getValue(sourceData, key);
      if (typeof sourceValue === 'string' && sourceValue.trim()) {
        const translated = await this.translateText(sourceValue, targetLang, sourceLang);
        return { key, value: translated };
      }
      return { key, value: sourceValue };
    });
    
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(({ key, value }) => {
      this.setValue(result, key, value);
      const sourceValue = this.getValue(sourceData, key);
      console.log(`  ✓ ${key}: "${sourceValue}" → "${value}"`);
    });
  }

  /**
   * Report translation progress
   */
  private reportProgress(
    callback: ((progress: ProgressData) => void) | undefined,
    current: number,
    total: number,
    batchNumber: number,
    totalBatches: number,
    batchSize: number
  ): void {
    const progress = Math.round(30 + ((current / total) * 60));
    callback?.({
      type: 'progress',
      stage: 'translating',
      message: `Translating batch ${batchNumber}/${totalBatches} (${batchSize} keys)...`,
      progress,
      translated: current,
      total
    });
  }

  /**
   * Report translation completion
   */
  private reportCompletion(
    callback: ((progress: ProgressData) => void) | undefined,
    keysTranslated: number
  ): void {
    callback?.({
      type: 'progress',
      stage: 'translation-complete',
      message: `Translation completed! ${keysTranslated} keys processed.`,
      progress: 90,
      translated: keysTranslated,
      total: keysTranslated
    });
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Synchronize all translations from source language to all target languages
   * Detects and translates missing keys and modified source values
   * @param sourceLang - Source language code (defaults to config.defaultSourceLang)
   * @param force - If true, re-translate ALL values even if they appear translated
   */
  public async syncTranslations(sourceLang?: string, force: boolean = false): Promise<void> {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    const forceMsg = force ? ' (FORCE MODE - re-translating all keys)' : '';
    console.log(`🌍 Starting translation sync with ${sourceLang} as source language${forceMsg}...\n`);
    
    const sourceData = this.loadLocale(sourceLang);
    if (Object.keys(sourceData).length === 0) {
      console.error(`❌ Source language file ${sourceLang}.json is empty or doesn't exist!`);
      return;
    }
    
    const totalKeys = this.getAllKeys(sourceData).length;
    console.log(`📝 Found ${totalKeys} keys in ${sourceLang}.json\n`);
    
    for (const targetLang of Object.keys(this.supportedLanguages)) {
      if (targetLang === sourceLang) continue;
      
      await this.syncLanguage(sourceLang, targetLang, sourceData, force);
    }
    
    // Save cache after successful sync (unless in force mode, which is a one-time operation)
    if (!force) {
      const cache: SyncCache = {
        lastSync: new Date().toISOString(),
        sourceLang: sourceLang,
        sourceData: this.flattenKeys(sourceData)
      };
      this.saveCache(cache);
      console.log('\n💾 Sync state saved to cache');
    }
    
    console.log('\n🎉 Translation sync completed!');
  }

  /**
   * Sync a single target language
   */
  private async syncLanguage(
    sourceLang: string,
    targetLang: string,
    sourceData: TranslationData,
    force: boolean = false
  ): Promise<void> {
    console.log(`\n🎯 Processing ${targetLang}...`);
    
    const targetData = this.loadLocale(targetLang);
    let keysToTranslate: string[];
    
    if (force) {
      // In force mode, re-translate ALL keys
      keysToTranslate = this.getAllKeys(sourceData);
      console.log(`🔄 Force mode: re-translating all ${keysToTranslate.length} keys in ${targetLang}.json`);
    } else {
      // Smart detection: find missing keys + keys modified in source
      const missingKeys = this.findMissingTranslations(sourceData, targetData, sourceLang, targetLang);
      const modifiedKeys = this.getModifiedKeys(sourceData, sourceLang);
      
      // Combine missing and modified keys (use Set to avoid duplicates)
      const missingSet = new Set(missingKeys);
      const modifiedSet = new Set(modifiedKeys);
      const keysSet = new Set([...missingKeys, ...modifiedKeys]);
      keysToTranslate = Array.from(keysSet);
      
      if (keysToTranslate.length === 0) {
        console.log(`✅ ${targetLang}.json is up to date!`);
        return;
      }
      
      // Calculate distinct categories for accurate reporting
      const bothModifiedAndMissing = Array.from(modifiedSet).filter(k => missingSet.has(k));
      const onlyModified = Array.from(modifiedSet).filter(k => !missingSet.has(k));
      const onlyMissing = Array.from(missingSet).filter(k => !modifiedSet.has(k));
      
      // Display categorized counts
      if (onlyModified.length > 0) {
        console.log(`📝 Found ${onlyModified.length} modified key(s) in source`);
      }
      if (onlyMissing.length > 0) {
        console.log(`➕ Found ${onlyMissing.length} missing key(s) in target`);
      }
      if (bothModifiedAndMissing.length > 0) {
        console.log(`🆕 Found ${bothModifiedAndMissing.length} new key(s) in source`);
      }
      console.log(`📋 Total: ${keysToTranslate.length} key(s) to translate in ${targetLang}.json`);
    }
    
    const updatedData = await this.translateMissingKeys(
      sourceLang, 
      targetLang, 
      keysToTranslate, 
      sourceData, 
      force ? {} : targetData
    );
    this.saveLocale(targetLang, updatedData);
  }

  /**
   * Add new translation key to all supported languages
   * @param keyPath - Dot-notated key path (e.g., 'app.title')
   * @param sourceValue - Value in source language
   * @param sourceLang - Source language code (defaults to config.defaultSourceLang)
   */
  public async addKey(keyPath: string, sourceValue: string, sourceLang?: string): Promise<void> {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    console.log(`\n➕ Adding new key: ${keyPath}`);
    
    for (const lang of Object.keys(this.supportedLanguages)) {
      const data = this.loadLocale(lang);
      
      if (lang === sourceLang) {
        this.setValue(data, keyPath, sourceValue);
        console.log(`  ${lang}: "${sourceValue}" (source)`);
      } else {
        const translatedValue = await this.translateText(sourceValue, lang, sourceLang);
        this.setValue(data, keyPath, translatedValue);
        console.log(`  ${lang}: "${translatedValue}"`);
      }
      
      this.saveLocale(lang, data);
    }
    
    console.log('✅ Key added to all language files!');
  }

  /**
   * Check and display translation status for all languages
   * @param sourceLang - Source language code (defaults to config.defaultSourceLang)
   */
  public checkTranslations(sourceLang?: string): void {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    console.log(`📊 Translation Status Report (source: ${sourceLang})\n`);
    
    const sourceData = this.loadLocale(sourceLang);
    const totalKeys = this.getAllKeys(sourceData).length;
    
    console.log(`Total keys in ${sourceLang}: ${totalKeys}\n`);
    
    for (const targetLang of Object.keys(this.supportedLanguages)) {
      if (targetLang === sourceLang) continue;
      
      const status = this.calculateLanguageStatus(sourceData, targetLang, sourceLang, totalKeys);
      console.log(`${targetLang}: ${status.translated}/${status.total} (${status.completeness}%) - ${status.missing} missing`);
    }
  }

  /**
   * Calculate translation status for a language
   */
  private calculateLanguageStatus(
    sourceData: TranslationData,
    targetLang: string,
    sourceLang: string,
    totalKeys: number
  ): TranslationStatus {
    const targetData = this.loadLocale(targetLang);
    const missingKeys = this.findMissingTranslations(sourceData, targetData, sourceLang, targetLang);
    const translated = totalKeys - missingKeys.length;
    const completeness = totalKeys > 0 ? parseFloat(((translated / totalKeys) * 100).toFixed(1)) : 0;
    
    return {
      language: targetLang,
      total: totalKeys,
      translated,
      missing: missingKeys.length,
      completeness
    };
  }

  /**
   * Get list of supported language codes
   * @returns Map of supported language codes
   */
  public getSupportedLanguages(): SupportedLanguages {
    return this.supportedLanguages;
  }

  /**
   * Get translation status for one or all languages
   * @param sourceLang - Source language code (defaults to config.defaultSourceLang)
   * @param targetLang - Optional target language code (if omitted, returns status for all languages)
   * @returns Translation status for specified language or all languages
   */
  public getTranslationStatus(
    sourceLang?: string, 
    targetLang?: string
  ): TranslationStatus | { [key: string]: TranslationStatus } {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    
    const sourceData = this.loadLocale(sourceLang);
    const totalKeys = this.getAllKeys(sourceData).length;
    
    if (targetLang) {
      return this.calculateLanguageStatus(sourceData, targetLang, sourceLang, totalKeys);
    }
    
    return this.getAllLanguagesStatus(sourceLang, sourceData, totalKeys);
  }

  /**
   * Get status for all languages
   */
  private getAllLanguagesStatus(
    sourceLang: string,
    sourceData: TranslationData,
    totalKeys: number
  ): { [key: string]: TranslationStatus } {
    const status: { [key: string]: TranslationStatus } = {};
    
    for (const lang of Object.keys(this.supportedLanguages)) {
      if (lang === sourceLang) {
        status[lang] = {
          language: lang,
          total: totalKeys,
          translated: totalKeys,
          missing: 0,
          completeness: 100
        };
      } else {
        status[lang] = this.calculateLanguageStatus(sourceData, lang, sourceLang, totalKeys);
      }
    }
    
    return status;
  }

  /**
   * Add new language by cloning source language and translating all keys
   * @param sourceLanguage - Source language code to clone from
   * @param newLanguage - New language code to create
   * @param progressCallback - Optional callback for progress updates
   * @returns Object with translation statistics
   */
  public async addNewLanguage(
    sourceLanguage: string, 
    newLanguage: string, 
    progressCallback?: (progress: ProgressData) => void
  ): Promise<{keysTranslated: number, totalKeys: number}> {
    const sourceFilePath = path.join(this.localesPath, `${sourceLanguage}.json`);
    const newFilePath = path.join(this.localesPath, `${newLanguage}.json`);
    
    if (!fs.existsSync(sourceFilePath)) {
      throw new Error(`Source language file not found: ${sourceLanguage}.json`);
    }
    
    if (fs.existsSync(newFilePath)) {
      throw new Error(`Language file already exists: ${newLanguage}.json`);
    }
    
    try {
      progressCallback?.({
        type: 'progress',
        stage: 'creating-file',
        message: `Creating ${newLanguage}.json file...`,
        progress: 10
      });

      const sourceData = this.loadLocale(sourceLanguage);
      this.saveLocale(newLanguage, sourceData);
      this.supportedLanguages[newLanguage] = newLanguage;
      
      console.log(`✅ Language ${newLanguage} added successfully by cloning from ${sourceLanguage}`);
      
      progressCallback?.({
        type: 'progress',
        stage: 'analyzing-keys',
        message: `Analyzing translation keys...`,
        progress: 20
      });
      
      console.log(`🚀 Starting automatic translation for ${newLanguage}...`);
      
      const allKeys = this.getAllKeys(sourceData);
      const totalKeys = allKeys.length;
      console.log(`📋 Translating all ${totalKeys} keys to ${newLanguage}`);
      
      progressCallback?.({
        type: 'progress',
        stage: 'translating',
        message: `Starting translation of ${totalKeys} keys...`,
        progress: 30,
        total: totalKeys
      });
      
      const updatedData = await this.translateMissingKeys(
        sourceLanguage, 
        newLanguage, 
        allKeys, 
        sourceData, 
        {}, 
        progressCallback
      );
      this.saveLocale(newLanguage, updatedData);
      
      console.log(`🎉 Translation completed for ${newLanguage}!`);
      
      progressCallback?.({
        type: 'progress',
        stage: 'saving',
        message: `Saving translation file...`,
        progress: 95
      });
      
      progressCallback?.({
        type: 'complete',
        stage: 'complete',
        message: `Language ${newLanguage} added successfully! ${totalKeys} keys translated.`,
        progress: 100,
        translated: totalKeys,
        total: totalKeys
      });
      
      return { keysTranslated: totalKeys, totalKeys };
      
    } catch (error) {
      progressCallback?.({
        type: 'error',
        stage: 'error',
        message: `Error: ${(error as Error).message}`,
        progress: 0
      });
      throw new Error(`Failed to add new language: ${(error as Error).message}`);
    }
  }

  /**
   * Get total number of translation keys in source language
   * @param sourceLang - Source language code (defaults to config.defaultSourceLang)
   * @returns Number of keys
   */
  public getKeyCount(sourceLang?: string): number {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    const sourceData = this.loadLocale(sourceLang);
    return this.getAllKeys(sourceData).length;
  }

  /**
   * Translate a specific batch of keys (used for manual batch processing)
   * @param sourceLanguage - Source language code
   * @param targetLanguage - Target language code
   * @param batchSize - Number of keys to process (default: 25)
   * @param offset - Starting position in key array (default: 0)
   * @returns Number of keys translated
   */
  public async translateBatch(
    sourceLanguage: string, 
    targetLanguage: string, 
    batchSize: number = 25, 
    offset: number = 0
  ): Promise<number> {
    const sourceData = this.loadLocale(sourceLanguage);
    const targetData = this.loadLocale(targetLanguage);
    
    const allKeys = this.getAllKeys(sourceData);
    const batchKeys = allKeys.slice(offset, offset + batchSize);
    
    if (batchKeys.length === 0) {
      return 0;
    }
    
    console.log(`🔄 Translating batch of ${batchKeys.length} keys for ${targetLanguage}...`);
    
    let translatedCount = 0;
    
    for (const key of batchKeys) {
      try {
        const sourceText = this.getValue(sourceData, key);
        const existingTranslation = this.getValue(targetData, key);
        
        if (existingTranslation && existingTranslation !== sourceText) {
          continue;
        }
        
        const translatedText = await this.translateText(sourceText, targetLanguage, sourceLanguage);
        this.setValue(targetData, key, translatedText);
        translatedCount++;
        
        await this.delay(100);
      } catch (error) {
        console.error(`❌ Error translating key ${key}:`, (error as Error).message);
      }
    }
    
    this.saveLocale(targetLanguage, targetData);
    
    console.log(`✅ Batch complete: translated ${translatedCount}/${batchKeys.length} keys for ${targetLanguage}`);
    return translatedCount;
  }
}
