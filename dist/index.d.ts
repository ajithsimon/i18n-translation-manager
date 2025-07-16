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
export declare class TranslationManager {
    private config;
    private localesPath;
    private supportedLanguages;
    constructor(config?: TranslationConfig);
    private detectSupportedLanguages;
    private translateText;
    private getAllKeys;
    private getValue;
    private setValue;
    private loadLocale;
    private saveLocale;
    private findMissingTranslations;
    private translateMissingKeys;
    syncTranslations(sourceLang?: string): Promise<void>;
    addKey(keyPath: string, sourceValue: string, sourceLang?: string): Promise<void>;
    checkTranslations(sourceLang?: string): void;
    getSupportedLanguages(): SupportedLanguages;
    getTranslationStatus(sourceLang?: string, targetLang?: string): TranslationStatus | {
        [key: string]: TranslationStatus;
    };
    addNewLanguage(sourceLanguage: string, newLanguage: string, progressCallback?: (progress: any) => void): Promise<{
        keysTranslated: number;
        totalKeys: number;
    }>;
    getKeyCount(sourceLang?: string): number;
    translateBatch(sourceLanguage: string, targetLanguage: string, batchSize?: number, offset?: number): Promise<number>;
}
//# sourceMappingURL=index.d.ts.map