/**
 * CLI 系统测试
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createCLISystem } from '../../src/cli/cli-system.js';
import { rm, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('CLI 系统测试', () => {
  let cli;
  let testDir;

  beforeAll(async () => {
    // 禁用交互式确认
    process.env.NO_CONFIRM = '1';

    testDir = join(process.cwd(), 'test-cli');

    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    cli = createCLISystem({
      memory: {
        storageDir: join(testDir, 'memory')
      },
      sync: {
        axiomRoot: join(testDir, '.agent'),
        omcRoot: join(testDir, '.omc')
      }
    });

    await cli.initialize();

    // 创建测试目录
    await mkdir(join(testDir, '.agent'), { recursive: true });
    await mkdir(join(testDir, '.omc'), { recursive: true });
  });

  afterAll(async () => {
    await cli.destroy();

    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Agent 命令', () => {
    test('agent:list - 列出所有 Agent', async () => {
      const result = await cli.execute('agent:list');

      expect(result.success).toBe(true);
      expect(result.agents).toBeDefined();
      expect(result.agents.length).toBeGreaterThan(0);
    });

    test('agent:info - 查看 Agent 详情', async () => {
      const result = await cli.execute('agent:info architect');

      expect(result.success).toBe(true);
      expect(result.agent).toBeDefined();
      expect(result.agent.id).toBe('oh-my-claudecode:architect');
    });

    test('agent:execute - 执行 Agent', async () => {
      const result = await cli.execute('agent:execute architect {}');

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
    });

    test('agent:status - 查看执行状态', async () => {
      const execResult = await cli.execute('agent:execute architect {}');
      const executionId = execResult.executionId;

      // 确保 executionId 是字符串
      expect(typeof executionId).toBe('string');

      // 等待执行开始（增加等待时间）
      await new Promise(resolve => setTimeout(resolve, 500));

      // 直接调用命令路由器，避免字符串解析问题
      const result = await cli.commandRouter.route('agent:status', [executionId]);

      expect(result.success).toBe(true);
      expect(result.execution).toBeDefined();
      expect(result.execution.id).toBe(executionId);
    });

    test('agent:history - 查看执行历史', async () => {
      const result = await cli.execute('agent:history');

      expect(result.success).toBe(true);
      expect(result.history).toBeDefined();
      expect(Array.isArray(result.history)).toBe(true);
    });

    test('agent:history - 按 Agent 过滤', async () => {
      const result = await cli.execute('agent:history architect 5');

      expect(result.success).toBe(true);
      expect(result.history).toBeDefined();
    });
  });

  describe('工作流命令', () => {
    test('workflow:list - 列出所有工作流', async () => {
      const result = await cli.execute('workflow:list');

      expect(result.success).toBe(true);
      expect(result.workflows).toBeDefined();
      expect(result.workflows.length).toBeGreaterThan(0);
    });

    test('workflow:start - 启动工作流', async () => {
      const result = await cli.execute('workflow:start omc-default');

      expect(result.success).toBe(true);
      expect(result.instanceId).toBeDefined();
    });

    test('workflow:status - 查看工作流状态', async () => {
      const startResult = await cli.execute('workflow:start omc-default');
      const instanceId = startResult.instanceId;

      const result = await cli.execute(`workflow:status ${instanceId}`);

      expect(result.success).toBe(true);
      expect(result.instance).toBeDefined();
      expect(result.instance.id).toBe(instanceId);
    });

    test('workflow:next - 转换到下一阶段', async () => {
      const startResult = await cli.execute('workflow:start omc-default');
      const instanceId = startResult.instanceId;

      const result = await cli.execute(`workflow:next ${instanceId}`);

      expect(result.success).toBe(true);
    });

    test('workflow:goto - 跳转到指定阶段', async () => {
      const startResult = await cli.execute('workflow:start omc-default');
      const instanceId = startResult.instanceId;

      const result = await cli.execute(`workflow:goto ${instanceId} testing`);

      expect(result.success).toBe(true);
    });

    test('workflow:active - 查看活动工作流', async () => {
      const result = await cli.execute('workflow:active');

      expect(result.success).toBe(true);
      expect(result.workflows).toBeDefined();
      expect(Array.isArray(result.workflows)).toBe(true);
    });

    test('workflow:stop - 停止工作流', async () => {
      const startResult = await cli.execute('workflow:start omc-default');
      const instanceId = startResult.instanceId;

      const result = await cli.execute(`workflow:stop ${instanceId}`);

      expect(result.success).toBe(true);
    });
  });

  describe('记忆命令', () => {
    test('memory:decision:add - 添加决策', async () => {
      const decision = {
        title: 'Test Decision',
        type: 'technical',
        status: 'accepted',
        decision: 'Test decision content'
      };

      const decisionStr = JSON.stringify(decision).replace(/"/g, '\\"');
      const result = await cli.execute(`memory:decision:add "${decisionStr}"`);

      expect(result.success).toBe(true);
      expect(result.decisionId).toBeDefined();
    });

    test('memory:decision:list - 列出决策', async () => {
      const result = await cli.execute('memory:decision:list');

      expect(result.success).toBe(true);
      expect(result.decisions).toBeDefined();
      expect(Array.isArray(result.decisions)).toBe(true);
    });

    test('memory:decision:list - 带过滤条件', async () => {
      const filters = { type: 'technical', limit: 5 };
      const filtersStr = JSON.stringify(filters).replace(/"/g, '\\"');
      const result = await cli.execute(`memory:decision:list "${filtersStr}"`);

      expect(result.success).toBe(true);
      expect(result.decisions).toBeDefined();
    });

    test('memory:knowledge:add - 添加知识节点', async () => {
      const node = {
        type: 'concept',
        name: 'Test Concept',
        description: 'Test description'
      };

      const nodeStr = JSON.stringify(node).replace(/"/g, '\\"');
      const result = await cli.execute(`memory:knowledge:add "${nodeStr}"`);

      expect(result.success).toBe(true);
      expect(result.nodeId).toBeDefined();
    });

    test('memory:knowledge:search - 搜索知识', async () => {
      const result = await cli.execute('memory:knowledge:search test');

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
    });

    test('memory:stats - 查看统计信息', async () => {
      const result = await cli.execute('memory:stats');

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
    });
  });

  describe('同步命令', () => {
    test('sync:register - 注册同步映射', async () => {
      const result = await cli.execute('sync:register test.txt test.txt');

      expect(result.success).toBe(true);
      expect(result.mappingId).toBeDefined();
    });

    test('sync:list - 列出同步映射', async () => {
      const result = await cli.execute('sync:list');

      expect(result.success).toBe(true);
      expect(result.mappings).toBeDefined();
      expect(Array.isArray(result.mappings)).toBe(true);
    });

    test('sync:run - 执行同步', async () => {
      const result = await cli.execute('sync:run');

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    test('sync:history - 查看同步历史', async () => {
      const result = await cli.execute('sync:history');

      expect(result.success).toBe(true);
      expect(result.history).toBeDefined();
      expect(Array.isArray(result.history)).toBe(true);
    });
  });

  describe('错误处理', () => {
    test('无效命令', async () => {
      const result = await cli.execute('invalid:command');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('缺少必需参数', async () => {
      const result = await cli.execute('agent:info');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('无效的 JSON 参数', async () => {
      const result = await cli.execute('memory:decision:add {invalid json}');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('命令别名', () => {
    test('agent:ls 别名', async () => {
      const result = await cli.execute('agent:ls');

      expect(result.success).toBe(true);
      expect(result.agents).toBeDefined();
    });

    test('workflow:ls 别名', async () => {
      const result = await cli.execute('workflow:ls');

      expect(result.success).toBe(true);
      expect(result.workflows).toBeDefined();
    });

    test('sync:ls 别名', async () => {
      const result = await cli.execute('sync:ls');

      expect(result.success).toBe(true);
      expect(result.mappings).toBeDefined();
    });
  });
});
