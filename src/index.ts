import fs from 'fs';
import path from 'path';

export interface TranslationConfig {
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

export interface TranslationStatus {
  language: string;
  total: number;
  translated: number;
  missing: number;
  completeness: number;
}

export interface SupportedLanguages {
  [key: string]: string;
}

export interface TranslationData {
  [key: string]: any;
}

export class TranslationManager {
  private config: Required<TranslationConfig>;
  private localesPath: string;
  private supportedLanguages: SupportedLanguages;

  constructor(config: TranslationConfig = {}) {
    this.config = {
      localesPath: './src/i18n/locales',
      defaultSourceLang: 'en',
      translationService: 'google-free',
      filePattern: '{lang}.json',
      excludeFiles: [],    rateLimiting: {
        batchSize: 25,
        delayBetweenBatches: 1000
    },
      ...config
    };
    
    // Resolve absolute path
    this.localesPath = path.resolve(process.cwd(), this.config.localesPath);
    this.supportedLanguages = this.detectSupportedLanguages();
  }

  // Dynamically detect supported languages from locale files
  private detectSupportedLanguages(): SupportedLanguages {
    const languages: SupportedLanguages = {};
    
    try {
      if (!fs.existsSync(this.localesPath)) {
        console.warn(`⚠️  Locales directory not found: ${this.localesPath}`);
        return {};
      }

      const files = fs.readdirSync(this.localesPath);
      
      for (const file of files) {
        // Skip non-JSON files, hidden files, and excluded files
        if (file.endsWith('.json') && 
            !file.startsWith('.') && 
            !this.config.excludeFiles.includes(file)) {
          const langCode = file.replace('.json', '');
          languages[langCode] = langCode;
        }
      }
      
      console.log(`🌍 Detected ${Object.keys(languages).length} languages: ${Object.keys(languages).join(', ')}`);
      
      if (Object.keys(languages).length === 0) {
        console.warn(`⚠️  No locale files found in ${this.localesPath}`);
        console.warn('   Please ensure you have .json files in your locales directory');
      }
      
    } catch (error) {
      console.error('❌ Error detecting languages:', (error as Error).message);
      console.warn(`⚠️  Please check that ${this.localesPath} exists and is accessible`);
      return {};
    }
    
    return languages;
  }

  // Free Google Translate using unofficial API
  private async translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    try {
      // Dynamic import for node-fetch
      const fetch = (await import('node-fetch')).default;
      
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json() as any;
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      
      throw new Error('Translation failed');
    } catch (error) {
      console.warn(`Translation failed for "${text}" to ${targetLang}:`, (error as Error).message);
      return text; // Return original text if translation fails
    }
  }

  // Get all keys from nested object
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

  // Get value from nested object using dot notation
  private getValue(obj: TranslationData, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // Set value in nested object using dot notation
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

  // Load locale file
  private loadLocale(lang: string): TranslationData {
    const filePath = path.join(this.localesPath, `${lang}.json`);
    
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error(`Error loading ${lang}.json:`, (error as Error).message);
      return {};
    }
  }

