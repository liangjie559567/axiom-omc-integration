/**
 * 代码审查工作流模板
 *
 * 提供标准化的代码审查流程：
 * 1. PREPARE - 准备审查
 * 2. REVIEW - 执行审查
 * 3. DISCUSS - 讨论反馈
 * 4. APPROVE - 批准合并
 */

/**
 * 代码审查工作流模板定义
 */
export const codeReviewWorkflowTemplate = {
  id: 'code-review-workflow',
  name: '代码审查工作流',
  description: '标准化的代码审查流程，确保代码质量和团队协作',
  version: '1.0.0',
  workflowId: 'code-review-default',

  phases: [
    {
      id: 'prepare',
      name: 'PREPARE - 准备审查',
      description: '准备代码审查所需的材料和环境',
      nextPhase: 'review',
      tasks: [
        '确保所有测试通过',
        '更新文档和注释',
        '自我审查代码',
        '准备变更说明'
      ],
      exitCriteria: [
        '代码已提交到审查分支',
        '所有自动化检查通过',
        '变更说明清晰完整',
        '相关文档已更新'
      ]
    },
    {
      id: 'review',
      name: 'REVIEW - 执行审查',
      description: '审查者检查代码质量和设计',
      nextPhase: 'discuss',
      tasks: [
        '检查代码风格和规范',
        '评估设计和架构',
        '验证测试覆盖率',
        '检查安全性和性能'
      ],
      exitCriteria: [
        '代码已被审查',
        '反馈已记录',
        '问题已标记',
        '建议已提出'
      ]
    },
    {
      id: 'discuss',
      name: 'DISCUSS - 讨论反馈',
      description: '作者和审查者讨论反馈意见',
      nextPhase: 'approve',
      tasks: [
        '回应审查意见',
        '解释设计决策',
        '修改代码',
        '更新文档'
      ],
      exitCriteria: [
        '所有反馈已处理',
        '必要的修改已完成',
        '审查者确认修改',
        '无阻塞性问题'
      ]
    },
    {
      id: 'approve',
      name: 'APPROVE - 批准合并',
      description: '最终批准并合并代码',
      nextPhase: null,
      tasks: [
        '最终代码检查',
        '确认测试通过',
        '批准合并请求',
        '合并到主分支'
      ],
      exitCriteria: [
        '代码已批准',
        '所有检查通过',
        '代码已合并',
        '相关人员已通知'
      ]
    }
  ],

  defaultContext: {
    methodology: 'CODE_REVIEW',
    reviewType: 'pull-request',
    priority: 'normal'
  },

  metadata: {
    category: 'quality-assurance',
    tags: ['code-review', 'quality', 'collaboration'],
    estimatedDuration: '1-4 hours',
    difficulty: 'easy'
  }
};

/**
 * 代码审查工作流辅助函数
 */
export class CodeReviewWorkflowHelper {
  /**
   * 创建代码审查会话
   */
  static createReviewSession(pullRequestInfo, context = {}) {
    return {
      id: `review-${Date.now()}`,
      pullRequest: pullRequestInfo,
      startTime: new Date().toISOString(),
      currentPhase: 'prepare',
      context: {
        ...codeReviewWorkflowTemplate.defaultContext,
        ...context
      },
      comments: [],
      approvals: [],
      changes: []
    };
  }

  /**
   * 添加审查意见
   */
  static addComment(session, phase, comment, severity = 'info') {
    session.comments.push({
      phase,
      timestamp: new Date().toISOString(),
      comment,
      severity,
      resolved: false
    });
    return session;
  }

  /**
   * 解决审查意见
   */
  static resolveComment(session, commentIndex) {
    if (session.comments[commentIndex]) {
      session.comments[commentIndex].resolved = true;
      session.comments[commentIndex].resolvedAt = new Date().toISOString();
    }
    return session;
  }

  /**
   * 添加批准
   */
  static addApproval(session, reviewer, approved = true) {
    session.approvals.push({
      reviewer,
      approved,
      timestamp: new Date().toISOString()
    });
    return session;
  }

  /**
   * 记录代码变更
   */
  static recordChange(session, description, files) {
    session.changes.push({
      timestamp: new Date().toISOString(),
      description,
      files: files || []
    });
    return session;
  }

