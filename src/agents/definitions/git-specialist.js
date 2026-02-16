/**
 * Git Specialist Agent 定义
 * Git 操作和版本控制专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const gitSpecialistAgent = {
  id: 'oh-my-claudecode:git-specialist',
  name: 'git-specialist',
  displayName: 'Git 专家',
  description: 'Git 操作、分支管理和版本控制的专业 Agent，使用 Haiku 模型实现快速操作',

  type: AgentType.DOMAIN_SPECIALIST,
  lane: 'Domain Specialists',

  capabilities: [
    AgentCapability.GIT_OPERATIONS
  ],

  preferredModel: AgentModel.HAIKU,
  supportedModels: [AgentModel.HAIKU, AgentModel.SONNET],

  input: {
    required: ['operation'],
    optional: ['branch', 'files', 'message', 'options'],
    schema: {
      operation: {
        type: 'string',
        enum: ['commit', 'branch', 'merge', 'rebase', 'cherry-pick', 'stash', 'reset', 'revert'],
        description: 'Git 操作类型'
      },
      branch: {
        type: 'string',
        description: '分支名称'
      },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: '文件列表'
      },
      message: {
        type: 'string',
        description: '提交信息'
      },
      options: {
        type: 'object',
        description: '操作选项'
      }
    }
  },

  output: {
    type: 'git-operation-result',
    schema: {
      commands: {
        type: 'array',
        description: 'Git 命令序列'
      },
      result: {
        type: 'object',
        description: '操作结果'
      },
      conflicts: {
        type: 'array',
        description: '冲突信息（如有）'
      },
      recommendations: {
        type: 'array',
        description: '操作建议'
      }
    }
  },

  useCases: [
    '创建和管理分支',
    '提交代码变更',
    '合并分支',
    '解决合并冲突',
    '回退变更',
    '管理 stash',
    '重写提交历史'
  ],

  bestPractices: [
    '编写清晰的提交信息',
    '频繁提交小的变更',
    '使用分支进行功能开发',
    '定期同步远程分支',
    '谨慎使用 rebase 和 reset',
    '解决冲突前备份'
  ],

  limitations: [
    '无法直接执行 Git 命令',
    '某些操作需要用户确认',
    '复杂冲突需要人工解决'
  ],

  dependencies: [
    'Bash 工具（执行 Git 命令）',
    'Read 工具（读取文件）'
  ],

  performance: {
    avgExecutionTime: '30秒-2分钟',
    complexity: 'low'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['git', 'version-control', 'scm', 'haiku']
  }
};

export default gitSpecialistAgent;