  // Save locale file
  private saveLocale(lang: string, data: TranslationData): void {
    const filePath = path.join(this.localesPath, `${lang}.json`);
    
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`✅ Saved ${lang}.json`);
    } catch (error) {
      console.error(`Error saving ${lang}.json:`, (error as Error).message);
    }
  }

  // Find missing translations
  private findMissingTranslations(sourceData: TranslationData, targetData: TranslationData): string[] {
    const sourceKeys = this.getAllKeys(sourceData);
    const missing: string[] = [];
    
    for (const key of sourceKeys) {
      const targetValue = this.getValue(targetData, key);
      if (targetValue === undefined || targetValue === null || targetValue === '') {
        missing.push(key);
      }
    }
    
    return missing;
  }

  // Translate missing keys
  private async translateMissingKeys(
    sourceLang: string, 
    targetLang: string, 
    missingKeys: string[], 
    sourceData: TranslationData, 
    targetData: TranslationData,
    progressCallback?: (progress: any) => void
  ): Promise<TranslationData> {
    console.log(`\n🔄 Translating ${missingKeys.length} missing keys from ${sourceLang} to ${targetLang}...`);
    
    const batchSize = this.config.rateLimiting.batchSize;
    const result = { ...targetData };
    
    for (let i = 0; i < missingKeys.length; i += batchSize) {
      const batch = missingKeys.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(missingKeys.length / batchSize);
      
      // Send progress update
      const progress = Math.round(30 + ((i / missingKeys.length) * 60)); // 30-90% range
      progressCallback?.({
        type: 'progress',
        stage: 'translating',
        message: `Translating batch ${batchNumber}/${totalBatches} (${batch.length} keys)...`,
        progress,
        translated: i,
        total: missingKeys.length
      });
      
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
        console.log(`  ✓ ${key}: "${this.getValue(sourceData, key)}" → "${value}"`);
      });
      
      // Delay between batches
      if (i + batchSize < missingKeys.length) {
        await new Promise(resolve => setTimeout(resolve, this.config.rateLimiting.delayBetweenBatches));
      }
    }
    
    // Send final progress update for translateMissingKeys
    progressCallback?.({
      type: 'progress',
      stage: 'translation-complete',
      message: `Translation batch completed! ${missingKeys.length} keys processed.`,
      progress: 90,
      translated: missingKeys.length,
      total: missingKeys.length
    });
    
    return result;
  }

  // Sync all translations
  public async syncTranslations(sourceLang?: string): Promise<void> {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    console.log(`🌍 Starting translation sync with ${sourceLang} as source language...\n`);
    
    const sourceData = this.loadLocale(sourceLang);
    if (Object.keys(sourceData).length === 0) {
      console.error(`❌ Source language file ${sourceLang}.json is empty or doesn't exist!`);
      return;
    }
    
    const totalKeys = this.getAllKeys(sourceData).length;
    console.log(`📝 Found ${totalKeys} keys in ${sourceLang}.json\n`);
    
    for (const targetLang of Object.keys(this.supportedLanguages)) {
      if (targetLang === sourceLang) continue;
      
      console.log(`\n🎯 Processing ${targetLang}...`);
      
      const targetData = this.loadLocale(targetLang);
      const missingKeys = this.findMissingTranslations(sourceData, targetData);
      
      if (missingKeys.length === 0) {
        console.log(`✅ ${targetLang}.json is up to date!`);
        continue;
      }
      
      console.log(`📋 Found ${missingKeys.length} missing translations in ${targetLang}.json`);
      
      const updatedData = await this.translateMissingKeys(sourceLang, targetLang, missingKeys, sourceData, targetData);
      this.saveLocale(targetLang, updatedData);
    }
    
    console.log('\n🎉 Translation sync completed!');
  }

  // Add new key to all languages
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

  // Check translation status
  public checkTranslations(sourceLang?: string): void {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    console.log(`📊 Translation Status Report (source: ${sourceLang})\n`);
    
    const sourceData = this.loadLocale(sourceLang);
    const totalKeys = this.getAllKeys(sourceData).length;
    
    console.log(`Total keys in ${sourceLang}: ${totalKeys}\n`);
    
    for (const targetLang of Object.keys(this.supportedLanguages)) {
      if (targetLang === sourceLang) continue;
      
      const targetData = this.loadLocale(targetLang);
      const missingKeys = this.findMissingTranslations(sourceData, targetData);
      const completeness = totalKeys > 0 ? ((totalKeys - missingKeys.length) / totalKeys * 100).toFixed(1) : '0.0';
      
      console.log(`${targetLang}: ${totalKeys - missingKeys.length}/${totalKeys} (${completeness}%) - ${missingKeys.length} missing`);
    }
  }

  // Get supported languages (for API)
  public getSupportedLanguages(): SupportedLanguages {
    return this.supportedLanguages;
  }

  // Get translation status for a specific language (for API)
  public getTranslationStatus(sourceLang?: string, targetLang?: string): TranslationStatus | { [key: string]: TranslationStatus } {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    
    const sourceData = this.loadLocale(sourceLang);
    const totalKeys = this.getAllKeys(sourceData).length;
    
    if (targetLang) {
      const targetData = this.loadLocale(targetLang);
      const missingKeys = this.findMissingTranslations(sourceData, targetData);
      const completeness = totalKeys > 0 ? ((totalKeys - missingKeys.length) / totalKeys * 100).toFixed(1) : '0.0';
      
      return {
        language: targetLang,
        total: totalKeys,
        translated: totalKeys - missingKeys.length,
        missing: missingKeys.length,
        completeness: parseFloat(completeness)
      };
    }
    
    // Return status for all languages
    const status: { [key: string]: TranslationStatus } = {};
    for (const lang of Object.keys(this.supportedLanguages)) {
      if (lang === sourceLang) {
        // Include source language with 100% completeness
        status[lang] = {
          language: lang,
          total: totalKeys,
          translated: totalKeys,
          missing: 0,
          completeness: 100
        };
      } else {
        status[lang] = this.getTranslationStatus(sourceLang, lang) as TranslationStatus;
      }
    }
    
    return status;
  }

  // Add new language support by cloning from source language
  public async addNewLanguage(
    sourceLanguage: string, 
    newLanguage: string, 
    progressCallback?: (progress: any) => void
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
      // Send progress update - file creation
      progressCallback?.({
        type: 'progress',
        stage: 'creating-file',
        message: `Creating ${newLanguage}.json file...`,
        progress: 10
      });

      // Clone the source language file
      const sourceData = this.loadLocale(sourceLanguage);
      this.saveLocale(newLanguage, sourceData);
      
      // Update supported languages
      this.supportedLanguages[newLanguage] = newLanguage;
      
      console.log(`✅ Language ${newLanguage} added successfully by cloning from ${sourceLanguage}`);
      
      progressCallback?.({
        type: 'progress',
        stage: 'analyzing-keys',
        message: `Analyzing translation keys...`,
        progress: 20
      });
      
      // Automatically translate ALL keys in the new language (not just missing ones)
      console.log(`🚀 Starting automatic translation for ${newLanguage}...`);
      
      const allKeys = this.getAllKeys(sourceData);
      const totalKeys = allKeys.length;
      console.log(`📋 Translating all ${totalKeys} keys to ${newLanguage}`);
      
      progressCallback?.({
        type: 'progress',
        stage: 'translating',
        message: `Starting translation of ${totalKeys} keys...`,
        progress: 30,
        totalKeys
      });
      
      // Force translation of all keys by treating them as "missing"
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
        type: 'progress',
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

  // Get total key count for batch processing
  public getKeyCount(sourceLang?: string): number {
    sourceLang = sourceLang || this.config.defaultSourceLang;
    const sourceData = this.loadLocale(sourceLang);
    return this.getAllKeys(sourceData).length;
  }

  // Translate a batch of keys
  public async translateBatch(sourceLanguage: string, targetLanguage: string, batchSize: number = 25, offset: number = 0): Promise<number> {
    const sourceData = this.loadLocale(sourceLanguage);
    const targetData = this.loadLocale(targetLanguage);
    
    // Get all keys and select the batch
    const allKeys = this.getAllKeys(sourceData);
    const batchKeys = allKeys.slice(offset, offset + batchSize);
    
    if (batchKeys.length === 0) {
      return 0; // No more keys to process
    }
    
    let translatedCount = 0;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    console.log(`🔄 Translating batch of ${batchKeys.length} keys for ${targetLanguage}...`);
    
    for (const key of batchKeys) {
      try {
        const sourceText = this.getValue(sourceData, key);
        const existingTranslation = this.getValue(targetData, key);
        
        // Skip if translation already exists
        if (existingTranslation && existingTranslation !== sourceText) {
          continue;
        }
        
        // Translate the text
        const translatedText = await this.translateText(sourceText, sourceLanguage, targetLanguage);
        
        // Set the translated value
        this.setValue(targetData, key, translatedText);
        translatedCount++;
        
        // Small delay to prevent API overload
        await delay(100);
      } catch (error) {
        console.error(`❌ Error translating key ${key}:`, (error as Error).message);
        // Continue with next key instead of failing the entire batch
      }
    }
    
    // Save the updated target language file
    this.saveLocale(targetLanguage, targetData);
    
    console.log(`✅ Batch complete: translated ${translatedCount}/${batchKeys.length} keys for ${targetLanguage}`);
    return translatedCount;
  }
}
