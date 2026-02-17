/**
 * 调试工作流模板测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { debugWorkflowTemplate, DebugWorkflowHelper } from '../../src/templates/debug-workflow.js';

describe('DebugWorkflowTemplate', () => {
  describe('模板结构', () => {
    it('应该有正确的基本信息', () => {
      expect(debugWorkflowTemplate.id).toBe('debug-workflow');
      expect(debugWorkflowTemplate.name).toBe('调试工作流');
      expect(debugWorkflowTemplate.workflowId).toBe('debug-default');
      expect(debugWorkflowTemplate.version).toBe('1.0.0');
    });

    it('应该有完整的描述', () => {
      expect(debugWorkflowTemplate.description).toBeDefined();
      expect(debugWorkflowTemplate.description.length).toBeGreaterThan(0);
    });

    it('应该有 4 个阶段', () => {
      expect(debugWorkflowTemplate.phases).toHaveLength(4);
    });

    it('阶段应该按正确顺序排列', () => {
      const phaseIds = debugWorkflowTemplate.phases.map(p => p.id);
      expect(phaseIds).toEqual(['reproduce', 'isolate', 'fix', 'verify']);
    });
  });

  describe('阶段定义', () => {
    it('REPRODUCE 阶段应该有正确的配置', () => {
      const reproduce = debugWorkflowTemplate.phases[0];

      expect(reproduce.id).toBe('reproduce');
      expect(reproduce.name).toContain('REPRODUCE');
      expect(reproduce.nextPhase).toBe('isolate');
      expect(reproduce.tasks).toBeDefined();
      expect(reproduce.tasks.length).toBeGreaterThan(0);
      expect(reproduce.exitCriteria).toBeDefined();
      expect(reproduce.exitCriteria.length).toBeGreaterThan(0);
    });

    it('ISOLATE 阶段应该有正确的配置', () => {
      const isolate = debugWorkflowTemplate.phases[1];

      expect(isolate.id).toBe('isolate');
      expect(isolate.name).toContain('ISOLATE');
      expect(isolate.nextPhase).toBe('fix');
      expect(isolate.tasks).toBeDefined();
      expect(isolate.exitCriteria).toBeDefined();
    });

    it('FIX 阶段应该有正确的配置', () => {
      const fix = debugWorkflowTemplate.phases[2];

      expect(fix.id).toBe('fix');
      expect(fix.name).toContain('FIX');
      expect(fix.nextPhase).toBe('verify');
      expect(fix.tasks).toBeDefined();
      expect(fix.exitCriteria).toBeDefined();
    });

    it('VERIFY 阶段应该有正确的配置', () => {
      const verify = debugWorkflowTemplate.phases[3];

      expect(verify.id).toBe('verify');
      expect(verify.name).toContain('VERIFY');
      expect(verify.nextPhase).toBeNull();
      expect(verify.tasks).toBeDefined();
      expect(verify.exitCriteria).toBeDefined();
    });

    it('每个阶段都应该有任务列表', () => {
      debugWorkflowTemplate.phases.forEach(phase => {
        expect(Array.isArray(phase.tasks)).toBe(true);
        expect(phase.tasks.length).toBeGreaterThan(0);
      });
    });

    it('每个阶段都应该有退出标准', () => {
      debugWorkflowTemplate.phases.forEach(phase => {
        expect(Array.isArray(phase.exitCriteria)).toBe(true);
        expect(phase.exitCriteria.length).toBeGreaterThan(0);
      });
    });
  });

  describe('默认上下文', () => {
    it('应该有默认上下文', () => {
      expect(debugWorkflowTemplate.defaultContext).toBeDefined();
      expect(debugWorkflowTemplate.defaultContext.methodology).toBe('DEBUG');
    });

    it('默认上下文应该包含必要字段', () => {
      const context = debugWorkflowTemplate.defaultContext;

      expect(context.methodology).toBe('DEBUG');
      expect(context.issueType).toBe('bug');
      expect(context.priority).toBe('high');
    });
  });

  describe('元数据', () => {
    it('应该有元数据', () => {
      expect(debugWorkflowTemplate.metadata).toBeDefined();
    });

    it('元数据应该包含分类信息', () => {
      const metadata = debugWorkflowTemplate.metadata;

      expect(metadata.category).toBe('debugging');
      expect(Array.isArray(metadata.tags)).toBe(true);
      expect(metadata.tags).toContain('debug');
      expect(metadata.estimatedDuration).toBeDefined();
      expect(metadata.difficulty).toBe('medium');
    });
  });
});

describe('DebugWorkflowHelper', () => {
  describe('createDebugSession', () => {
    it('应该创建调试会话', () => {
      const session = DebugWorkflowHelper.createDebugSession('测试问题');

      expect(session.id).toBeDefined();
      expect(session.id).toContain('debug-');
      expect(session.issue).toBe('测试问题');
      expect(session.startTime).toBeDefined();
      expect(session.currentPhase).toBe('reproduce');
      expect(session.findings).toEqual([]);
      expect(session.actions).toEqual([]);
    });

    it('应该合并自定义上下文', () => {
      const customContext = { priority: 'critical', assignee: 'developer' };
      const session = DebugWorkflowHelper.createDebugSession('测试问题', customContext);

      expect(session.context.methodology).toBe('DEBUG');
      expect(session.context.priority).toBe('critical');
      expect(session.context.assignee).toBe('developer');
    });
  });

  describe('recordFinding', () => {
    it('应该记录调试发现', () => {
      const session = DebugWorkflowHelper.createDebugSession('测试问题');

      DebugWorkflowHelper.recordFinding(session, 'reproduce', '问题可以重现');

      expect(session.findings).toHaveLength(1);
      expect(session.findings[0].phase).toBe('reproduce');
      expect(session.findings[0].finding).toBe('问题可以重现');
      expect(session.findings[0].timestamp).toBeDefined();
    });

    it('应该支持多个发现', () => {
      const session = DebugWorkflowHelper.createDebugSession('测试问题');

      DebugWorkflowHelper.recordFinding(session, 'reproduce', '发现 1');
      DebugWorkflowHelper.recordFinding(session, 'isolate', '发现 2');

      expect(session.findings).toHaveLength(2);
    });
  });

  describe('recordAction', () => {
    it('应该记录调试行动', () => {
      const session = DebugWorkflowHelper.createDebugSession('测试问题');

      DebugWorkflowHelper.recordAction(session, 'fix', '修复代码', '成功');

      expect(session.actions).toHaveLength(1);
      expect(session.actions[0].phase).toBe('fix');
      expect(session.actions[0].action).toBe('修复代码');
      expect(session.actions[0].result).toBe('成功');
      expect(session.actions[0].timestamp).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('应该生成调试报告', () => {
      const session = DebugWorkflowHelper.createDebugSession('测试问题');

      DebugWorkflowHelper.recordFinding(session, 'reproduce', '发现 1');
      DebugWorkflowHelper.recordFinding(session, 'isolate', '发现 2');
      DebugWorkflowHelper.recordAction(session, 'fix', '行动 1', '成功');

      const report = DebugWorkflowHelper.generateReport(session);

      expect(report.sessionId).toBe(session.id);
      expect(report.issue).toBe('测试问题');
      expect(report.duration).toBeDefined();
      expect(report.phases).toBeDefined();
      expect(report.actions).toHaveLength(1);
      expect(report.summary).toBeDefined();
    });

    it('报告应该按阶段分组发现', () => {
      const session = DebugWorkflowHelper.createDebugSession('测试问题');

      DebugWorkflowHelper.recordFinding(session, 'reproduce', '发现 1');
      DebugWorkflowHelper.recordFinding(session, 'reproduce', '发现 2');
      DebugWorkflowHelper.recordFinding(session, 'isolate', '发现 3');

      const report = DebugWorkflowHelper.generateReport(session);

      expect(report.phases.reproduce).toHaveLength(2);
      expect(report.phases.isolate).toHaveLength(1);
      expect(report.phases.fix).toHaveLength(0);
      expect(report.phases.verify).toHaveLength(0);
    });
  });

  describe('generateSummary', () => {
    it('应该生成调试摘要', () => {
      const session = DebugWorkflowHelper.createDebugSession('测试问题');

      DebugWorkflowHelper.recordFinding(session, 'reproduce', '发现 1');
      DebugWorkflowHelper.recordFinding(session, 'isolate', '发现 2');
      DebugWorkflowHelper.recordAction(session, 'fix', '行动 1', '成功');

      const summary = DebugWorkflowHelper.generateSummary(session);

      expect(summary.totalFindings).toBe(2);
      expect(summary.totalActions).toBe(1);
      expect(summary.phasesCompleted).toBe(2);
      expect(summary.status).toBe('in-progress');
    });

    it('完成的会话应该有正确的状态', () => {
      const session = DebugWorkflowHelper.createDebugSession('测试问题');
      session.currentPhase = 'verify';

      const summary = DebugWorkflowHelper.generateSummary(session);

      expect(summary.status).toBe('completed');
    });
  });

  describe('getDebugSuggestions', () => {
    it('应该为每个阶段提供建议', () => {
      const phases = ['reproduce', 'isolate', 'fix', 'verify'];

      phases.forEach(phase => {
        const suggestions = DebugWorkflowHelper.getDebugSuggestions(phase);

        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
      });
    });

    it('未知阶段应该返回空数组', () => {
      const suggestions = DebugWorkflowHelper.getDebugSuggestions('unknown');

      expect(suggestions).toEqual([]);
    });
  });

  describe('getDebugTools', () => {
    it('应该返回调试工具列表', () => {
      const tools = DebugWorkflowHelper.getDebugTools();

      expect(tools).toBeDefined();
      expect(tools.logging).toBeDefined();
      expect(tools.debugging).toBeDefined();
      expect(tools.profiling).toBeDefined();
      expect(tools.monitoring).toBeDefined();
      expect(tools.testing).toBeDefined();
    });

    it('每个类别都应该有工具列表', () => {
      const tools = DebugWorkflowHelper.getDebugTools();

      Object.values(tools).forEach(toolList => {
        expect(Array.isArray(toolList)).toBe(true);
        expect(toolList.length).toBeGreaterThan(0);
      });
    });
  });
});
