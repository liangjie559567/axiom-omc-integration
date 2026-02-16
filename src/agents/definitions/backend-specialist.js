/**
 * Backend Specialist Agent 定义
 * 后端开发专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const backendSpecialistAgent = {
  id: 'oh-my-claudecode:backend-specialist',
  name: 'backend-specialist',
  displayName: '后端开发专家',
  description: '后端服务、API 和数据处理实现的专业 Agent，使用 Sonnet 模型平衡开发质量和效率',

  type: AgentType.DOMAIN_SPECIALIST,
  lane: 'Domain Specialists',

  capabilities: [
    AgentCapability.CODE_IMPLEMENTATION,
    AgentCapability.CODE_ANALYSIS,
    AgentCapability.REFACTORING
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['task', 'technology'],
    optional: ['architecture', 'database', 'apiSpec'],
    schema: {
      task: {
        type: 'string',
        description: '后端开发任务'
      },
      technology: {
        type: 'string',
        description: '技术栈（Node.js, Python, Java, Go 等）'
      },
      architecture: {
        type: 'object',
        description: '架构设计'
      },
      database: {
        type: 'object',
        description: '数据库配置和 Schema'
      },
      apiSpec: {
        type: 'object',
        description: 'API 规范'
      }
    }
  },

  output: {
    type: 'backend-implementation',
    schema: {
      services: {
        type: 'array',
        description: '服务实现'
      },
      apis: {
        type: 'array',
        description: 'API 端点'
      },
      models: {
        type: 'array',
        description: '数据模型'
      },
      tests: {
        type: 'array',
        description: '单元和集成测试'
      },
      documentation: {
        type: 'string',
        description: 'API 文档'
      }
    }
  },

  useCases: [
    '实现 REST/GraphQL API',
    '构建微服务',
    '实现数据库操作',
    '实现认证和授权',
    '实现业务逻辑',
    '集成第三方服务',
    '实现消息队列和异步处理'
  ],

  bestPractices: [
    '遵循 RESTful 或 GraphQL 最佳实践',
    '实现适当的错误处理',
    '编写单元和集成测试',
    '实现日志和监控',
    '考虑安全性和性能',
    '编写清晰的 API 文档'
  ],

  limitations: [
    '需要明确的架构设计',
    '无法直接测试生产环境',
    '某些集成需要实际服务'
  ],

  dependencies: [
    'Read 工具（读取现有代码）',
    'Write 工具（创建服务）',
    'Edit 工具（修改代码）',
    'Bash 工具（运行测试）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['backend', 'api', 'server', 'sonnet']
  }
};

export default backendSpecialistAgent;
