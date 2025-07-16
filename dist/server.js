import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { TranslationManager } from './index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export class TranslationServer {
    constructor(config = {}, port = 3001) {
        this.progressClients = new Map();
        this.config = config;
        this.port = port;
        this.translationManager = new TranslationManager(config);
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    sendProgressUpdate(sessionId, data) {
        const client = this.progressClients.get(sessionId);
        if (client) {
            try {
                client.write(`data: ${JSON.stringify({
                    ...data,
                    timestamp: new Date().toISOString()
                })}\n\n`);
            }
            catch (error) {
                this.progressClients.delete(sessionId);
            }
        }
    }
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../web')));
    }
    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../web/index.html'));
        });
        this.app.get('/api/languages', (req, res) => {
            try {
                const languages = this.translationManager.getSupportedLanguages();
                res.json({ success: true, languages });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/status/:lang?', (req, res) => {
            try {
                const { lang } = req.params;
                const { source, target } = req.query;
                const targetLang = lang || target;
                const status = this.translationManager.getTranslationStatus(source, targetLang);
                res.json({ success: true, status });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/translation-status', (req, res) => {
            try {
                const { source, target } = req.query;
                const status = this.translationManager.getTranslationStatus(source, target);
                res.json({ success: true, status });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/progress/:sessionId', (req, res) => {
            const sessionId = req.params.sessionId;
            if (!sessionId) {
                res.status(400).json({ error: 'Session ID is required' });
                return;
            }
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            this.progressClients.set(sessionId, res);
            res.write(`data: ${JSON.stringify({
                type: 'connected',
                message: 'Progress stream connected',
                timestamp: new Date().toISOString()
            })}\n\n`);
            req.on('close', () => {
                this.progressClients.delete(sessionId);
            });
            const heartbeat = setInterval(() => {
                if (this.progressClients.has(sessionId)) {
                    res.write(`data: ${JSON.stringify({
                        type: 'heartbeat',
                        timestamp: new Date().toISOString()
                    })}\n\n`);
                }
                else {
                    clearInterval(heartbeat);
                }
            }, 30000);
        });
        this.app.post('/api/sync', async (req, res) => {
            try {
                const { sourceLang } = req.body;
                await this.translationManager.syncTranslations(sourceLang);
                res.json({ success: true, message: 'Translation sync completed' });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.post('/api/add-key', async (req, res) => {
            try {
                const { keyPath, sourceValue, sourceLang } = req.body;
                if (!keyPath || !sourceValue) {
                    return res.status(400).json({
                        success: false,
                        error: 'keyPath and sourceValue are required'
                    });
                }
                await this.translationManager.addKey(keyPath, sourceValue, sourceLang);
                return res.json({ success: true, message: 'Key added successfully' });
            }
            catch (error) {
                return res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.post('/api/add-language', async (req, res) => {
            try {
                const { sourceLanguage, newLanguage, sessionId } = req.body;
                if (!sourceLanguage || !newLanguage) {
                    return res.status(400).json({
                        success: false,
                        error: 'sourceLanguage and newLanguage are required'
                    });
                }
                if (sessionId) {
                    this.sendProgressUpdate(sessionId, {
                        type: 'progress',
                        stage: 'starting',
                        message: `Starting translation from ${sourceLanguage} to ${newLanguage}...`,
                        progress: 0
                    });
                }
                const result = await this.translationManager.addNewLanguage(sourceLanguage, newLanguage, sessionId ? (progress) => this.sendProgressUpdate(sessionId, progress) : undefined);
                if (sessionId) {
                    this.sendProgressUpdate(sessionId, {
                        type: 'complete',
                        stage: 'completed',
                        message: `✅ Translation completed! ${result.keysTranslated} keys translated.`,
                        progress: 100,
                        keysTranslated: result.keysTranslated,
                        totalKeys: result.totalKeys
                    });
                }
                return res.json({
                    success: true,
                    message: `Language ${newLanguage} added successfully`,
                    keysTranslated: result.keysTranslated,
                    totalKeys: result.totalKeys
                });
            }
            catch (error) {
                return res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.post('/api/translate-batch', async (req, res) => {
            try {
                const { sourceLanguage, targetLanguage, batchSize = 50, offset = 0 } = req.body;
                if (!sourceLanguage || !targetLanguage) {
                    return res.status(400).json({
                        success: false,
                        error: 'sourceLanguage and targetLanguage are required'
                    });
                }
                const translatedCount = await this.translationManager.translateBatch(sourceLanguage, targetLanguage, parseInt(batchSize), parseInt(offset));
                return res.json({
                    success: true,
                    translatedCount,
                    message: `Translated ${translatedCount} keys for ${targetLanguage}`
                });
            }
            catch (error) {
                return res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/key-count/:lang?', (req, res) => {
            try {
                const { lang } = req.params;
                const keyCount = this.translationManager.getKeyCount(lang);
                res.json({ success: true, keyCount });
            }
            catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        this.app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                message: 'Translation server is running',
                timestamp: new Date().toISOString()
            });
        });
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({ success: false, error: 'API endpoint not found' });
        });
    }
    start() {
        return new Promise((resolve, reject) => {
            try {
                const server = this.app.listen(this.port, () => {
                    console.log(`🌍 i18n Translation Manager Server running on:`);
                    console.log(`   🖥️  Web GUI: http://localhost:${this.port}`);
                    console.log(`   📡 API: http://localhost:${this.port}/api`);
                    console.log(`\n📊 Available API endpoints:`);
                    console.log(`   GET  /api/languages               - Get supported languages`);
                    console.log(`   GET  /api/status/:lang?           - Get translation status`);
                    console.log(`   GET  /api/translation-status      - Get translation status (alias)`);
                    console.log(`   POST /api/sync                    - Sync translations`);
                    console.log(`   POST /api/add-key                 - Add new translation key`);
                    console.log(`   POST /api/add-language            - Add new language`);
                    console.log(`   POST /api/translate-batch         - Translate batch of keys`);
                    console.log(`   GET  /api/key-count/:lang?        - Get total key count`);
                    console.log(`   GET  /api/health                  - Health check`);
                    resolve();
                });
                server.on('error', (error) => {
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    getApp() {
        return this.app;
    }
}
