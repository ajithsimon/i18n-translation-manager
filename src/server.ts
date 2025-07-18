import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { TranslationManager, TranslationConfig } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ServerConfig extends TranslationConfig {
  // Additional server-specific config can be added here
}

export class TranslationServer {
  private config: ServerConfig;
  private port: number;
  private translationManager: TranslationManager;
  private app: Application;
  private progressClients: Map<string, Response> = new Map();

  constructor(config: ServerConfig = {}, port: number = 3001) {
    this.config = config;
    this.port = port;
    this.translationManager = new TranslationManager(config);
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  // Helper method to send progress updates to connected clients
  private sendProgressUpdate(sessionId: string, data: any): void {
    const client = this.progressClients.get(sessionId);
    if (client) {
      try {
        client.write(`data: ${JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        // Client disconnected, remove from map
        this.progressClients.delete(sessionId);
      }
    }
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../web')));
  }

  private setupRoutes(): void {
    // Serve web GUI
    this.app.get('/', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../web/index.html'));
    });

    // API Routes
    this.app.get('/api/languages', (req: Request, res: Response) => {
      try {
        const languages = this.translationManager.getSupportedLanguages();
        res.json({ success: true, languages });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.get('/api/status/:lang?', (req: Request, res: Response) => {
      try {
        const { lang } = req.params;
        const { source, target } = req.query;
        
        // Support both 'lang' param and 'target' query for flexibility
        const targetLang = lang || target as string;
        
        const status = this.translationManager.getTranslationStatus(source as string, targetLang);
        res.json({ success: true, status });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Alias for translation-status (alternative endpoint name)
    this.app.get('/api/translation-status', (req: Request, res: Response) => {
      try {
        const { source, target } = req.query;
        const status = this.translationManager.getTranslationStatus(source as string, target as string);
        res.json({ success: true, status });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Server-Sent Events endpoint for real-time progress updates
    this.app.get('/api/progress/:sessionId', (req: Request, res: Response): void => {
      const sessionId = req.params.sessionId;
      
      if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
      }
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Store client connection
      this.progressClients.set(sessionId, res);

      // Send initial connection confirmation
      res.write(`data: ${JSON.stringify({ 
        type: 'connected', 
        message: 'Progress stream connected',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Handle client disconnect
      req.on('close', () => {
        this.progressClients.delete(sessionId);
      });

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        if (this.progressClients.has(sessionId)) {
          res.write(`data: ${JSON.stringify({ 
            type: 'heartbeat', 
            timestamp: new Date().toISOString() 
          })}\n\n`);
        } else {
          clearInterval(heartbeat);
        }
      }, 30000); // 30 second heartbeat
    });

    this.app.post('/api/sync', async (req: Request, res: Response) => {
      try {
        const { sourceLang } = req.body;
        await this.translationManager.syncTranslations(sourceLang);
        res.json({ success: true, message: 'Translation sync completed' });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/api/add-key', async (req: Request, res: Response) => {
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
      } catch (error) {
        return res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/api/add-language', async (req: Request, res: Response) => {
      try {
        const { sourceLanguage, newLanguage, sessionId } = req.body;
        
        if (!sourceLanguage || !newLanguage) {
          return res.status(400).json({ 
            success: false, 
            error: 'sourceLanguage and newLanguage are required' 
          });
        }

        // Send initial progress update if sessionId provided
        if (sessionId) {
          this.sendProgressUpdate(sessionId, {
            type: 'progress',
            stage: 'starting',
            message: `Starting translation from ${sourceLanguage} to ${newLanguage}...`,
            progress: 0
          });
        }
        
        const result = await this.translationManager.addNewLanguage(
          sourceLanguage, 
          newLanguage,
          sessionId ? (progress: any) => this.sendProgressUpdate(sessionId, progress) : undefined
        );

        // Send completion update
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
      } catch (error) {
        return res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/api/translate-batch', async (req: Request, res: Response) => {
      try {
        const { sourceLanguage, targetLanguage, batchSize = 50, offset = 0 } = req.body;
        
        if (!sourceLanguage || !targetLanguage) {
          return res.status(400).json({ 
            success: false, 
            error: 'sourceLanguage and targetLanguage are required' 
          });
        }
        
        const translatedCount = await this.translationManager.translateBatch(
          sourceLanguage, 
          targetLanguage, 
          parseInt(batchSize), 
          parseInt(offset)
        );
        
        return res.json({ 
          success: true, 
          translatedCount,
          message: `Translated ${translatedCount} keys for ${targetLanguage}` 
        });
      } catch (error) {
        return res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.get('/api/key-count/:lang?', (req: Request, res: Response) => {
      try {
        const { lang } = req.params;
        const keyCount = this.translationManager.getKeyCount(lang);
        res.json({ success: true, keyCount });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Health check endpoint
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ 
        success: true, 
        message: 'Translation server is running',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({ success: false, error: 'API endpoint not found' });
    });
  }

  public start(): Promise<void> {
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

        server.on('error', (error: Error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public getApp(): Application {
    return this.app;
  }
}
