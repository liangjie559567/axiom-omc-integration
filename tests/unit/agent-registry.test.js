/**
 * Agent 注册表单元测试
 */

import { AgentRegistry, AgentManager, initializeAgents } from '../../src/agents/index.js';
import { jest } from '@jest/globals';

describe('AgentRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  describe('构造函数', () => {
    it('应该创建空的注册表', () => {
      expect(registry.agents.size).toBe(0);
      expect(registry.categories.size).toBe(0);
    });
  });

  describe('registerAgent', () => {
    it('应该注册 Agent', () => {
      const definition = {
        description: '测试 Agent',
        model: 'sonnet',
        capabilities: ['test']
      };

      registry.registerAgent('test-agent', definition);

      expect(registry.agents.size).toBe(1);
      const agent = registry.getAgent('test-agent');
      expect(agent.name).toBe('test-agent');
      expect(agent.model).toBe('sonnet');
    });

    it('应该在缺少 model 字段时抛出错误', () => {
      expect(() => {
        registry.registerAgent('invalid', { description: '无效' });
      }).toThrow('Agent invalid 缺少 model 字段');
    });

    it('应该使用默认值', () => {
      registry.registerAgent('test', { model: 'haiku' });

      const agent = registry.getAgent('test');
      expect(agent.description).toBe('');
      expect(agent.priority).toBe('medium');
      expect(agent.category).toBe('general');
      expect(agent.capabilities).toEqual([]);
    });

    it('应该按类别索引 Agent', () => {
      registry.registerAgent('agent1', { model: 'sonnet', category: 'build' });
      registry.registerAgent('agent2', { model: 'opus', category: 'build' });
      registry.registerAgent('agent3', { model: 'haiku', category: 'review' });

      const buildAgents = registry.getAgentsByCategory('build');
      expect(buildAgents).toEqual(['agent1', 'agent2']);

      const reviewAgents = registry.getAgentsByCategory('review');
      expect(reviewAgents).toEqual(['agent3']);
    });
  });

  describe('getAgent', () => {
    it('应该获取 Agent 定义', () => {
      registry.registerAgent('test', {
        model: 'sonnet',
        description: '测试 Agent'
      });

      const agent = registry.getAgent('test');
      expect(agent).not.toBeNull();
      expect(agent.name).toBe('test');
      expect(agent.description).toBe('测试 Agent');
    });

    it('应该在 Agent 不存在时返回 null', () => {
      const agent = registry.getAgent('nonexistent');
      expect(agent).toBeNull();
    });
  });

  describe('hasAgent', () => {
    it('应该检查 Agent 是否存在', () => {
      registry.registerAgent('test', { model: 'sonnet' });

      expect(registry.hasAgent('test')).toBe(true);
      expect(registry.hasAgent('nonexistent')).toBe(false);
    });
  });

  describe('listAgents', () => {
    beforeEach(() => {
      registry.registerAgent('executor', {
        model: 'sonnet',
        category: 'build',
        priority: 'high',
        capabilities: ['code_implementation']
      });
      registry.registerAgent('planner', {
        model: 'opus',
        category: 'build',
        priority: 'high',
        capabilities: ['task_planning']
      });
      registry.registerAgent('style-reviewer', {
        model: 'haiku',
        category: 'review',
        priority: 'low',
        capabilities: ['style_check']
      });
    });

    it('应该获取所有 Agent', () => {
      const agents = registry.listAgents();
      expect(agents.length).toBe(3);
    });

    it('应该按模型过滤', () => {
      const sonnetAgents = registry.listAgents({ model: 'sonnet' });
      expect(sonnetAgents.length).toBe(1);
      expect(sonnetAgents[0].name).toBe('executor');
    });

    it('应该按类别过滤', () => {
      const buildAgents = registry.listAgents({ category: 'build' });
      expect(buildAgents.length).toBe(2);
    });

    it('应该按优先级过滤', () => {
      const highPriorityAgents = registry.listAgents({ priority: 'high' });
      expect(highPriorityAgents.length).toBe(2);
    });

    it('应该按能力过滤', () => {
      const planningAgents = registry.listAgents({ capability: 'task_planning' });
      expect(planningAgents.length).toBe(1);
      expect(planningAgents[0].name).toBe('planner');
    });

    it('应该支持多条件过滤', () => {
      const agents = registry.listAgents({
        category: 'build',
        priority: 'high'
      });
      expect(agents.length).toBe(2);
    });
  });

  describe('getAgentsByCategory', () => {
    it('应该按类别获取 Agent 名称列表', () => {
      registry.registerAgent('agent1', { model: 'sonnet', category: 'build' });
      registry.registerAgent('agent2', { model: 'opus', category: 'build' });

      const buildAgents = registry.getAgentsByCategory('build');
      expect(buildAgents).toEqual(['agent1', 'agent2']);
    });

    it('应该在类别不存在时返回空数组', () => {
      const agents = registry.getAgentsByCategory('nonexistent');
      expect(agents).toEqual([]);
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      registry.registerAgent('agent1', { model: 'sonnet', category: 'build', priority: 'high' });
      registry.registerAgent('agent2', { model: 'sonnet', category: 'review', priority: 'medium' });
      registry.registerAgent('agent3', { model: 'opus', category: 'build', priority: 'high' });
      registry.registerAgent('agent4', { model: 'haiku', category: 'review', priority: 'low' });
    });

    it('应该返回统计信息', () => {
      const stats = registry.getStats();

      expect(stats.total).toBe(4);
      expect(stats.byModel).toEqual({
        sonnet: 2,
        opus: 1,
        haiku: 1
      });
      expect(stats.byCategory).toEqual({
        build: 2,
        review: 2
      });
      expect(stats.byPriority).toEqual({
        high: 2,
        medium: 1,
        low: 1
      });
    });
  });

  describe('unregisterAgent', () => {
    it('应该注销 Agent', () => {
      registry.registerAgent('test', { model: 'sonnet', category: 'build' });
      expect(registry.agents.size).toBe(1);

      const result = registry.unregisterAgent('test');
      expect(result).toBe(true);
      expect(registry.agents.size).toBe(0);
    });

    it('应该从类别索引中移除', () => {
      registry.registerAgent('test', { model: 'sonnet', category: 'build' });
      registry.unregisterAgent('test');

      const buildAgents = registry.getAgentsByCategory('build');
      expect(buildAgents).toEqual([]);
    });

    it('应该在 Agent 不存在时返回 false', () => {
      const result = registry.unregisterAgent('nonexistent');
      expect(result).toBe(false);
    });
  });
});

