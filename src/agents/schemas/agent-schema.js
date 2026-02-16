/**
 * Agent 元数据 Schema
 * 定义 Agent 的标准结构和验证规则
 */

/**
 * Agent 模型类型枚举
 */
export const AgentModel = {
  HAIKU: 'haiku',
  SONNET: 'sonnet',
  OPUS: 'opus'
};

/**
 * Agent 类型枚举
 */
export const AgentType = {
  BUILD_ANALYSIS: 'build-analysis',
  REVIEW: 'review',
  DOMAIN_SPECIALIST: 'domain-specialist',
  PRODUCT: 'product',
  COORDINATION: 'coordination',
  SPECIAL: 'special'
};

/**
 * Agent 能力枚举
 */
export const AgentCapability = {
  // 代码分析
  CODE_ANALYSIS: 'code-analysis',
  CODEBASE_EXPLORATION: 'codebase-exploration',

  // 架构设计
  ARCHITECTURE_DESIGN: 'architecture-design',
  SYSTEM_DESIGN: 'system-design',

  // 规划
  PLANNING: 'planning',
  TASK_DECOMPOSITION: 'task-decomposition',

  // 实现
  CODE_IMPLEMENTATION: 'code-implementation',
  REFACTORING: 'refactoring',

  // 调试
  DEBUGGING: 'debugging',
  ROOT_CAUSE_ANALYSIS: 'root-cause-analysis',

  // 审查
  CODE_REVIEW: 'code-review',
  STYLE_REVIEW: 'style-review',
  QUALITY_REVIEW: 'quality-review',
  API_REVIEW: 'api-review',
  SECURITY_REVIEW: 'security-review',
  PERFORMANCE_REVIEW: 'performance-review',

  // 测试
  TEST_STRATEGY: 'test-strategy',
  TEST_IMPLEMENTATION: 'test-implementation',

  // 文档
  DOCUMENTATION: 'documentation',
  TECHNICAL_WRITING: 'technical-writing',

  // 产品
  PRODUCT_MANAGEMENT: 'product-management',
  UX_RESEARCH: 'ux-research',
  INFORMATION_ARCHITECTURE: 'information-architecture',

  // 其他
  DEPENDENCY_MANAGEMENT: 'dependency-management',
  BUILD_FIXING: 'build-fixing',
  GIT_OPERATIONS: 'git-operations',
  DATA_ANALYSIS: 'data-analysis'
};

/**
 * Agent 元数据 Schema
 */
