// 32个专业Agent定义
const agentDefinitions = {
  // 构建/分析通道
  explore: { name: 'explore', model: 'haiku', role: '代码库发现' },
  analyst: { name: 'analyst', model: 'opus', role: '需求分析' },
  planner: { name: 'planner', model: 'opus', role: '任务规划' },
  architect: { name: 'architect', model: 'opus', role: '系统设计' },
  debugger: { name: 'debugger', model: 'sonnet', role: '根因分析' },
  executor: { name: 'executor', model: 'sonnet', role: '代码实现' },
  'deep-executor': { name: 'deep-executor', model: 'opus', role: '复杂任务执行' },
  verifier: { name: 'verifier', model: 'sonnet', role: '完成验证' },

  // 审查通道
  'style-reviewer': { name: 'style-reviewer', model: 'haiku', role: '代码风格审查' },
  'quality-reviewer': { name: 'quality-reviewer', model: 'sonnet', role: '质量审查' },
  'api-reviewer': { name: 'api-reviewer', model: 'sonnet', role: 'API审查' },
  'security-reviewer': { name: 'security-reviewer', model: 'sonnet', role: '安全审查' },
  'performance-reviewer': { name: 'performance-reviewer', model: 'sonnet', role: '性能审查' },
  'code-reviewer': { name: 'code-reviewer', model: 'opus', role: '综合代码审查' },

  // 领域专家
  'dependency-expert': { name: 'dependency-expert', model: 'sonnet', role: '依赖管理' },
  'test-engineer': { name: 'test-engineer', model: 'sonnet', role: '测试策略' },
  'quality-strategist': { name: 'quality-strategist', model: 'sonnet', role: '质量策略' },
  'build-fixer': { name: 'build-fixer', model: 'sonnet', role: '构建修复' },
  designer: { name: 'designer', model: 'sonnet', role: 'UI/UX设计' },
  writer: { name: 'writer', model: 'haiku', role: '文档编写' },
  'qa-tester': { name: 'qa-tester', model: 'sonnet', role: 'QA测试' },
  scientist: { name: 'scientist', model: 'sonnet', role: '数据分析' },
  'document-specialist': { name: 'document-specialist', model: 'sonnet', role: '文档专家' },
  'git-master': { name: 'git-master', model: 'sonnet', role: 'Git管理' },
  researcher: { name: 'researcher', model: 'sonnet', role: '研究分析' },
  'tdd-guide': { name: 'tdd-guide', model: 'sonnet', role: 'TDD指导' },

  // 产品通道
  'product-manager': { name: 'product-manager', model: 'sonnet', role: '产品管理' },
  'ux-researcher': { name: 'ux-researcher', model: 'sonnet', role: 'UX研究' },
  'information-architect': { name: 'information-architect', model: 'sonnet', role: '信息架构' },
  'product-analyst': { name: 'product-analyst', model: 'sonnet', role: '产品分析' },

  // 协调
  critic: { name: 'critic', model: 'opus', role: '批判性审查' },
  vision: { name: 'vision', model: 'sonnet', role: '视觉分析' }
};

export default agentDefinitions;
