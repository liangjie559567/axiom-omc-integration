/**
 * Debugger Agent 定义
 * 根因分析和问题诊断
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const debuggerAgent = {
  id: 'oh-my-claudecode:debugger',
  name: 'debugger',
  displayName: '调试专家',
  description: '根因分析、问题诊断和回归隔离的专业 Agent，使用 Sonnet 模型平衡分析深度和执行效率',

  type: AgentType.BUILD_ANALYSIS,
  lane: 'Build/Analysis Lane',

  capabilities: [
    AgentCapability.DEBUGGING,
    AgentCapability.ROOT_CAUSE_ANALYSIS,
    AgentCapability.CODE_ANALYSIS
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['issue'],
    optional: ['errorMessage', 'stackTrace', 'reproSteps', 'context'],
    schema: {
      issue: {
        type: 'string',
        description: '问题描述'
      },
      errorMessage: {
        type: 'string',
        description: '错误信息'
      },
      stackTrace: {
        type: 'string',
        description: '堆栈跟踪'
      },
      reproSteps: {
        type: 'array',
        items: { type: 'string' },
        description: '复现步骤'
      },
      context: {
        type: 'object',
        description: '上下文信息（环境、版本、配置等）'
      }
    }
  },

  output: {
    type: 'debug-report',
    schema: {
      rootCause: {
        type: 'string',
        description: '根本原因分析'
      },
      affectedComponents: {
        type: 'array',
        description: '受影响的组件列表'
      },
      reproductionAnalysis: {
        type: 'object',
        description: '复现条件分析'
      },
      fixSuggestions: {
        type: 'array',
        description: '修复建议（按优先级排序）'
      },
      preventionMeasures: {
        type: 'array',
        description: '预防措施'
      },
      relatedIssues: {
        type: 'array',
        description: '相关问题'
      }
    }
  },

  useCases: [
    '分析生产环境的 Bug 根因',
    '诊断测试失败的原因',
    '隔离回归问题的引入点',
    '分析性能问题的瓶颈',
    '识别系统异常的触发条件'
  ],

  bestPractices: [
    '提供完整的错误信息和堆栈跟踪',
    '描述清晰的复现步骤',
    '包含环境和配置信息',
    '先尝试复现问题再进行分析',
    '结合日志和监控数据进行诊断'
  ],

  limitations: [
    '需要足够的上下文信息才能准确诊断',
    '无法直接访问运行时环境',
    '复杂的并发问题可能需要多次迭代',
    '依赖于代码的可读性和文档'
  ],

  dependencies: [
    'Read 工具（读取相关代码）',
    'Grep 工具（搜索错误模式）',
    'Bash 工具（运行诊断命令）'
  ],

  performance: {
    avgExecutionTime: '3-8分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['debugging', 'root-cause', 'diagnosis', 'sonnet']
  }
};

export default debuggerAgent;
