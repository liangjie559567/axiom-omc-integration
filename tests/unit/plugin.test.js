/**
 * 插件系统测试
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createPlugin } from '../../src/plugin.js';
import { rm, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('插件系统测试', () => {
  let plugin;
  let testDir;

  beforeAll(async () => {
    testDir = join(process.cwd(), 'test-plugin');

    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    plugin = createPlugin({
      memory: {
        storageDir: join(testDir, 'memory')
      },
      sync: {
        axiomRoot: join(testDir, '.agent'),
        omcRoot: join(testDir, '.omc')
      }
    });

    // 创建测试目录
    await mkdir(join(testDir, '.agent'), { recursive: true });
    await mkdir(join(testDir, '.omc'), { recursive: true });
  });

  afterAll(async () => {
    if (plugin) {
      await plugin.destroy();
    }

    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('插件生命周期', () => {
    test('创建插件', () => {
      expect(plugin).toBeDefined();
      expect(plugin.config.name).toBe('axiom-omc');
      expect(plugin.initialized).toBe(false);
      expect(plugin.active).toBe(false);
    });

    test('初始化插件', async () => {
      await plugin.initialize();

      expect(plugin.initialized).toBe(true);
      expect(plugin.agentSystem).toBeDefined();
      expect(plugin.commandRouter).toBeDefined();
      expect(plugin.stateSynchronizer).toBeDefined();
      expect(plugin.memorySystem).toBeDefined();
      expect(plugin.workflowIntegration).toBeDefined();
      expect(plugin.cliSystem).toBeDefined();
    });

    test('激活插件', async () => {
      await plugin.activate();

      expect(plugin.active).toBe(true);
    });

    test('获取插件信息', () => {
      const info = plugin.getInfo();

      expect(info.name).toBe('axiom-omc');
      expect(info.version).toBe('1.0.0');
      expect(info.initialized).toBe(true);
      expect(info.active).toBe(true);
    });

    test('获取插件状态', () => {
      const status = plugin.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.active).toBe(true);
      expect(status.systems.agentSystem).toBe(true);
      expect(status.systems.commandRouter).toBe(true);
      expect(status.systems.stateSynchronizer).toBe(true);
      expect(status.systems.memorySystem).toBe(true);
      expect(status.systems.workflowIntegration).toBe(true);
      expect(status.systems.cliSystem).toBe(true);
    });
  });

  describe('插件命令', () => {
    test('plugin:info - 查看插件信息', async () => {
      const result = await plugin.executeCommand('plugin:info');

      expect(result.success).toBe(true);
      expect(result.plugin).toBeDefined();
      expect(result.plugin.name).toBe('axiom-omc');
      expect(result.plugin.version).toBe('1.0.0');
    });

    test('plugin:status - 查看插件状态', async () => {
      const result = await plugin.executeCommand('plugin:status');

      expect(result.success).toBe(true);
      expect(result.status).toBeDefined();
      expect(result.status.initialized).toBe(true);
      expect(result.status.active).toBe(true);
    });
  });

  describe('Agent 命令集成', () => {
    test('agent:list - 列出所有 Agent', async () => {
      const result = await plugin.executeCommand('agent:list');

      expect(result.success).toBe(true);
      expect(result.agents).toBeDefined();
      expect(result.agents.length).toBeGreaterThan(0);
    });

    test('agent:info - 查看 Agent 详情', async () => {
      const result = await plugin.executeCommand('agent:info architect');

      expect(result.success).toBe(true);
      expect(result.agent).toBeDefined();
    });

    test('agent:execute - 执行 Agent', async () => {
      const result = await plugin.executeCommand('agent:execute architect {}');

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
    });
  });

  describe('工作流命令集成', () => {
    test('workflow:list - 列出所有工作流', async () => {
      const result = await plugin.executeCommand('workflow:list');

      expect(result.success).toBe(true);
      expect(result.workflows).toBeDefined();
      expect(result.workflows.length).toBeGreaterThan(0);
    });

    test('workflow:start - 启动工作流', async () => {
      const result = await plugin.executeCommand('workflow:start omc-default');

      expect(result.success).toBe(true);
      expect(result.instanceId).toBeDefined();
    });

    test('workflow:active - 查看活动工作流', async () => {
      const result = await plugin.executeCommand('workflow:active');

      expect(result.success).toBe(true);
      expect(result.workflows).toBeDefined();
      expect(Array.isArray(result.workflows)).toBe(true);
    });
  });

  describe('记忆命令集成', () => {
    test('memory:stats - 查看统计信息', async () => {
      const result = await plugin.executeCommand('memory:stats');

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
    });

    test('memory:knowledge:search - 搜索知识', async () => {
      const result = await plugin.executeCommand('memory:knowledge:search test');

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
    });
  });

  describe('同步命令集成', () => {
    test('sync:list - 列出同步映射', async () => {
      const result = await plugin.executeCommand('sync:list');

      expect(result.success).toBe(true);
      expect(result.mappings).toBeDefined();
    });

    test('sync:register - 注册同步映射', async () => {
      const result = await plugin.executeCommand('sync:register test.txt test.txt');

      expect(result.success).toBe(true);
      expect(result.mappingId).toBeDefined();
    });
  });

  describe('插件停用和销毁', () => {
    test('停用插件', async () => {
      await plugin.deactivate();

      expect(plugin.active).toBe(false);
      expect(plugin.initialized).toBe(true);
    });

    test('重新激活插件', async () => {
      await plugin.activate();

      expect(plugin.active).toBe(true);
    });

    test('plugin:reload - 重载插件', async () => {
      const result = await plugin.executeCommand('plugin:reload');

      expect(result.success).toBe(true);
      expect(result.message).toBe('插件已重载');
      expect(plugin.active).toBe(true);
    });

    test('销毁插件', async () => {
      await plugin.destroy();

      expect(plugin.initialized).toBe(false);
      expect(plugin.active).toBe(false);
    });
  });

  describe('错误处理', () => {
    test('未激活时执行命令', async () => {
      const newPlugin = createPlugin();

      await expect(
        newPlugin.executeCommand('agent:list')
      ).rejects.toThrow('插件未激活');
    });

    test('重复初始化', async () => {
      const newPlugin = createPlugin({
        memory: {
          storageDir: join(testDir, 'memory2')
        }
      });

      await newPlugin.initialize();
      await newPlugin.initialize(); // 应该不会报错

      expect(newPlugin.initialized).toBe(true);

      await newPlugin.destroy();
    });

    test('重复激活', async () => {
      const newPlugin = createPlugin({
        memory: {
          storageDir: join(testDir, 'memory3')
        }
      });

      await newPlugin.activate();
      await newPlugin.activate(); // 应该不会报错

      expect(newPlugin.active).toBe(true);

      await newPlugin.destroy();
    });
  });
});
