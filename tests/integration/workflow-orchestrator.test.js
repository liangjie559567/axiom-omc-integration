/**
 * WorkflowOrchestrator 集成测试
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { WorkflowOrchestrator } from '../../src/core/workflow-orchestrator.js';
import { tddWorkflowTemplate } from '../../src/templates/tdd-workflow.js';
import { EventEmitter } from 'events';

// Mock WorkflowIntegration
class MockWorkflowIntegration extends EventEmitter {
  constructor() {
    super();
    this.instances = new Map();
    this.instanceCounter = 0;
  }

  async startWorkflow(workflowId, context = {}) {
    const instanceId = `instance-${++this.instanceCounter}`;
    const instance = {
      instanceId,
      workflowId,
      currentPhase: 'initial',
      context,
      createdAt: Date.now()
    };

    this.instances.set(instanceId, instance);
    return instance;
  }

  async transitionToNext(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    instance.currentPhase = 'next-phase';
    this.emit('phaseTransitioned', {
      instanceId,
      from: 'initial',
      to: 'next-phase'
    });
    return true;
  }

  async transitionTo(instanceId, targetPhase, options = {}) {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    const oldPhase = instance.currentPhase;
    instance.currentPhase = targetPhase;
    instance.metadata = options.metadata;

    this.emit('phaseTransitioned', {
      instanceId,
      from: oldPhase,
      to: targetPhase
    });
    return true;
  }

  async completeWorkflow(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    instance.completed = true;
    return true;
  }

  getWorkflowInstance(instanceId) {
    return this.instances.get(instanceId) || null;
  }
}

describe('WorkflowOrchestrator', () => {
  let orchestrator;
  let workflowIntegration;

  beforeEach(() => {
    workflowIntegration = new MockWorkflowIntegration();
    orchestrator = new WorkflowOrchestrator(workflowIntegration);
  });

  describe('构造函数', () => {
    test('应该正确初始化', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator.workflowIntegration).toBe(workflowIntegration);
      expect(orchestrator.phaseMapper).toBeDefined();
      expect(orchestrator.autoSyncEngine).toBeDefined();
      expect(orchestrator.templateManager).toBeDefined();
    });

    test('应该默认启用自动同步', () => {
      expect(orchestrator.options.enableAutoSync).toBe(true);
      expect(orchestrator.autoSyncEngine.isRunning).toBe(true);
    });

    test('应该允许禁用自动同步', () => {
      const orch = new WorkflowOrchestrator(workflowIntegration, {
        enableAutoSync: false
      });

      expect(orch.options.enableAutoSync).toBe(false);
      expect(orch.autoSyncEngine.isRunning).toBe(false);
    });

    test('应该设置默认同步策略', () => {
      expect(orchestrator.options.defaultSyncStrategy).toBe('master-slave');
    });

    test('应该拒绝缺少 workflowIntegration', () => {
      expect(() => {
        new WorkflowOrchestrator(null);
      }).toThrow('workflowIntegration 是必需的');
    });
  });

  describe('工作流基础 API', () => {
    test('应该启动工作流', async () => {
      const instance = await orchestrator.startWorkflow('test-workflow', {
        title: 'Test'
      });

      expect(instance).toBeDefined();
      expect(instance.instanceId).toBeDefined();
      expect(instance.workflowId).toBe('test-workflow');
      expect(instance.context.title).toBe('Test');
    });

    test('应该转换到下一个阶段', async () => {
      const instance = await orchestrator.startWorkflow('test-workflow');
      const result = await orchestrator.transitionToNext(instance.instanceId);

      expect(result).toBe(true);

      const updated = orchestrator.getWorkflowInstance(instance.instanceId);
      expect(updated.currentPhase).toBe('next-phase');
    });

    test('应该转换到指定阶段', async () => {
      const instance = await orchestrator.startWorkflow('test-workflow');
      const result = await orchestrator.transitionTo(instance.instanceId, 'custom-phase');

      expect(result).toBe(true);

      const updated = orchestrator.getWorkflowInstance(instance.instanceId);
      expect(updated.currentPhase).toBe('custom-phase');
    });

    test('应该完成工作流', async () => {
      const instance = await orchestrator.startWorkflow('test-workflow');
      const result = await orchestrator.completeWorkflow(instance.instanceId);

      expect(result).toBe(true);

      const updated = orchestrator.getWorkflowInstance(instance.instanceId);
      expect(updated.completed).toBe(true);
    });

    test('应该获取工作流实例', async () => {
      const instance = await orchestrator.startWorkflow('test-workflow');
      const retrieved = orchestrator.getWorkflowInstance(instance.instanceId);

      expect(retrieved).toBeDefined();
      expect(retrieved.instanceId).toBe(instance.instanceId);
    });
  });

  describe('映射 API', () => {
    test('应该注册映射规则', () => {
      const ruleId = orchestrator.registerMappingRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      expect(ruleId).toBeDefined();
    });

    test('应该执行阶段映射', () => {
      orchestrator.registerMappingRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      const result = orchestrator.mapPhase('axiom:draft');

      expect(result).toEqual(['omc:planning']);
    });

    test('应该执行反向映射', () => {
      orchestrator.registerMappingRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      const result = orchestrator.reverseMapPhase('omc:planning');

      expect(result).toEqual(['axiom:draft']);
    });
  });

  describe('同步 API', () => {
    beforeEach(() => {
      // 注册映射规则
      orchestrator.registerMappingRule({
        from: 'initial',
        to: ['initial'],
        weight: 1.0
      });

      orchestrator.registerMappingRule({
        from: 'next-phase',
        to: ['next-phase'],
        weight: 1.0
      });
    });

    test('应该创建同步的工作流对', async () => {
      const result = await orchestrator.createSyncedWorkflowPair(
        'axiom-workflow',
        'omc-workflow'
      );

      expect(result).toBeDefined();
      expect(result.axiomInstanceId).toBeDefined();
      expect(result.omcInstanceId).toBeDefined();

      const axiomInstance = orchestrator.getWorkflowInstance(result.axiomInstanceId);
      const omcInstance = orchestrator.getWorkflowInstance(result.omcInstanceId);

      expect(axiomInstance.context.role).toBe('master');
      expect(omcInstance.context.role).toBe('slave');
    });

    test('应该手动同步工作流', async () => {
      const { axiomInstanceId, omcInstanceId } =
        await orchestrator.createSyncedWorkflowPair('axiom-workflow', 'omc-workflow');

      const success = await orchestrator.syncWorkflows(axiomInstanceId, omcInstanceId);

      expect(success).toBe(true);
    });

    test('应该获取同步历史', async () => {
      const { axiomInstanceId, omcInstanceId } =
        await orchestrator.createSyncedWorkflowPair('axiom-workflow', 'omc-workflow');

      await orchestrator.syncWorkflows(axiomInstanceId, omcInstanceId);

      const history = orchestrator.getSyncHistory();

      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('模板 API', () => {
    test('应该注册模板', () => {
      const templateId = orchestrator.registerTemplate(tddWorkflowTemplate);

      expect(templateId).toBe('tdd-workflow');
    });

    test('应该从模板创建工作流', async () => {
      orchestrator.registerTemplate(tddWorkflowTemplate);

      const instance = await orchestrator.createFromTemplate('tdd-workflow', {
        context: {
          feature: 'test-feature'
        }
      });

      expect(instance).toBeDefined();
      expect(instance.context.feature).toBe('test-feature');
      expect(instance.context.templateId).toBe('tdd-workflow');
    });

    test('应该启动 TDD 工作流（便捷方法）', async () => {
      orchestrator.registerTemplate(tddWorkflowTemplate);

      const instance = await orchestrator.startTDDWorkflow({
        feature: 'user-login'
      });

      expect(instance).toBeDefined();
      expect(instance.context.feature).toBe('user-login');
      expect(instance.context.methodology).toBe('TDD');
    });
  });

  describe('统计 API', () => {
    test('应该获取统计信息', () => {
      const stats = orchestrator.getStats();

      expect(stats).toHaveProperty('phaseMapper');
      expect(stats).toHaveProperty('autoSyncEngine');
      expect(stats).toHaveProperty('templateManager');
    });

    test('应该获取性能指标', () => {
      const metrics = orchestrator.getPerformanceMetrics();

      expect(metrics).toHaveProperty('totalMappings');
      expect(metrics).toHaveProperty('totalSyncs');
      expect(metrics).toHaveProperty('successfulSyncs');
      expect(metrics).toHaveProperty('failedSyncs');
      expect(metrics).toHaveProperty('syncSuccessRate');
      expect(metrics).toHaveProperty('totalTemplates');
      expect(metrics).toHaveProperty('totalCreatedFromTemplates');
    });

    test('应该计算同步成功率', async () => {
      orchestrator.registerMappingRule({
        from: 'initial',
        to: ['initial'],
        weight: 1.0
      });

      const { axiomInstanceId, omcInstanceId } =
        await orchestrator.createSyncedWorkflowPair('axiom-workflow', 'omc-workflow');

      await orchestrator.syncWorkflows(axiomInstanceId, omcInstanceId);

      const metrics = orchestrator.getPerformanceMetrics();

      expect(metrics.syncSuccessRate).toBeGreaterThan(0);
    });
  });

  describe('集成测试', () => {
    test('应该完整集成所有组件', async () => {
      // 1. 注册映射规则
      orchestrator.registerMappingRule({
        from: 'axiom:draft',
        to: ['omc:planning'],
        weight: 1.0
      });

      // 2. 注册模板
      orchestrator.registerTemplate(tddWorkflowTemplate);

      // 3. 创建同步的工作流对
      const { axiomInstanceId, omcInstanceId } =
        await orchestrator.createSyncedWorkflowPair('axiom-workflow', 'omc-workflow');

      // 4. 验证工作流已创建
      expect(axiomInstanceId).toBeDefined();
      expect(omcInstanceId).toBeDefined();

      // 5. 从模板创建工作流
      const tddInstance = await orchestrator.startTDDWorkflow({
        feature: 'integration-test'
      });

      expect(tddInstance).toBeDefined();

      // 6. 获取统计信息
      const stats = orchestrator.getStats();

      expect(stats.phaseMapper.totalRules).toBeGreaterThan(0);
      expect(stats.autoSyncEngine.totalLinks).toBeGreaterThan(0);
      expect(stats.templateManager.totalTemplates).toBeGreaterThan(0);
    });

    test('应该支持端到端工作流', async () => {
      // 注册映射规则
      orchestrator.registerMappingRule({
        from: 'initial',
        to: ['initial'],
        weight: 1.0
      });

      orchestrator.registerMappingRule({
        from: 'next-phase',
        to: ['next-phase'],
        weight: 1.0
      });

      // 创建同步的工作流对
      const { axiomInstanceId, omcInstanceId } =
        await orchestrator.createSyncedWorkflowPair('axiom-workflow', 'omc-workflow');

      // 转换 Axiom 阶段
      await orchestrator.transitionToNext(axiomInstanceId);

      // 等待自动同步
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证 OMC 已同步
      const omcInstance = orchestrator.getWorkflowInstance(omcInstanceId);
      expect(omcInstance.currentPhase).toBe('next-phase');
    });
  });

  describe('资源管理', () => {
    test('应该清理所有资源', () => {
      orchestrator.registerMappingRule({
        from: 'test',
        to: ['test']
      });

      orchestrator.registerTemplate(tddWorkflowTemplate);

      orchestrator.destroy();

      expect(orchestrator.autoSyncEngine.isRunning).toBe(false);
      expect(orchestrator.phaseMapper.getAllRules().length).toBe(0);
    });
  });
});
