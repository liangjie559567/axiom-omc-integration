/**
 * Migrator Agent 定义
 * 代码迁移和升级专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const migratorAgent = {
  id: 'oh-my-claudecode:migrator',
  name: 'migrator',
  displayName: '迁移专家',
  description: '代码迁移、框架升级和技术栈转换的专业 Agent，使用 Sonnet 模型平衡迁移质量和效率',

  type: AgentType.SPECIAL,
  lane: 'Special',

  capabilities: [
    AgentCapability.CODE_IMPLEMENTATION,
    AgentCapability.REFACTORING,
    AgentCapability.CODE_ANALYSIS
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['code', 'migrationType'],
    optional: ['sourceVersion', 'targetVersion', 'migrationGuide'],
    schema: {
      code: {
        type: 'string',
        description: '待迁移的代码'
      },
      migrationType: {
        type: 'string',
        enum: ['framework-upgrade', 'language-migration', 'api-migration', 'library-replacement', 'architecture-migration'],
        description: '迁移类型'
      },
      sourceVersion: {
        type: 'string',
        description: '源版本或技术栈'
      },
      targetVersion: {
        type: 'string',
        description: '目标版本或技术栈'
      },
      migrationGuide: {
        type: 'object',
        description: '迁移指南'
      }
    }
  },

  output: {
    type: 'migration-result',
    schema: {
      migratedCode: {
        type: 'string',
        description: '迁移后的代码'
      },
      changes: {
        type: 'array',
        description: '迁移变更',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            description: { type: 'string' },
            before: { type: 'string' },
            after: { type: 'string' }
          }
        }
      },
      breakingChanges: {
        type: 'array',
        description: '破坏性变更'
      },
      manualSteps: {
        type: 'array',
        description: '需要手动处理的步骤'
      },
      testStrategy: {
        type: 'object',
        description: '测试策略'
      },
      rollbackPlan: {
        type: 'object',
        description: '回滚计划'
      }
    }
  },

  useCases: [
    '升级框架版本（React 17 → 18）',
    '迁移语言（JavaScript → TypeScript）',
    '替换库（Moment.js → Day.js）',
    '迁移 API（REST → GraphQL）',
    '架构迁移（Monolith → Microservices）',
    '数据库迁移',
    '云平台迁移'
  ],

  bestPractices: [
    '制定详细的迁移计划',
    '分阶段迁移',
    '保持向后兼容',
    '充分测试',
    '准备回滚方案',
    '文档化迁移过程'
  ],

  limitations: [
    '复杂迁移需要多次迭代',
    '无法直接测试迁移结果',
    '某些迁移需要架构级决策'
  ],

  dependencies: [
    'Read 工具（读取代码）',
    'Write 工具（创建迁移代码）',
    'Edit 工具（修改代码）',
    'Bash 工具（运行测试）',
    'architect Agent（架构决策）'
  ],

  performance: {
    avgExecutionTime: '10-20分钟',
    complexity: 'high'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['migration', 'upgrade', 'refactoring', 'sonnet']
  }
};

export default migratorAgent;