describe('AgentManager', () => {
  let manager;
  let registry;

  beforeEach(() => {
    registry = new AgentRegistry();
    manager = new AgentManager(registry);
  });

  describe('构造函数', () => {
    it('应该创建管理器实例', () => {
      expect(manager.registry).toBe(registry);
      expect(manager.activeAgents.size).toBe(0);
      expect(manager.executionHistory.length).toBe(0);
    });

    it('应该在未提供注册表时创建默认注册表', () => {
      const mgr = new AgentManager();
      expect(mgr.registry).toBeInstanceOf(AgentRegistry);
    });
  });

  describe('register', () => {
    it('应该注册 Agent 实例', () => {
      const agent = {
        execute: jest.fn().mockResolvedValue('result')
      };

      manager.register('test-agent', agent);

      expect(manager.activeAgents.size).toBe(1);
      expect(manager.activeAgents.get('test-agent')).toBe(agent);
    });

    it('应该注册 Agent 定义', () => {
      const definition = {
        model: 'sonnet',
        description: '测试 Agent'
      };

      manager.register('test-agent', definition);

      expect(registry.hasAgent('test-agent')).toBe(true);
    });
  });

  describe('execute', () => {
    it('应该执行 Agent 实例', async () => {
      const agent = {
        execute: jest.fn().mockResolvedValue({ success: true, data: 'result' })
      };

      manager.register('test-agent', agent);

      const result = await manager.execute('test-agent', { task: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toBe('result');
      expect(agent.execute).toHaveBeenCalledWith(
        { task: 'test' },
        {}
      );
    });

    it('应该记录执行历史', async () => {
      const agent = {
        execute: jest.fn().mockResolvedValue({ success: true })
      };

      manager.register('test-agent', agent);
      await manager.execute('test-agent', { task: 'test' });

      const history = manager.getExecutionHistory();
      expect(history.length).toBe(1);
      expect(history[0].agentName).toBe('test-agent');
      expect(history[0].status).toBe('completed');
    });

    it('应该在 Agent 不存在时抛出错误', async () => {
      await expect(
        manager.execute('nonexistent', { task: 'test' })
      ).rejects.toThrow('Agent 不存在: nonexistent');
    });

    it('应该处理执行错误', async () => {
      const agent = {
        execute: jest.fn().mockRejectedValue(new Error('执行失败'))
      };

      manager.register('test-agent', agent);

      await expect(
        manager.execute('test-agent', { task: 'test' })
      ).rejects.toThrow('执行失败');

      const history = manager.getExecutionHistory();
      expect(history[0].status).toBe('failed');
      expect(history[0].error).toBe('执行失败');
    });

    it('应该使用 Agent 定义执行（模拟）', async () => {
      registry.registerAgent('test-agent', {
        model: 'sonnet',
        description: '测试'
      });

      const result = await manager.execute('test-agent', { task: 'test' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('模拟');
    });
  });

  describe('getExecutionHistory', () => {
    it('应该获取执行历史', async () => {
      const agent = {
        execute: jest.fn().mockResolvedValue({ success: true })
      };

      manager.register('test', agent);
      await manager.execute('test', { task: '1' });
      await manager.execute('test', { task: '2' });

      const history = manager.getExecutionHistory();
      expect(history.length).toBe(2);
    });

    it('应该限制历史数量', async () => {
      const agent = {
        execute: jest.fn().mockResolvedValue({ success: true })
      };

      manager.register('test', agent);

      for (let i = 0; i < 5; i++) {
        await manager.execute('test', { task: i });
      }

      const history = manager.getExecutionHistory(3);
      expect(history.length).toBe(3);
    });
  });

  describe('clearHistory', () => {
    it('应该清除执行历史', async () => {
      const agent = {
        execute: jest.fn().mockResolvedValue({ success: true })
      };

      manager.register('test', agent);
      await manager.execute('test', { task: 'test' });

      expect(manager.executionHistory.length).toBeGreaterThan(0);

      manager.clearHistory();
      expect(manager.executionHistory.length).toBe(0);
    });
  });
});
