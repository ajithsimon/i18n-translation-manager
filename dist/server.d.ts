import { Application } from 'express';
import { TranslationConfig } from './index.js';
export interface ServerConfig extends TranslationConfig {
}
export declare class TranslationServer {
    private config;
    private port;
    private translationManager;
    private app;
    private progressClients;
    constructor(config?: ServerConfig, port?: number);
    private sendProgressUpdate;
    private setupMiddleware;
    private setupRoutes;
    start(): Promise<void>;
    getApp(): Application;
}
