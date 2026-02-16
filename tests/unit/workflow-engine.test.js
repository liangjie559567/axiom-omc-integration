/**
 * WorkflowEngine 单元测试
 */

import { WorkflowEngine, WorkflowStatus, TaskStatus } from '../../src/agents/workflow-engine.js';
import { createAgentRegistry } from '../../src/agents/agent-registry.js';
import { createAgentExecutor } from '../../src/agents/agent-executor.js';
import { exploreAgent } from '../../src/agents/definitions/explore.js';
import { analystAgent } from '../../src/agents/definitions/analyst.js';
import { plannerAgent } from '../../src/agents/definitions/planner.js';

describe('WorkflowEngine', () => {
  let registry;
  let executor;
  let engine;

  beforeEach(() => {
    registry = createAgentRegistry();
    registry.register(exploreAgent);
    registry.register(analystAgent);
    registry.register(plannerAgent);

    executor = createAgentExecutor({ registry });
    engine = new WorkflowEngine({ executor, registry });
  });

  describe('createWorkflow', () => {
    test('应该创建工作流', () => {
      const workflowId = engine.createWorkflow({
        name: 'Test Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: exploreAgent.id,
            input: { target: 'test' }
          }
        ]
      });

      expect(workflowId).toBeDefined();
      const workflow = engine.getWorkflow(workflowId);
      expect(workflow).toBeDefined();
      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.status).toBe(WorkflowStatus.PENDING);
    });

    test('应该在没有任务时抛出错误', () => {
      expect(() => {
        engine.createWorkflow({
          name: 'Empty Workflow',
          tasks: []
        });
      }).toThrow('工作流必须包含至少一个任务');
    });

    test('应该在 Agent 不存在时抛出错误', () => {
      expect(() => {
        engine.createWorkflow({
          name: 'Invalid Workflow',
          tasks: [
            {
              id: 'task1',
              agentId: 'non-existent',
              input: {}
            }
          ]
        });
      }).toThrow('Agent 不存在');
    });

    test('应该检测循环依赖', () => {
      expect(() => {
        engine.createWorkflow({
          name: 'Circular Workflow',
          tasks: [
            {
              id: 'task1',
              agentId: exploreAgent.id,
              input: {},
              dependencies: ['task2']
            },
            {
              id: 'task2',
              agentId: analystAgent.id,
              input: {},
              dependencies: ['task1']
            }
          ]
        });
      }).toThrow('工作流存在循环依赖');
    });
  });

  describe('executeWorkflow', () => {
    test('应该执行简单工作流', async () => {
      const workflowId = engine.createWorkflow({
        name: 'Simple Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: exploreAgent.id,
            input: { target: 'test' }
          }
        ]
      });

      const result = await engine.executeWorkflow(workflowId);

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();

      const workflow = engine.getWorkflow(workflowId);
      expect(workflow.status).toBe(WorkflowStatus.COMPLETED);
    });

    test('应该执行带依赖的工作流', async () => {
      const workflowId = engine.createWorkflow({
        name: 'Dependent Workflow',
        tasks: [
          {
            id: 'explore',
            agentId: exploreAgent.id,
            input: { target: 'test' }
          },
          {
            id: 'analyze',
            agentId: analystAgent.id,
            input: { requirement: 'test' },
            dependencies: ['explore']
          }
        ]
      });

      const result = await engine.executeWorkflow(workflowId);

      expect(result.success).toBe(true);

      const workflow = engine.getWorkflow(workflowId);
      expect(workflow.tasks[0].status).toBe(TaskStatus.COMPLETED);
      expect(workflow.tasks[1].status).toBe(TaskStatus.COMPLETED);
    });

    test('应该并行执行独立任务', async () => {
      const workflowId = engine.createWorkflow({
        name: 'Parallel Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: exploreAgent.id,
            input: { target: 'test1' }
          },
          {
            id: 'task2',
            agentId: exploreAgent.id,
            input: { target: 'test2' }
          }
        ]
      });

      const startTime = Date.now();
      await engine.executeWorkflow(workflowId);
      const duration = Date.now() - startTime;

      // 并行执行应该比串行快
      expect(duration).toBeLessThan(3000);
    });

    test('应该在工作流正在运行时抛出错误', async () => {
      const workflowId = engine.createWorkflow({
        name: 'Running Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: exploreAgent.id,
            input: { target: 'test' }
          }
        ]
      });

      const promise = engine.executeWorkflow(workflowId);

      await expect(
        engine.executeWorkflow(workflowId)
      ).rejects.toThrow('工作流正在运行');

      await promise;
    });
  });

  describe('cancelWorkflow', () => {
    test('应该取消正在运行的工作流', async () => {
      const workflowId = engine.createWorkflow({
        name: 'Cancellable Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: exploreAgent.id,
            input: { target: 'test' }
          }
        ]
      });

      const promise = engine.executeWorkflow(workflowId);

      // 立即取消
      const cancelled = engine.cancelWorkflow(workflowId);

      await promise.catch(() => {});

      expect(cancelled).toBe(true);
    });

    test('应该在工作流不存在时返回 false', () => {
      const cancelled = engine.cancelWorkflow('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('getWorkflow', () => {
    test('应该获取工作流', () => {
      const workflowId = engine.createWorkflow({
        name: 'Test Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: exploreAgent.id,
            input: { target: 'test' }
          }
        ]
      });

      const workflow = engine.getWorkflow(workflowId);
      expect(workflow).toBeDefined();
      expect(workflow.id).toBe(workflowId);
    });

    test('应该在工作流不存在时返回 null', () => {
      const workflow = engine.getWorkflow('non-existent');
      expect(workflow).toBeNull();
    });
  });

  describe('getWorkflows', () => {
    test('应该获取所有工作流', () => {
      engine.createWorkflow({
        name: 'Workflow 1',
        tasks: [{ id: 'task1', agentId: exploreAgent.id, input: {} }]
      });

      engine.createWorkflow({
        name: 'Workflow 2',
        tasks: [{ id: 'task1', agentId: analystAgent.id, input: {} }]
      });

      const workflows = engine.getWorkflows();
      expect(workflows.length).toBeGreaterThanOrEqual(2);
    });

    test('应该按状态过滤工作流', async () => {
      const workflowId = engine.createWorkflow({
        name: 'Completed Workflow',
        tasks: [{ id: 'task1', agentId: exploreAgent.id, input: { target: 'test' } }]
      });

      await engine.executeWorkflow(workflowId);

      const completed = engine.getWorkflows({ status: WorkflowStatus.COMPLETED });
      expect(completed.length).toBeGreaterThan(0);
      expect(completed[0].status).toBe(WorkflowStatus.COMPLETED);
    });
  });

  describe('复杂工作流', () => {
    test('应该执行多层依赖的工作流', async () => {
      const workflowId = engine.createWorkflow({
        name: 'Complex Workflow',
        tasks: [
          {
            id: 'explore',
            agentId: exploreAgent.id,
            input: { target: 'test' }
          },
          {
            id: 'analyze',
            agentId: analystAgent.id,
            input: { requirement: 'test' },
            dependencies: ['explore']
          },
          {
            id: 'plan',
            agentId: plannerAgent.id,
            input: { requirement: 'test', acceptanceCriteria: [] },
            dependencies: ['analyze']
          }
        ]
      });

      const result = await engine.executeWorkflow(workflowId);

      expect(result.success).toBe(true);

      const workflow = engine.getWorkflow(workflowId);
      workflow.tasks.forEach(task => {
        expect(task.status).toBe(TaskStatus.COMPLETED);
      });
    });
  });
});
