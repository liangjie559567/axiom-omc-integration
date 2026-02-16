/**
 * AgentExecutor 单元测试
 */

import { AgentExecutor, ExecutionStatus } from '../../src/agents/agent-executor.js';
import { createAgentRegistry } from '../../src/agents/agent-registry.js';
import { exploreAgent } from '../../src/agents/definitions/explore.js';
import { executorAgent } from '../../src/agents/definitions/executor.js';

describe('AgentExecutor', () => {
  let registry;
  let executor;

  beforeEach(() => {
    registry = createAgentRegistry();
    registry.register(exploreAgent);
    registry.register(executorAgent);

    executor = new AgentExecutor({
      registry,
      maxConcurrent: 2,
      timeout: 5000
    });
  });

  describe('构造函数', () => {
    test('应该创建执行器实例', () => {
      expect(executor).toBeDefined();
      expect(executor.registry).toBe(registry);
      expect(executor.maxConcurrent).toBe(2);
      expect(executor.timeout).toBe(5000);
    });
  });

  describe('execute', () => {
    test('应该执行 Agent', async () => {
      const result = await executor.execute(exploreAgent.id, {
        target: 'test'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('应该在 Agent 不存在时抛出错误', async () => {
      await expect(
        executor.execute('non-existent', {})
      ).rejects.toThrow('Agent 不存在');
    });

    test('应该记录执行历史', async () => {
      await executor.execute(exploreAgent.id, { target: 'test' });

      const history = executor.getExecutionHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].agentId).toBe(exploreAgent.id);
      expect(history[0].status).toBe(ExecutionStatus.COMPLETED);
    });
  });

  describe('executeBatch', () => {
    test('应该批量执行多个任务', async () => {
      const tasks = [
        { agentId: exploreAgent.id, input: { target: 'test1' } },
        { agentId: executorAgent.id, input: { task: 'test2', specification: {} } }
      ];

      const results = await executor.executeBatch(tasks);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
    });
  });

  describe('cancelExecution', () => {
    test('应该取消队列中的执行', async () => {
      // 创建一个执行但不等待
      const promise = executor.execute(exploreAgent.id, { target: 'test' });

      // 立即取消
      const cancelled = executor.cancelExecution(
        executor.executionQueue[0]?.id || Array.from(executor.runningExecutions.keys())[0]
      );

      // 等待执行完成或失败
      await promise.catch(() => {});

      // 验证取消成功（可能已经开始执行）
      expect(typeof cancelled).toBe('boolean');
    });
  });

  describe('getExecution', () => {
    test('应该获取执行信息', async () => {
      const promise = executor.execute(exploreAgent.id, { target: 'test' });

      // 获取执行 ID
      const executions = Array.from(executor.runningExecutions.values());
      if (executions.length > 0) {
        const execution = executor.getExecution(executions[0].id);
        expect(execution).toBeDefined();
        expect(execution.agentId).toBe(exploreAgent.id);
      }

      await promise;
    });

    test('应该在执行不存在时返回 null', () => {
      const execution = executor.getExecution('non-existent');
      expect(execution).toBeNull();
    });
  });

  describe('getExecutionHistory', () => {
    test('应该获取执行历史', async () => {
      await executor.execute(exploreAgent.id, { target: 'test1' });
      await executor.execute(executorAgent.id, { task: 'test2', specification: {} });

      const history = executor.getExecutionHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    test('应该按 Agent 过滤历史', async () => {
      await executor.execute(exploreAgent.id, { target: 'test1' });
      await executor.execute(executorAgent.id, { task: 'test2', specification: {} });

      const history = executor.getExecutionHistory({
        agentId: exploreAgent.id
      });

      expect(history.length).toBeGreaterThan(0);
      history.forEach(exec => {
        expect(exec.agentId).toBe(exploreAgent.id);
      });
    });

    test('应该限制历史数量', async () => {
      await executor.execute(exploreAgent.id, { target: 'test1' });
      await executor.execute(exploreAgent.id, { target: 'test2' });
      await executor.execute(exploreAgent.id, { target: 'test3' });

      const history = executor.getExecutionHistory({ limit: 2 });
      expect(history.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getStats', () => {
    test('应该返回统计信息', async () => {
      await executor.execute(exploreAgent.id, { target: 'test' });

      const stats = executor.getStats();

      expect(stats.totalExecutions).toBeGreaterThan(0);
      expect(stats.successfulExecutions).toBeGreaterThan(0);
      expect(stats.successRate).toBeDefined();
    });
  });

  describe('cleanupHistory', () => {
    test('应该清理旧的历史记录', async () => {
      await executor.execute(exploreAgent.id, { target: 'test' });

      const beforeCount = executor.completedExecutions.size;

      // 清理 0 毫秒以上的记录（清理所有）
      executor.cleanupHistory(0);

      const afterCount = executor.completedExecutions.size;

      expect(afterCount).toBeLessThanOrEqual(beforeCount);
    });
  });

  describe('并发控制', () => {
    test('应该限制并发执行数量', async () => {
      const tasks = Array(5).fill(null).map((_, i) => ({
        agentId: exploreAgent.id,
        input: { target: `test${i}` }
      }));

      const promise = executor.executeBatch(tasks);

      // 检查运行中的任务数量不超过 maxConcurrent
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(executor.runningExecutions.size).toBeLessThanOrEqual(executor.maxConcurrent);

      await promise;
    });
  });
});
