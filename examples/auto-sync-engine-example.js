/**
 * AutoSyncEngine 使用示例
 *
 * 演示如何使用 AutoSyncEngine 进行自动工作流同步
 */

import { AutoSyncEngine } from '../src/core/auto-sync-engine.js';
import { PhaseMapper } from '../src/core/phase-mapper.js';
import { WorkflowIntegration } from '../src/core/workflow-integration.js';

console.log('=== AutoSyncEngine 使用示例 ===\n');

// 1. 创建依赖实例
const workflowIntegration = new WorkflowIntegration();
const phaseMapper = new PhaseMapper();

// 2. 注册映射规则
console.log('--- 步骤 1: 注册映射规则 ---');
phaseMapper.registerRule({
  id: 'axiom-draft-to-omc-planning',
  from: 'axiom:draft',
  to: ['omc:planning'],
  weight: 1.0
});

phaseMapper.registerRule({
  id: 'axiom-review-to-omc-design',
  from: 'axiom:review',
  to: ['omc:design'],
  weight: 1.0
});

phaseMapper.registerRule({
  id: 'axiom-implement-to-omc-impl',
  from: 'axiom:implement',
  to: ['omc:implementation'],
  weight: 1.0
});

console.log('✓ 已注册 3 个映射规则\n');

// 3. 创建 AutoSyncEngine
console.log('--- 步骤 2: 创建 AutoSyncEngine ---');
const syncEngine = new AutoSyncEngine(workflowIntegration, phaseMapper);
console.log('✓ AutoSyncEngine 已创建\n');

// 4. 创建工作流实例
console.log('--- 步骤 3: 创建工作流实例 ---');
const axiomInstance = await workflowIntegration.startWorkflow('axiom-default', {
  title: '用户认证功能',
  description: '实现用户登录和注册功能'
});

const omcInstance = await workflowIntegration.startWorkflow('omc-default', {
  title: '用户认证功能',
  description: '实现用户登录和注册功能'
});

console.log('✓ Axiom 实例:', axiomInstance.instanceId);
console.log('✓ OMC 实例:', omcInstance.instanceId);
console.log();

// 5. 建立同步关系
console.log('--- 步骤 4: 建立同步关系 ---');
await syncEngine.linkWorkflows(axiomInstance.instanceId, omcInstance.instanceId, {
  strategy: 'master-slave'
});
console.log('✓ 已建立 Axiom -> OMC 的主从同步关系\n');

// 6. 启动自动同步
console.log('--- 步骤 5: 启动自动同步 ---');
syncEngine.start();
console.log('✓ 自动同步已启动\n');

// 7. 手动同步示例
console.log('--- 示例 1: 手动同步 ---');
console.log('当前状态:');
console.log('  Axiom:', workflowIntegration.getWorkflowInstance(axiomInstance.instanceId).currentPhase);
console.log('  OMC:', workflowIntegration.getWorkflowInstance(omcInstance.instanceId).currentPhase);

const syncSuccess = await syncEngine.sync(axiomInstance.instanceId, omcInstance.instanceId);
console.log('\n手动同步结果:', syncSuccess ? '成功' : '失败');

console.log('同步后状态:');
console.log('  Axiom:', workflowIntegration.getWorkflowInstance(axiomInstance.instanceId).currentPhase);
console.log('  OMC:', workflowIntegration.getWorkflowInstance(omcInstance.instanceId).currentPhase);
console.log();

// 8. 自动同步示例
console.log('--- 示例 2: 自动同步 ---');
console.log('转换 Axiom 阶段: draft -> review');

await workflowIntegration.transitionToNext(axiomInstance.instanceId);

// 等待自动同步完成
await new Promise(resolve => setTimeout(resolve, 100));

console.log('自动同步后状态:');
console.log('  Axiom:', workflowIntegration.getWorkflowInstance(axiomInstance.instanceId).currentPhase);
console.log('  OMC:', workflowIntegration.getWorkflowInstance(omcInstance.instanceId).currentPhase);
console.log('✓ OMC 自动同步到对应阶段\n');

