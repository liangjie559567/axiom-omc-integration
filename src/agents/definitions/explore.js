/**
 * Explore Agent 定义
 * 快速代码库探索和符号映射
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const exploreAgent = {
  id: 'oh-my-claudecode:explore',
  name: 'explore',
  displayName: '代码探索器',
  description: '快速代码库探索、文件发现和符号映射的专业 Agent，使用 Haiku 模型实现高速低成本扫描',

  type: AgentType.BUILD_ANALYSIS,
  lane: 'Build/Analysis Lane',

  capabilities: [
    AgentCapability.CODEBASE_EXPLORATION,
    AgentCapability.CODE_ANALYSIS
  ],

  preferredModel: AgentModel.HAIKU,
  supportedModels: [AgentModel.HAIKU, AgentModel.SONNET],

  input: {
    required: ['target'],
    optional: ['pattern', 'depth', 'fileTypes', 'excludePatterns'],
    schema: {
      target: {
        type: 'string',
        description: '探索目标（文件路径、目录或搜索模式）'
      },
      pattern: {
        type: 'string',
        description: '搜索模式（支持 glob 和正则表达式）'
      },
      depth: {
        type: 'string',
        enum: ['quick', 'medium', 'thorough'],
        default: 'medium',
        description: '探索深度级别'
      },
      fileTypes: {
        type: 'array',
        items: { type: 'string' },
        description: '文件类型过滤（如：[".js", ".ts"]）'
      },
      excludePatterns: {
        type: 'array',
        items: { type: 'string' },
        description: '排除模式（如：["node_modules", "dist"]）'
      }
    }
  },

  output: {
    type: 'exploration-report',
    schema: {
      files: {
        type: 'array',
        description: '发现的文件列表'
      },
      symbols: {
        type: 'object',
        description: '符号映射（函数、类、变量等）'
      },
      structure: {
        type: 'object',
        description: '代码库结构概览'
      },
      insights: {
        type: 'array',
        description: '探索发现和建议'
      }
    }
  },

  useCases: [
    '快速了解新代码库的结构和组织',
    '查找特定功能或模块的位置',
    '识别代码库中的关键文件和入口点',
    '生成代码库导航地图',
    '为后续深度分析提供上下文'
  ],

  bestPractices: [
    '使用 "quick" 深度进行初步扫描，然后根据需要深入',
    '合理使用 excludePatterns 排除无关目录（如 node_modules）',
    '结合 fileTypes 过滤聚焦特定技术栈',
    '探索结果可作为其他 Agent 的输入上下文'
  ],

  limitations: [
    '使用 Haiku 模型，深度分析能力有限',
    '大型代码库（>10000 文件）可能需要分批探索',
    '不执行代码语义分析，仅做结构扫描'
  ],

  dependencies: [
    'Glob 工具（文件搜索）',
    'Grep 工具（内容搜索）',
    'Read 工具（文件读取）'
  ],

  performance: {
    avgExecutionTime: '30秒-2分钟',
    complexity: 'low'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['exploration', 'codebase', 'fast', 'haiku']
  }
};

export default exploreAgent;
