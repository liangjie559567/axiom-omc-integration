/**
 * WorkflowOrchestrator 使用示例
 *
 * 演示如何使用 WorkflowOrchestrator 统一管理工作流系统
 */

import { WorkflowOrchestrator } from '../src/core/workflow-orchestrator.js';
import { WorkflowIntegration } from '../src/core/workflow-integration.js';
import { tddWorkflowTemplate } from '../src/templates/tdd-workflow.js';

console.log('=== WorkflowOrchestrator 使用示例 ===\n');

// 1. 创建 WorkflowOrchestrator
console.log('--- 示例 1: 创建 WorkflowOrchestrator ---');
const workflowIntegration = new WorkflowIntegration();
const orchestrator = new WorkflowOrchestrator(workflowIntegration, {
  enableAutoSync: true,
  defaultSyncStrategy: 'master-slave'
});

console.log('✓ WorkflowOrchestrator 已创建');
console.log('  自动同步: 已启用');
console.log('  默认同步策略: master-slave\n');

// 2. 注册映射规则
console.log('--- 示例 2: 注册映射规则 ---');
orchestrator.registerMappingRule({
  id: 'axiom-draft-to-omc-planning',
  from: 'axiom:draft',
  to: ['omc:planning'],
  weight: 1.0
});

orchestrator.registerMappingRule({
  id: 'axiom-review-to-omc-design',
  from: 'axiom:review',
  to: ['omc:design'],
  weight: 1.0
});

orchestrator.registerMappingRule({
  id: 'axiom-implement-to-omc-impl',
  from: 'axiom:implement',
  to: ['omc:implementation'],
  weight: 1.0
});

console.log('✓ 已注册 3 个映射规则\n');

// 3. 注册 TDD 模板
console.log('--- 示例 3: 注册 TDD 模板 ---');
orchestrator.registerTemplate(tddWorkflowTemplate);
console.log('✓ TDD 模板已注册\n');

// 4. 启动基础工作流
console.log('--- 示例 4: 启动基础工作流 ---');
const basicInstance = await orchestrator.startWorkflow('axiom-default', {
  title: '用户认证功能',
  description: '实现用户登录和注册'
});

console.log('✓ 工作流已启动:');
console.log('  实例 ID:', basicInstance.instanceId);
console.log('  工作流 ID:', basicInstance.workflowId);
console.log('  当前阶段:', basicInstance.currentPhase);
console.log();

// 5. 创建同步的工作流对
console.log('--- 示例 5: 创建同步的工作流对 ---');
const { axiomInstanceId, omcInstanceId } = await orchestrator.createSyncedWorkflowPair(
  'axiom-default',
  'omc-default',
  {
    context: {
      title: '支付处理功能',
      description: '实现支付流程'
    }
  }
);

console.log('✓ 同步工作流对已创建:');
console.log('  Axiom 实例:', axiomInstanceId);
console.log('  OMC 实例:', omcInstanceId);
console.log('  同步关系: Axiom (主) -> OMC (从)');
console.log();

// 6. 阶段映射
console.log('--- 示例 6: 阶段映射 ---');
const mappedPhases = orchestrator.mapPhase('axiom:draft');
console.log('映射结果: axiom:draft ->', mappedPhases);

const reverseMapped = orchestrator.reverseMapPhase('omc:planning');
console.log('反向映射: omc:planning <-', reverseMapped);
console.log();

// 7. 手动同步
console.log('--- 示例 7: 手动同步 ---');
const syncSuccess = await orchestrator.syncWorkflows(axiomInstanceId, omcInstanceId);
console.log('手动同步结果:', syncSuccess ? '成功' : '失败');

const syncHistory = orchestrator.getSyncHistory({ instanceId: axiomInstanceId });
console.log('同步历史记录数:', syncHistory.length);
console.log();

// 8. 启动 TDD 工作流
console.log('--- 示例 8: 启动 TDD 工作流 ---');
const tddInstance = await orchestrator.startTDDWorkflow({
  feature: 'email-validation',
  testFramework: 'jest',
  language: 'javascript'
});

console.log('✓ TDD 工作流已启动:');
console.log('  实例 ID:', tddInstance.instanceId);
console.log('  功能:', tddInstance.context.feature);
console.log('  方法论:', tddInstance.context.methodology);
console.log('  测试框架:', tddInstance.context.testFramework);
console.log();

// 9. 工作流转换
console.log('--- 示例 9: 工作流转换 ---');
console.log('当前阶段:', basicInstance.currentPhase);

await orchestrator.transitionToNext(basicInstance.instanceId);
const updated1 = orchestrator.getWorkflowInstance(basicInstance.instanceId);
console.log('转换到下一个阶段:', updated1.currentPhase);

await orchestrator.transitionTo(basicInstance.instanceId, 'custom-phase');
const updated2 = orchestrator.getWorkflowInstance(basicInstance.instanceId);
console.log('转换到指定阶段:', updated2.currentPhase);
console.log();