  /**
   * 生成审查报告
   */
  static generateReport(session) {
    const duration = new Date() - new Date(session.startTime);
    const durationHours = (duration / (1000 * 60 * 60)).toFixed(2);

    const commentsByPhase = {
      prepare: session.comments.filter(c => c.phase === 'prepare'),
      review: session.comments.filter(c => c.phase === 'review'),
      discuss: session.comments.filter(c => c.phase === 'discuss'),
      approve: session.comments.filter(c => c.phase === 'approve')
    };

    const commentsBySeverity = {
      blocker: session.comments.filter(c => c.severity === 'blocker'),
      error: session.comments.filter(c => c.severity === 'error'),
      warning: session.comments.filter(c => c.severity === 'warning'),
      info: session.comments.filter(c => c.severity === 'info')
    };

    return {
      sessionId: session.id,
      pullRequest: session.pullRequest,
      duration: `${durationHours} hours`,
      summary: {
        totalComments: session.comments.length,
        resolvedComments: session.comments.filter(c => c.resolved).length,
        unresolvedComments: session.comments.filter(c => !c.resolved).length,
        blockers: commentsBySeverity.blocker.length,
        totalApprovals: session.approvals.length,
        approved: session.approvals.filter(a => a.approved).length,
        totalChanges: session.changes.length
      },
      commentsByPhase,
      commentsBySeverity,
      approvals: session.approvals,
      changes: session.changes
    };
  }

  /**
   * 检查是否可以批准
   */
  static canApprove(session) {
    const unresolvedBlockers = session.comments.filter(
      c => c.severity === 'blocker' && !c.resolved
    );

    const unresolvedErrors = session.comments.filter(
      c => c.severity === 'error' && !c.resolved
    );

    return {
      canApprove: unresolvedBlockers.length === 0 && unresolvedErrors.length === 0,
      blockers: unresolvedBlockers.length,
      errors: unresolvedErrors.length,
      warnings: session.comments.filter(c => c.severity === 'warning' && !c.resolved).length
    };
  }

  /**
   * 获取审查检查清单
   */
  static getReviewChecklist() {
    return {
      codeQuality: [
        '代码遵循项目编码规范',
        '变量和函数命名清晰',
        '代码逻辑清晰易懂',
        '没有重复代码',
        '适当的注释和文档'
      ],
      functionality: [
        '实现符合需求',
        '边界情况已处理',
        '错误处理完善',
        '性能可接受'
      ],
      testing: [
        '有足够的单元测试',
        '测试覆盖关键路径',
        '测试用例有意义',
        '所有测试通过'
      ],
      security: [
        '没有安全漏洞',
        '输入验证完善',
        '敏感数据已保护',
        '权限检查正确'
      ],
      documentation: [
        'API 文档完整',
        '变更说明清晰',
        'README 已更新',
        '示例代码可用'
      ]
    };
  }

  /**
   * 获取审查最佳实践
   */
  static getBestPractices() {
    return {
      forAuthors: [
        '保持 PR 小而专注',
        '提供清晰的变更说明',
        '自我审查后再提交',
        '及时回应审查意见',
        '保持积极的态度'
      ],
      forReviewers: [
        '及时审查代码',
        '提供建设性反馈',
        '关注重要问题',
        '避免过于挑剔',
        '认可好的代码'
      ],
      general: [
        '使用自动化工具',
        '建立审查标准',
        '定期审查流程',
        '培养审查文化',
        '记录审查经验'
      ]
    };
  }

  /**
   * 获取常见问题模板
   */
  static getCommentTemplates() {
    return {
      codeStyle: '代码风格问题：{description}。建议：{suggestion}',
      logic: '逻辑问题：{description}。可能导致：{impact}',
      performance: '性能问题：{description}。建议优化：{suggestion}',
      security: '安全问题：{description}。风险级别：{level}',
      testing: '测试问题：{description}。建议添加：{suggestion}',
      documentation: '文档问题：{description}。需要补充：{suggestion}',
      praise: '做得好：{description}。继续保持！'
    };
  }
}

export default codeReviewWorkflowTemplate;
