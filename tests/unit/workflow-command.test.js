/**
 * WorkflowCommand 单元测试
 */

import { WorkflowCommand } from '../../src/commands/workflow-command.js';
import { createAgentSystem } from '../../src/agents/agent-system.js';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

describe('WorkflowCommand', () => {
  let command;
  let system;
  let testFilePath;

  beforeEach(() => {
    system = createAgentSystem();
    command = new WorkflowCommand();
    testFilePath = join(process.cwd(), 'test-workflow.json');
  });

  afterEach(async () => {
    // 清理测试文件
    try {
      await unlink(testFilePath);
    } catch (error) {
      // 文件可能不存在
    }
  });

  describe('create', () => {
    test('应该创建工作流', async () => {
      const definition = {
        name: 'Test Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: 'oh-my-claudecode:explore',
            input: { target: 'src/' }
          }
        ]
      };

      await writeFile(testFilePath, JSON.stringify(definition));

      const result = await command.create(testFilePath);

      expect(result.success).toBe(true);
      expect(result.workflowId).toBeDefined();
      expect(result.name).toBe('Test Workflow');
      expect(result.tasks).toBe(1);
    });

    test('应该在未指定文件时抛出错误', async () => {
      await expect(command.create()).rejects.toThrow('请指定工作流定义文件');
    });

    test('应该在文件不存在时抛出错误', async () => {
      await expect(
        command.create('non-existent.json')
      ).rejects.toThrow('加载工作流定义失败');
    });
  });

  describe('run', () => {
    test('应该执行工作流', async () => {
      const definition = {
        name: 'Test Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: 'oh-my-claudecode:explore',
            input: { target: 'src/' }
          }
        ]
      };

      await writeFile(testFilePath, JSON.stringify(definition));

      const result = await command.run(testFilePath);

      expect(result.success).toBe(true);
      expect(result.workflowId).toBeDefined();
    });

    test('应该在未指定工作流时抛出错误', async () => {
      await expect(command.run()).rejects.toThrow('请指定工作流 ID 或定义文件');
    });
  });

  describe('list', () => {
    test('应该列出所有工作流', async () => {
      const result = command.list();

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.workflows).toBeDefined();
      expect(Array.isArray(result.workflows)).toBe(true);
    });

    test('应该返回 JSON 格式', async () => {
      const result = command.list({ format: 'json' });

      expect(result.workflows).toBeDefined();
      expect(Array.isArray(result.workflows)).toBe(true);
    });
  });

  describe('info', () => {
    test('应该获取工作流信息', async () => {
      const definition = {
        name: 'Test Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: 'oh-my-claudecode:explore',
            input: { target: 'src/' }
          }
        ]
      };

      await writeFile(testFilePath, JSON.stringify(definition));
      const createResult = await command.create(testFilePath);

      const result = command.info(createResult.workflowId);

      expect(result.id).toBe(createResult.workflowId);
      expect(result.name).toBe('Test Workflow');
      expect(result.tasks).toBeDefined();
    });

    test('应该在工作流不存在时抛出错误', () => {
      expect(() => {
        command.info('non-existent');
      }).toThrow('工作流不存在');
    });

    test('应该在未指定工作流时抛出错误', () => {
      expect(() => {
        command.info();
      }).toThrow('请指定工作流 ID');
    });
  });

  describe('cancel', () => {
    test('应该取消工作流', async () => {
      const definition = {
        name: 'Test Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: 'oh-my-claudecode:explore',
            input: { target: 'src/' }
          }
        ]
      };

      await writeFile(testFilePath, JSON.stringify(definition));
      const createResult = await command.create(testFilePath);

      // 启动工作流（不等待完成）
      command.run(createResult.workflowId).catch(() => {});

      // 立即取消
      const result = command.cancel(createResult.workflowId);

      expect(result.workflowId).toBe(createResult.workflowId);
    });

    test('应该在未指定工作流时抛出错误', () => {
      expect(() => {
        command.cancel();
      }).toThrow('请指定工作流 ID');
    });
  });

  describe('template', () => {
    test('应该生成简单模板', () => {
      const result = command.template('simple');

      expect(result.template).toBeDefined();
      expect(result.template.name).toBeDefined();
      expect(result.template.tasks).toBeDefined();
    });

    test('应该生成分析模板', () => {
      const result = command.template('analysis');

      expect(result.template).toBeDefined();
      expect(result.template.tasks.length).toBeGreaterThan(1);
    });

    test('应该生成开发模板', () => {
      const result = command.template('development');

      expect(result.template).toBeDefined();
      expect(result.template.tasks.length).toBeGreaterThan(2);
    });

    test('应该生成审查模板', () => {
      const result = command.template('review');

      expect(result.template).toBeDefined();
      expect(result.template.tasks.length).toBeGreaterThan(2);
    });

    test('应该默认返回简单模板', () => {
      const result = command.template('unknown');

      expect(result.template).toBeDefined();
      expect(result.template.name).toBe('Simple Workflow');
    });
  });

  describe('validate', () => {
    test('应该验证有效的工作流定义', async () => {
      const definition = {
        name: 'Test Workflow',
        tasks: [
          {
            id: 'task1',
            agentId: 'oh-my-claudecode:explore',
            input: { target: 'src/' }
          }
        ]
      };

      await writeFile(testFilePath, JSON.stringify(definition));

      const result = await command.validate(testFilePath);

      expect(result.valid).toBe(true);
      expect(result.message).toBe('工作流定义有效');
    });

    test('应该检测无效的工作流定义', async () => {
      const definition = {
        name: 'Invalid Workflow',
        tasks: []
      };

      await writeFile(testFilePath, JSON.stringify(definition));

      const result = await command.validate(testFilePath);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('应该在未指定文件时抛出错误', async () => {
      await expect(command.validate()).rejects.toThrow('请指定工作流定义文件');
    });
  });

  describe('execute', () => {
    test('应该执行 list 子命令', async () => {
      const result = await command.execute('list');

      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    test('应该执行 template 子命令', async () => {
      const result = await command.execute('template', ['simple']);

      expect(result.template).toBeDefined();
    });

    test('应该在未知子命令时抛出错误', async () => {
      await expect(
        command.execute('unknown')
      ).rejects.toThrow('未知的子命令');
    });
  });
});
