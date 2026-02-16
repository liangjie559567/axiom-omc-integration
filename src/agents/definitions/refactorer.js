/**
 * Refactorer Agent 定义
 * 代码重构专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const refactorerAgent = {
  id: 'oh-my-claudecode:refactorer',
  name: 'refactorer',
  displayName: '重构专家',
  description: '代码重构、技术债务清理和代码质量提升的专业 Agent，使用 Sonnet 模型平衡重构质量和效率',

  type: AgentType.SPECIAL,
  lane: 'Special',

  capabilities: [
    AgentCapability.REFACTORING,
    AgentCapability.CODE_ANALYSIS
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['code', 'refactoringGoal'],
    optional: ['context', 'constraints', 'tests'],
    schema: {
      code: {
        type: 'string',
        description: '待重构的代码'
      },
      refactoringGoal: {
        type: 'string',
        enum: ['improve-readability', 'reduce-complexity', 'eliminate-duplication', 'improve-performance', 'modernize', 'extract-abstraction'],
        description: '重构目标'
      },
      context: {
        type: 'object',
        description: '代码上下文'
      },
      constraints: {
        type: 'object',
        description: '重构约束（保持行为、兼容性）'
      },
      tests: {
        type: 'string',
        description: '现有测试'
      }
    }
  },

  output: {
    type: 'refactoring-result',
    schema: {
      refactoredCode: {
        type: 'string',
        description: '重构后的代码'
      },
      changes: {
        type: 'array',
        description: '变更说明',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            rationale: { type: 'string' }
          }
        }
      },
      improvements: {
        type: 'object',
        description: '改进指标（复杂度、可读性等）'
      },
      testUpdates: {
        type: 'array',
        description: '测试更新（如需要）'
      },
      recommendations: {
        type: 'array',
        description: '进一步改进建议'
      }
    }
  },

  useCases: [
    '提高代码可读性',
    '降低代码复杂度',
    '消除重复代码',
    '提取抽象和模式',
    '优化代码性能',
    '现代化遗留代码',
    '改善代码结构'
  ],

  bestPractices: [
    '保持行为不变',
    '小步重构',
    '运行测试验证',
    '一次专注一个目标',
    '记录重构原因',
    '考虑向后兼容性'
  ],

  limitations: [
    '需要充分的测试覆盖',
    '无法直接运行测试',
    '某些重构需要架构级决策'
  ],

  dependencies: [
    'Read 工具（读取代码）',
    'Edit 工具（修改代码）',
    'Bash 工具（运行测试）',
    'quality-reviewer Agent（质量评估）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['refactoring', 'code-quality', 'technical-debt', 'sonnet']
  }
};

export default refactorerAgent;
