/**
 * Testing Specialist Agent 定义
 * 测试策略和实现专家
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const testingSpecialistAgent = {
  id: 'oh-my-claudecode:testing-specialist',
  name: 'testing-specialist',
  displayName: '测试专家',
  description: '测试策略制定、测试实现和质量保证的专业 Agent，使用 Sonnet 模型平衡测试覆盖和效率',

  type: AgentType.DOMAIN_SPECIALIST,
  lane: 'Domain Specialists',

  capabilities: [
    AgentCapability.TEST_STRATEGY,
    AgentCapability.TEST_IMPLEMENTATION,
    AgentCapability.CODE_IMPLEMENTATION
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['code', 'testType'],
    optional: ['requirements', 'existingTests', 'framework'],
    schema: {
      code: {
        type: 'string',
        description: '待测试的代码'
      },
      testType: {
        type: 'string',
        enum: ['unit', 'integration', 'e2e', 'performance', 'security'],
        description: '测试类型'
      },
      requirements: {
        type: 'array',
        description: '测试需求'
      },
      existingTests: {
        type: 'string',
        description: '现有测试'
      },
      framework: {
        type: 'string',
        description: '测试框架（Jest、Mocha、Pytest 等）'
      }
    }
  },

  output: {
    type: 'testing-implementation',
    schema: {
      testStrategy: {
        type: 'object',
        description: '测试策略'
      },
      tests: {
        type: 'array',
        description: '测试代码'
      },
      fixtures: {
        type: 'array',
        description: '测试数据和 Mock'
      },
      coverage: {
        type: 'object',
        description: '预期覆盖率'
      },
      documentation: {
        type: 'string',
        description: '测试文档'
      }
    }
  },

  useCases: [
    '制定测试策略',
    '编写单元测试',
    '实现集成测试',
    '创建端到端测试',
    '实现性能测试',
    '创建测试数据和 Mock',
    '优化测试覆盖率'
  ],

  bestPractices: [
    '遵循测试金字塔原则',
    '编写可读性强的测试',
    '使用适当的 Mock 和 Stub',
    '测试边界条件和异常',
    '保持测试独立性',
    '优化测试执行速度'
  ],

  limitations: [
    '需要理解代码逻辑',
    '无法直接执行测试',
    '某些测试需要实际环境'
  ],

  dependencies: [
    'Read 工具（读取代码）',
    'Write 工具（创建测试）',
    'Bash 工具（运行测试）'
  ],

  performance: {
    avgExecutionTime: '5-10分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['testing', 'qa', 'unit-test', 'integration-test', 'sonnet']
  }
};

export default testingSpecialistAgent;
