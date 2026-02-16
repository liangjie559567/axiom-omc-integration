/**
 * Data Specialist Agent 定义
 * 数据分析和处理专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const dataSpecialistAgent = {
  id: 'oh-my-claudecode:data-specialist',
  name: 'data-specialist',
  displayName: '数据分析专家',
  description: '数据分析、ETL 和数据可视化的专业 Agent，使用 Sonnet 模型平衡分析深度和效率',

  type: AgentType.DOMAIN_SPECIALIST,
  lane: 'Domain Specialists',

  capabilities: [
    AgentCapability.CODE_IMPLEMENTATION,
    AgentCapability.DATA_ANALYSIS,
    AgentCapability.CODE_ANALYSIS
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['task', 'dataSource'],
    optional: ['schema', 'requirements', 'visualizationNeeds'],
    schema: {
      task: {
        type: 'string',
        description: '数据任务'
      },
      dataSource: {
        type: 'object',
        description: '数据源信息'
      },
      schema: {
        type: 'object',
        description: '数据 Schema'
      },
      requirements: {
        type: 'object',
        description: '分析需求'
      },
      visualizationNeeds: {
        type: 'object',
        description: '可视化需求'
      }
    }
  },

  output: {
    type: 'data-implementation',
    schema: {
      pipeline: {
        type: 'object',
        description: 'ETL/数据处理管道'
      },
      analysis: {
        type: 'object',
        description: '数据分析结果'
      },
      visualizations: {
        type: 'array',
        description: '可视化配置'
      },
      insights: {
        type: 'array',
        description: '数据洞察'
      },
      documentation: {
        type: 'string',
        description: '分析文档'
      }
    }
  },

  useCases: [
    '实现 ETL 数据管道',
    '执行数据清洗和转换',
    '进行探索性数据分析',
    '创建数据可视化',
    '实现数据聚合和统计',
    '构建数据报表',
    '实现数据质量检查'
  ],

  bestPractices: [
    '理解数据质量和完整性',
    '实现可重复的数据管道',
    '选择合适的可视化类型',
    '文档化数据转换逻辑',
    '考虑数据隐私和安全',
    '优化数据处理性能'
  ],

  limitations: [
    '需要访问实际数据',
    '某些分析需要领域知识',
    '大数据处理可能需要专门工具'
  ],

  dependencies: [
    'Read 工具（读取数据）',
    'Write 工具（保存结果）',
    'Bash 工具（运行脚本）'
  ],

  performance: {
    avgExecutionTime: '5-15分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['data', 'analytics', 'etl', 'visualization', 'sonnet']
  }
};

export default dataSpecialistAgent;
