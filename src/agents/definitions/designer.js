/**
 * Designer Agent 定义
 * UI/UX 设计专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const designerAgent = {
  id: 'oh-my-claudecode:designer',
  name: 'designer',
  displayName: 'UI/UX 设计师',
  description: 'UI/UX 设计、交互设计和视觉设计的专业 Agent，使用 Sonnet 模型平衡设计质量和效率',

  type: AgentType.PRODUCT,
  lane: 'Product Lane',

  capabilities: [
    AgentCapability.INFORMATION_ARCHITECTURE
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['designGoal'],
    optional: ['requirements', 'brandGuidelines', 'userResearch', 'constraints'],
    schema: {
      designGoal: {
        type: 'string',
        description: '设计目标'
      },
      requirements: {
        type: 'object',
        description: '功能和内容需求'
      },
      brandGuidelines: {
        type: 'object',
        description: '品牌指南'
      },
      userResearch: {
        type: 'object',
        description: '用户研究结果'
      },
      constraints: {
        type: 'object',
        description: '设计约束（技术、平台、无障碍）'
      }
    }
  },

  output: {
    type: 'design-specification',
    schema: {
      wireframes: {
        type: 'array',
        description: '线框图描述'
      },
      layouts: {
        type: 'array',
        description: '布局设计'
      },
      interactions: {
        type: 'array',
        description: '交互设计'
      },
      visualDesign: {
        type: 'object',
        description: '视觉设计规范（颜色、字体、间距）'
      },
      components: {
        type: 'array',
        description: '组件设计'
      },
      accessibility: {
        type: 'object',
        description: '无障碍设计指南'
      }
    }
  },

  useCases: [
    '设计用户界面',
    '创建交互原型',
    '制定设计系统',
    '设计信息架构',
    '优化用户流程',
    '确保无障碍访问',
    '创建响应式设计'
  ],

  bestPractices: [
    '遵循设计原则',
    '保持一致性',
    '考虑用户需求',
    '确保无障碍访问',
    '优化移动体验',
    '使用设计系统'
  ],

  limitations: [
    '无法生成实际设计文件',
    '需要设计工具实现',
    '某些设计需要视觉专业知识'
  ],

  dependencies: [
    'ux-researcher Agent（用户研究）',
    'frontend-specialist Agent（实现）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['design', 'ui', 'ux', 'interaction', 'sonnet']
  }
};

export default designerAgent;
