/**
 * Frontend Specialist Agent 定义
 * 前端开发专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const frontendSpecialistAgent = {
  id: 'oh-my-claudecode:frontend-specialist',
  name: 'frontend-specialist',
  displayName: '前端开发专家',
  description: '前端开发、UI 组件和用户体验实现的专业 Agent，使用 Sonnet 模型平衡开发质量和效率',

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
    required: ['task', 'framework'],
    optional: ['design', 'components', 'stateManagement'],
    schema: {
      task: {
        type: 'string',
        description: '前端开发任务'
      },
      framework: {
        type: 'string',
        enum: ['react', 'vue', 'angular', 'svelte', 'vanilla'],
        description: '前端框架'
      },
      design: {
        type: 'object',
        description: '设计规范（UI/UX）'
      },
      components: {
        type: 'array',
        description: '现有组件库'
      },
      stateManagement: {
        type: 'string',
        description: '状态管理方案'
      }
    }
  },

  output: {
    type: 'frontend-implementation',
    schema: {
      components: {
        type: 'array',
        description: '组件实现'
      },
      styles: {
        type: 'object',
        description: '样式代码'
      },
      tests: {
        type: 'array',
        description: '组件测试'
      },
      documentation: {
        type: 'string',
        description: '组件文档'
      }
    }
  },

  useCases: [
    '实现 React/Vue/Angular 组件',
    '构建响应式布局',
    '实现状态管理',
    '优化前端性能',
    '实现无障碍访问',
    '集成 UI 组件库',
    '实现动画和交互'
  ],

  bestPractices: [
    '遵循框架最佳实践',
    '编写可复用的组件',
    '实现响应式设计',
    '优化性能（懒加载、代码分割）',
    '确保无障碍访问',
    '编写组件测试'
  ],

  limitations: [
    '需要明确的设计规范',
    '无法直接测试浏览器兼容性',
    '某些交互需要实际用户测试'
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
    tags: ['frontend', 'ui', 'react', 'vue', 'sonnet']
  }
};

export default frontendSpecialistAgent;
