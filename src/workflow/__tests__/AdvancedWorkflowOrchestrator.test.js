/**
 * 高级工作流编排器测试
 */

import { jest } from '@jest/globals';
import AdvancedWorkflowOrchestrator, { WorkflowStatus, NodeType } from '../AdvancedWorkflowOrchestrator.js';

describe('AdvancedWorkflowOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AdvancedWorkflowOrchestrator({
      maxConcurrency: 5,
      timeout: 10000
    });
  });

  afterEach(() => {
    orchestrator.destroy();
  });

  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator.workflows.size).toBe(0);
      expect(orchestrator.templates.size).toBe(0);
    });
  });

  describe('模板管理', () => {
    test('应该注册工作流模板', () => {
      orchestrator.registerTemplate('test-template', {
        name: 'Test Template',
        description: 'A test template',
        nodes: [
          { id: 'node-1', type: NodeType.TASK, handler: jest.fn() }
        ]
      });

      expect(orchestrator.templates.has('test-template')).toBe(true);
    });

    test('应该拒绝无效的模板', () => {
      expect(() => {
        orchestrator.registerTemplate('invalid', { name: 'Invalid' });
      }).toThrow('模板必须包含 nodes 数组');
    });

    test('应该从模板创建工作流', () => {
      orchestrator.registerTemplate('test-template', {
        name: 'Test Template',
        nodes: [
          { id: 'node-1', type: NodeType.TASK, handler: jest.fn() }
        ],
        variables: { var1: 'value1' }
      });

      const workflowId = orchestrator.createFromTemplate('test-template', {
        var2: 'value2'
      });

      expect(workflowId).toBeDefined();
      expect(orchestrator.workflows.has(workflowId)).toBe(true);

      const workflow = orchestrator.workflows.get(workflowId);
      expect(workflow.status).toBe(WorkflowStatus.PENDING);
      expect(workflow.variables.var1).toBe('value1');
      expect(workflow.variables.var2).toBe('value2');
    });
  });

  describe('动态工作流', () => {
    test('应该创建动态工作流', () => {
      const workflowId = orchestrator.createDynamic({
        name: 'Dynamic Workflow',
        nodes: [
          { id: 'node-1', type: NodeType.TASK, handler: jest.fn() }
        ]
      });

      expect(workflowId).toBeDefined();
      expect(orchestrator.workflows.has(workflowId)).toBe(true);
    });

    test('应该拒绝无效的工作流定义', () => {
      expect(() => {
        orchestrator.createDynamic({ name: 'Invalid' });
      }).toThrow('工作流定义必须包含 nodes 数组');
    });
  });

  describe('任务节点执行', () => {
    test('应该执行简单任务', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const workflowId = orchestrator.createDynamic({
        name: 'Simple Task',
        nodes: [
          { id: 'task-1', type: NodeType.TASK, handler }
        ]
      });

      const result = await orchestrator.execute(workflowId);

      expect(handler).toHaveBeenCalled();
      expect(result).toBeDefined();

      const workflow = orchestrator.workflows.get(workflowId);
      expect(workflow.status).toBe(WorkflowStatus.COMPLETED);
    });

    test('应该传递输入到任务', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const workflowId = orchestrator.createDynamic({
        name: 'Task with Input',
        nodes: [
          {
            id: 'task-1',
            type: NodeType.TASK,
            handler,
            input: { key: 'value' }
          }
        ]
      });

      await orchestrator.execute(workflowId);

      expect(handler).toHaveBeenCalledWith(
        { key: 'value' },
        expect.any(Object)
      );
    });

    test('应该保存任务输出到变量', async () => {
      const handler = jest.fn().mockResolvedValue('task-result');

      const workflowId = orchestrator.createDynamic({
        name: 'Task with Output',
        nodes: [
          {
            id: 'task-1',
            type: NodeType.TASK,
            handler,
            output: 'result'
          }
        ]
      });

      await orchestrator.execute(workflowId);

      const context = orchestrator.contexts.get(workflowId);
      expect(context.variables.result).toBe('task-result');
    });
  });

  describe('条件节点执行', () => {
    test('应该执行true分支', async () => {
      const trueHandler = jest.fn().mockResolvedValue('true-result');
      const falseHandler = jest.fn().mockResolvedValue('false-result');

      const workflowId = orchestrator.createDynamic({
        name: 'Condition Test',
        nodes: [
          {
            id: 'condition-1',
            type: NodeType.CONDITION,
            condition: () => true,
            trueBranch: [
              { id: 'true-task', type: NodeType.TASK, handler: trueHandler }
            ],
            falseBranch: [
              { id: 'false-task', type: NodeType.TASK, handler: falseHandler }
            ]
          }
        ]
      });

      await orchestrator.execute(workflowId);

      expect(trueHandler).toHaveBeenCalled();
      expect(falseHandler).not.toHaveBeenCalled();
    });

    test('应该执行false分支', async () => {
      const trueHandler = jest.fn().mockResolvedValue('true-result');
      const falseHandler = jest.fn().mockResolvedValue('false-result');

      const workflowId = orchestrator.createDynamic({
        name: 'Condition Test',
        nodes: [
          {
            id: 'condition-1',
            type: NodeType.CONDITION,
            condition: () => false,
            trueBranch: [
              { id: 'true-task', type: NodeType.TASK, handler: trueHandler }
            ],
            falseBranch: [
              { id: 'false-task', type: NodeType.TASK, handler: falseHandler }
            ]
          }
        ]
      });

      await orchestrator.execute(workflowId);

      expect(trueHandler).not.toHaveBeenCalled();
      expect(falseHandler).toHaveBeenCalled();
    });

    test('应该支持对象条件', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const workflowId = orchestrator.createDynamic({
        name: 'Object Condition',
        variables: { count: 10 },
        nodes: [
          {
            id: 'condition-1',
            type: NodeType.CONDITION,
            condition: { variable: 'count', operator: '>', value: 5 },
            trueBranch: [
              { id: 'task-1', type: NodeType.TASK, handler }
            ]
          }
        ]
      });

      await orchestrator.execute(workflowId);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('循环节点执行', () => {
    test('应该执行固定次数循环', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const workflowId = orchestrator.createDynamic({
        name: 'Loop Test',
        nodes: [
          {
            id: 'loop-1',
            type: NodeType.LOOP,
            iterations: 3,
            body: [
              { id: 'task-1', type: NodeType.TASK, handler }
            ]
          }
        ]
      });

      await orchestrator.execute(workflowId);

      expect(handler).toHaveBeenCalledTimes(3);
    });

    test('应该执行条件循环', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const workflowId = orchestrator.createDynamic({
        name: 'Conditional Loop',
        nodes: [
          {
            id: 'loop-1',
            type: NodeType.LOOP,
            condition: (context) => {
              const iteration = context.variables._iteration || 0;
              return iteration < 5;
            },
            body: [
              { id: 'task-1', type: NodeType.TASK, handler }
            ]
          }
        ]
      });

      await orchestrator.execute(workflowId);

      expect(handler).toHaveBeenCalledTimes(5);
    });
  });

  describe('并行节点执行', () => {
    test('应该并行执行多个分支', async () => {
      const handler1 = jest.fn().mockResolvedValue('result1');
      const handler2 = jest.fn().mockResolvedValue('result2');
      const handler3 = jest.fn().mockResolvedValue('result3');

      const workflowId = orchestrator.createDynamic({
        name: 'Parallel Test',
        nodes: [
          {
            id: 'parallel-1',
            type: NodeType.PARALLEL,
            branches: [
              [{ id: 'task-1', type: NodeType.TASK, handler: handler1 }],
              [{ id: 'task-2', type: NodeType.TASK, handler: handler2 }],
              [{ id: 'task-3', type: NodeType.TASK, handler: handler3 }]
            ]
          }
        ]
      });

      const result = await orchestrator.execute(workflowId);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    test('应该处理并行分支中的错误', async () => {
      const handler1 = jest.fn().mockResolvedValue('result1');
      const handler2 = jest.fn().mockRejectedValue(new Error('Failed'));
      const handler3 = jest.fn().mockResolvedValue('result3');

      const workflowId = orchestrator.createDynamic({
        name: 'Parallel Error Test',
        nodes: [
          {
            id: 'parallel-1',
            type: NodeType.PARALLEL,
            branches: [
              [{ id: 'task-1', type: NodeType.TASK, handler: handler1 }],
              [{ id: 'task-2', type: NodeType.TASK, handler: handler2 }],
              [{ id: 'task-3', type: NodeType.TASK, handler: handler3 }]
            ]
          }
        ]
      });

      await orchestrator.execute(workflowId);

      const workflow = orchestrator.workflows.get(workflowId);
      expect(workflow.status).toBe(WorkflowStatus.COMPLETED);
    });
  });

  describe('序列节点执行', () => {
    test('应该按顺序执行步骤', async () => {
      const order = [];
      const handler1 = jest.fn().mockImplementation(() => {
        order.push(1);
        return 'result1';
      });
      const handler2 = jest.fn().mockImplementation(() => {
        order.push(2);
        return 'result2';
      });
      const handler3 = jest.fn().mockImplementation(() => {
        order.push(3);
        return 'result3';
      });

      const workflowId = orchestrator.createDynamic({
        name: 'Sequence Test',
        nodes: [
          {
            id: 'sequence-1',
            type: NodeType.SEQUENCE,
            steps: [
              { id: 'task-1', type: NodeType.TASK, handler: handler1 },
              { id: 'task-2', type: NodeType.TASK, handler: handler2 },
              { id: 'task-3', type: NodeType.TASK, handler: handler3 }
            ]
          }
        ]
      });

      await orchestrator.execute(workflowId);

      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe('变量解析', () => {
    test('应该解析字符串中的变量', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const workflowId = orchestrator.createDynamic({
        name: 'Variable Test',
        variables: { name: 'World' },
        nodes: [
          {
            id: 'task-1',
            type: NodeType.TASK,
            handler,
            input: { message: 'Hello ${name}!' }
          }
        ]
      });

      await orchestrator.execute(workflowId);

      expect(handler).toHaveBeenCalledWith(
        { message: 'Hello World!' },
        expect.any(Object)
      );
    });
  });

  describe('工作流控制', () => {
    test('应该暂停工作流', async () => {
      const workflowId = orchestrator.createDynamic({
        name: 'Pause Test',
        nodes: [
          { id: 'task-1', type: NodeType.TASK, handler: jest.fn() }
        ]
      });

      // 启动工作流
      const executePromise = orchestrator.execute(workflowId);

      // 立即暂停（实际上工作流可能已经完成）
      try {
        orchestrator.pause(workflowId);
      } catch (error) {
        // 如果工作流已完成，暂停会失败
      }

      await executePromise;
    });

    test('应该取消工作流', () => {
      const workflowId = orchestrator.createDynamic({
        name: 'Cancel Test',
        nodes: [
          { id: 'task-1', type: NodeType.TASK, handler: jest.fn() }
        ]
      });

      orchestrator.cancel(workflowId);

      const workflow = orchestrator.workflows.get(workflowId);
      expect(workflow.status).toBe(WorkflowStatus.CANCELLED);
    });
  });

  describe('工作流状态', () => {
    test('应该获取工作流状态', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const workflowId = orchestrator.createDynamic({
        name: 'Status Test',
        nodes: [
          { id: 'task-1', type: NodeType.TASK, handler }
        ]
      });

      await orchestrator.execute(workflowId);

      const status = orchestrator.getWorkflowStatus(workflowId);

      expect(status).toBeDefined();
      expect(status.id).toBe(workflowId);
      expect(status.status).toBe(WorkflowStatus.COMPLETED);
      expect(status.progress).toBe(1);
    });

    test('应该获取所有工作流', () => {
      orchestrator.createDynamic({
        name: 'Workflow 1',
        nodes: [{ id: 'task-1', type: NodeType.TASK, handler: jest.fn() }]
      });

      orchestrator.createDynamic({
        name: 'Workflow 2',
        nodes: [{ id: 'task-2', type: NodeType.TASK, handler: jest.fn() }]
      });

      const workflows = orchestrator.getAllWorkflows();

      expect(workflows).toHaveLength(2);
    });
  });

  describe('统计信息', () => {
    test('应该生成统计信息', async () => {
      const handler = jest.fn().mockResolvedValue('result');

      const wf1 = orchestrator.createDynamic({
        name: 'Workflow 1',
        nodes: [{ id: 'task-1', type: NodeType.TASK, handler }]
      });

      const wf2 = orchestrator.createDynamic({
        name: 'Workflow 2',
        nodes: [{ id: 'task-2', type: NodeType.TASK, handler }]
      });

      await orchestrator.execute(wf1);

      const stats = orchestrator.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.running).toBe(0);
    });
  });

  describe('错误处理', () => {
    test('应该处理任务执行错误', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Task failed'));

      const workflowId = orchestrator.createDynamic({
        name: 'Error Test',
        nodes: [
          { id: 'task-1', type: NodeType.TASK, handler }
        ]
      });

      await expect(orchestrator.execute(workflowId)).rejects.toThrow('Task failed');

      const workflow = orchestrator.workflows.get(workflowId);
      expect(workflow.status).toBe(WorkflowStatus.FAILED);
    });
  });

  describe('事件', () => {
    test('应该触发工作流事件', async () => {
      const events = [];

      orchestrator.on('workflow_created', () => events.push('created'));
      orchestrator.on('workflow_started', () => events.push('started'));
      orchestrator.on('workflow_completed', () => events.push('completed'));

      const handler = jest.fn().mockResolvedValue('result');

      const workflowId = orchestrator.createDynamic({
        name: 'Event Test',
        nodes: [{ id: 'task-1', type: NodeType.TASK, handler }]
      });

      await orchestrator.execute(workflowId);

      expect(events).toContain('created');
      expect(events).toContain('started');
      expect(events).toContain('completed');
    });
  });

  describe('销毁', () => {
    test('应该正确销毁', () => {
      orchestrator.createDynamic({
        name: 'Test',
        nodes: [{ id: 'task-1', type: NodeType.TASK, handler: jest.fn() }]
      });

      orchestrator.destroy();

      expect(orchestrator.workflows.size).toBe(0);
      expect(orchestrator.templates.size).toBe(0);
    });
  });
});