// 10. 统计信息
console.log('--- 示例 10: 统计信息 ---');
const stats = orchestrator.getStats();
console.log('组件统计:');
console.log('  PhaseMapper:');
console.log('    - 总规则数:', stats.phaseMapper.totalRules);
console.log('    - 总映射次数:', stats.phaseMapper.totalMappings);
console.log('  AutoSyncEngine:');
console.log('    - 总同步次数:', stats.autoSyncEngine.totalSyncs);
console.log('    - 成功次数:', stats.autoSyncEngine.successfulSyncs);
console.log('    - 失败次数:', stats.autoSyncEngine.failedSyncs);
console.log('    - 同步链接数:', stats.autoSyncEngine.totalLinks);
console.log('  TemplateManager:');
console.log('    - 总模板数:', stats.templateManager.totalTemplates);
console.log('    - 总创建数:', stats.templateManager.totalCreated);
console.log();

// 11. 性能指标
console.log('--- 示例 11: 性能指标 ---');
const metrics = orchestrator.getPerformanceMetrics();
console.log('性能指标:');
console.log('  总映射次数:', metrics.totalMappings);
console.log('  总同步次数:', metrics.totalSyncs);
console.log('  成功同步次数:', metrics.successfulSyncs);
console.log('  失败同步次数:', metrics.failedSyncs);
console.log('  同步成功率:', metrics.syncSuccessRate.toFixed(2) + '%');
console.log('  总模板数:', metrics.totalTemplates);
console.log('  从模板创建数:', metrics.totalCreatedFromTemplates);
console.log();

// 12. 端到端场景
console.log('--- 示例 12: 端到端场景 ---');
console.log('场景: 使用 TDD 开发新功能，并同步到 OMC\n');

// 步骤 1: 创建同步的工作流对
console.log('步骤 1: 创建同步的 Axiom 和 OMC 工作流');
const { axiomInstanceId: axiomId, omcInstanceId: omcId } =
  await orchestrator.createSyncedWorkflowPair('axiom-default', 'omc-default', {
    context: {
      feature: 'shopping-cart',
      methodology: 'TDD'
    }
  });
console.log('  ✓ Axiom 实例:', axiomId);
console.log('  ✓ OMC 实例:', omcId);

// 步骤 2: 转换 Axiom 阶段
console.log('\n步骤 2: 转换 Axiom 到 review 阶段');
await orchestrator.transitionTo(axiomId, 'axiom:review');
console.log('  ✓ Axiom 当前阶段: axiom:review');

// 步骤 3: 等待自动同步
console.log('\n步骤 3: 自动同步到 OMC');
await new Promise(resolve => setTimeout(resolve, 100));
const omcInstance = orchestrator.getWorkflowInstance(omcId);
console.log('  ✓ OMC 自动同步到:', omcInstance.currentPhase);

// 步骤 4: 查看同步历史
console.log('\n步骤 4: 查看同步历史');
const history = orchestrator.getSyncHistory({ instanceId: axiomId });
console.log('  ✓ 同步记录数:', history.length);
if (history.length > 0) {
  console.log('  ✓ 最新同步:');
  console.log('    - 源阶段:', history[history.length - 1].sourcePhase);
  console.log('    - 目标阶段:', history[history.length - 1].targetPhase);
  console.log('    - 成功:', history[history.length - 1].success);
}
console.log();

// 13. 完成工作流
console.log('--- 示例 13: 完成工作流 ---');
await orchestrator.completeWorkflow(basicInstance.instanceId);
console.log('✓ 工作流已完成:', basicInstance.instanceId);
console.log();

// 14. 实际使用场景总结
console.log('--- 示例 14: 实际使用场景 ---');
console.log('场景 1: 快速启动 TDD 工作流');
console.log('  orchestrator.startTDDWorkflow({ feature: "login" })');
console.log('  → 自动创建 TDD 工作流实例\n');

console.log('场景 2: 创建同步的 Axiom-OMC 工作流对');
console.log('  orchestrator.createSyncedWorkflowPair("axiom", "omc")');
console.log('  → 自动建立主从同步关系\n');

console.log('场景 3: 阶段映射');
console.log('  orchestrator.mapPhase("axiom:draft")');
console.log('  → 自动映射到对应的 OMC 阶段\n');

console.log('场景 4: 统一管理');
console.log('  orchestrator.getStats()');
console.log('  → 获取所有组件的统计信息\n');

// 15. 清理资源
console.log('--- 清理资源 ---');
orchestrator.destroy();
console.log('✓ WorkflowOrchestrator 已销毁\n');

console.log('=== 示例完成 ===');
console.log('\n关键要点:');
console.log('1. WorkflowOrchestrator 统一管理所有工作流组件');
console.log('2. 集成 PhaseMapper、AutoSyncEngine、TemplateManager');
console.log('3. 提供简洁的 API（startWorkflow, createSyncedWorkflowPair, etc.）');
console.log('4. 支持便捷方法（startTDDWorkflow）');
console.log('5. 自动同步默认启用');
console.log('6. 完整的统计信息和性能指标');
console.log('7. 端到端工作流支持');
console.log('8. MVP 版本提供核心协调功能');
