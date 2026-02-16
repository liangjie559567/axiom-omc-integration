/**
 * AgentCommand 单元测试
 */

import { AgentCommand } from '../../src/commands/agent-command.js';
import { createAgentSystem } from '../../src/agents/agent-system.js';

describe('AgentCommand', () => {
  let command;
  let system;

  beforeEach(() => {
    system = createAgentSystem();
    command = new AgentCommand();
  });

  describe('list', () => {
    test('应该列出所有 Agent', () => {
      const result = command.list();

      expect(result.total).toBeGreaterThan(0);
      expect(result.agents).toBeDefined();
      expect(Array.isArray(result.agents)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    test('应该按类型过滤 Agent', () => {
      const result = command.list({ type: 'build-analysis' });

      expect(result.agents.length).toBeGreaterThan(0);
      result.agents.forEach(agent => {
        const fullAgent = system.registry.getAgent(`oh-my-claudecode:${agent.id}`);
        expect(fullAgent.type).toBe('build-analysis');
      });
    });

    test('应该按模型过滤 Agent', () => {
      const result = command.list({ model: 'haiku' });

      expect(result.agents.length).toBeGreaterThan(0);
      result.agents.forEach(agent => {
        expect(agent.model).toBe('haiku');
      });
    });

    test('应该返回 JSON 格式', () => {
      const result = command.list({ format: 'json' });

      expect(result.agents).toBeDefined();
      expect(Array.isArray(result.agents)).toBe(true);
    });
  });

  describe('info', () => {
    test('应该获取 Agent 详细信息', () => {
      const result = command.info('explore');

      expect(result.agent).toBeDefined();
      expect(result.agent.name).toBe('explore');
      expect(result.agent.displayName).toBeDefined();
      expect(result.agent.description).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    test('应该在 Agent 不存在时抛出错误', () => {
      expect(() => {
        command.info('non-existent');
      }).toThrow('Agent 不存在');
    });

    test('应该在未指定 Agent 时抛出错误', () => {
      expect(() => {
        command.info();
      }).toThrow('请指定 Agent 名称');
    });
  });

  describe('run', () => {
    test('应该执行 Agent', async () => {
      const result = await command.run('explore', ['{"target":"src/"}']);

      expect(result.success).toBe(true);
      expect(result.agent).toBe('explore');
      expect(result.result).toBeDefined();
    });

    test('应该解析 JSON 输入', async () => {
      const result = await command.run('explore', ['{"target":"src/","depth":"medium"}']);

      expect(result.success).toBe(true);
    });

    test('应该处理执行错误', async () => {
      const result = await command.run('non-existent', []);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('应该在未指定 Agent 时抛出错误', async () => {
      await expect(command.run()).rejects.toThrow('请指定 Agent 名称');
    });
  });

  describe('history', () => {
    test('应该获取执行历史', async () => {
      // 先执行一个 Agent
      await command.run('explore', ['{"target":"src/"}']);

      const result = command.history();

      expect(result.total).toBeGreaterThan(0);
      expect(result.history).toBeDefined();
      expect(Array.isArray(result.history)).toBe(true);
    });

    test('应该按 Agent 过滤历史', async () => {
      await command.run('explore', ['{"target":"src/"}']);

      const result = command.history('explore');

      expect(result.history.length).toBeGreaterThan(0);
      result.history.forEach(exec => {
        expect(exec.agent).toBe('explore');
      });
    });

    test('应该限制历史数量', async () => {
      await command.run('explore', ['{"target":"src/"}']);
      await command.run('explore', ['{"target":"tests/"}']);

      const result = command.history(null, { limit: 1 });

      expect(result.history.length).toBeLessThanOrEqual(1);
    });
  });

  describe('stats', () => {
    test('应该返回统计信息', () => {
      const result = command.stats();

      expect(result.registry).toBeDefined();
      expect(result.executor).toBeDefined();
      expect(result.health).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('search', () => {
    test('应该搜索 Agent', () => {
      const result = command.search('explore');

      expect(result.query).toBe('explore');
      expect(result.total).toBeGreaterThan(0);
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    test('应该按能力搜索', () => {
      const result = command.search('code-analysis');

      expect(result.total).toBeGreaterThan(0);
    });

    test('应该在未指定关键词时抛出错误', () => {
      expect(() => {
        command.search();
      }).toThrow('请指定搜索关键词');
    });
  });

  describe('execute', () => {
    test('应该执行 list 子命令', async () => {
      const result = await command.execute('list');

      expect(result.total).toBeGreaterThan(0);
    });

    test('应该执行 info 子命令', async () => {
      const result = await command.execute('info', ['explore']);

      expect(result.agent.name).toBe('explore');
    });

    test('应该执行 run 子命令', async () => {
      const result = await command.execute('run', ['explore', '{"target":"src/"}']);

      expect(result.success).toBe(true);
    });

    test('应该在未知子命令时抛出错误', async () => {
      await expect(
        command.execute('unknown')
      ).rejects.toThrow('未知的子命令');
    });
  });
});
