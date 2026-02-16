/**
 * Style Reviewer Agent 定义
 * 代码风格和格式审查
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const styleReviewerAgent = {
  id: 'oh-my-claudecode:style-reviewer',
  name: 'style-reviewer',
  displayName: '代码风格审查员',
  description: '代码风格、格式化和命名规范审查的专业 Agent，使用 Haiku 模型实现快速审查',

  type: AgentType.REVIEW,
  lane: 'Review Lane',

  capabilities: [
    AgentCapability.STYLE_REVIEW,
    AgentCapability.CODE_REVIEW
  ],

  preferredModel: AgentModel.HAIKU,
  supportedModels: [AgentModel.HAIKU, AgentModel.SONNET],

  input: {
    required: ['code'],
    optional: ['styleGuide', 'language', 'context'],
    schema: {
      code: {
        type: 'string',
        description: '待审查的代码'
      },
      styleGuide: {
        type: 'object',
        description: '代码风格指南配置'
      },
      language: {
        type: 'string',
        description: '编程语言'
      },
      context: {
        type: 'object',
        description: '项目上下文（现有风格、团队偏好）'
      }
    }
  },

  output: {
    type: 'style-review-report',
    schema: {
      issues: {
        type: 'array',
        description: '风格问题列表',
        items: {
          type: 'object',
          properties: {
            line: { type: 'number' },
            column: { type: 'number' },
            severity: { type: 'string', enum: ['info', 'warning', 'error'] },
            message: { type: 'string' },
            suggestion: { type: 'string' }
          }
        }
      },
      summary: {
        type: 'object',
        description: '审查摘要'
      },
      autoFixable: {
        type: 'array',
        description: '可自动修复的问题'
      }
    }
  },

  useCases: [
    '检查代码格式化问题（缩进、空格、换行）',
    '验证命名规范（变量、函数、类名）',
    '检查代码组织和结构',
    '识别不一致的代码风格',
    '提供自动修复建议'
  ],

  bestPractices: [
    '提供项目的风格指南配置',
    '结合 ESLint/Prettier 等工具的规则',
    '优先修复可自动修复的问题',
    '保持团队风格一致性'
  ],

  limitations: [
    '仅关注风格问题，不检查逻辑错误',
    '依赖于提供的风格指南',
    '使用 Haiku 模型，深度分析有限'
  ],

  dependencies: [
    'Read 工具（读取代码文件）'
  ],

  performance: {
    avgExecutionTime: '30秒-1分钟',
    complexity: 'low'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['review', 'style', 'formatting', 'haiku']
  }
};

export default styleReviewerAgent;
