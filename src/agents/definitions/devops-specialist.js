/**
 * DevOps Specialist Agent 定义
 * DevOps 和基础设施专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const devopsSpecialistAgent = {
  id: 'oh-my-claudecode:devops-specialist',
  name: 'devops-specialist',
  displayName: 'DevOps 专家',
  description: 'CI/CD、容器化和基础设施即代码的专业 Agent，使用 Sonnet 模型平衡实施质量和效率',

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
    required: ['task', 'platform'],
    optional: ['infrastructure', 'requirements', 'constraints'],
    schema: {
      task: {
        type: 'string',
        description: 'DevOps 任务'
      },
      platform: {
        type: 'string',
        enum: ['aws', 'azure', 'gcp', 'kubernetes', 'docker'],
        description: '目标平台'
      },
      infrastructure: {
        type: 'object',
        description: '现有基础设施'
      },
      requirements: {
        type: 'object',
        description: '部署和运维需求'
      },
      constraints: {
        type: 'object',
        description: '约束条件（预算、合规等）'
      }
    }
  },

  output: {
    type: 'devops-implementation',
    schema: {
      pipelines: {
        type: 'array',
        description: 'CI/CD 管道配置'
      },
      infrastructure: {
        type: 'object',
        description: '基础设施代码'
      },
      containers: {
        type: 'array',
        description: 'Docker/容器配置'
      },
      monitoring: {
        type: 'object',
        description: '监控和告警配置'
      },
      documentation: {
        type: 'string',
        description: '部署文档'
      }
    }
  },

  useCases: [
    '配置 CI/CD 管道',
    '编写 Dockerfile 和容器编排',
    '实现基础设施即代码（Terraform、CloudFormation）',
    '配置监控和日志',
    '实现自动化部署',
    '配置负载均衡和扩展',
    '实现灾难恢复'
  ],

  bestPractices: [
    '使用基础设施即代码',
    '实现自动化测试和部署',
    '配置适当的监控和告警',
    '实现安全最佳实践',
    '文档化部署流程',
    '实现回滚机制'
  ],

  limitations: [
    '需要了解目标平台',
    '无法直接测试生产环境',
    '某些配置需要实际权限'
  ],

  dependencies: [
    'Read 工具（读取配置）',
    'Write 工具（创建配置）',
    'Bash 工具（运行部署）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['devops', 'cicd', 'infrastructure', 'sonnet']
  }
};

export default devopsSpecialistAgent;
