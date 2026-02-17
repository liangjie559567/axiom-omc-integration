// 32个专业Agent的最小化配置
const agentDefinitions = {
  // 构建/分析通道
  explore: { name: 'explore', model: 'haiku', role: '代码库发现' },
  analyst: { name: 'analyst', model: 'opus', role: '需求分析' },
  planner: { name: 'planner', model: 'opus', role: '任务规划' },
  architect: { name: 'architect', model: 'opus', role: '架构设计' },
  debugger: { name: 'debugger', model: 'sonnet', role: '调试分析' },
  executor: { name: 'executor', model: 'sonnet', role: '代码实现' },
  'deep-executor': { name: 'deep-executor', model: 'opus', role: '复杂实现' },
  verifier: { name: 'verifier', model: 'sonnet', role: '验证测试' },

  // 审查通道
  'style-reviewer': { name: 'style-reviewer', model: 'haiku', role: '代码风格' },
  'quality-reviewer': { name: 'quality-reviewer', model: 'sonnet', role: '质量审查' },
  'api-reviewer': { name: 'api-reviewer', model: 'sonnet', role: 'API审查' },
  'security-reviewer': { name: 'security-reviewer', model: 'sonnet', role: '安全审查' },
  'performance-reviewer': { name: 'performance-reviewer', model: 'sonnet', role: '性能审查' },
  'code-reviewer': { name: 'code-reviewer', model: 'opus', role: '综合审查' },

  // 领域专家
  'dependency-expert': { name: 'dependency-expert', model: 'sonnet', role: '依赖管理' },
  'test-engineer': { name: 'test-engineer', model: 'sonnet', role: '测试工程' },
  'quality-strategist': { name: 'quality-strategist', model: 'sonnet', role: '质量策略' },
  'build-fixer': { name: 'build-fixer', model: 'sonnet', role: '构建修复' },
  designer: { name: 'designer', model: 'sonnet', role: 'UI/UX设计' },
  writer: { name: 'writer', model: 'haiku', role: '文档编写' },
  'qa-tester': { name: 'qa-tester', model: 'sonnet', role: 'QA测试' },
  scientist: { name: 'scientist', model: 'sonnet', role: '数据分析' },
  'document-specialist': { name: 'document-specialist', model: 'sonnet', role: '文档专家' },
  'git-master': { name: 'git-master', model: 'sonnet', role: 'Git管理' },

  // 产品通道
  'product-manager': { name: 'product-manager', model: 'sonnet', role: '产品管理' },
  'ux-researcher': { name: 'ux-researcher', model: 'sonnet', role: 'UX研究' },
  'information-architect': { name: 'information-architect', model: 'sonnet', role: '信息架构' },
  'product-analyst': { name: 'product-analyst', model: 'sonnet', role: '产品分析' },

  // 协调
  critic: { name: 'critic', model: 'opus', role: '批判性分析' },
  vision: { name: 'vision', model: 'sonnet', role: '视觉分析' }
};

export default agentDefinitions;
