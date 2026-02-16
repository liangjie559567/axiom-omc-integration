/**
 * Build Fixer Agent 定义
 * 构建错误修复专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const buildFixerAgent = {
  id: 'oh-my-claudecode:build-fixer',
  name: 'build-fixer',
  displayName: '构建修复器',
  description: '构建错误诊断和快速修复的专业 Agent，使用 Haiku 模型实现快速响应',

  type: AgentType.SPECIAL,
  lane: 'Special',

  capabilities: [
    AgentCapability.BUILD_FIXING,
    AgentCapability.DEBUGGING
  ],

  preferredModel: AgentModel.HAIKU,
  supportedModels: [AgentModel.HAIKU, AgentModel.SONNET],

  input: {
    required: ['buildError'],
    optional: ['buildConfig', 'environment', 'recentChanges'],
    schema: {
      buildError: {
        type: 'string',
        description: '构建错误信息'
      },
      buildConfig: {
        type: 'object',
        description: '构建配置'
      },
      environment: {
        type: 'object',
        description: '环境信息'
      },
      recentChanges: {
        type: 'array',
        description: '最近的代码变更'
      }
    }
  },

  output: {
    type: 'build-fix',
    schema: {
      diagnosis: {
        type: 'string',
        description: '错误诊断'
      },
      fixes: {
        type: 'array',
        description: '修复方案',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            changes: { type: 'array' },
            confidence: { type: 'string' }
          }
        }
      },
      commands: {
        type: 'array',
        description: '修复命令'
      },
      preventionTips: {
        type: 'array',
        description: '预防建议'
      }
    }
  },

  useCases: [
    '修复编译错误',
    '解决依赖冲突',
    '修复配置问题',
    '解决环境问题',
    '修复打包错误',
    '解决测试失败',
    '修复 CI/CD 问题'
  ],

  bestPractices: [
    '快速识别常见错误',
    '提供多个修复方案',
    '验证修复效果',
    '记录修复过程',
    '提供预防建议',
    '优先简单修复'
  ],

  limitations: [
    '使用 Haiku 模型，复杂问题分析有限',
    '无法直接执行修复',
    '某些问题需要深度调试'
  ],

  dependencies: [
    'Read 工具（读取配置）',
    'Bash 工具（运行构建）',
    'debugger Agent（复杂问题）'
  ],

  performance: {
    avgExecutionTime: '1-3分钟',
    complexity: 'low'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['build', 'fix', 'debugging', 'haiku']
  }
};

export default buildFixerAgent;
