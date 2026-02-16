/**
 * Agent 定义索引
 * 导出所有 Agent 定义
 */

// Build/Analysis Lane (6 个)
export { exploreAgent } from './explore.js';
export { analystAgent } from './analyst.js';
export { plannerAgent } from './planner.js';
export { architectAgent } from './architect.js';
export { debuggerAgent } from './debugger.js';
export { executorAgent } from './executor.js';

// Review Lane (6 个)
export { styleReviewerAgent } from './style-reviewer.js';
export { qualityReviewerAgent } from './quality-reviewer.js';
export { apiReviewerAgent } from './api-reviewer.js';
export { securityReviewerAgent } from './security-reviewer.js';
export { performanceReviewerAgent } from './performance-reviewer.js';
export { testReviewerAgent } from './test-reviewer.js';

// Domain Specialists (10 个)
export { frontendSpecialistAgent } from './frontend-specialist.js';
export { backendSpecialistAgent } from './backend-specialist.js';
export { databaseSpecialistAgent } from './database-specialist.js';
export { devopsSpecialistAgent } from './devops-specialist.js';
export { mobileSpecialistAgent } from './mobile-specialist.js';
export { dataSpecialistAgent } from './data-specialist.js';
export { mlSpecialistAgent } from './ml-specialist.js';
export { testingSpecialistAgent } from './testing-specialist.js';
export { docsSpecialistAgent } from './docs-specialist.js';
export { gitSpecialistAgent } from './git-specialist.js';

// Product Lane (4 个)
export { productManagerAgent } from './product-manager.js';
export { uxResearcherAgent } from './ux-researcher.js';
export { designerAgent } from './designer.js';
export { contentWriterAgent } from './content-writer.js';

// Coordination (2 个)
export { orchestratorAgent } from './orchestrator.js';
export { teamAgent } from './team.js';

// Special (4 个)
export { buildFixerAgent } from './build-fixer.js';
export { dependencyManagerAgent } from './dependency-manager.js';
export { refactorerAgent } from './refactorer.js';
export { migratorAgent } from './migrator.js';

// 按 Lane 分组导出
export const buildAnalysisAgents = [
  'explore',
  'analyst',
  'planner',
  'architect',
  'debugger',
  'executor'
];

export const reviewAgents = [
  'style-reviewer',
  'quality-reviewer',
  'api-reviewer',
  'security-reviewer',
  'performance-reviewer',
  'test-reviewer'
];

export const domainSpecialists = [
  'frontend-specialist',
  'backend-specialist',
  'database-specialist',
  'devops-specialist',
  'mobile-specialist',
  'data-specialist',
  'ml-specialist',
  'testing-specialist',
  'docs-specialist',
  'git-specialist'
];

export const productAgents = [
  'product-manager',
  'ux-researcher',
  'designer',
  'content-writer'
];

export const coordinationAgents = [
  'orchestrator',
  'team'
];

export const specialAgents = [
  'build-fixer',
  'dependency-manager',
  'refactorer',
  'migrator'
];

// 所有 Agent 列表
export const allAgents = [
  ...buildAnalysisAgents,
  ...reviewAgents,
  ...domainSpecialists,
  ...productAgents,
  ...coordinationAgents,
  ...specialAgents
];
