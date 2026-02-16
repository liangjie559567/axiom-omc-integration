/**
 * Dependency Manager Agent 定义
 * 依赖管理和更新专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const dependencyManagerAgent = {
  id: 'oh-my-claudecode:dependency-manager',
  name: 'dependency-manager',
  displayName: '依赖管理器',
  description: '依赖分析、更新和冲突解决的专业 Agent，使用 Sonnet 模型平衡分析深度和效率',

  type: AgentType.SPECIAL,
  lane: 'Special',

  capabilities: [
    AgentCapability.DEPENDENCY_MANAGEMENT
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['operation'],
    optional: ['dependencies', 'constraints', 'securityAlerts'],
    schema: {
      operation: {
        type: 'string',
        enum: ['analyze', 'update', 'resolve-conflict', 'audit', 'optimize'],
        description: '操作类型'
      },
      dependencies: {
        type: 'object',
        description: '依赖清单'
      },
      constraints: {
        type: 'object',
        description: '更新约束（版本、兼容性）'
      },
      securityAlerts: {
        type: 'array',
        description: '安全警告'
      }
    }
  },

  output: {
    type: 'dependency-report',
    schema: {
      analysis: {
        type: 'object',
        description: '依赖分析'
      },
      updates: {
        type: 'array',
        description: '推荐更新',
        items: {
          type: 'object',
          properties: {
            package: { type: 'string' },
            currentVersion: { type: 'string' },
            targetVersion: { type: 'string' },
            reason: { type: 'string' },
            breaking: { type: 'boolean' }
          }
        }
      },
      conflicts: {
        type: 'array',
        description: '依赖冲突'
      },
      securityIssues: {
        type: 'array',
        description: '安全问题'
      },
      recommendations: {
        type: 'array',
        description: '优化建议'
      }
    }
  },

  useCases: [
    '分析依赖树',
    '更新依赖版本',
    '解决依赖冲突',
    '审计安全漏洞',
    '优化依赖大小',
    '识别未使用的依赖',
    '管理依赖版本'
  ],

  bestPractices: [
    '定期审计依赖',
    '优先修复安全问题',
    '测试依赖更新',
    '使用语义化版本',
    '锁定依赖版本',
    '清理未使用的依赖'
  ],

  limitations: [
    '无法直接测试兼容性',
    '某些冲突需要人工决策',
    '依赖于包管理器的信息'
  ],

  dependencies: [
    'Read 工具（读取依赖文件）',
    'Write 工具（更新依赖）',
    'Bash 工具（运行包管理器）'
  ],

  performance: {
    avgExecutionTime: '3-6分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['dependency', 'package', 'npm', 'security', 'sonnet']
  }
};

export default dependencyManagerAgent;
