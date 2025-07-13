import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';

describe('i18n Translation Manager Tests', () => {
  test('should load package.json correctly', () => {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    assert.strictEqual(packageJson.name, 'i18n-translation-manager');
    assert.strictEqual(packageJson.version, '1.0.0');
  });

  test('should have required files', () => {
    assert.ok(existsSync('./bin/cli.js'));
    assert.ok(existsSync('./lib/server.js'));
    assert.ok(existsSync('./index.js'));
    assert.ok(existsSync('./web/index.html'));
  });

  test('should export main module', async () => {
    const mainModule = await import('../index.js');
    assert.ok(mainModule);
    // Add more specific tests based on your exports
  });
});

describe('Configuration Tests', () => {
  test('should create valid config', () => {
    const configPath = './i18n.config.js';
    if (existsSync(configPath)) {
      const configContent = readFileSync(configPath, 'utf8');
      assert.ok(configContent.includes('localesPath'));
    }
  });
});