// 9. 查看同步历史
console.log('--- 示例 3: 查看同步历史 ---');
const history = syncEngine.getSyncHistory();
console.log('同步历史记录数:', history.length);
history.forEach((record, index) => {
  console.log(`\n记录 ${index + 1}:`);
  console.log('  源阶段:', record.sourcePhase);
  console.log('  目标阶段:', record.targetPhase);
  console.log('  成功:', record.success);
  console.log('  时间:', new Date(record.timestamp).toLocaleString());
});
console.log();

// 10. 查看统计信息
console.log('--- 示例 4: 统计信息 ---');
const stats = syncEngine.getStats();
console.log('统计信息:');
console.log('  总同步次数:', stats.totalSyncs);
console.log('  成功次数:', stats.successfulSyncs);
console.log('  失败次数:', stats.failedSyncs);
console.log('  检测到的循环:', stats.cyclesDetected);
console.log('  同步链接数:', stats.totalLinks);
console.log('  运行状态:', stats.isRunning ? '运行中' : '已停止');
console.log();

// 11. 循环检测示例
console.log('--- 示例 5: 循环检测 ---');
console.log('尝试在同步进行中再次同步（模拟循环）...');

// 模拟正在同步
syncEngine.syncInProgress.add(axiomInstance.instanceId);

const cyclicSync = await syncEngine.sync(axiomInstance.instanceId, omcInstance.instanceId);
console.log('循环同步结果:', cyclicSync ? '成功' : '被阻止');
console.log('✓ 循环检测机制有效\n');

// 清除模拟标记
syncEngine.syncInProgress.clear();

// 12. 事件监听示例
console.log('--- 示例 6: 事件监听 ---');

syncEngine.on('syncCompleted', (event) => {
  console.log('✓ 同步完成事件:', {
    source: event.sourceInstanceId,
    target: event.targetInstanceId,
    phase: event.targetPhase
  });
});

syncEngine.on('syncFailed', (event) => {
  console.log('✗ 同步失败事件:', {
    source: event.sourceInstanceId,
    target: event.targetInstanceId,
    error: event.error
  });
});

console.log('已注册事件监听器\n');

// 13. 多目标同步示例
console.log('--- 示例 7: 一对多同步 ---');

// 创建第二个 OMC 实例
const omcInstance2 = await workflowIntegration.startWorkflow('omc-default', {
  title: '用户认证功能 - 副本',
  description: '实现用户登录和注册功能'
});

console.log('✓ 创建第二个 OMC 实例:', omcInstance2.instanceId);

// 建立第二个同步关系
await syncEngine.linkWorkflows(axiomInstance.instanceId, omcInstance2.instanceId);
console.log('✓ 已建立第二个同步关系');

// 查看关联的工作流
const linkedWorkflows = syncEngine.getLinkedWorkflows(axiomInstance.instanceId);
console.log('Axiom 关联的工作流:', linkedWorkflows);
console.log('✓ 一个源工作流可以同步到多个目标\n');

// 14. 停止自动同步
console.log('--- 步骤 6: 停止自动同步 ---');
syncEngine.stop();
console.log('✓ 自动同步已停止\n');

// 15. 清理资源
console.log('--- 步骤 7: 清理资源 ---');
syncEngine.destroy();
console.log('✓ AutoSyncEngine 已销毁\n');

console.log('=== 示例完成 ===');
console.log('\n关键要点:');
console.log('1. AutoSyncEngine 需要 WorkflowIntegration 和 PhaseMapper 实例');
console.log('2. 使用 linkWorkflows() 建立同步关系');
console.log('3. 使用 start() 启动自动同步');
console.log('4. 使用 sync() 手动触发同步');
console.log('5. 内置循环检测机制防止无限同步');
console.log('6. 支持事件监听（syncCompleted, syncFailed, linkCreated）');
console.log('7. 完整的同步历史记录和统计信息');
console.log('8. MVP 版本只支持主从同步模式');
