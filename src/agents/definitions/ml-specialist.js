/**
 * ML Specialist Agent 定义
 * 机器学习和 AI 专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const mlSpecialistAgent = {
  id: 'oh-my-claudecode:ml-specialist',
  name: 'ml-specialist',
  displayName: '机器学习专家',
  description: '机器学习模型开发、训练和部署的专业 Agent，使用 Opus 模型确保 ML 实现的准确性',

  type: AgentType.DOMAIN_SPECIALIST,
  lane: 'Domain Specialists',

  capabilities: [
    AgentCapability.CODE_IMPLEMENTATION,
    AgentCapability.DATA_ANALYSIS,
    AgentCapability.SYSTEM_DESIGN
  ],

  preferredModel: AgentModel.OPUS,
  supportedModels: [AgentModel.OPUS, AgentModel.SONNET],

  input: {
    required: ['task', 'problemType'],
    optional: ['dataset', 'requirements', 'constraints'],
    schema: {
      task: {
        type: 'string',
        description: 'ML 任务'
      },
      problemType: {
        type: 'string',
        enum: ['classification', 'regression', 'clustering', 'nlp', 'cv', 'recommendation'],
        description: '问题类型'
      },
      dataset: {
        type: 'object',
        description: '数据集信息'
      },
      requirements: {
        type: 'object',
        description: '性能和准确度要求'
      },
      constraints: {
        type: 'object',
        description: '约束条件（计算资源、延迟等）'
      }
    }
  },

  output: {
    type: 'ml-implementation',
    schema: {
      model: {
        type: 'object',
        description: '模型架构和配置'
      },
      training: {
        type: 'object',
        description: '训练代码和配置'
      },
      evaluation: {
        type: 'object',
        description: '评估指标和结果'
      },
      deployment: {
        type: 'object',
        description: '部署配置'
      },
      documentation: {
        type: 'string',
        description: '模型文档'
      }
    }
  },

  useCases: [
    '设计和实现 ML 模型',
    '进行特征工程',
    '实现模型训练管道',
    '优化模型性能',
    '实现模型评估',
    '部署 ML 模型',
    '实现模型监控'
  ],

  bestPractices: [
    '理解问题和数据特征',
    '选择合适的模型架构',
    '实现适当的数据预处理',
    '使用交叉验证',
    '监控模型性能',
    '文档化模型和实验'
  ],

  limitations: [
    '需要足够的训练数据',
    '无法直接训练大型模型',
    '某些问题需要领域专业知识'
  ],

  dependencies: [
    'Read 工具（读取数据）',
    'Write 工具（保存模型）',
    'Bash 工具（运行训练）'
  ],

  performance: {
    avgExecutionTime: '10-20分钟',
    complexity: 'high'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['ml', 'ai', 'machine-learning', 'opus']
  }
};

export default mlSpecialistAgent;
