/**
 * Database Specialist Agent 定义
 * 数据库设计和优化专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const databaseSpecialistAgent = {
  id: 'oh-my-claudecode:database-specialist',
  name: 'database-specialist',
  displayName: '数据库专家',
  description: '数据库设计、查询优化和数据建模的专业 Agent，使用 Sonnet 模型平衡设计质量和效率',

  type: AgentType.DOMAIN_SPECIALIST,
  lane: 'Domain Specialists',

  capabilities: [
    AgentCapability.CODE_IMPLEMENTATION,
    AgentCapability.CODE_ANALYSIS,
    AgentCapability.SYSTEM_DESIGN
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['task', 'databaseType'],
    optional: ['schema', 'requirements', 'performanceGoals'],
    schema: {
      task: {
        type: 'string',
        description: '数据库任务'
      },
      databaseType: {
        type: 'string',
        enum: ['sql', 'nosql', 'graph', 'timeseries'],
        description: '数据库类型'
      },
      schema: {
        type: 'object',
        description: '现有数据库 Schema'
      },
      requirements: {
        type: 'object',
        description: '数据需求'
      },
      performanceGoals: {
        type: 'object',
        description: '性能目标'
      }
    }
  },

  output: {
    type: 'database-implementation',
    schema: {
      schema: {
        type: 'object',
        description: '数据库 Schema 设计'
      },
      migrations: {
        type: 'array',
        description: '数据库迁移脚本'
      },
      queries: {
        type: 'array',
        description: '优化的查询'
      },
      indexes: {
        type: 'array',
        description: '索引设计'
      },
      documentation: {
        type: 'string',
        description: '数据库文档'
      }
    }
  },

  useCases: [
    '设计数据库 Schema',
    '优化 SQL 查询',
    '设计索引策略',
    '实现数据迁移',
    '设计数据分区',
    '优化数据库性能',
    '设计数据备份策略'
  ],

  bestPractices: [
    '遵循数据库范式',
    '设计适当的索引',
    '考虑查询性能',
    '实现数据完整性约束',
    '规划数据增长和扩展',
    '编写清晰的迁移脚本'
  ],

  limitations: [
    '需要理解业务数据模型',
    '无法直接测试生产负载',
    '某些优化需要实际数据验证'
  ],

  dependencies: [
    'Read 工具（读取 Schema）',
    'Write 工具（创建迁移）',
    'Bash 工具（运行迁移）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['database', 'sql', 'schema', 'sonnet']
  }
};

export default databaseSpecialistAgent;
