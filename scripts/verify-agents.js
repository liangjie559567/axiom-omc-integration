/**
 * 验证所有 Agent 定义
 */

import { createAgentRegistry } from '../src/agents/agent-registry.js';
import { validateAgentDefinition } from '../src/agents/schemas/agent-schema.js';
import * as agentDefinitions from '../src/agents/definitions/index.js';

// 导入所有 Agent 定义
const agents = [
  agentDefinitions.exploreAgent,
  agentDefinitions.analystAgent,
  agentDefinitions.plannerAgent,
  agentDefinitions.architectAgent,
  agentDefinitions.debuggerAgent,
  agentDefinitions.executorAgent,
  agentDefinitions.styleReviewerAgent,
  agentDefinitions.qualityReviewerAgent,
  agentDefinitions.apiReviewerAgent,
  agentDefinitions.securityReviewerAgent,
  agentDefinitions.performanceReviewerAgent,
  agentDefinitions.testReviewerAgent,
  agentDefinitions.frontendSpecialistAgent,
  agentDefinitions.backendSpecialistAgent,
  agentDefinitions.databaseSpecialistAgent,
  agentDefinitions.devopsSpecialistAgent,
  agentDefinitions.mobileSpecialistAgent,
  agentDefinitions.dataSpecialistAgent,
  agentDefinitions.mlSpecialistAgent,
  agentDefinitions.testingSpecialistAgent,
  agentDefinitions.docsSpecialistAgent,
  agentDefinitions.gitSpecialistAgent,
  agentDefinitions.productManagerAgent,
  agentDefinitions.uxResearcherAgent,
  agentDefinitions.designerAgent,
  agentDefinitions.contentWriterAgent,
  agentDefinitions.orchestratorAgent,
  agentDefinitions.teamAgent,
  agentDefinitions.buildFixerAgent,
  agentDefinitions.dependencyManagerAgent,
  agentDefinitions.refactorerAgent,
  agentDefinitions.migratorAgent
];

console.log('🔍 验证 Agent 定义...\n');

let totalAgents = 0;
let validAgents = 0;
let invalidAgents = 0;
const errors = [];

// 验证每个 Agent
for (const agent of agents) {
  totalAgents++;
  const validation = validateAgentDefinition(agent);

  if (validation.valid) {
    validAgents++;
    console.log(`✅ ${agent.id} - ${agent.displayName}`);
  } else {
    invalidAgents++;
    console.log(`❌ ${agent.id} - ${agent.displayName}`);
    errors.push({
      agent: agent.id,
      errors: validation.errors
    });
  }
}

console.log('\n📊 验证结果:');
console.log(`总计: ${totalAgents} 个 Agent`);
console.log(`有效: ${validAgents} 个`);
console.log(`无效: ${invalidAgents} 个`);

if (invalidAgents > 0) {
  console.log('\n❌ 发现错误:');
  errors.forEach(({ agent, errors }) => {
    console.log(`\n${agent}:`);
    errors.forEach(err => console.log(`  - ${err}`));
  });
  process.exit(1);
}

// 测试注册表
console.log('\n🔧 测试 Agent 注册表...');
const registry = createAgentRegistry();

for (const agent of agents) {
  try {
    registry.register(agent);
  } catch (error) {
    console.error(`❌ 注册失败: ${agent.id}`, error.message);
    process.exit(1);
  }
}

console.log(`✅ 成功注册 ${registry.getAllAgents().length} 个 Agent`);

// 统计信息
const stats = registry.getStats();
console.log('\n📈 统计信息:');
console.log(`按类型分布:`);
Object.entries(stats.agentsByType).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count} 个`);
});

console.log(`\n按模型分布:`);
Object.entries(stats.agentsByModel).forEach(([model, count]) => {
  console.log(`  - ${model}: ${count} 个`);
});

console.log(`\n总能力数: ${stats.totalCapabilities}`);

// 健康检查
const health = registry.healthCheck();
console.log('\n💚 健康检查:');
console.log(`状态: ${health.healthy ? '健康' : '异常'}`);
console.log(`空闲: ${health.idleAgents} 个`);
console.log(`忙碌: ${health.busyAgents} 个`);
console.log(`错误: ${health.errorAgents} 个`);

console.log('\n✨ 所有验证通过！');
