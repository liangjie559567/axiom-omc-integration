/**
 * 分布式执行引擎测试
 */

import { jest } from '@jest/globals';
import DistributedExecutionEngine, { TaskStatus, ExecutionMode } from '../DistributedExecutionEngine.js';

describe('DistributedExecutionEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new DistributedExecutionEngine({
      maxConcurrency: 5,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 100,
      shardSize: 10
    });
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(engine).toBeDefined();
      expect(engine.tasks.size).toBe(0);
      expect(engine.executors.size).toBe(0);
    });
  });

  describe('执行器管理', () => {
    test('应该注册执行器', () => {
      const executor = engine.registerExecutor('executor-1', {
        name: 'Local Executor',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });

      expect(executor).toBeDefined();
      expect(executor.id).toBe('executor-1');
      expect(engine.executors.has('executor-1')).toBe(true);
    });

    test('应该触发执行器注册事件', (done) => {
      engine.once('executor_registered', (event) => {
        expect(event.executorId).toBe('executor-1');
        done();
      });

      engine.registerExecutor('executor-1', {
        name: 'Local Executor',
        type: ExecutionMode.LOCAL
      });
    });

    test('应该注销执行器', () => {
      engine.registerExecutor('executor-1', {
        name: 'Local Executor',
        type: ExecutionMode.LOCAL
      });

      engine.unregisterExecutor('executor-1');

      expect(engine.executors.has('executor-1')).toBe(false);
    });
  });

  describe('任务提交', () => {
    test('应该提交任务', () => {
      const taskId = engine.submitTask({
        name: 'Test Task',
        handler: jest.fn(),
        input: { data: 'test' }
      });

      expect(taskId).toBeDefined();
      expect(engine.tasks.has(taskId)).toBe(true);

      const task = engine.tasks.get(taskId);
      expect(task.status).toBe(TaskStatus.PENDING);
    });

    test('应该触发任务提交事件', (done) => {
      engine.once('task_submitted', (event) => {
        expect(event.taskId).toBeDefined();
        done();
      });

      engine.submitTask({
        name: 'Test Task',
        handler: jest.fn()
      });
    });
  });

  describe('本地执行', () => {
    beforeEach(() => {
      engine.registerExecutor('local-1', {
        name: 'Local Executor',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });
    });

    test('应该执行本地任务', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const taskId = engine.submitTask({
        name: 'Local Task',
        handler,
        input: { data: 'test' },
        mode: ExecutionMode.LOCAL
      });

      const result = await engine.executeTask(taskId);

      expect(result).toBe('result');
      expect(handler).toHaveBeenCalledWith({ data: 'test' });

      const task = engine.tasks.get(taskId);
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });

    test('应该触发任务事件', async () => {
      const events = [];

      engine.on('task_started', () => events.push('started'));
      engine.on('task_completed', () => events.push('completed'));

      const handler = jest.fn().mockResolvedValue('result');

      const taskId = engine.submitTask({
        name: 'Event Task',
        handler,
        mode: ExecutionMode.LOCAL
      });

      await engine.executeTask(taskId);

      expect(events).toContain('started');
      expect(events).toContain('completed');
    });
  });

  describe('远程执行', () => {
    beforeEach(() => {
      engine.registerExecutor('remote-1', {
        name: 'Remote Executor',
        type: ExecutionMode.REMOTE,
        endpoint: 'http://remote:3000',
        capacity: 10
      });
    });

    test('应该执行远程任务', async () => {
      const handler = jest.fn().mockResolvedValue('remote-result');

      const taskId = engine.submitTask({
        name: 'Remote Task',
        handler,
        input: { data: 'test' },
        mode: ExecutionMode.REMOTE
      });

      const result = await engine.executeTask(taskId);

      expect(result).toBe('remote-result');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('混合执行', () => {
    beforeEach(() => {
      engine.registerExecutor('local-1', {
        name: 'Local Executor',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });

      engine.registerExecutor('remote-1', {
        name: 'Remote Executor',
        type: ExecutionMode.REMOTE,
        capacity: 10
      });
    });

    test('应该优先本地执行', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const taskId = engine.submitTask({
        name: 'Hybrid Task',
        handler,
        mode: ExecutionMode.HYBRID
      });

      const result = await engine.executeTask(taskId);

      expect(result).toBe('result');
    });

    test('应该在本地失败时远程执行', async () => {
      // 移除本地执行器，强制远程执行
      engine.unregisterExecutor('local-1');

      const handler = jest.fn().mockResolvedValue('remote-result');

      const taskId = engine.submitTask({
        name: 'Hybrid Fallback Task',
        handler,
        mode: ExecutionMode.HYBRID
      });

      const result = await engine.executeTask(taskId);

      expect(result).toBe('remote-result');
    });
  });

  describe('分片执行', () => {
    beforeEach(() => {
      engine.registerExecutor('local-1', {
        name: 'Local Executor',
        type: ExecutionMode.LOCAL,
        capacity: 100
      });
    });

    test('应该分片执行大数据集', async () => {
      const handler = jest.fn().mockImplementation((data) => {
        return data.map(x => x * 2);
      });

      const input = Array.from({ length: 25 }, (_, i) => i);

      const taskId = engine.submitTask({
        name: 'Sharded Task',
        handler,
        input,
        shardable: true,
        mode: ExecutionMode.LOCAL
      });

      const result = await engine.executeTask(taskId);

      expect(result).toHaveLength(25);
      expect(result[0]).toBe(0);
      expect(result[24]).toBe(48);
      expect(handler).toHaveBeenCalled();
    });

    test('应该并行执行分片', async () => {
      const executionOrder = [];
      const handler = jest.fn().mockImplementation(async (data) => {
        executionOrder.push(data.length);
        return data;
      });

      const input = Array.from({ length: 30 }, (_, i) => i);

      const taskId = engine.submitTask({
        name: 'Parallel Sharded Task',
        handler,
        input,
        shardable: true,
        mode: ExecutionMode.LOCAL
      });

      await engine.executeTask(taskId);

      // 应该有3个分片（30 / 10）
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('任务重试', () => {
    beforeEach(() => {
      engine.registerExecutor('local-1', {
        name: 'Local Executor',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });
    });

    test('应该在失败时重试', async () => {
      const handler = jest.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce('success');

      const taskId = engine.submitTask({
        name: 'Retry Task',
        handler,
        mode: ExecutionMode.LOCAL
      });

      const result = await engine.executeTask(taskId);

      expect(result).toBe('success');
      expect(handler).toHaveBeenCalledTimes(3);

      const task = engine.tasks.get(taskId);
      expect(task.retries).toBe(2);
    });

    test('应该在达到最大重试次数后失败', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Always fails'));

      const taskId = engine.submitTask({
        name: 'Max Retry Task',
        handler,
        mode: ExecutionMode.LOCAL
      });

      await expect(engine.executeTask(taskId)).rejects.toThrow('Always fails');

      const task = engine.tasks.get(taskId);
      expect(task.status).toBe(TaskStatus.FAILED);
      expect(task.retries).toBe(3);
    });
  });

  describe('任务取消', () => {
    test('应该取消任务', () => {
      const taskId = engine.submitTask({
        name: 'Cancel Task',
        handler: jest.fn()
      });

      engine.cancelTask(taskId);

      const task = engine.tasks.get(taskId);
      expect(task.status).toBe(TaskStatus.CANCELLED);
    });

    test('应该触发取消事件', (done) => {
      engine.once('task_cancelled', (event) => {
        expect(event.taskId).toBeDefined();
        done();
      });

      const taskId = engine.submitTask({
        name: 'Cancel Event Task',
        handler: jest.fn()
      });

      engine.cancelTask(taskId);
    });
  });

  describe('执行器选择', () => {
    test('应该选择负载最小的执行器', async () => {
      engine.registerExecutor('executor-1', {
        name: 'Executor 1',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });

      engine.registerExecutor('executor-2', {
        name: 'Executor 2',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });

      // 模拟 executor-1 有负载
      engine.executors.get('executor-1').currentLoad = 5;
      engine.executors.get('executor-2').currentLoad = 2;

      const handler = jest.fn().mockResolvedValue('result');

      const taskId = engine.submitTask({
        name: 'Load Balance Task',
        handler,
        mode: ExecutionMode.LOCAL
      });

      await engine.executeTask(taskId);

      // executor-2 应该被选中（负载更低）
      expect(handler).toHaveBeenCalled();
    });

    test('应该根据能力要求选择执行器', async () => {
      engine.registerExecutor('executor-1', {
        name: 'Executor 1',
        type: ExecutionMode.LOCAL,
        capabilities: ['cpu-intensive'],
        capacity: 10
      });

      engine.registerExecutor('executor-2', {
        name: 'Executor 2',
        type: ExecutionMode.LOCAL,
        capabilities: ['memory-intensive'],
        capacity: 10
      });

      const handler = jest.fn().mockResolvedValue('result');

      const taskId = engine.submitTask({
        name: 'Capability Task',
        handler,
        requirements: ['cpu-intensive'],
        mode: ExecutionMode.LOCAL
      });

      await engine.executeTask(taskId);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('状态查询', () => {
    test('应该获取任务状态', () => {
      const taskId = engine.submitTask({
        name: 'Status Task',
        handler: jest.fn()
      });

      const status = engine.getTaskStatus(taskId);

      expect(status).toBeDefined();
      expect(status.id).toBe(taskId);
      expect(status.status).toBe(TaskStatus.PENDING);
    });

    test('应该返回null对于不存在的任务', () => {
      const status = engine.getTaskStatus('non-existent');
      expect(status).toBeNull();
    });

    test('应该获取执行器状态', () => {
      engine.registerExecutor('executor-1', {
        name: 'Executor 1',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });

      const status = engine.getExecutorStatus('executor-1');

      expect(status).toBeDefined();
      expect(status.id).toBe('executor-1');
      expect(status.currentLoad).toBe(0);
    });
  });

  describe('列表查询', () => {
    test('应该获取所有任务', () => {
      engine.submitTask({ name: 'Task 1', handler: jest.fn() });
      engine.submitTask({ name: 'Task 2', handler: jest.fn() });

      const tasks = engine.getAllTasks();

      expect(tasks).toHaveLength(2);
    });

    test('应该获取所有执行器', () => {
      engine.registerExecutor('executor-1', {
        name: 'Executor 1',
        type: ExecutionMode.LOCAL
      });

      engine.registerExecutor('executor-2', {
        name: 'Executor 2',
        type: ExecutionMode.REMOTE
      });

      const executors = engine.getAllExecutors();

      expect(executors).toHaveLength(2);
    });
  });

  describe('统计信息', () => {
    test('应该生成统计信息', async () => {
      engine.registerExecutor('executor-1', {
        name: 'Executor 1',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });

      const handler = jest.fn().mockResolvedValue('result');

      const taskId = engine.submitTask({
        name: 'Stats Task',
        handler,
        mode: ExecutionMode.LOCAL
      });

      await engine.executeTask(taskId);

      const stats = engine.getStatistics();

      expect(stats.tasks.total).toBe(1);
      expect(stats.tasks.completed).toBe(1);
      expect(stats.executors.total).toBe(1);
    });
  });

  describe('错误处理', () => {
    test('应该在没有执行器时抛出错误', async () => {
      const taskId = engine.submitTask({
        name: 'No Executor Task',
        handler: jest.fn(),
        mode: ExecutionMode.LOCAL
      });

      await expect(engine.executeTask(taskId))
        .rejects.toThrow('没有可用的本地执行器');
    });

    test('应该处理任务执行错误', async () => {
      engine.registerExecutor('executor-1', {
        name: 'Executor 1',
        type: ExecutionMode.LOCAL,
        capacity: 10
      });

      const handler = jest.fn().mockRejectedValue(new Error('Task error'));

      const taskId = engine.submitTask({
        name: 'Error Task',
        handler,
        mode: ExecutionMode.LOCAL
      });

      await expect(engine.executeTask(taskId)).rejects.toThrow('Task error');

      const task = engine.tasks.get(taskId);
      expect(task.status).toBe(TaskStatus.FAILED);
    });
  });

  describe('销毁', () => {
    test('应该正确销毁', () => {
      engine.submitTask({ name: 'Task 1', handler: jest.fn() });
      engine.registerExecutor('executor-1', {
        name: 'Executor 1',
        type: ExecutionMode.LOCAL
      });

      engine.destroy();

      expect(engine.tasks.size).toBe(0);
      expect(engine.executors.size).toBe(0);
    });
  });
});
