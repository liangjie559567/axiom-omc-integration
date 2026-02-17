/**
 * 高级同步示例（简化版）
 *
 * 演示如何使用 AutoSyncEngine 进行工作流同步
 */

import { WorkflowIntegration } from '../src/core/workflow-integration.js';
import { AutoSyncEngine } from '../src/core/auto-sync-engine.js';
import { PhaseMapper } from '../src/core/phase-mapper.js';

console.log('=== 高级同步示例 ===\n');

// 1. 初始化系统
const workflowIntegration = new WorkflowIntegration();
const phaseMapper = new PhaseMapper();
const syncEngine = new AutoSyncEngine(workflowIntegration, phaseMapper);

console.log('✓ 系统已初始化\n');

// 2. 配置映射规则
console.log('=== 示例 1: 配置阶段映射规则 ===');

// Axiom 到 OMC 的映射
phaseMapper.registerRule({
  from: 'draft',
  to: ['planning']
});

phaseMapper.registerRule({
  from: 'review',
  to: ['planning', 'coding']
});

phaseMapper.registerRule({
  from: 'implement',
  to: ['coding', 'testing']
});

console.log('✓ 映射规则已配置');
console.log(`  总规则数: ${phaseMapper.getAllRules().length}\n`);

// 3. 启动自动同步
console.log('=== 示例 2: 启动自动同步引擎 ===');
syncEngine.start();
console.log('✓ 自动同步已启动\n');

// 4. 创建工作流实例
console.log('=== 示例 3: 创建工作流实例 ===');

const axiomInstanceId = workflowIntegration.startWorkflow('axiom-default', {
  projectName: 'Mobile App',
  priority: 'high'
});

const omcInstanceId = workflowIntegration.startWorkflow('omc-default', {
  projectName: 'Mobile App',
  team: 'Backend'
});

console.log('工作流实例已创建:');
console.log(`  Axiom 实例: ${axiomInstanceId}`);
console.log(`  OMC 实例: ${omcInstanceId}\n`);

// 5. 链接工作流（建立同步关系）
console.log('=== 示例 4: 链接工作流 ===');

await syncEngine.linkWorkflows(axiomInstanceId, omcInstanceId, {
  strategy: 'master-slave'
});

console.log('✓ 工作流已链接');
console.log(`  主工作流: ${axiomInstanceId}`);
console.log(`  从工作流: ${omcInstanceId}\n`);

// 6. 测试自动同步
console.log('=== 示例 5: 测试自动同步 ===');

// 转换 Axiom 阶段
await workflowIntegration.transitionTo(axiomInstanceId, 'review');
console.log('✓ Axiom 阶段已转换: review');

// 等待同步完成
await new Promise(resolve => setTimeout(resolve, 100));

// 检查 OMC 实例状态
const omcInstance = workflowIntegration.getWorkflowInstance(omcInstanceId);
console.log(`✓ OMC 阶段已同步: ${omcInstance.currentPhase}\n`);

// 7. 继续测试同步
console.log('=== 示例 6: 继续测试同步 ===');

await workflowIntegration.transitionTo(axiomInstanceId, 'implement');
console.log('✓ Axiom 阶段已转换: implement');

await new Promise(resolve => setTimeout(resolve, 100));

const omcInstance2 = workflowIntegration.getWorkflowInstance(omcInstanceId);
console.log(`✓ OMC 阶段已同步: ${omcInstance2.currentPhase}\n`);

// 8. 查看同步统计
console.log('=== 示例 7: 同步统计 ===');
const stats = syncEngine.getStats();
console.log('统计信息:');
console.log(`  总同步次数: ${stats.totalSyncs}`);
console.log(`  成功同步: ${stats.successfulSyncs}`);
console.log(`  失败同步: ${stats.failedSyncs}`);
console.log();

// 9. 多实例同步场景
console.log('=== 示例 8: 多实例同步场景 ===');

// 创建多个项目
const projects = ['Project A', 'Project B', 'Project C'];
const projectPairs = [];

for (const project of projects) {
  const axiomId = workflowIntegration.startWorkflow('axiom-default', {
    projectName: project
  });

  const omcId = workflowIntegration.startWorkflow('omc-default', {
    projectName: project
  });

  await syncEngine.linkWorkflows(axiomId, omcId);
  projectPairs.push({ axiomId, omcId, project });

  console.log(`✓ ${project} 工作流已创建并链接`);
}
console.log();

// 10. 批量阶段转换
console.log('=== 示例 9: 批量阶段转换 ===');

for (const pair of projectPairs) {
  await workflowIntegration.transitionTo(pair.axiomId, 'implement');
  console.log(`✓ ${pair.project} 已转换到 implement`);
}

await new Promise(resolve => setTimeout(resolve, 200));

console.log('\n同步结果:');
for (const pair of projectPairs) {
  const omcInst = workflowIntegration.getWorkflowInstance(pair.omcId);
  console.log(`  ${pair.project}: ${omcInst.currentPhase}`);
}
console.log();

// 11. 查看最终统计
console.log('=== 示例 10: 最终统计 ===');
const finalStats = syncEngine.getStats();
console.log('最终统计:');
console.log(`  总同步次数: ${finalStats.totalSyncs}`);
console.log(`  成功同步: ${finalStats.successfulSyncs}`);
console.log(`  失败同步: ${finalStats.failedSyncs}`);
console.log(`  成功率: ${((finalStats.successfulSyncs / finalStats.totalSyncs) * 100).toFixed(2)}%`);
console.log();

// 12. 停止同步引擎
console.log('=== 示例 11: 停止同步引擎 ===');
syncEngine.stop();
console.log('✓ 同步引擎已停止\n');

console.log('=== 示例完成 ===');
console.log('\n关键要点:');
console.log('1. 使用 PhaseMapper 配置阶段映射规则');
console.log('2. 使用 linkWorkflows 建立工作流同步关系');
console.log('3. 自动同步引擎监听阶段转换事件并自动同步');
console.log('4. 支持一对一和一对多的同步关系');
console.log('5. 提供详细的同步统计信息');
