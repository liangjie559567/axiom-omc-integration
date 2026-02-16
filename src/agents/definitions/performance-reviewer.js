/**
 * Performance Reviewer Agent 定义
 * 性能问题和优化建议
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const performanceReviewerAgent = {
  id: 'oh-my-claudecode:performance-reviewer',
  name: 'performance-reviewer',
  displayName: '性能审查员',
  description: '性能瓶颈识别、资源使用分析和优化建议的专业 Agent，使用 Sonnet 模型平衡分析深度和效率',

  type: AgentType.REVIEW,
  lane: 'Review Lane',

  capabilities: [
    AgentCapability.PERFORMANCE_REVIEW,
    AgentCapability.CODE_REVIEW
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['code'],
    optional: ['performanceMetrics', 'benchmarks', 'profilerData'],
    schema: {
      code: {
        type: 'string',
        description: '待审查的代码'
      },
      performanceMetrics: {
        type: 'object',
        description: '性能指标（响应时间、吞吐量、资源使用）'
      },
      benchmarks: {
        type: 'object',
        description: '性能基准'
      },
      profilerData: {
        type: 'object',
        description: '性能分析数据'
      }
    }
  },

  output: {
    type: 'performance-review-report',
    schema: {
      bottlenecks: {
        type: 'array',
        description: '性能瓶颈',
        items: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            type: { type: 'string' },
            severity: { type: 'string' },
            impact: { type: 'string' },
            description: { type: 'string' }
          }
        }
      },
      optimizations: {
        type: 'array',
        description: '优化建议',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            suggestion: { type: 'string' },
            expectedImprovement: { type: 'string' },
            effort: { type: 'string' }
          }
        }
      },
      resourceUsage: {
        type: 'object',
        description: '资源使用分析'
      },
      algorithmicComplexity: {
        type: 'object',
        description: '算法复杂度分析'
      },
      recommendations: {
        type: 'array',
        description: '性能改进建议'
      }
    }
  },

  useCases: [
    '识别性能瓶颈（CPU、内存、I/O）',
    '分析算法复杂度',
    '检查不必要的计算和重复操作',
    '识别内存泄漏风险',
    '评估数据库查询效率',
    '检查缓存策略',
    '分析并发和异步处理'
  ],

  bestPractices: [
    '提供性能分析数据和基准',
    '关注热点代码路径',
    '考虑实际使用场景和负载',
    '平衡性能和可读性',
    '使用性能分析工具验证优化效果'
  ],

  limitations: [
    '静态分析无法完全预测运行时性能',
    '需要实际性能数据才能准确评估',
    '某些优化需要权衡其他质量属性'
  ],

  dependencies: [
    'Read 工具（读取代码）',
    'Grep 工具（搜索性能模式）'
  ],

  performance: {
    avgExecutionTime: '3-6分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['review', 'performance', 'optimization', 'sonnet']
  }
};

export default performanceReviewerAgent;
