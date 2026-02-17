/**
 * 调试工作流模板
 * 
 * 提供系统化的调试流程：
 * 1. REPRODUCE - 重现问题
 * 2. ISOLATE - 隔离问题
 * 3. FIX - 修复问题
 * 4. VERIFY - 验证修复
 */

/**
 * 调试工作流模板定义
 */
export const debugWorkflowTemplate = {
  id: 'debug-workflow',
  name: '调试工作流',
  description: '系统化的调试流程，帮助开发者快速定位和修复问题',
  version: '1.0.0',
  workflowId: 'debug-default',
  
  phases: [
    {
      id: 'reproduce',
      name: 'REPRODUCE - 重现问题',
      description: '确认问题存在并能够稳定重现',
      nextPhase: 'isolate',
      tasks: [
        '收集问题报告和错误信息',
        '创建最小可重现示例',
        '记录重现步骤',
        '确认问题的影响范围'
      ],
      exitCriteria: [
        '问题可以稳定重现',
        '有清晰的重现步骤',
        '了解问题的触发条件'
      ]
    },
    {
      id: 'isolate',
      name: 'ISOLATE - 隔离问题',
      description: '定位问题的根本原因',
      nextPhase: 'fix',
      tasks: [
        '分析错误堆栈和日志',
        '使用调试工具定位问题',
        '检查相关代码和配置',
        '识别问题的根本原因'
      ],
      exitCriteria: [
        '找到问题的根本原因',
        '理解问题发生的机制',
        '确定修复方案'
      ]
    },
    {
      id: 'fix',
      name: 'FIX - 修复问题',
      description: '实施修复方案',
      nextPhase: 'verify',
      tasks: [
        '设计修复方案',
        '实现代码修复',
        '添加或更新测试',
        '代码审查'
      ],
      exitCriteria: [
        '修复代码已实现',
        '相关测试已添加',
        '代码审查通过'
      ]
    },
    {
      id: 'verify',
      name: 'VERIFY - 验证修复',
      description: '确认问题已解决且没有引入新问题',
      nextPhase: null, // 最后一个阶段
      tasks: [
        '运行所有测试',
        '验证原问题已解决',
        '检查是否引入新问题',
        '更新文档'
      ],
      exitCriteria: [
        '所有测试通过',
        '原问题不再出现',
        '没有引入新的回归问题',
        '文档已更新'
      ]
    }
  ],
  
  defaultContext: {
    methodology: 'DEBUG',
    issueType: 'bug',
    priority: 'high'
  },
  
  metadata: {
    category: 'debugging',
    tags: ['debug', 'bugfix', 'troubleshooting'],
    estimatedDuration: '2-8 hours',
    difficulty: 'medium'
  }
};

/**
 * 调试工作流辅助函数
 */
export class DebugWorkflowHelper {
  /**
   * 创建调试会话
   */
  static createDebugSession(issueDescription, context = {}) {
    return {
      id: `debug-${Date.now()}`,
      issue: issueDescription,
      startTime: new Date().toISOString(),
      currentPhase: 'reproduce',
      context: {
        ...debugWorkflowTemplate.defaultContext,
        ...context
      },
      findings: [],
      actions: []
    };
  }
  
  /**
   * 记录调试发现
   */
  static recordFinding(session, phase, finding) {
    session.findings.push({
      phase,
      timestamp: new Date().toISOString(),
      finding
    });
    return session;
  }
  
  /**
   * 记录调试行动
   */
  static recordAction(session, phase, action, result) {
    session.actions.push({
      phase,
      timestamp: new Date().toISOString(),
      action,
      result
    });
    return session;
  }
  
  /**
   * 生成调试报告
   */
  static generateReport(session) {
    const duration = new Date() - new Date(session.startTime);
    const durationHours = (duration / (1000 * 60 * 60)).toFixed(2);
    
    return {
      sessionId: session.id,
      issue: session.issue,
      duration: `${durationHours} hours`,
      phases: {
        reproduce: session.findings.filter(f => f.phase === 'reproduce'),
        isolate: session.findings.filter(f => f.phase === 'isolate'),
        fix: session.findings.filter(f => f.phase === 'fix'),
        verify: session.findings.filter(f => f.phase === 'verify')
      },
      actions: session.actions,
      summary: this.generateSummary(session)
    };
  }
  
  /**
   * 生成调试摘要
   */
  static generateSummary(session) {
    const totalFindings = session.findings.length;
    const totalActions = session.actions.length;
    
    return {
      totalFindings,
      totalActions,
      phasesCompleted: [...new Set(session.findings.map(f => f.phase))].length,
      status: session.currentPhase === 'verify' ? 'completed' : 'in-progress'
    };
  }
  
  /**
   * 获取调试建议
   */
  static getDebugSuggestions(phase) {
    const suggestions = {
      reproduce: [
        '尝试在不同环境中重现问题',
        '简化重现步骤，去除不必要的操作',
        '记录所有相关的环境变量和配置',
        '使用日志记录关键步骤'
      ],
      isolate: [
        '使用二分法缩小问题范围',
        '检查最近的代码变更',
        '使用调试器逐步执行代码',
        '添加详细的日志输出'
      ],
      fix: [
        '先写测试，确保能捕获问题',
        '实施最小化的修复',
        '考虑边界情况和异常处理',
        '更新相关文档'
      ],
      verify: [
        '运行完整的测试套件',
        '在多个环境中测试',
        '检查性能影响',
        '进行回归测试'
      ]
    };
    
    return suggestions[phase] || [];
  }
  
  /**
   * 获取常见调试工具
   */
  static getDebugTools() {
    return {
      logging: ['console.log', 'debug', 'winston', 'pino'],
      debugging: ['node --inspect', 'Chrome DevTools', 'VS Code Debugger'],
      profiling: ['node --prof', 'clinic.js', '0x'],
      monitoring: ['New Relic', 'Datadog', 'Sentry'],
      testing: ['Jest', 'Mocha', 'Vitest']
    };
  }
}

export default debugWorkflowTemplate;
