/**
 * WorkflowIntegration 单元测试
 */

import {
  WorkflowIntegration,
  WorkflowType,
  AxiomPhase,
  OMCPhase,
  PhaseStatus,
  createWorkflowIntegration
} from '../../src/core/workflow-integration.js';

describe('WorkflowIntegration', () => {
  let integration;

  beforeEach(() => {
    integration = new WorkflowIntegration();
  });

  afterEach(() => {
    integration.destroy();
  });

  describe('构造函数', () => {
    test('应该创建工作流整合系统实例', () => {
      expect(integration).toBeDefined();
      expect(integration.workflows).toBeDefined();
      expect(integration.activeWorkflows).toBeDefined();
    });

    test('应该初始化默认工作流', () => {
      expect(integration.workflows.size).toBe(2);
      expect(integration.workflows.has('axiom-default')).toBe(true);
      expect(integration.workflows.has('omc-default')).toBe(true);
    });

    test('应该使用默认配置', () => {
      expect(integration.config.defaultWorkflowType).toBe(WorkflowType.OMC);
      expect(integration.config.enableAutoTransition).toBe(true);
      expect(integration.config.enableValidation).toBe(true);
    });
  });

  describe('registerWorkflow', () => {
    test('应该注册自定义工作流', () => {
      const id = integration.registerWorkflow({
        name: 'Custom Workflow',
        type: WorkflowType.CUSTOM,
        phases: ['phase1', 'phase2', 'phase3']
      });

      expect(id).toBeDefined();
      expect(integration.workflows.has(id)).toBe(true);
    });

    test('应该触发 workflowRegistered 事件', (done) => {
      integration.on('workflowRegistered', () => {
        done();
      });

      integration.registerWorkflow({
        name: 'Test Workflow',
        phases: ['phase1']
      });
    });
  });

  describe('startWorkflow', () => {
    test('应该启动 Axiom 工作流', () => {
      const instanceId = integration.startWorkflow('axiom-default');

      expect(instanceId).toBeDefined();
      expect(integration.activeWorkflows.has(instanceId)).toBe(true);

      const instance = integration.getWorkflowInstance(instanceId);
      expect(instance.currentPhase).toBe(AxiomPhase.DRAFT);
      expect(instance.phaseStatuses[AxiomPhase.DRAFT]).toBe(PhaseStatus.IN_PROGRESS);
    });

    test('应该启动 OMC 工作流', () => {
      const instanceId = integration.startWorkflow('omc-default');

      expect(instanceId).toBeDefined();

      const instance = integration.getWorkflowInstance(instanceId);
      expect(instance.currentPhase).toBe(OMCPhase.PLANNING);
      expect(instance.phaseStatuses[OMCPhase.PLANNING]).toBe(PhaseStatus.IN_PROGRESS);
    });

    test('应该在工作流不存在时抛出错误', () => {
      expect(() => {
        integration.startWorkflow('nonexistent');
      }).toThrow();
    });

    test('应该触发 workflowStarted 事件', (done) => {
      integration.on('workflowStarted', () => {
        done();
      });

      integration.startWorkflow('axiom-default');
    });
  });

  describe('transitionToNext', () => {
    test('应该转换到下一个阶段', async () => {
      const instanceId = integration.startWorkflow('axiom-default');

      const success = await integration.transitionToNext(instanceId);

      expect(success).toBe(true);

      const instance = integration.getWorkflowInstance(instanceId);
      expect(instance.currentPhase).toBe(AxiomPhase.REVIEW);
      expect(instance.phaseStatuses[AxiomPhase.DRAFT]).toBe(PhaseStatus.COMPLETED);
      expect(instance.phaseStatuses[AxiomPhase.REVIEW]).toBe(PhaseStatus.IN_PROGRESS);
    });

    test('应该在最后阶段完成工作流', async () => {
      const instanceId = integration.startWorkflow('axiom-default');

      await integration.transitionToNext(instanceId);
      await integration.transitionToNext(instanceId);
      const success = await integration.transitionToNext(instanceId);

      expect(success).toBe(true);
      expect(integration.activeWorkflows.has(instanceId)).toBe(false);
    });

    test('应该触发 phaseTransitioned 事件', async () => {
      const instanceId = integration.startWorkflow('axiom-default');

      const eventPromise = new Promise((resolve) => {
        integration.on('phaseTransitioned', (event) => {
          expect(event.from).toBe(AxiomPhase.DRAFT);
          expect(event.to).toBe(AxiomPhase.REVIEW);
          resolve();
        });
      });

      await integration.transitionToNext(instanceId);
      await eventPromise;
    });
  });

  describe('transitionTo', () => {
    test('应该转换到指定阶段', async () => {
      const instanceId = integration.startWorkflow('omc-default');

      const success = await integration.transitionTo(
        instanceId,
        OMCPhase.IMPLEMENTATION,
        { skipIntermediate: true }
      );

      expect(success).toBe(true);

      const instance = integration.getWorkflowInstance(instanceId);
      expect(instance.currentPhase).toBe(OMCPhase.IMPLEMENTATION);
    });

    test('应该跳过中间阶段', async () => {
      const instanceId = integration.startWorkflow('omc-default');

      await integration.transitionTo(
        instanceId,
        OMCPhase.TESTING,
        { skipIntermediate: true }
      );

      const instance = integration.getWorkflowInstance(instanceId);
      expect(instance.phaseStatuses[OMCPhase.DESIGN]).toBe(PhaseStatus.SKIPPED);
      expect(instance.phaseStatuses[OMCPhase.IMPLEMENTATION]).toBe(PhaseStatus.SKIPPED);
    });

    test('应该在阶段不存在时抛出错误', async () => {
      const instanceId = integration.startWorkflow('axiom-default');

      await expect(
        integration.transitionTo(instanceId, 'nonexistent')
      ).rejects.toThrow();
    });
  });

  describe('completeWorkflow', () => {
    test('应该完成工作流', () => {
      const instanceId = integration.startWorkflow('axiom-default');

      const success = integration.completeWorkflow(instanceId);

      expect(success).toBe(true);
      expect(integration.activeWorkflows.has(instanceId)).toBe(false);
      expect(integration.stats.completedWorkflows).toBe(1);
    });

    test('应该触发 workflowCompleted 事件', (done) => {
      const instanceId = integration.startWorkflow('axiom-default');

      integration.on('workflowCompleted', () => {
        done();
      });

      integration.completeWorkflow(instanceId);
    });
  });

  describe('cancelWorkflow', () => {
    test('应该取消工作流', () => {
      const instanceId = integration.startWorkflow('axiom-default');

      const success = integration.cancelWorkflow(instanceId);

      expect(success).toBe(true);
      expect(integration.activeWorkflows.has(instanceId)).toBe(false);
    });

    test('应该触发 workflowCancelled 事件', (done) => {
      const instanceId = integration.startWorkflow('axiom-default');

      integration.on('workflowCancelled', () => {
        done();
      });

      integration.cancelWorkflow(instanceId);
    });
  });

  describe('getWorkflowInstance', () => {
    test('应该获取工作流实例', () => {
      const instanceId = integration.startWorkflow('axiom-default');

      const instance = integration.getWorkflowInstance(instanceId);

      expect(instance).toBeDefined();
      expect(instance.id).toBe(instanceId);
    });

    test('应该在实例不存在时返回 null', () => {
      const instance = integration.getWorkflowInstance('nonexistent');

      expect(instance).toBeNull();
    });
  });

  describe('getActiveWorkflows', () => {
    test('应该获取所有活动工作流', () => {
      integration.startWorkflow('axiom-default');
      integration.startWorkflow('omc-default');

      const workflows = integration.getActiveWorkflows();

      expect(workflows.length).toBe(2);
    });

    test('应该按类型过滤', () => {
      integration.startWorkflow('axiom-default');
      integration.startWorkflow('omc-default');

      const workflows = integration.getActiveWorkflows({
        type: WorkflowType.AXIOM
      });

      expect(workflows.length).toBe(1);
      expect(workflows[0].workflowType).toBe(WorkflowType.AXIOM);
    });

    test('应该按当前阶段过滤', () => {
      const instanceId = integration.startWorkflow('axiom-default');
      integration.startWorkflow('omc-default');

      const workflows = integration.getActiveWorkflows({
        currentPhase: AxiomPhase.DRAFT
      });

      expect(workflows.length).toBe(1);
      expect(workflows[0].id).toBe(instanceId);
    });
  });

  describe('getTransitionHistory', () => {
    test('应该获取转换历史', async () => {
      const instanceId = integration.startWorkflow('axiom-default');

      await integration.transitionToNext(instanceId);

      const history = integration.getTransitionHistory();

      expect(history.length).toBeGreaterThan(0);
    });

    test('应该按实例过滤', async () => {
      const instanceId1 = integration.startWorkflow('axiom-default');
      const instanceId2 = integration.startWorkflow('omc-default');

      await integration.transitionToNext(instanceId1);
      await integration.transitionToNext(instanceId2);

      const history = integration.getTransitionHistory({
        instanceId: instanceId1
      });

      expect(history.length).toBe(1);
      expect(history[0].instanceId).toBe(instanceId1);
    });

    test('应该限制历史数量', async () => {
      const instanceId = integration.startWorkflow('omc-default');

      await integration.transitionToNext(instanceId);
      await integration.transitionToNext(instanceId);
      await integration.transitionToNext(instanceId);

      const history = integration.getTransitionHistory({ limit: 2 });

      expect(history.length).toBeLessThanOrEqual(2);
    });
  });

  describe('阶段映射', () => {
    test('应该映射 Axiom 阶段到 OMC 阶段', () => {
      expect(integration.mapAxiomToOMC(AxiomPhase.DRAFT)).toBe(OMCPhase.PLANNING);
      expect(integration.mapAxiomToOMC(AxiomPhase.REVIEW)).toBe(OMCPhase.DESIGN);
      expect(integration.mapAxiomToOMC(AxiomPhase.IMPLEMENT)).toBe(OMCPhase.IMPLEMENTATION);
    });

    test('应该映射 OMC 阶段到 Axiom 阶段', () => {
      expect(integration.mapOMCToAxiom(OMCPhase.PLANNING)).toBe(AxiomPhase.DRAFT);
      expect(integration.mapOMCToAxiom(OMCPhase.DESIGN)).toBe(AxiomPhase.REVIEW);
      expect(integration.mapOMCToAxiom(OMCPhase.IMPLEMENTATION)).toBe(AxiomPhase.IMPLEMENT);
      expect(integration.mapOMCToAxiom(OMCPhase.TESTING)).toBe(AxiomPhase.IMPLEMENT);
      expect(integration.mapOMCToAxiom(OMCPhase.DEPLOYMENT)).toBe(AxiomPhase.IMPLEMENT);
    });
  });

  describe('统计信息', () => {
    test('应该返回统计信息', async () => {
      const instanceId = integration.startWorkflow('axiom-default');
      await integration.transitionToNext(instanceId);

      const stats = integration.getStats();

      expect(stats.totalWorkflows).toBe(2); // 默认的 2 个工作流
      expect(stats.activeWorkflows).toBe(1);
      expect(stats.totalTransitions).toBeGreaterThan(0);
    });
  });

  describe('自定义验证', () => {
    test('应该支持自定义验证', async () => {
      const workflowId = integration.registerWorkflow({
        name: 'Validated Workflow',
        phases: ['phase1', 'phase2'],
        validation: async (instance, from, to) => {
          return to === 'phase2'; // 只允许转换到 phase2
        }
      });

      const instanceId = integration.startWorkflow(workflowId);

      const success = await integration.transitionToNext(instanceId);

      expect(success).toBe(true);
    });

    test('应该在验证失败时拒绝转换', async () => {
      const workflowId = integration.registerWorkflow({
        name: 'Validated Workflow',
        phases: ['phase1', 'phase2'],
        validation: async () => false // 总是拒绝
      });

      const instanceId = integration.startWorkflow(workflowId);

      const success = await integration.transitionToNext(instanceId);

      expect(success).toBe(false);
    });
  });

  describe('转换规则', () => {
    test('应该遵守转换规则', async () => {
      const instanceId = integration.startWorkflow('axiom-default');

      // Draft -> Review 是允许的
      const success1 = await integration.transitionToNext(instanceId);
      expect(success1).toBe(true);

      // Review -> Implement 是允许的
      const success2 = await integration.transitionToNext(instanceId);
      expect(success2).toBe(true);
    });
  });

  describe('createWorkflowIntegration', () => {
    test('应该创建工作流整合系统实例', () => {
      const system = createWorkflowIntegration();
      expect(system).toBeInstanceOf(WorkflowIntegration);
      system.destroy();
    });
  });

  describe('destroy', () => {
    test('应该清理资源', () => {
      integration.startWorkflow('axiom-default');
      integration.destroy();

      expect(integration.workflows.size).toBe(0);
      expect(integration.activeWorkflows.size).toBe(0);
    });
  });
});
