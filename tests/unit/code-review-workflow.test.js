/**
 * 代码审查工作流模板测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { codeReviewWorkflowTemplate, CodeReviewWorkflowHelper } from '../../src/templates/code-review-workflow.js';

describe('CodeReviewWorkflowTemplate', () => {
  describe('模板结构', () => {
    it('应该有正确的基本信息', () => {
      expect(codeReviewWorkflowTemplate.id).toBe('code-review-workflow');
      expect(codeReviewWorkflowTemplate.name).toBe('代码审查工作流');
      expect(codeReviewWorkflowTemplate.workflowId).toBe('code-review-default');
      expect(codeReviewWorkflowTemplate.version).toBe('1.0.0');
    });

    it('应该有完整的描述', () => {
      expect(codeReviewWorkflowTemplate.description).toBeDefined();
      expect(codeReviewWorkflowTemplate.description.length).toBeGreaterThan(0);
    });

    it('应该有 4 个阶段', () => {
      expect(codeReviewWorkflowTemplate.phases).toHaveLength(4);
    });

    it('阶段应该按正确顺序排列', () => {
      const phaseIds = codeReviewWorkflowTemplate.phases.map(p => p.id);
      expect(phaseIds).toEqual(['prepare', 'review', 'discuss', 'approve']);
    });
  });

  describe('阶段定义', () => {
    it('PREPARE 阶段应该有正确的配置', () => {
      const prepare = codeReviewWorkflowTemplate.phases[0];

      expect(prepare.id).toBe('prepare');
      expect(prepare.name).toContain('PREPARE');
      expect(prepare.nextPhase).toBe('review');
      expect(prepare.tasks).toBeDefined();
      expect(prepare.tasks.length).toBeGreaterThan(0);
      expect(prepare.exitCriteria).toBeDefined();
      expect(prepare.exitCriteria.length).toBeGreaterThan(0);
    });

    it('REVIEW 阶段应该有正确的配置', () => {
      const review = codeReviewWorkflowTemplate.phases[1];

      expect(review.id).toBe('review');
      expect(review.name).toContain('REVIEW');
      expect(review.nextPhase).toBe('discuss');
      expect(review.tasks).toBeDefined();
      expect(review.exitCriteria).toBeDefined();
    });

    it('DISCUSS 阶段应该有正确的配置', () => {
      const discuss = codeReviewWorkflowTemplate.phases[2];

      expect(discuss.id).toBe('discuss');
      expect(discuss.name).toContain('DISCUSS');
      expect(discuss.nextPhase).toBe('approve');
      expect(discuss.tasks).toBeDefined();
      expect(discuss.exitCriteria).toBeDefined();
    });

    it('APPROVE 阶段应该有正确的配置', () => {
      const approve = codeReviewWorkflowTemplate.phases[3];

      expect(approve.id).toBe('approve');
      expect(approve.name).toContain('APPROVE');
      expect(approve.nextPhase).toBeNull();
      expect(approve.tasks).toBeDefined();
      expect(approve.exitCriteria).toBeDefined();
    });

    it('每个阶段都应该有任务列表', () => {
      codeReviewWorkflowTemplate.phases.forEach(phase => {
        expect(Array.isArray(phase.tasks)).toBe(true);
        expect(phase.tasks.length).toBeGreaterThan(0);
      });
    });

    it('每个阶段都应该有退出标准', () => {
      codeReviewWorkflowTemplate.phases.forEach(phase => {
        expect(Array.isArray(phase.exitCriteria)).toBe(true);
        expect(phase.exitCriteria.length).toBeGreaterThan(0);
      });
    });
  });

  describe('默认上下文', () => {
    it('应该有默认上下文', () => {
      expect(codeReviewWorkflowTemplate.defaultContext).toBeDefined();
      expect(codeReviewWorkflowTemplate.defaultContext.methodology).toBe('CODE_REVIEW');
    });

    it('默认上下文应该包含必要字段', () => {
      const context = codeReviewWorkflowTemplate.defaultContext;

      expect(context.methodology).toBe('CODE_REVIEW');
      expect(context.reviewType).toBe('pull-request');
      expect(context.priority).toBe('normal');
    });
  });

  describe('元数据', () => {
    it('应该有元数据', () => {
      expect(codeReviewWorkflowTemplate.metadata).toBeDefined();
    });

    it('元数据应该包含分类信息', () => {
      const metadata = codeReviewWorkflowTemplate.metadata;

      expect(metadata.category).toBe('quality-assurance');
      expect(Array.isArray(metadata.tags)).toBe(true);
      expect(metadata.tags).toContain('code-review');
      expect(metadata.estimatedDuration).toBeDefined();
      expect(metadata.difficulty).toBe('easy');
    });
  });
});

describe('CodeReviewWorkflowHelper', () => {
  describe('createReviewSession', () => {
    it('应该创建审查会话', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      expect(session.id).toBeDefined();
      expect(session.id).toContain('review-');
      expect(session.pullRequest).toEqual(prInfo);
      expect(session.startTime).toBeDefined();
      expect(session.currentPhase).toBe('prepare');
      expect(session.comments).toEqual([]);
      expect(session.approvals).toEqual([]);
      expect(session.changes).toEqual([]);
    });

    it('应该合并自定义上下文', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const customContext = { priority: 'high', team: 'frontend' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo, customContext);

      expect(session.context.methodology).toBe('CODE_REVIEW');
      expect(session.context.priority).toBe('high');
      expect(session.context.team).toBe('frontend');
    });
  });

  describe('addComment', () => {
    it('应该添加审查意见', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '代码风格需要改进', 'warning');

      expect(session.comments).toHaveLength(1);
      expect(session.comments[0].phase).toBe('review');
      expect(session.comments[0].comment).toBe('代码风格需要改进');
      expect(session.comments[0].severity).toBe('warning');
      expect(session.comments[0].resolved).toBe(false);
      expect(session.comments[0].timestamp).toBeDefined();
    });

    it('应该支持不同严重级别', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '信息', 'info');
      CodeReviewWorkflowHelper.addComment(session, 'review', '警告', 'warning');
      CodeReviewWorkflowHelper.addComment(session, 'review', '错误', 'error');
      CodeReviewWorkflowHelper.addComment(session, 'review', '阻塞', 'blocker');

      expect(session.comments).toHaveLength(4);
      expect(session.comments[0].severity).toBe('info');
      expect(session.comments[1].severity).toBe('warning');
      expect(session.comments[2].severity).toBe('error');
      expect(session.comments[3].severity).toBe('blocker');
    });
  });

  describe('resolveComment', () => {
    it('应该解决审查意见', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '需要修复');
      CodeReviewWorkflowHelper.resolveComment(session, 0);

      expect(session.comments[0].resolved).toBe(true);
      expect(session.comments[0].resolvedAt).toBeDefined();
    });

    it('应该处理无效索引', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.resolveComment(session, 999);

      expect(session.comments).toHaveLength(0);
    });
  });

  describe('addApproval', () => {
    it('应该添加批准', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addApproval(session, 'reviewer1', true);

      expect(session.approvals).toHaveLength(1);
      expect(session.approvals[0].reviewer).toBe('reviewer1');
      expect(session.approvals[0].approved).toBe(true);
      expect(session.approvals[0].timestamp).toBeDefined();
    });

    it('应该支持拒绝', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addApproval(session, 'reviewer1', false);

      expect(session.approvals[0].approved).toBe(false);
    });
  });

  describe('recordChange', () => {
    it('应该记录代码变更', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.recordChange(session, '修复代码风格', ['file1.js', 'file2.js']);

      expect(session.changes).toHaveLength(1);
      expect(session.changes[0].description).toBe('修复代码风格');
      expect(session.changes[0].files).toEqual(['file1.js', 'file2.js']);
      expect(session.changes[0].timestamp).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('应该生成审查报告', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '意见 1', 'info');
      CodeReviewWorkflowHelper.addComment(session, 'review', '意见 2', 'warning');
      CodeReviewWorkflowHelper.addApproval(session, 'reviewer1', true);
      CodeReviewWorkflowHelper.recordChange(session, '修复问题');

      const report = CodeReviewWorkflowHelper.generateReport(session);

      expect(report.sessionId).toBe(session.id);
      expect(report.pullRequest).toEqual(prInfo);
      expect(report.duration).toBeDefined();
      expect(report.summary.totalComments).toBe(2);
      expect(report.summary.totalApprovals).toBe(1);
      expect(report.summary.totalChanges).toBe(1);
    });

    it('报告应该按阶段分组意见', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'prepare', '意见 1');
      CodeReviewWorkflowHelper.addComment(session, 'review', '意见 2');
      CodeReviewWorkflowHelper.addComment(session, 'review', '意见 3');

      const report = CodeReviewWorkflowHelper.generateReport(session);

      expect(report.commentsByPhase.prepare).toHaveLength(1);
      expect(report.commentsByPhase.review).toHaveLength(2);
      expect(report.commentsByPhase.discuss).toHaveLength(0);
      expect(report.commentsByPhase.approve).toHaveLength(0);
    });

    it('报告应该按严重级别分组意见', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '信息', 'info');
      CodeReviewWorkflowHelper.addComment(session, 'review', '警告', 'warning');
      CodeReviewWorkflowHelper.addComment(session, 'review', '错误', 'error');
      CodeReviewWorkflowHelper.addComment(session, 'review', '阻塞', 'blocker');

      const report = CodeReviewWorkflowHelper.generateReport(session);

      expect(report.commentsBySeverity.info).toHaveLength(1);
      expect(report.commentsBySeverity.warning).toHaveLength(1);
      expect(report.commentsBySeverity.error).toHaveLength(1);
      expect(report.commentsBySeverity.blocker).toHaveLength(1);
    });
  });

  describe('canApprove', () => {
    it('没有阻塞问题时应该可以批准', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '信息', 'info');
      CodeReviewWorkflowHelper.addComment(session, 'review', '警告', 'warning');

      const result = CodeReviewWorkflowHelper.canApprove(session);

      expect(result.canApprove).toBe(true);
      expect(result.blockers).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('有未解决的阻塞问题时不应该批准', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '阻塞问题', 'blocker');

      const result = CodeReviewWorkflowHelper.canApprove(session);

      expect(result.canApprove).toBe(false);
      expect(result.blockers).toBe(1);
    });

    it('有未解决的错误时不应该批准', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '错误', 'error');

      const result = CodeReviewWorkflowHelper.canApprove(session);

      expect(result.canApprove).toBe(false);
      expect(result.errors).toBe(1);
    });

    it('解决问题后应该可以批准', () => {
      const prInfo = { id: 123, title: 'Add feature X' };
      const session = CodeReviewWorkflowHelper.createReviewSession(prInfo);

      CodeReviewWorkflowHelper.addComment(session, 'review', '阻塞问题', 'blocker');
      CodeReviewWorkflowHelper.resolveComment(session, 0);

      const result = CodeReviewWorkflowHelper.canApprove(session);

      expect(result.canApprove).toBe(true);
      expect(result.blockers).toBe(0);
    });
  });

  describe('getReviewChecklist', () => {
    it('应该返回审查检查清单', () => {
      const checklist = CodeReviewWorkflowHelper.getReviewChecklist();

      expect(checklist).toBeDefined();
      expect(checklist.codeQuality).toBeDefined();
      expect(checklist.functionality).toBeDefined();
      expect(checklist.testing).toBeDefined();
      expect(checklist.security).toBeDefined();
      expect(checklist.documentation).toBeDefined();
    });

    it('每个类别都应该有检查项', () => {
      const checklist = CodeReviewWorkflowHelper.getReviewChecklist();

      Object.values(checklist).forEach(items => {
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getBestPractices', () => {
    it('应该返回最佳实践', () => {
      const practices = CodeReviewWorkflowHelper.getBestPractices();

      expect(practices).toBeDefined();
      expect(practices.forAuthors).toBeDefined();
      expect(practices.forReviewers).toBeDefined();
      expect(practices.general).toBeDefined();
    });

    it('每个类别都应该有实践建议', () => {
      const practices = CodeReviewWorkflowHelper.getBestPractices();

      Object.values(practices).forEach(items => {
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCommentTemplates', () => {
    it('应该返回意见模板', () => {
      const templates = CodeReviewWorkflowHelper.getCommentTemplates();

      expect(templates).toBeDefined();
      expect(templates.codeStyle).toBeDefined();
      expect(templates.logic).toBeDefined();
      expect(templates.performance).toBeDefined();
      expect(templates.security).toBeDefined();
      expect(templates.testing).toBeDefined();
      expect(templates.documentation).toBeDefined();
      expect(templates.praise).toBeDefined();
    });

    it('每个模板都应该是字符串', () => {
      const templates = CodeReviewWorkflowHelper.getCommentTemplates();

      Object.values(templates).forEach(template => {
        expect(typeof template).toBe('string');
        expect(template.length).toBeGreaterThan(0);
      });
    });
  });
});
