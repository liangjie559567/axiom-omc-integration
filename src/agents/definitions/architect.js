/**
 * Architect Agent 定义
 * 系统设计和架构决策
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const architectAgent = {
  id: 'oh-my-claudecode:architect',
  name: 'architect',
  displayName: '系统架构师',
  description: '系统设计、架构决策和长期技术权衡的专业 Agent，使用 Opus 模型确保架构的合理性和可扩展性',

  type: AgentType.BUILD_ANALYSIS,
  lane: 'Build/Analysis Lane',

  capabilities: [
    AgentCapability.ARCHITECTURE_DESIGN,
    AgentCapability.SYSTEM_DESIGN
  ],

  preferredModel: AgentModel.OPUS,
  supportedModels: [AgentModel.OPUS],

  input: {
    required: ['requirement', 'scope'],
    optional: ['existingArchitecture', 'constraints', 'qualityAttributes'],
    schema: {
      requirement: {
        type: 'string',
        description: '功能需求或架构问题'
      },
      scope: {
        type: 'string',
        enum: ['module', 'subsystem', 'system'],
        description: '架构设计范围'
      },
      existingArchitecture: {
        type: 'object',
        description: '现有架构描述'
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: '技术约束（性能、安全、兼容性等）'
      },
      qualityAttributes: {
        type: 'array',
        items: { type: 'string' },
        description: '质量属性优先级（可维护性、可扩展性、性能等）'
      }
    }
  },

  output: {
    type: 'architecture-design',
    schema: {
      overview: {
        type: 'string',
        description: '架构概览'
      },
      components: {
        type: 'array',
        description: '组件定义和职责'
      },
      interfaces: {
        type: 'array',
        description: '接口定义'
      },
      dataFlow: {
        type: 'object',
        description: '数据流设计'
      },
      tradeoffs: {
        type: 'array',
        description: '架构权衡分析'
      },
      alternatives: {
        type: 'array',
        description: '备选方案'
      },
      recommendations: {
        type: 'array',
        description: '实施建议'
      }
    }
  },

  useCases: [
    '设计新功能的架构方案',
    '评估现有架构的合理性',
    '进行架构重构决策',
    '解决架构层面的技术债务',
    '制定技术选型方案',
    '设计系统边界和接口'
  ],

  bestPractices: [
    '提供完整的现有架构信息',
    '明确质量属性的优先级',
    '考虑长期演化和可维护性',
    '评估多个备选方案的权衡',
    '架构决策应文档化并与团队对齐'
  ],

  limitations: [
    '需要深入的领域知识和上下文',
    '架构设计需要与实际实施验证',
    '无法替代团队的架构评审',
    '仅使用 Opus 模型，成本较高'
  ],

  dependencies: [
    'explore Agent（了解代码库结构）',
    'analyst Agent（理解需求）',
    'Read 工具（读取现有代码）'
  ],

  performance: {
    avgExecutionTime: '10-20分钟',
    complexity: 'high'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['architecture', 'design', 'system', 'opus']
  }
};

export default architectAgent;
