import fs from 'fs';
import path from 'path';
export class TranslationManager {
    constructor(config = {}) {
        this.config = {
            localesPath: './src/i18n/locales',
            defaultSourceLang: 'en',
            translationService: 'google-free',
            filePattern: '{lang}.json',
            excludeFiles: [], rateLimiting: {
                batchSize: 25,
                delayBetweenBatches: 1000
            },
            ...config
        };
        this.localesPath = path.resolve(process.cwd(), this.config.localesPath);
        this.supportedLanguages = this.detectSupportedLanguages();
    }
    detectSupportedLanguages() {
        const languages = {};
        try {
            if (!fs.existsSync(this.localesPath)) {
                console.warn(`⚠️  Locales directory not found: ${this.localesPath}`);
                return {};
            }
            const files = fs.readdirSync(this.localesPath);
            for (const file of files) {
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
        }
        catch (error) {
            console.error('❌ Error detecting languages:', error.message);
            console.warn(`⚠️  Please check that ${this.localesPath} exists and is accessible`);
            return {};
        }
        return languages;
    }
    async translateText(text, targetLang, sourceLang = 'en') {
        try {
            const fetch = (await import('node-fetch')).default;
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                return data[0][0][0];
            }
            throw new Error('Translation failed');
        }
        catch (error) {
            console.warn(`Translation failed for "${text}" to ${targetLang}:`, error.message);
            return text;
        }
    }
    getAllKeys(obj, prefix = '') {
        let keys = [];
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                keys = keys.concat(this.getAllKeys(obj[key], fullKey));
            }
            else {
                keys.push(fullKey);
            }
        }
        return keys;
    }
    getValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }
    setValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    loadLocale(lang) {
        const filePath = path.join(this.localesPath, `${lang}.json`);
        if (!fs.existsSync(filePath)) {
            return {};
        }
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        catch (error) {
            console.error(`Error loading ${lang}.json:`, error.message);
            return {};
        }
    }
    saveLocale(lang, data) {
        const filePath = path.join(this.localesPath, `${lang}.json`);
        try {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
            console.log(`✅ Saved ${lang}.json`);
        }
        catch (error) {
            console.error(`Error saving ${lang}.json:`, error.message);
        }
    }
    findMissingTranslations(sourceData, targetData) {
        const sourceKeys = this.getAllKeys(sourceData);
        const missing = [];
        for (const key of sourceKeys) {
            const targetValue = this.getValue(targetData, key);
            if (targetValue === undefined || targetValue === null || targetValue === '') {
                missing.push(key);
            }
        }
        return missing;
    }
    async translateMissingKeys(sourceLang, targetLang, missingKeys, sourceData, targetData, progressCallback) {
        console.log(`\n🔄 Translating ${missingKeys.length} missing keys from ${sourceLang} to ${targetLang}...`);
        const batchSize = this.config.rateLimiting.batchSize;
        const result = { ...targetData };
        for (let i = 0; i < missingKeys.length; i += batchSize) {
            const batch = missingKeys.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(missingKeys.length / batchSize);
            const progress = Math.round(30 + ((i / missingKeys.length) * 60));
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
            if (i + batchSize < missingKeys.length) {
                await new Promise(resolve => setTimeout(resolve, this.config.rateLimiting.delayBetweenBatches));
            }
        }
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
    async syncTranslations(sourceLang) {
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
            if (targetLang === sourceLang)
                continue;
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
    async addKey(keyPath, sourceValue, sourceLang) {
        sourceLang = sourceLang || this.config.defaultSourceLang;
        console.log(`\n➕ Adding new key: ${keyPath}`);
        for (const lang of Object.keys(this.supportedLanguages)) {
            const data = this.loadLocale(lang);
            if (lang === sourceLang) {
                this.setValue(data, keyPath, sourceValue);
                console.log(`  ${lang}: "${sourceValue}" (source)`);
            }
            else {
                const translatedValue = await this.translateText(sourceValue, lang, sourceLang);
                this.setValue(data, keyPath, translatedValue);
                console.log(`  ${lang}: "${translatedValue}"`);
            }
            this.saveLocale(lang, data);
        }
        console.log('✅ Key added to all language files!');
    }
    checkTranslations(sourceLang) {
        sourceLang = sourceLang || this.config.defaultSourceLang;
        console.log(`📊 Translation Status Report (source: ${sourceLang})\n`);
        const sourceData = this.loadLocale(sourceLang);
        const totalKeys = this.getAllKeys(sourceData).length;
        console.log(`Total keys in ${sourceLang}: ${totalKeys}\n`);
        for (const targetLang of Object.keys(this.supportedLanguages)) {
            if (targetLang === sourceLang)
                continue;
            const targetData = this.loadLocale(targetLang);
            const missingKeys = this.findMissingTranslations(sourceData, targetData);
            const completeness = totalKeys > 0 ? ((totalKeys - missingKeys.length) / totalKeys * 100).toFixed(1) : '0.0';
            console.log(`${targetLang}: ${totalKeys - missingKeys.length}/${totalKeys} (${completeness}%) - ${missingKeys.length} missing`);
        }
    }
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
    getTranslationStatus(sourceLang, targetLang) {
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
        const status = {};
        for (const lang of Object.keys(this.supportedLanguages)) {
            if (lang === sourceLang)
                continue;
            status[lang] = this.getTranslationStatus(sourceLang, lang);
        }
        return status;
    }
    async addNewLanguage(sourceLanguage, newLanguage, progressCallback) {
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
                totalKeys
            });
            const updatedData = await this.translateMissingKeys(sourceLanguage, newLanguage, allKeys, sourceData, {}, progressCallback);
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
        }
        catch (error) {
            progressCallback?.({
                type: 'error',
                stage: 'error',
                message: `Error: ${error.message}`,
                progress: 0
            });
            throw new Error(`Failed to add new language: ${error.message}`);
        }
    }
    getKeyCount(sourceLang) {
        sourceLang = sourceLang || this.config.defaultSourceLang;
        const sourceData = this.loadLocale(sourceLang);
        return this.getAllKeys(sourceData).length;
    }
    async translateBatch(sourceLanguage, targetLanguage, batchSize = 25, offset = 0) {
        const sourceData = this.loadLocale(sourceLanguage);
        const targetData = this.loadLocale(targetLanguage);
        const allKeys = this.getAllKeys(sourceData);
        const batchKeys = allKeys.slice(offset, offset + batchSize);
        if (batchKeys.length === 0) {
            return 0;
        }
        let translatedCount = 0;
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        console.log(`🔄 Translating batch of ${batchKeys.length} keys for ${targetLanguage}...`);
        for (const key of batchKeys) {
            try {
                const sourceText = this.getValue(sourceData, key);
                const existingTranslation = this.getValue(targetData, key);
                if (existingTranslation && existingTranslation !== sourceText) {
                    continue;
                }
                const translatedText = await this.translateText(sourceText, sourceLanguage, targetLanguage);
                this.setValue(targetData, key, translatedText);
                translatedCount++;
                await delay(100);
            }
            catch (error) {
                console.error(`❌ Error translating key ${key}:`, error.message);
            }
        }
        this.saveLocale(targetLanguage, targetData);
        console.log(`✅ Batch complete: translated ${translatedCount}/${batchKeys.length} keys for ${targetLanguage}`);
        return translatedCount;
    }
}
