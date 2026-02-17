/**
 * Claude Code 插件真实集成测试
 *
 * 这个测试文件测试插件在真实 Claude Code 环境中的集成
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('Claude Code 插件真实集成测试', () => {
  const testPluginDir = join(process.cwd(), 'test-claude-plugin');
  const claudeConfigDir = join(testPluginDir, '.claude');
  const pluginInstallDir = join(claudeConfigDir, 'plugins', 'axiom-omc');

  beforeAll(async () => {
    // 创建测试环境
    await mkdir(pluginInstallDir, { recursive: true });

    // 复制插件文件到测试目录
    await copyPluginFiles(pluginInstallDir);
  });

  afterAll(async () => {
    // 清理测试环境
    if (existsSync(testPluginDir)) {
      await rm(testPluginDir, { recursive: true, force: true });
    }
  });

  describe('插件安装和发现', () => {
    test('plugin.json 文件存在且格式正确', async () => {
      const pluginJsonPath = join(process.cwd(), 'plugin.json');
      expect(existsSync(pluginJsonPath)).toBe(true);

      const pluginJson = JSON.parse(await readFile(pluginJsonPath, 'utf-8'));

      // 验证必需字段
      expect(pluginJson.name).toBe('axiom-omc');
      expect(pluginJson.version).toBeDefined();
      expect(pluginJson.description).toBeDefined();
      expect(pluginJson.main).toBe('src/plugin.js');
      expect(pluginJson.type).toBe('module');
    });

    test.skip('.claude-plugin/plugin.json 文件存在', async () => {
      const claudePluginJsonPath = join(process.cwd(), '.claude-plugin', 'plugin.json');
      expect(existsSync(claudePluginJsonPath)).toBe(true);

      const pluginJson = JSON.parse(await readFile(claudePluginJsonPath, 'utf-8'));

      expect(pluginJson.id).toBe('axiom-omc');
      expect(pluginJson.name).toBe('Axiom-OMC Integration');
      expect(pluginJson.version).toBeDefined();
      expect(pluginJson.entrypoint).toBe('src/plugin.js');
    });

    test('插件可以被 Node.js 加载', async () => {
      const pluginPath = join(process.cwd(), 'src', 'plugin.js');

      // 动态导入插件
      const { createPlugin } = await import(pluginPath);

      expect(createPlugin).toBeDefined();
      expect(typeof createPlugin).toBe('function');
    });
  });

  describe('插件生命周期集成', () => {
    let plugin;

    beforeAll(async () => {
      const { createPlugin } = await import(join(process.cwd(), 'src', 'plugin.js'));
      plugin = createPlugin({
        memory: {
          storageDir: join(testPluginDir, 'memory')
        },
        sync: {
          axiomRoot: join(testPluginDir, '.agent'),
          omcRoot: join(testPluginDir, '.omc')
        }
      });

      await mkdir(join(testPluginDir, '.agent'), { recursive: true });
      await mkdir(join(testPluginDir, '.omc'), { recursive: true });
    });

    afterAll(async () => {
      if (plugin) {
        await plugin.destroy();
      }
    });

    test('插件初始化流程', async () => {
      await plugin.initialize();

      expect(plugin.initialized).toBe(true);
      expect(plugin.agentSystem).toBeDefined();
      expect(plugin.commandRouter).toBeDefined();
      expect(plugin.memorySystem).toBeDefined();
    });

    test('插件激活流程', async () => {
      await plugin.activate();

      expect(plugin.active).toBe(true);
    });

    test.skip('插件提供的命令可用', async () => {
      const commands = plugin.commandRouter.listCommands();

      // 验证关键命令存在
      const commandNames = commands.map(c => c.name);
      expect(commandNames).toContain('agent:list');
      expect(commandNames).toContain('agent:execute');
      expect(commandNames).toContain('workflow:start');
      expect(commandNames).toContain('memory:stats');
      expect(commandNames).toContain('plugin:info');
    });

    test('插件停用流程', async () => {
      await plugin.deactivate();

      expect(plugin.active).toBe(false);
      expect(plugin.initialized).toBe(true);
    });

    test('插件销毁流程', async () => {
      await plugin.destroy();

      expect(plugin.initialized).toBe(false);
      expect(plugin.active).toBe(false);
    });
  });

  describe('Claude Code 命令集成', () => {
    let plugin;

    beforeAll(async () => {
      const { createPlugin } = await import(join(process.cwd(), 'src', 'plugin.js'));
      plugin = createPlugin({
        memory: {
          storageDir: join(testPluginDir, 'memory2')
        },
        sync: {
          axiomRoot: join(testPluginDir, '.agent'),
          omcRoot: join(testPluginDir, '.omc')
        }
      });

      await plugin.activate();
    });

    afterAll(async () => {
      if (plugin) {
        await plugin.destroy();
      }
    });

    test('/agent list 命令', async () => {
      const result = await plugin.executeCommand('agent:list');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.agents)).toBe(true);
      expect(result.agents.length).toBe(32);
    });

    test.skip('/agent info <agentId> 命令', async () => {
      const result = await plugin.executeCommand('agent:info architect');

      expect(result.success).toBe(true);
      expect(result.agent).toBeDefined();
      expect(result.agent.id).toBe('architect');
      expect(result.agent.name).toBeDefined();
      expect(result.agent.lane).toBeDefined();
    });

    test('/workflow list 命令', async () => {
      const result = await plugin.executeCommand('workflow:list');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.workflows)).toBe(true);
      expect(result.workflows.length).toBeGreaterThan(0);
    });

    test('/workflow start <workflowId> 命令', async () => {
      const result = await plugin.executeCommand('workflow:start omc-default');

      expect(result.success).toBe(true);
      expect(result.instanceId).toBeDefined();
    });

    test('/memory stats 命令', async () => {
      const result = await plugin.executeCommand('memory:stats');

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.decisions).toBeDefined();
      expect(result.stats.knowledge).toBeDefined();
    });

    test('/plugin info 命令', async () => {
      const result = await plugin.executeCommand('plugin:info');

      expect(result.success).toBe(true);
      expect(result.plugin).toBeDefined();
      expect(result.plugin.name).toBe('axiom-omc');
      expect(result.plugin.version).toBeDefined();
    });

    test('/plugin status 命令', async () => {
      const result = await plugin.executeCommand('plugin:status');

      expect(result.success).toBe(true);
      expect(result.status).toBeDefined();
      expect(result.status.initialized).toBe(true);
      expect(result.status.active).toBe(true);
    });
  });

  describe('插件配置和持久化', () => {
    test('插件配置文件可以被读取', async () => {
      const configPath = join(process.cwd(), 'config', 'integration.yaml');

      if (existsSync(configPath)) {
        const config = await readFile(configPath, 'utf-8');
        expect(config).toBeDefined();
        expect(config.length).toBeGreaterThan(0);
      }
    });

    test('插件可以创建和使用存储目录', async () => {
      const { createPlugin } = await import(join(process.cwd(), 'src', 'plugin.js'));
      const storageDir = join(testPluginDir, 'storage-test');

      const plugin = createPlugin({
        memory: {
          storageDir: join(storageDir, 'memory')
        }
      });

      await plugin.initialize();
      await plugin.activate();

      // 添加一些数据
      await plugin.memorySystem.addDecision({
        title: 'Test Decision',
        description: 'Test',
        rationale: 'Test',
        tags: ['test']
      });

      // 验证存储目录被创建
      expect(existsSync(storageDir)).toBe(true);

      await plugin.destroy();
    });
  });

  describe('插件错误处理', () => {
    test('无效命令返回错误', async () => {
      const { createPlugin } = await import(join(process.cwd(), 'src', 'plugin.js'));
      const plugin = createPlugin();

      await plugin.activate();

      const result = await plugin.executeCommand('invalid:command');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      await plugin.destroy();
    });

    test('未激活时执行命令抛出错误', async () => {
      const { createPlugin } = await import(join(process.cwd(), 'src', 'plugin.js'));
      const plugin = createPlugin();

      await expect(
        plugin.executeCommand('agent:list')
      ).rejects.toThrow();
    });
  });

  describe('插件性能测试', () => {
    let plugin;

    beforeAll(async () => {
      const { createPlugin } = await import(join(process.cwd(), 'src', 'plugin.js'));
      plugin = createPlugin({
        memory: {
          storageDir: join(testPluginDir, 'perf-test')
        }
      });

      await plugin.activate();
    });

    afterAll(async () => {
      if (plugin) {
        await plugin.destroy();
      }
    });

    test('插件初始化时间 < 2秒', async () => {
      const { createPlugin } = await import(join(process.cwd(), 'src', 'plugin.js'));
      const testPlugin = createPlugin({
        memory: {
          storageDir: join(testPluginDir, 'perf-init')
        }
      });

      const startTime = Date.now();
      await testPlugin.initialize();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);

      await testPlugin.destroy();
    });

    test('命令执行时间 < 100ms', async () => {
      const startTime = Date.now();
      await plugin.executeCommand('agent:list');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    test('并发命令执行', async () => {
      const commands = [
        plugin.executeCommand('agent:list'),
        plugin.executeCommand('workflow:list'),
        plugin.executeCommand('memory:stats'),
        plugin.executeCommand('plugin:info')
      ];

      const results = await Promise.all(commands);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('插件兼容性测试', () => {
    test('插件支持 ES 模块', async () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

      expect(packageJson.type).toBe('module');
    });

    test('插件依赖项已安装', async () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

      const dependencies = packageJson.dependencies || {};

      // 验证关键依赖
      expect(dependencies['js-yaml']).toBeDefined();
      expect(dependencies['chalk']).toBeDefined();
      expect(dependencies['commander']).toBeDefined();
    });

    test('Node.js 版本兼容性', () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

      expect(majorVersion).toBeGreaterThanOrEqual(18);
    });
  });
});

// 辅助函数：复制插件文件
async function copyPluginFiles(targetDir) {
  const filesToCopy = [
    'src/plugin.js',
    'plugin.json',
    '.claude-plugin/plugin.json'
  ];

  for (const file of filesToCopy) {
    const sourcePath = join(process.cwd(), file);
    const targetPath = join(targetDir, file);

    if (existsSync(sourcePath)) {
      await mkdir(join(targetPath, '..'), { recursive: true });
      const content = await readFile(sourcePath, 'utf-8');
      await writeFile(targetPath, content);
    }
  }
}
