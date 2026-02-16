/**
 * 配置管理器单元测试
 */

import { ConfigManager, createConfigManager } from '../../src/core/config.js';
import fs from 'fs/promises';
import path from 'path';

describe('ConfigManager', () => {
  let configManager;
  const testConfigDir = path.join(process.cwd(), '.test-config');

  beforeEach(async () => {
    // 创建测试配置目录
    await fs.mkdir(testConfigDir, { recursive: true });

    // 创建测试实例
    configManager = new ConfigManager({
      configPath: testConfigDir,
      defaults: {
        app: {
          name: 'test-app',
          version: '1.0.0'
        }
      }
    });
  });

  afterEach(async () => {
    // 清理测试数据
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  });

  describe('构造函数', () => {
    it('应该创建配置管理器实例', () => {
      expect(configManager).toBeInstanceOf(ConfigManager);
      expect(configManager.configPath).toBe(testConfigDir);
      expect(configManager.loaded).toBe(false);
    });

    it('应该使用默认配置', () => {
      expect(configManager.defaults).toEqual({
        app: {
          name: 'test-app',
          version: '1.0.0'
        }
      });
    });

    it('应该支持自定义选项', () => {
      const customManager = new ConfigManager({
        configPath: '/custom/path',
        useEnv: false
      });

      expect(customManager.configPath).toBe('/custom/path');
      expect(customManager.useEnv).toBe(false);
    });
  });

  describe('load', () => {
    it('应该加载默认配置', async () => {
      await configManager.load();

      expect(configManager.loaded).toBe(true);
      expect(configManager.get('app.name')).toBe('test-app');
      expect(configManager.get('app.version')).toBe('1.0.0');
    });

    it('应该加载 JSON 配置文件', async () => {
      // 创建测试配置文件
      const configFile = path.join(testConfigDir, 'database.json');
      await fs.writeFile(
        configFile,
        JSON.stringify({
          host: 'localhost',
          port: 5432,
          database: 'testdb'
        }),
        'utf-8'
      );

      await configManager.load();

      expect(configManager.get('database.host')).toBe('localhost');
      expect(configManager.get('database.port')).toBe(5432);
      expect(configManager.get('database.database')).toBe('testdb');
    });

    it('应该合并多个配置文件', async () => {
      // 创建多个配置文件
      await fs.writeFile(
        path.join(testConfigDir, 'server.json'),
        JSON.stringify({ port: 3000, host: '0.0.0.0' }),
        'utf-8'
      );

      await fs.writeFile(
        path.join(testConfigDir, 'logging.json'),
        JSON.stringify({ level: 'info', format: 'json' }),
        'utf-8'
      );

      await configManager.load();

      expect(configManager.get('server.port')).toBe(3000);
      expect(configManager.get('logging.level')).toBe('info');
    });

    it('应该处理不存在的配置目录', async () => {
      const emptyManager = new ConfigManager({
        configPath: path.join(testConfigDir, 'nonexistent')
      });

      await expect(emptyManager.load()).resolves.not.toThrow();
      expect(emptyManager.loaded).toBe(true);
    });

    it('应该处理无效的 JSON 文件', async () => {
      await fs.writeFile(
        path.join(testConfigDir, 'invalid.json'),
        'invalid json content',
        'utf-8'
      );

      await expect(configManager.load()).resolves.not.toThrow();
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await configManager.load();
      configManager.set('nested.deep.value', 'test');
    });

    it('应该获取顶层配置', () => {
      expect(configManager.get('app')).toEqual({
        name: 'test-app',
        version: '1.0.0'
      });
    });

    it('应该获取嵌套配置', () => {
      expect(configManager.get('app.name')).toBe('test-app');
      expect(configManager.get('nested.deep.value')).toBe('test');
    });

    it('应该返回默认值当键不存在', () => {
      expect(configManager.get('nonexistent', 'default')).toBe('default');
      expect(configManager.get('app.nonexistent', null)).toBeNull();
    });

    it('应该处理 undefined 值', () => {
      configManager.set('test', undefined);
      expect(configManager.get('test', 'default')).toBe('default');
    });
  });

  describe('set', () => {
    beforeEach(async () => {
      await configManager.load();
    });

    it('应该设置顶层配置', () => {
      configManager.set('newKey', 'newValue');
      expect(configManager.get('newKey')).toBe('newValue');
    });

    it('应该设置嵌套配置', () => {
      configManager.set('level1.level2.level3', 'deep');
      expect(configManager.get('level1.level2.level3')).toBe('deep');
    });

    it('应该覆盖现有配置', () => {
      configManager.set('app.name', 'new-name');
      expect(configManager.get('app.name')).toBe('new-name');
    });

    it('应该支持不同类型的值', () => {
      configManager.set('string', 'text');
      configManager.set('number', 42);
      configManager.set('boolean', true);
      configManager.set('array', [1, 2, 3]);
      configManager.set('object', { key: 'value' });

      expect(configManager.get('string')).toBe('text');
      expect(configManager.get('number')).toBe(42);
      expect(configManager.get('boolean')).toBe(true);
      expect(configManager.get('array')).toEqual([1, 2, 3]);
      expect(configManager.get('object')).toEqual({ key: 'value' });
    });
  });

  describe('has', () => {
    beforeEach(async () => {
      await configManager.load();
      configManager.set('existing', 'value');
    });

    it('应该检查配置是否存在', () => {
      expect(configManager.has('existing')).toBe(true);
      expect(configManager.has('app.name')).toBe(true);
    });

    it('应该返回 false 当配置不存在', () => {
      expect(configManager.has('nonexistent')).toBe(false);
      expect(configManager.has('app.nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await configManager.load();
      configManager.set('toDelete', 'value');
      configManager.set('nested.toDelete', 'value');
    });

    it('应该删除顶层配置', () => {
      expect(configManager.delete('toDelete')).toBe(true);
      expect(configManager.has('toDelete')).toBe(false);
    });

    it('应该删除嵌套配置', () => {
      expect(configManager.delete('nested.toDelete')).toBe(true);
      expect(configManager.has('nested.toDelete')).toBe(false);
    });

    it('应该返回 false 当配置不存在', () => {
      expect(configManager.delete('nonexistent')).toBe(false);
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      await configManager.load();
    });

    it('应该返回所有配置', () => {
      const all = configManager.getAll();
      expect(all).toHaveProperty('app');
      expect(all.app.name).toBe('test-app');
    });

    it('应该返回配置的副本', () => {
      const all = configManager.getAll();
      all.app.name = 'modified';

      expect(configManager.get('app.name')).toBe('test-app');
    });
  });

  describe('merge', () => {
    beforeEach(async () => {
      await configManager.load();
    });

    it('应该合并新配置', () => {
      configManager.merge({
        newSection: {
          key: 'value'
        }
      });

      expect(configManager.get('newSection.key')).toBe('value');
      expect(configManager.get('app.name')).toBe('test-app');
    });

    it('应该深度合并配置', () => {
      configManager.merge({
        app: {
          description: 'Test application'
        }
      });

      expect(configManager.get('app.name')).toBe('test-app');
      expect(configManager.get('app.description')).toBe('Test application');
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await configManager.load();
      configManager.set('custom', 'value');
    });

    it('应该重置配置为默认值', () => {
      configManager.reset();

      expect(configManager.get('custom')).toBeNull();
      expect(configManager.get('app.name')).toBe('test-app');
      expect(configManager.loaded).toBe(false);
    });
  });

  describe('save', () => {
    beforeEach(async () => {
      await configManager.load();
      configManager.set('runtime.value', 'test');
    });

    it('应该保存配置到文件', async () => {
      await configManager.save('test-runtime.json');

      const filePath = path.join(testConfigDir, 'test-runtime.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const saved = JSON.parse(content);

      expect(saved.runtime.value).toBe('test');
    });

    it('应该使用默认文件名', async () => {
      await configManager.save();

      const filePath = path.join(testConfigDir, 'runtime.json');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);

      expect(exists).toBe(true);
    });
  });

  describe('loadFile', () => {
    it('应该从文件加载配置', async () => {
      await configManager.load();

      // 创建额外的配置文件
      await fs.writeFile(
        path.join(testConfigDir, 'extra.json'),
        JSON.stringify({ extra: { key: 'value' } }),
        'utf-8'
      );

      await configManager.loadFile('extra.json');

      expect(configManager.get('extra.key')).toBe('value');
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await configManager.load();
      configManager.set('level1.level2.key1', 'value1');
      configManager.set('level1.level2.key2', 'value2');
      configManager.set('level1.key3', 'value3');
    });

    it('应该返回统计信息', () => {
      const stats = configManager.getStats();

      expect(stats.loaded).toBe(true);
      expect(stats.totalKeys).toBeGreaterThan(0);
      expect(stats.topLevelKeys).toBeGreaterThan(0);
      expect(stats.configPath).toBe(testConfigDir);
      expect(stats.useEnv).toBe(true);
      expect(stats.hasSchema).toBe(false);
    });
  });

  describe('环境变量覆盖', () => {
    it('应该应用环境变量覆盖', async () => {
      // 设置环境变量
      process.env.APP_CONFIG_TEST_VALUE = 'from-env';
      process.env.APP_CONFIG_TEST_NUMBER = '42';
      process.env.APP_CONFIG_TEST_BOOL = 'true';

      await configManager.load();

      expect(configManager.get('test.value')).toBe('from-env');
      expect(configManager.get('test.number')).toBe(42);
      expect(configManager.get('test.bool')).toBe(true);

      // 清理环境变量
      delete process.env.APP_CONFIG_TEST_VALUE;
      delete process.env.APP_CONFIG_TEST_NUMBER;
      delete process.env.APP_CONFIG_TEST_BOOL;
    });

    it('应该支持禁用环境变量覆盖', async () => {
      process.env.APP_CONFIG_TEST = 'value';

      const noEnvManager = new ConfigManager({
        configPath: testConfigDir,
        useEnv: false
      });

      await noEnvManager.load();

      expect(noEnvManager.get('test')).toBeNull();

      delete process.env.APP_CONFIG_TEST;
    });
  });

  describe('配置验证', () => {
    it('应该验证必需字段', async () => {
      const validatingManager = new ConfigManager({
        configPath: testConfigDir,
        schema: {
          'required.field': {
            required: true
          }
        }
      });

      await expect(validatingManager.load()).rejects.toThrow('配置项 required.field 是必需的');
    });

    it('应该验证类型', async () => {
      const validatingManager = new ConfigManager({
        configPath: testConfigDir,
        defaults: {
          port: 'not-a-number'
        },
        schema: {
          port: {
            type: 'number'
          }
        }
      });

      await expect(validatingManager.load()).rejects.toThrow('配置项 port 类型错误');
    });

    it('应该验证枚举值', async () => {
      const validatingManager = new ConfigManager({
        configPath: testConfigDir,
        defaults: {
          env: 'invalid'
        },
        schema: {
          env: {
            enum: ['development', 'production', 'test']
          }
        }
      });

      await expect(validatingManager.load()).rejects.toThrow('配置项 env 值无效');
    });

    it('应该通过有效配置的验证', async () => {
      const validatingManager = new ConfigManager({
        configPath: testConfigDir,
        defaults: {
          port: 3000,
          env: 'development'
        },
        schema: {
          port: {
            type: 'number'
          },
          env: {
            enum: ['development', 'production', 'test']
          }
        }
      });

      await expect(validatingManager.load()).resolves.not.toThrow();
    });
  });

  describe('createConfigManager', () => {
    it('应该创建配置管理器实例', () => {
      const manager = createConfigManager({
        configPath: testConfigDir
      });

      expect(manager).toBeInstanceOf(ConfigManager);
      expect(manager.configPath).toBe(testConfigDir);
    });
  });
});
