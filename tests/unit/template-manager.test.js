/**
 * TemplateManager 单元测试
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { TemplateManager } from '../../src/core/template-manager.js';
import { tddWorkflowTemplate } from '../../src/templates/tdd-workflow.js';

// Mock WorkflowIntegration
class MockWorkflowIntegration {
  constructor() {
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

  getWorkflowInstance(instanceId) {
    return this.instances.get(instanceId) || null;
  }
}

describe('TemplateManager', () => {
  let manager;
  let workflowIntegration;

  beforeEach(() => {
    workflowIntegration = new MockWorkflowIntegration();
    manager = new TemplateManager(workflowIntegration);
  });

  describe('构造函数', () => {
    test('应该正确初始化', () => {
      expect(manager).toBeDefined();
      expect(manager.workflowIntegration).toBe(workflowIntegration);
      expect(manager.templates).toBeDefined();
    });

    test('应该初始化统计信息', () => {
      const stats = manager.getStats();
      expect(stats.totalTemplates).toBe(0);
      expect(stats.totalCreated).toBe(0);
    });

    test('应该拒绝缺少 workflowIntegration', () => {
      expect(() => {
        new TemplateManager(null);
      }).toThrow('workflowIntegration 是必需的');
    });
  });

  describe('registerTemplate', () => {
    test('应该成功注册有效模板', () => {
      const template = {
        id: 'test-template',
        name: '测试模板',
        description: '这是一个测试模板',
        workflowId: 'test-workflow',
        phases: [
          { id: 'phase1', name: '阶段1' },
          { id: 'phase2', name: '阶段2' }
        ]
      };

      const templateId = manager.registerTemplate(template);

      expect(templateId).toBe('test-template');
      expect(manager.getStats().totalTemplates).toBe(1);
    });

    test('应该成功注册 TDD 模板', () => {
      const templateId = manager.registerTemplate(tddWorkflowTemplate);

      expect(templateId).toBe('tdd-workflow');
      expect(manager.getStats().totalTemplates).toBe(1);

      const template = manager.getTemplate('tdd-workflow');
      expect(template).toBeDefined();
      expect(template.name).toBe('TDD 工作流');
      expect(template.phases.length).toBe(3);
    });

    test('应该拒绝空模板', () => {
      expect(() => {
        manager.registerTemplate(null);
      }).toThrow('模板不能为空');
    });

    test('应该拒绝缺少 id 的模板', () => {
      const template = {
        name: '测试模板',
        description: '描述',
        workflowId: 'test-workflow',
        phases: [{ id: 'phase1', name: '阶段1' }]
      };

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('模板必须包含有效的 id 字段');
    });

    test('应该拒绝缺少 name 的模板', () => {
      const template = {
        id: 'test-template',
        description: '描述',
        workflowId: 'test-workflow',
        phases: [{ id: 'phase1', name: '阶段1' }]
      };

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('模板必须包含有效的 name 字段');
    });

    test('应该拒绝缺少 description 的模板', () => {
      const template = {
        id: 'test-template',
        name: '测试模板',
        workflowId: 'test-workflow',
        phases: [{ id: 'phase1', name: '阶段1' }]
      };

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('模板必须包含有效的 description 字段');
    });

    test('应该拒绝缺少 workflowId 的模板', () => {
      const template = {
        id: 'test-template',
        name: '测试模板',
        description: '描述',
        phases: [{ id: 'phase1', name: '阶段1' }]
      };

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('模板必须包含有效的 workflowId 字段');
    });

    test('应该拒绝缺少 phases 的模板', () => {
      const template = {
        id: 'test-template',
        name: '测试模板',
        description: '描述',
        workflowId: 'test-workflow'
      };

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('模板必须包含有效的 phases 字段');
    });

    test('应该拒绝空 phases 数组', () => {
      const template = {
        id: 'test-template',
        name: '测试模板',
        description: '描述',
        workflowId: 'test-workflow',
        phases: []
      };

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('phases 字段不能为空数组');
    });

    test('应该拒绝阶段缺少 id', () => {
      const template = {
        id: 'test-template',
        name: '测试模板',
        description: '描述',
        workflowId: 'test-workflow',
        phases: [{ name: '阶段1' }]
      };

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('阶段 0 必须包含有效的 id 字段');
    });

    test('应该拒绝阶段缺少 name', () => {
      const template = {
        id: 'test-template',
        name: '测试模板',
        description: '描述',
        workflowId: 'test-workflow',
        phases: [{ id: 'phase1' }]
      };

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('阶段 0 必须包含有效的 name 字段');
    });

    test('应该拒绝重复的模板 ID', () => {
      const template = {
        id: 'test-template',
        name: '测试模板',
        description: '描述',
        workflowId: 'test-workflow',
        phases: [{ id: 'phase1', name: '阶段1' }]
      };

      manager.registerTemplate(template);

      expect(() => {
        manager.registerTemplate(template);
      }).toThrow('模板已存在: test-template');
    });
  });

  describe('createFromTemplate', () => {
    beforeEach(() => {
      manager.registerTemplate(tddWorkflowTemplate);
    });

    test('应该成功从模板创建工作流', async () => {
      const instance = await manager.createFromTemplate('tdd-workflow', {
        context: {
          feature: 'user-authentication'
        }
      });

      expect(instance).toBeDefined();
      expect(instance.instanceId).toBeDefined();
      expect(instance.workflowId).toBe('tdd-default');
      expect(instance.context.templateId).toBe('tdd-workflow');
      expect(instance.context.templateName).toBe('TDD 工作流');
      expect(instance.context.feature).toBe('user-authentication');
    });

    test('应该合并默认上下文', async () => {
      const instance = await manager.createFromTemplate('tdd-workflow');

      expect(instance.context.methodology).toBe('TDD');
      expect(instance.context.testFramework).toBe('jest');
      expect(instance.context.language).toBe('javascript');
    });

    test('应该允许覆盖默认上下文', async () => {
      const instance = await manager.createFromTemplate('tdd-workflow', {
        context: {
          testFramework: 'mocha',
          language: 'typescript'
        }
      });

      expect(instance.context.testFramework).toBe('mocha');
      expect(instance.context.language).toBe('typescript');
      expect(instance.context.methodology).toBe('TDD'); // 未覆盖的保持默认值
    });

    test('应该更新统计信息', async () => {
      await manager.createFromTemplate('tdd-workflow');
      await manager.createFromTemplate('tdd-workflow');

      const stats = manager.getStats();
      expect(stats.totalCreated).toBe(2);
    });

    test('应该拒绝不存在的模板', async () => {
      await expect(
        manager.createFromTemplate('non-existent')
      ).rejects.toThrow('模板不存在: non-existent');
    });
  });

  describe('getTemplate', () => {
    test('应该返回存在的模板', () => {
      manager.registerTemplate(tddWorkflowTemplate);

      const template = manager.getTemplate('tdd-workflow');

      expect(template).toBeDefined();
      expect(template.id).toBe('tdd-workflow');
      expect(template.name).toBe('TDD 工作流');
    });

    test('应该返回 null 当模板不存在', () => {
      const template = manager.getTemplate('non-existent');

      expect(template).toBeNull();
    });
  });

  describe('getAllTemplates', () => {
    test('应该返回所有模板', () => {
      manager.registerTemplate(tddWorkflowTemplate);

      manager.registerTemplate({
        id: 'test-template',
        name: '测试模板',
        description: '描述',
        workflowId: 'test-workflow',
        phases: [{ id: 'phase1', name: '阶段1' }]
      });

      const templates = manager.getAllTemplates();

      expect(templates.length).toBe(2);
      expect(templates.some(t => t.id === 'tdd-workflow')).toBe(true);
      expect(templates.some(t => t.id === 'test-template')).toBe(true);
    });

    test('应该返回空数组当没有模板', () => {
      const templates = manager.getAllTemplates();

      expect(templates).toEqual([]);
    });
  });

  describe('deleteTemplate', () => {
    test('应该成功删除模板', () => {
      manager.registerTemplate(tddWorkflowTemplate);

      const deleted = manager.deleteTemplate('tdd-workflow');

      expect(deleted).toBe(true);
      expect(manager.getStats().totalTemplates).toBe(0);
      expect(manager.getTemplate('tdd-workflow')).toBeNull();
    });

    test('应该返回 false 当模板不存在', () => {
      const deleted = manager.deleteTemplate('non-existent');

      expect(deleted).toBe(false);
    });
  });

  describe('getStats', () => {
    test('应该返回统计信息', () => {
      const stats = manager.getStats();

      expect(stats).toHaveProperty('totalTemplates');
      expect(stats).toHaveProperty('totalCreated');
    });

    test('应该正确统计模板数量', () => {
      manager.registerTemplate(tddWorkflowTemplate);

      const stats = manager.getStats();

      expect(stats.totalTemplates).toBe(1);
    });

    test('应该正确统计创建次数', async () => {
      manager.registerTemplate(tddWorkflowTemplate);

      await manager.createFromTemplate('tdd-workflow');
      await manager.createFromTemplate('tdd-workflow');

      const stats = manager.getStats();

      expect(stats.totalCreated).toBe(2);
    });
  });

  describe('destroy', () => {
    test('应该清理所有资源', () => {
      manager.registerTemplate(tddWorkflowTemplate);
      manager.destroy();

      expect(manager.templates.size).toBe(0);
    });
  });

  describe('TDD 模板集成测试', () => {
    test('TDD 模板应该包含 3 个阶段', () => {
      manager.registerTemplate(tddWorkflowTemplate);

      const template = manager.getTemplate('tdd-workflow');

      expect(template.phases.length).toBe(3);
      expect(template.phases[0].id).toBe('red');
      expect(template.phases[1].id).toBe('green');
      expect(template.phases[2].id).toBe('refactor');
    });

    test('TDD 模板应该有正确的阶段顺序', () => {
      manager.registerTemplate(tddWorkflowTemplate);

      const template = manager.getTemplate('tdd-workflow');

      expect(template.phases[0].nextPhase).toBe('green');
      expect(template.phases[1].nextPhase).toBe('refactor');
      expect(template.phases[2].nextPhase).toBe('red'); // 循环
    });

    test('从 TDD 模板创建的工作流应该有正确的上下文', async () => {
      manager.registerTemplate(tddWorkflowTemplate);

      const instance = await manager.createFromTemplate('tdd-workflow', {
        context: {
          feature: 'login-system',
          testFramework: 'vitest'
        }
      });

      expect(instance.context.methodology).toBe('TDD');
      expect(instance.context.testFramework).toBe('vitest');
      expect(instance.context.feature).toBe('login-system');
      expect(instance.context.templateId).toBe('tdd-workflow');
    });
  });
});
