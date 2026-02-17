/**
 * TDD 工作流模板
 *
 * 测试驱动开发（Test-Driven Development）工作流
 * 遵循 RED -> GREEN -> REFACTOR 循环
 */

/**
 * TDD 工作流模板定义
 */
export const tddWorkflowTemplate = {
  id: 'tdd-workflow',
  name: 'TDD 工作流',
  description: '测试驱动开发工作流，遵循 RED -> GREEN -> REFACTOR 循环',
  workflowId: 'tdd-default',

  phases: [
    {
      id: 'red',
      name: 'RED - 编写失败的测试',
      description: '编写一个失败的测试用例，明确需求',
      actions: [
        '分析需求',
        '编写测试用例',
        '运行测试（应该失败）',
        '确认测试失败原因正确'
      ],
      expectedOutcome: '一个失败的测试用例',
      nextPhase: 'green'
    },
    {
      id: 'green',
      name: 'GREEN - 让测试通过',
      description: '编写最简单的代码让测试通过',
      actions: [
        '编写最小实现代码',
        '运行测试',
        '确认测试通过',
        '不考虑代码质量，只求通过'
      ],
      expectedOutcome: '测试通过的代码',
      nextPhase: 'refactor'
    },
    {
      id: 'refactor',
      name: 'REFACTOR - 重构代码',
      description: '在保持测试通过的前提下优化代码',
      actions: [
        '识别代码异味',
        '重构代码',
        '运行测试确保仍然通过',
        '提交代码'
      ],
      expectedOutcome: '干净、可维护的代码',
      nextPhase: 'red' // 循环回到 RED，开始下一个功能
    }
  ],

  defaultContext: {
    methodology: 'TDD',
    testFramework: 'jest', // 默认测试框架
    language: 'javascript' // 默认语言
  },

  metadata: {
    category: 'development',
    tags: ['tdd', 'testing', 'agile', 'best-practice'],
    author: 'Axiom-OMC Integration Team',
    version: '1.0.0',
    createdAt: '2026-02-17'
  },

  guidelines: {
    red: [
      '测试应该清晰表达需求',
      '测试应该是可重复的',
      '一次只测试一个功能点',
      '测试失败的原因应该明确'
    ],
    green: [
      '使用最简单的实现',
      '不要过度设计',
      '只关注让测试通过',
      '可以使用硬编码或简单逻辑'
    ],
    refactor: [
      '保持测试通过',
      '消除重复代码',
      '提高代码可读性',
      '遵循 SOLID 原则',
      '频繁运行测试'
    ]
  },

  examples: [
    {
      feature: '用户登录',
      red: 'test("should authenticate user with valid credentials")',
      green: 'function login(username, password) { return true; }',
      refactor: 'Extract validation, add error handling, improve naming'
    },
    {
      feature: '计算器加法',
      red: 'test("should add two numbers correctly")',
      green: 'function add(a, b) { return a + b; }',
      refactor: 'Add input validation, handle edge cases'
    }
  ]
};

/**
 * 获取 TDD 工作流定义
 * @returns {Object} - 工作流定义
 */
export function getTDDWorkflowDefinition() {
  return {
    id: 'tdd-default',
    name: 'TDD 工作流',
    phases: tddWorkflowTemplate.phases.map(phase => ({
      id: phase.id,
      name: phase.name,
      description: phase.description
    })),
    initialPhase: 'red',
    metadata: {
      template: 'tdd-workflow',
      ...tddWorkflowTemplate.metadata
    }
  };
}

/**
 * 创建 TDD 工作流实例的辅助函数
 * @param {Object} templateManager - 模板管理器实例
 * @param {Object} context - 上下文
 * @returns {Promise<Object>} - 工作流实例
 */
export async function createTDDWorkflow(templateManager, context = {}) {
  return await templateManager.createFromTemplate('tdd-workflow', {
    context: {
      ...context,
      workflowType: 'tdd'
    }
  });
}

/**
 * TDD 最佳实践指南
 */
export const tddBestPractices = {
  principles: [
    '先写测试，后写代码',
    '保持测试简单和专注',
    '频繁运行测试',
    '小步前进，快速迭代',
    '重构时保持测试通过'
  ],

  commonMistakes: [
    '跳过 RED 阶段直接写代码',
    '在 GREEN 阶段过度设计',
    '忽略 REFACTOR 阶段',
    '测试覆盖率不足',
    '测试依赖外部状态'
  ],

  tips: [
    '使用描述性的测试名称',
    '每个测试只验证一个行为',
    '使用 AAA 模式（Arrange-Act-Assert）',
    '保持测试独立性',
    '定期重构测试代码'
  ]
};

export default tddWorkflowTemplate;
