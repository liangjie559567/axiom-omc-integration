/**
 * Security Reviewer Agent 定义
 * 安全漏洞和威胁分析
 */

import { AgentType, AgentModel, AgentCapability } from '../schemas/agent-schema.js';

export const securityReviewerAgent = {
  id: 'oh-my-claudecode:security-reviewer',
  name: 'security-reviewer',
  displayName: '安全审查员',
  description: '安全漏洞识别、威胁分析和安全最佳实践审查的专业 Agent，使用 Sonnet 模型确保代码安全',

  type: AgentType.REVIEW,
  lane: 'Review Lane',

  capabilities: [
    AgentCapability.SECURITY_REVIEW,
    AgentCapability.CODE_REVIEW
  ],

  preferredModel: AgentModel.SONNET,
  supportedModels: [AgentModel.SONNET, AgentModel.OPUS],

  input: {
    required: ['code'],
    optional: ['context', 'threatModel', 'complianceRequirements'],
    schema: {
      code: {
        type: 'string',
        description: '待审查的代码'
      },
      context: {
        type: 'object',
        description: '安全上下文（认证、授权、数据流）'
      },
      threatModel: {
        type: 'object',
        description: '威胁模型'
      },
      complianceRequirements: {
        type: 'array',
        items: { type: 'string' },
        description: '合规要求（OWASP、GDPR 等）'
      }
    }
  },

  output: {
    type: 'security-review-report',
    schema: {
      vulnerabilities: {
        type: 'array',
        description: '发现的漏洞',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            category: { type: 'string' },
            location: { type: 'string' },
            description: { type: 'string' },
            cwe: { type: 'string' },
            remediation: { type: 'string' }
          }
        }
      },
      threatAnalysis: {
        type: 'object',
        description: '威胁分析'
      },
      complianceGaps: {
        type: 'array',
        description: '合规性差距'
      },
      recommendations: {
        type: 'array',
        description: '安全改进建议'
      },
      riskScore: {
        type: 'number',
        description: '风险评分（0-100）'
      }
    }
  },

  useCases: [
    '识别 OWASP Top 10 漏洞',
    '检查注入攻击风险（SQL、XSS、命令注入）',
    '验证认证和授权机制',
    '检查敏感数据处理',
    '评估加密和哈希使用',
    '识别不安全的依赖',
    '检查安全配置'
  ],

  bestPractices: [
    '提供完整的安全上下文',
    '定义威胁模型',
    '遵循 OWASP 安全编码指南',
    '定期进行安全审查',
    '结合自动化安全扫描工具',
    '优先修复高危漏洞'
  ],

  limitations: [
    '无法检测所有运行时安全问题',
    '需要理解业务逻辑才能识别某些漏洞',
    '某些漏洞需要渗透测试验证'
  ],

  dependencies: [
    'Read 工具（读取代码）',
    'Grep 工具（搜索安全模式）'
  ],

  performance: {
    avgExecutionTime: '4-8分钟',
    complexity: 'medium'
  },

  metadata: {
    version: '1.0.0',
    author: 'OMC Integration Team',
    tags: ['review', 'security', 'vulnerability', 'sonnet']
  }
};

export default securityReviewerAgent;
