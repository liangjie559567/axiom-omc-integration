/**
 * Executor Agent 定义
 * 代码实现和重构
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const executorAgent = {
  id: 'oh-my-claudecode:executor',
  name: 'executor',
  displayName: '代码执行器',
  description: '代码实现、重构和功能开发的专业 Agent，使用 Sonnet 模型平衡代码质量和执行效率',

  type: AgentType.BUILD_ANALYSIS,
  lane: 'Build/Analysis Lane',

  capabilities: [
    AgentCapability.CODE_IMPLEMENTATION,
    AgentCapability.REFACTORING
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['task', 'specification'],
    optional: ['codeContext', 'constraints', 'testRequirements'],
    schema: {
      task: {
        type: 'string',
        description: '任务描述'
      },
      specification: {
        type: 'object',
        description: '详细规格说明',
        properties: {
          requirements: { type: 'array' },
          acceptanceCriteria: { type: 'array' },
          interfaces: { type: 'object' }
        }
      },
      codeContext: {
        type: 'object',
        description: '代码上下文（现有代码、依赖、模式）'
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: '实现约束（性能、兼容性等）'
      },
      testRequirements: {
        type: 'object',
        description: '测试要求'
      }
    }
  },

  output: {
    type: 'implementation',
    schema: {
      files: {
        type: 'array',
        description: '修改或创建的文件列表',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            action: { type: 'string', enum: ['create', 'modify', 'delete'] },
            content: { type: 'string' }
          }
        }
      },
      tests: {
        type: 'array',
        description: '测试文件'
      },
      documentation: {
        type: 'string',
        description: '实现文档'
      },
      verificationSteps: {
        type: 'array',
        description: '验证步骤'
      }
    }
  },

  useCases: [
    '实现新功能',
    '重构现有代码',
    '修复 Bug',
    '优化性能',
    '添加测试',
    '更新文档'
  ],

  bestPractices: [
    '提供清晰的规格说明和验收标准',
    '包含足够的代码上下文',
    '遵循项目的编码规范',
    '编写可测试的代码',
    '小步提交，频繁验证',
    '实现后运行测试确保功能正确'
  ],

  limitations: [
    '需要明确的规格说明',
    '复杂的架构变更可能需要 architect 先设计',
    '无法替代人工代码审查',
    '依赖于现有代码的质量'
  ],

  dependencies: [
    'Read 工具（读取现有代码）',
    'Write 工具（创建新文件）',
    'Edit 工具（修改文件）',
    'Bash 工具（运行测试）'
  ],

  performance: {
    avgExecutionTime: '5-15分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['implementation', 'coding', 'refactoring', 'sonnet']
  }
};

export default executorAgent;
