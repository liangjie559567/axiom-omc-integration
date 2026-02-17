/**
 * AutoSyncEngine 单元测试
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AutoSyncEngine } from '../../src/core/auto-sync-engine.js';
import { PhaseMapper } from '../../src/core/phase-mapper.js';
import { EventEmitter } from 'events';

// Mock WorkflowIntegration
class MockWorkflowIntegration extends EventEmitter {
  constructor() {
    super();
    this.instances = new Map();
  }

  getWorkflowInstance(instanceId) {
    return this.instances.get(instanceId) || null;
  }

  async transitionTo(instanceId, targetPhase, options = {}) {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    instance.currentPhase = targetPhase;
    instance.metadata = options.metadata;
    return true;
  }

  // 辅助方法：添加模拟实例
  addMockInstance(instanceId, workflowId, currentPhase, context = {}) {
    this.instances.set(instanceId, {
      instanceId,
      workflowId,
      currentPhase,
      context
    });
  }

  // 辅助方法：触发阶段转换事件
  emitPhaseChange(instanceId, from, to) {
    this.emit('phaseTransitioned', { instanceId, from, to });
  }
}

describe('AutoSyncEngine', () => {
  let engine;
  let workflowIntegration;
  let phaseMapper;

  beforeEach(() => {
    workflowIntegration = new MockWorkflowIntegration();
    phaseMapper = new PhaseMapper();
    engine = new AutoSyncEngine(workflowIntegration, phaseMapper);
  });

  describe('构造函数', () => {
    test('应该正确初始化', () => {
      expect(engine).toBeDefined();
      expect(engine.workflowIntegration).toBe(workflowIntegration);
      expect(engine.phaseMapper).toBe(phaseMapper);
      expect(engine.syncStrategy).toBe('master-slave');
      expect(engine.isRunning).toBe(false);
    });

    test('应该初始化统计信息', () => {
      const stats = engine.getStats();
      expect(stats.totalSyncs).toBe(0);
      expect(stats.successfulSyncs).toBe(0);
      expect(stats.failedSyncs).toBe(0);
      expect(stats.cyclesDetected).toBe(0);
    });

    test('应该拒绝缺少 workflowIntegration', () => {
      expect(() => {
        new AutoSyncEngine(null, phaseMapper);
      }).toThrow('workflowIntegration 是必需的');
    });

    test('应该拒绝缺少 phaseMapper', () => {
      expect(() => {
        new AutoSyncEngine(workflowIntegration, null);
      }).toThrow('phaseMapper 是必需的');
    });
  });

  describe('start/stop', () => {
    test('应该成功启动', () => {
      engine.start();
      expect(engine.isRunning).toBe(true);
    });

    test('应该成功停止', () => {
      engine.start();
      engine.stop();
      expect(engine.isRunning).toBe(false);
    });

    test('重复启动应该发出警告', () => {
      engine.start();
      engine.start(); // 第二次启动
      expect(engine.isRunning).toBe(true);
    });

    test('未启动时停止应该发出警告', () => {
      engine.stop(); // 未启动就停止
      expect(engine.isRunning).toBe(false);
    });
  });

  describe('linkWorkflows', () => {
    test('应该成功建立工作流同步关系', async () => {
      // 添加模拟实例
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.linkWorkflows('axiom-1', 'omc-1');

      const linkedWorkflows = engine.getLinkedWorkflows('axiom-1');
      expect(linkedWorkflows).toContain('omc-1');
    });

    test('应该拒绝缺少 sourceId', async () => {
      await expect(engine.linkWorkflows(null, 'omc-1')).rejects.toThrow(
        'sourceId 和 targetId 是必需的'
      );
    });

    test('应该拒绝缺少 targetId', async () => {
      await expect(engine.linkWorkflows('axiom-1', null)).rejects.toThrow(
        'sourceId 和 targetId 是必需的'
      );
    });

    test('应该拒绝将工作流链接到自身', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');

      await expect(engine.linkWorkflows('axiom-1', 'axiom-1')).rejects.toThrow(
        '不能将工作流链接到自身'
      );
    });

    test('应该拒绝不存在的源工作流', async () => {
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await expect(engine.linkWorkflows('non-existent', 'omc-1')).rejects.toThrow(
        '源工作流实例不存在'
      );
    });

    test('应该拒绝不存在的目标工作流', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');

      await expect(engine.linkWorkflows('axiom-1', 'non-existent')).rejects.toThrow(
        '目标工作流实例不存在'
      );
    });

    test('应该拒绝非 master-slave 策略（MVP 限制）', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await expect(
        engine.linkWorkflows('axiom-1', 'omc-1', { strategy: 'bidirectional' })
      ).rejects.toThrow('MVP 版本只支持 master-slave 同步策略');
    });

    test('应该避免重复链接', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.linkWorkflows('axiom-1', 'omc-1');
      await engine.linkWorkflows('axiom-1', 'omc-1'); // 重复链接

      const linkedWorkflows = engine.getLinkedWorkflows('axiom-1');
      expect(linkedWorkflows.length).toBe(1);
    });

    test('应该触发 linkCreated 事件', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      const linkCreatedHandler = jest.fn();
      engine.on('linkCreated', linkCreatedHandler);

      await engine.linkWorkflows('axiom-1', 'omc-1');

      expect(linkCreatedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: 'axiom-1',
          targetId: 'omc-1',
          strategy: 'master-slave'
        })
      );
    });
  });

  describe('sync', () => {
    beforeEach(() => {
      // 注册映射规则
      phaseMapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      phaseMapper.registerRule({
        from: 'axiom:review',
        to: ['omc:design'],
        weight: 1.0
      });
    });

    test('应该正确同步阶段变化', async () => {
      // 添加模拟实例
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      const success = await engine.sync('axiom-1', 'omc-1');

      expect(success).toBe(true);
      expect(engine.getStats().successfulSyncs).toBe(1);
    });

    test('应该记录同步历史', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.sync('axiom-1', 'omc-1');

      const history = engine.getSyncHistory();
      expect(history.length).toBe(1);
      expect(history[0].success).toBe(true);
      expect(history[0].sourceInstanceId).toBe('axiom-1');
      expect(history[0].targetInstanceId).toBe('omc-1');
    });

    test('应该触发 syncCompleted 事件', async () => {
      // 使用不同的初始阶段，确保会触发转换
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:design'); // 不同的初始阶段

      const syncCompletedHandler = jest.fn();
      engine.on('syncCompleted', syncCompletedHandler);

      await engine.sync('axiom-1', 'omc-1');

      expect(syncCompletedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceInstanceId: 'axiom-1',
          targetInstanceId: 'omc-1'
        })
      );
    });

    test('应该处理不存在的源工作流', async () => {
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      const success = await engine.sync('non-existent', 'omc-1');

      expect(success).toBe(false);
      expect(engine.getStats().failedSyncs).toBe(1);
    });

    test('应该处理不存在的目标工作流', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');

      const success = await engine.sync('axiom-1', 'non-existent');

      expect(success).toBe(false);
      expect(engine.getStats().failedSyncs).toBe(1);
    });

    test('应该处理无法映射的阶段', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'unknown:phase');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      const success = await engine.sync('axiom-1', 'omc-1');

      expect(success).toBe(false);
      expect(engine.getStats().failedSyncs).toBe(1);
    });

    test('应该跳过已经是目标阶段的同步', async () => {
      // axiom:draft 映射到 omc:planning
      // 如果目标已经是 omc:planning，应该跳过转换
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      const success = await engine.sync('axiom-1', 'omc-1');

      expect(success).toBe(true);
      // 虽然目标已经是 omc:planning，但同步仍然成功（只是跳过了转换）
      expect(engine.getStats().successfulSyncs).toBe(1);
    });

    test('应该触发 syncFailed 事件', async () => {
      const syncFailedHandler = jest.fn();
      engine.on('syncFailed', syncFailedHandler);

      await engine.sync('non-existent', 'omc-1');

      expect(syncFailedHandler).toHaveBeenCalled();
    });
  });

  describe('循环检测', () => {
    beforeEach(() => {
      phaseMapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });
    });

    test('应该检测到循环同步', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      // 模拟正在同步
      engine.syncInProgress.add('axiom-1');

      const success = await engine.sync('axiom-1', 'omc-1');

      expect(success).toBe(false);
      expect(engine.getStats().cyclesDetected).toBe(1);
    });

    test('应该在同步完成后清除标记', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.sync('axiom-1', 'omc-1');

      expect(engine.syncInProgress.has('axiom-1')).toBe(false);
      expect(engine.syncInProgress.has('omc-1')).toBe(false);
    });
  });

  describe('自动同步', () => {
    beforeEach(() => {
      phaseMapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      phaseMapper.registerRule({
        from: 'axiom:review',
        to: ['omc:design'],
        weight: 1.0
      });
    });

    test('应该在阶段变化时自动同步', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.linkWorkflows('axiom-1', 'omc-1');
      engine.start();

      // 触发阶段变化
      workflowIntegration.emitPhaseChange('axiom-1', 'axiom:draft', 'axiom:review');

      // 等待异步同步完成
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = engine.getStats();
      expect(stats.successfulSyncs).toBeGreaterThan(0);
    });

    test('停止后不应该自动同步', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.linkWorkflows('axiom-1', 'omc-1');
      engine.start();
      engine.stop();

      const statsBefore = engine.getStats();

      // 触发阶段变化
      workflowIntegration.emitPhaseChange('axiom-1', 'axiom:draft', 'axiom:review');

      await new Promise(resolve => setTimeout(resolve, 100));

      const statsAfter = engine.getStats();
      expect(statsAfter.successfulSyncs).toBe(statsBefore.successfulSyncs);
    });
  });

  describe('getLinkedWorkflows', () => {
    test('应该返回关联的工作流列表', async () => {
      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');
      workflowIntegration.addMockInstance('omc-2', 'omc-default', 'omc:design');

      await engine.linkWorkflows('axiom-1', 'omc-1');
      await engine.linkWorkflows('axiom-1', 'omc-2');

      const linkedWorkflows = engine.getLinkedWorkflows('axiom-1');

      expect(linkedWorkflows).toContain('omc-1');
      expect(linkedWorkflows).toContain('omc-2');
      expect(linkedWorkflows.length).toBe(2);
    });

    test('应该返回空数组当没有关联工作流', () => {
      const linkedWorkflows = engine.getLinkedWorkflows('non-existent');
      expect(linkedWorkflows).toEqual([]);
    });
  });

  describe('getSyncHistory', () => {
    test('应该返回所有同步历史', async () => {
      phaseMapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.sync('axiom-1', 'omc-1');

      const history = engine.getSyncHistory();
      expect(history.length).toBe(1);
    });

    test('应该按实例 ID 过滤', async () => {
      phaseMapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.sync('axiom-1', 'omc-1');

      const history = engine.getSyncHistory({ instanceId: 'axiom-1' });
      expect(history.length).toBe(1);
      expect(history[0].sourceInstanceId).toBe('axiom-1');
    });

    test('应该按成功状态过滤', async () => {
      phaseMapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.sync('axiom-1', 'omc-1');

      const history = engine.getSyncHistory({ success: true });
      expect(history.length).toBe(1);
      expect(history[0].success).toBe(true);
    });

    test('应该限制返回数量', async () => {
      phaseMapper.registerRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      workflowIntegration.addMockInstance('axiom-1', 'axiom-default', 'axiom:draft');
      workflowIntegration.addMockInstance('omc-1', 'omc-default', 'omc:planning');

      await engine.sync('axiom-1', 'omc-1');

      const history = engine.getSyncHistory({ limit: 1 });
      expect(history.length).toBe(1);
    });
  });

  describe('getStats', () => {
    test('应该返回统计信息', () => {
      const stats = engine.getStats();

      expect(stats).toHaveProperty('totalSyncs');
      expect(stats).toHaveProperty('successfulSyncs');
      expect(stats).toHaveProperty('failedSyncs');
      expect(stats).toHaveProperty('cyclesDetected');
      expect(stats).toHaveProperty('totalLinks');
      expect(stats).toHaveProperty('isRunning');
    });
  });

  describe('destroy', () => {
    test('应该清理所有资源', () => {
      engine.start();
      engine.destroy();

      expect(engine.isRunning).toBe(false);
      expect(engine.syncLinks.size).toBe(0);
      expect(engine.syncHistory.length).toBe(0);
      expect(engine.syncInProgress.size).toBe(0);
    });
  });
});
