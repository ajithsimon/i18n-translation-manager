import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { TranslationManager } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TranslationServer {
  constructor(config = {}, port = 3001) {
    this.config = config;
    this.port = port;
    this.translationManager = new TranslationManager(config);
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../web')));
  }

  setupRoutes() {
    // Serve web GUI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../web/index.html'));
    });

    // API Routes
    this.app.get('/api/languages', (req, res) => {
      try {
        const languages = this.translationManager.getSupportedLanguages();
        res.json({ success: true, languages });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/status/:lang?', (req, res) => {
      try {
        const { lang } = req.params;
        const { source } = req.query;
        const status = this.translationManager.getTranslationStatus(source, lang);
        res.json({ success: true, status });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/sync', async (req, res) => {
      try {
        const { sourceLang } = req.body;
        console.log('🔄 API: Starting translation sync...');
        await this.translationManager.syncTranslations(sourceLang);
        res.json({ success: true, message: 'Translation sync completed' });
      } catch (error) {
        console.error('❌ API sync error:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/add-key', async (req, res) => {
      try {
        const { key, value, sourceLang } = req.body;
        
        if (!key || !value) {
          return res.status(400).json({ 
            success: false, 
            error: 'Key and value are required' 
          });
        }

        console.log(`🔄 API: Adding new key: ${key}`);
        await this.translationManager.addKey(key, value, sourceLang);
        res.json({ success: true, message: 'Key added successfully' });
      } catch (error) {
        console.error('❌ API add-key error:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        success: true, 
        status: 'healthy', 
        config: {
          localesPath: this.config.localesPath,
          defaultSourceLang: this.config.defaultSourceLang
        }
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      const languages = this.translationManager.getSupportedLanguages();
      console.log(`🌍 Detected ${Object.keys(languages).length} languages: ${Object.keys(languages).join(', ')}`);
      console.log(`🌍 Translation Manager Server running at http://localhost:${this.port}`);
      console.log(`📝 GUI available at http://localhost:${this.port}`);
      console.log(`🔧 API endpoints:`);
      console.log(`   GET  /api/languages - Get supported languages`);
      console.log(`   GET  /api/status/:lang - Get translation status`);
      console.log(`   POST /api/sync - Sync translations`);
      console.log(`   POST /api/add-key - Add new translation key`);
      console.log(`   GET  /api/health - Health check`);
    });
  }
}
