/**
 * Mobile Specialist Agent 定义
 * 移动应用开发专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const mobileSpecialistAgent = {
  id: 'oh-my-claudecode:mobile-specialist',
  name: 'mobile-specialist',
  displayName: '移动开发专家',
  description: 'iOS、Android 和跨平台移动应用开发的专业 Agent，使用 Sonnet 模型平衡开发质量和效率',

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
    required: ['task', 'platform'],
    optional: ['framework', 'design', 'nativeModules'],
    schema: {
      task: {
        type: 'string',
        description: '移动开发任务'
      },
      platform: {
        type: 'string',
        enum: ['ios', 'android', 'cross-platform'],
        description: '目标平台'
      },
      framework: {
        type: 'string',
        enum: ['react-native', 'flutter', 'swift', 'kotlin', 'xamarin'],
        description: '开发框架'
      },
      design: {
        type: 'object',
        description: 'UI/UX 设计规范'
      },
      nativeModules: {
        type: 'array',
        description: '需要的原生模块'
      }
    }
  },

  output: {
    type: 'mobile-implementation',
    schema: {
      screens: {
        type: 'array',
        description: '屏幕/页面实现'
      },
      components: {
        type: 'array',
        description: '组件实现'
      },
      navigation: {
        type: 'object',
        description: '导航配置'
      },
      nativeCode: {
        type: 'object',
        description: '原生代码（如需要）'
      },
      tests: {
        type: 'array',
        description: '测试代码'
      },
      documentation: {
        type: 'string',
        description: '实现文档'
      }
    }
  },

  useCases: [
    '实现移动应用界面',
    '集成原生功能（相机、GPS、推送）',
    '实现离线功能',
    '优化移动性能',
    '实现响应式布局',
    '集成第三方 SDK',
    '实现应用内购买'
  ],

  bestPractices: [
    '遵循平台设计指南（iOS HIG、Material Design）',
    '优化性能和电池使用',
    '实现适当的错误处理',
    '考虑不同屏幕尺寸',
    '实现离线支持',
    '编写单元和 UI 测试'
  ],

  limitations: [
    '需要明确的设计规范',
    '无法直接测试真机',
    '某些原生功能需要实际设备'
  ],

  dependencies: [
    'Read 工具（读取现有代码）',
    'Write 工具（创建组件）',
    'Edit 工具（修改代码）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['mobile', 'ios', 'android', 'react-native', 'sonnet']
  }
};

export default mobileSpecialistAgent;
