/**
 * Test Reviewer Agent 定义
 * 测试覆盖率和质量审查
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const testReviewerAgent = {
  id: 'oh-my-claudecode:test-reviewer',
  name: 'test-reviewer',
  displayName: '测试审查员',
  description: '测试覆盖率、测试质量和测试策略审查的专业 Agent，使用 Sonnet 模型确保测试完整性',

  type: AgentType.REVIEW,
  lane: 'Review Lane',

  capabilities: [
    AgentCapability.CODE_REVIEW,
    AgentCapability.TEST_STRATEGY
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['code', 'tests'],
    optional: ['coverageReport', 'testStrategy', 'requirements'],
    schema: {
      code: {
        type: 'string',
        description: '被测试的代码'
      },
      tests: {
        type: 'string',
        description: '测试代码'
      },
      coverageReport: {
        type: 'object',
        description: '测试覆盖率报告'
      },
      testStrategy: {
        type: 'object',
        description: '测试策略'
      },
      requirements: {
        type: 'array',
        description: '需求和验收标准'
      }
    }
  },

  output: {
    type: 'test-review-report',
    schema: {
      coverageGaps: {
        type: 'array',
        description: '覆盖率缺口',
        items: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            type: { type: 'string' },
            severity: { type: 'string' },
            suggestion: { type: 'string' }
          }
        }
      },
      testQualityIssues: {
        type: 'array',
        description: '测试质量问题'
      },
      missingTests: {
        type: 'array',
        description: '缺失的测试场景'
      },
      testSmells: {
        type: 'array',
        description: '测试异味'
      },
      recommendations: {
        type: 'array',
        description: '测试改进建议'
      },
      coverageSummary: {
        type: 'object',
        description: '覆盖率摘要'
      }
    }
  },

  useCases: [
    '评估测试覆盖率',
    '识别缺失的测试场景',
    '检查测试质量（可读性、可维护性）',
    '识别测试异味（重复、脆弱、慢速）',
    '验证边界条件和异常处理测试',
    '评估测试策略的完整性',
    '检查测试数据和 Mock 的合理性'
  ],

  bestPractices: [
    '提供完整的代码和测试',
    '包含覆盖率报告',
    '关注关键路径和边界条件',
    '遵循测试金字塔原则',
    '编写可读性强的测试',
    '避免测试异味'
  ],

  limitations: [
    '无法执行测试验证其正确性',
    '需要理解业务逻辑才能评估测试完整性',
    '某些测试场景需要领域知识'
  ],

  dependencies: [
    'Read 工具（读取代码和测试）',
    'Grep 工具（搜索测试模式）'
  ],

  performance: {
    avgExecutionTime: '3-6分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['review', 'testing', 'coverage', 'sonnet']
  }
};

export default testReviewerAgent;