export const AgentSchema = {
  // 基本信息
  id: {
    type: 'string',
    required: true,
    description: 'Agent 唯一标识符（如：oh-my-claudecode:executor）'
  },

  name: {
    type: 'string',
    required: true,
    description: 'Agent 名称（如：executor）'
  },

  displayName: {
    type: 'string',
    required: true,
    description: 'Agent 显示名称（如：代码执行器）'
  },

  description: {
    type: 'string',
    required: true,
    description: 'Agent 功能描述'
  },

  // 分类
  type: {
    type: 'enum',
    values: Object.values(AgentType),
    required: true,
    description: 'Agent 类型'
  },

  lane: {
    type: 'string',
    required: false,
    description: 'Agent 所属通道（如：Build/Analysis Lane）'
  },

  // 能力
  capabilities: {
    type: 'array',
    items: {
      type: 'enum',
      values: Object.values(AgentCapability)
    },
    required: true,
    description: 'Agent 能力列表'
  },

  // 模型配置
  preferredModel: {
    type: 'enum',
    values: Object.values(AgentModel),
    required: true,
    description: '推荐使用的模型'
  },

  supportedModels: {
    type: 'array',
    items: {
      type: 'enum',
      values: Object.values(AgentModel)
    },
    required: false,
    default: [],
    description: '支持的模型列表（为空表示仅支持 preferredModel）'
  },

  // 输入输出
  input: {
    type: 'object',
    required: true,
    description: '输入参数定义',
    properties: {
      required: {
        type: 'array',
        items: { type: 'string' },
        description: '必需参数列表'
      },
      optional: {
        type: 'array',
        items: { type: 'string' },
        description: '可选参数列表'
      },
      schema: {
        type: 'object',
        description: '参数 Schema 定义'
      }
    }
  },

  output: {
    type: 'object',
    required: true,
    description: '输出结果定义',
    properties: {
      type: {
        type: 'string',
        description: '输出类型（如：report, code, analysis）'
      },
      schema: {
        type: 'object',
        description: '输出 Schema 定义'
      }
    }
  },

  // 使用场景
  useCases: {
    type: 'array',
    items: { type: 'string' },
    required: true,
    description: '典型使用场景列表'
  },

  // 最佳实践
  bestPractices: {
    type: 'array',
    items: { type: 'string' },
    required: false,
    default: [],
    description: '使用最佳实践'
  },

  // 限制和注意事项
  limitations: {
    type: 'array',
    items: { type: 'string' },
    required: false,
    default: [],
    description: '已知限制和注意事项'
  },

  // 依赖
  dependencies: {
    type: 'array',
    items: { type: 'string' },
    required: false,
    default: [],
    description: '依赖的其他 Agent 或工具'
  },

  // 性能指标
  performance: {
    type: 'object',
    required: false,
    description: '性能指标',
    properties: {
      avgExecutionTime: {
        type: 'string',
        description: '平均执行时间（如：2-5分钟）'
      },
      complexity: {
        type: 'enum',
        values: ['low', 'medium', 'high'],
        description: '任务复杂度'
      }
    }
  },

  // 元数据
  metadata: {
    type: 'object',
    required: false,
    description: '额外元数据',
    properties: {
      version: {
        type: 'string',
        description: 'Agent 版本'
      },
      author: {
        type: 'string',
        description: 'Agent 作者'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: '标签列表'
      }
    }
  }
};

/**
 * 验证 Agent 定义是否符合 Schema
 * @param {Object} agentDef - Agent 定义对象
 * @returns {Object} - 验证结果 { valid: boolean, errors: string[] }
 */
export function validateAgentDefinition(agentDef) {
  const errors = [];

  // 检查必需字段
  const requiredFields = ['id', 'name', 'displayName', 'description', 'type', 'capabilities', 'preferredModel', 'input', 'output', 'useCases'];

  for (const field of requiredFields) {
    if (!agentDef[field]) {
      errors.push(`缺少必需字段: ${field}`);
    }
  }

  // 检查类型
  if (agentDef.type && !Object.values(AgentType).includes(agentDef.type)) {
    errors.push(`无效的 Agent 类型: ${agentDef.type}`);
  }

  // 检查模型
  if (agentDef.preferredModel && !Object.values(AgentModel).includes(agentDef.preferredModel)) {
    errors.push(`无效的模型类型: ${agentDef.preferredModel}`);
  }

  // 检查能力
  if (agentDef.capabilities && Array.isArray(agentDef.capabilities)) {
    for (const cap of agentDef.capabilities) {
      if (!Object.values(AgentCapability).includes(cap)) {
        errors.push(`无效的能力: ${cap}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 创建 Agent 定义模板
 * @param {Object} options - 基本选项
 * @returns {Object} - Agent 定义模板
 */
export function createAgentTemplate(options = {}) {
  return {
    id: options.id || '',
    name: options.name || '',
    displayName: options.displayName || '',
    description: options.description || '',
    type: options.type || AgentType.BUILD_ANALYSIS,
    lane: options.lane || '',
    capabilities: options.capabilities || [],
    preferredModel: options.preferredModel || AgentModel.SONNET,
    supportedModels: options.supportedModels || [],
    input: {
      required: [],
      optional: [],
      schema: {}
    },
    output: {
      type: '',
      schema: {}
    },
    useCases: [],
    bestPractices: [],
    limitations: [],
    dependencies: [],
    performance: {
      avgExecutionTime: '',
      complexity: 'medium'
    },
    metadata: {
      version: '1.0.0',
      author: 'Axiom-OMC-Superpowers Integration',
      tags: []
    }
  };
}
