/**
 * 调试工作流示例
 * 
 * 演示如何使用调试工作流模板进行系统化调试
 */

import { WorkflowOrchestrator } from '../src/core/workflow-orchestrator.js';
import { WorkflowIntegration } from '../src/core/workflow-integration.js';
import { TemplateManager } from '../src/core/template-manager.js';
import { debugWorkflowTemplate, DebugWorkflowHelper } from '../src/templates/debug-workflow.js';

console.log('=== 调试工作流示例 ===\n');

// 1. 初始化系统
const workflowIntegration = new WorkflowIntegration();
const orchestrator = new WorkflowOrchestrator(workflowIntegration);

// 2. 注册调试工作流模板
orchestrator.templateManager.registerTemplate(debugWorkflowTemplate);
console.log('✓ 调试工作流模板已注册\n');

// 3. 创建调试会话
const debugSession = DebugWorkflowHelper.createDebugSession(
  '用户登录失败 - 返回 500 错误',
  {
    priority: 'critical',
    assignee: 'developer-1',
    environment: 'production'
  }
);

console.log('调试会话已创建:');
console.log(`  会话 ID: ${debugSession.id}`);
console.log(`  问题: ${debugSession.issue}`);
console.log(`  当前阶段: ${debugSession.currentPhase}`);
console.log(`  优先级: ${debugSession.context.priority}\n`);

// 4. REPRODUCE 阶段 - 重现问题
console.log('=== 阶段 1: REPRODUCE - 重现问题 ===');

const reproduceSuggestions = DebugWorkflowHelper.getDebugSuggestions('reproduce');
console.log('建议:');
reproduceSuggestions.forEach((suggestion, index) => {
  console.log(`  ${index + 1}. ${suggestion}`);
});
console.log();

// 记录重现步骤
DebugWorkflowHelper.recordFinding(
  debugSession,
  'reproduce',
  '问题可以在生产环境稳定重现'
);

DebugWorkflowHelper.recordFinding(
  debugSession,
  'reproduce',
  '重现步骤: 1) 访问登录页面 2) 输入有效凭证 3) 点击登录按钮'
);

DebugWorkflowHelper.recordAction(
  debugSession,
  'reproduce',
  '创建最小可重现示例',
  '成功 - 可以在本地环境重现'
);

console.log('✓ 问题已成功重现\n');

// 5. ISOLATE 阶段 - 隔离问题
console.log('=== 阶段 2: ISOLATE - 隔离问题 ===');
debugSession.currentPhase = 'isolate';

const isolateSuggestions = DebugWorkflowHelper.getDebugSuggestions('isolate');
console.log('建议:');
isolateSuggestions.forEach((suggestion, index) => {
  console.log(`  ${index + 1}. ${suggestion}`);
});
console.log();

// 使用调试工具
const debugTools = DebugWorkflowHelper.getDebugTools();
console.log('可用的调试工具:');
console.log(`  日志工具: ${debugTools.logging.join(', ')}`);
console.log(`  调试器: ${debugTools.debugging.join(', ')}`);
console.log();

// 记录问题定位
DebugWorkflowHelper.recordFinding(
  debugSession,
  'isolate',
  '错误堆栈指向 auth-service.js:45'
);

DebugWorkflowHelper.recordFinding(
  debugSession,
  'isolate',
  '根本原因: 数据库连接池耗尽'
);

DebugWorkflowHelper.recordAction(
  debugSession,
  'isolate',
  '使用 Chrome DevTools 分析网络请求',
  '发现请求超时'
);

console.log('✓ 问题根本原因已定位\n');

// 6. FIX 阶段 - 修复问题
console.log('=== 阶段 3: FIX - 修复问题 ===');
debugSession.currentPhase = 'fix';

const fixSuggestions = DebugWorkflowHelper.getDebugSuggestions('fix');
console.log('建议:');
fixSuggestions.forEach((suggestion, index) => {
  console.log(`  ${index + 1}. ${suggestion}`);
});
console.log();

// 记录修复过程
DebugWorkflowHelper.recordFinding(
  debugSession,
  'fix',
  '修复方案: 增加数据库连接池大小并添加连接超时处理'
);

DebugWorkflowHelper.recordAction(
  debugSession,
  'fix',
  '修改配置文件 database.config.js',
  '成功 - 连接池从 10 增加到 50'
);

DebugWorkflowHelper.recordAction(
  debugSession,
  'fix',
  '添加连接超时和重试逻辑',
  '成功 - 添加了 5 秒超时和 3 次重试'
);

DebugWorkflowHelper.recordAction(
  debugSession,
  'fix',
  '添加单元测试覆盖新逻辑',
  '成功 - 测试覆盖率 95%'
);

console.log('✓ 修复已实现\n');

// 7. VERIFY 阶段 - 验证修复
console.log('=== 阶段 4: VERIFY - 验证修复 ===');
debugSession.currentPhase = 'verify';

const verifySuggestions = DebugWorkflowHelper.getDebugSuggestions('verify');
console.log('建议:');
verifySuggestions.forEach((suggestion, index) => {
  console.log(`  ${index + 1}. ${suggestion}`);
});
console.log();

// 记录验证结果
DebugWorkflowHelper.recordAction(
  debugSession,
  'verify',
  '运行所有测试',
  '成功 - 所有测试通过 (150/150)'
);

DebugWorkflowHelper.recordAction(
  debugSession,
  'verify',
  '在生产环境验证',
  '成功 - 问题不再出现'
);

DebugWorkflowHelper.recordFinding(
  debugSession,
  'verify',
  '验证完成: 原问题已解决，无新问题引入'
);

console.log('✓ 修复已验证\n');

// 8. 生成调试报告
console.log('=== 调试报告 ===');
const report = DebugWorkflowHelper.generateReport(debugSession);

console.log(`会话 ID: ${report.sessionId}`);
console.log(`问题: ${report.issue}`);
console.log(`总耗时: ${report.duration}`);
console.log();

console.log('摘要:');
console.log(`  总发现数: ${report.summary.totalFindings}`);
console.log(`  总行动数: ${report.summary.totalActions}`);
console.log(`  完成阶段: ${report.summary.phasesCompleted}/4`);
console.log(`  状态: ${report.summary.status}`);
console.log();

console.log('各阶段发现:');
console.log(`  REPRODUCE: ${report.phases.reproduce.length} 个发现`);
console.log(`  ISOLATE: ${report.phases.isolate.length} 个发现`);
console.log(`  FIX: ${report.phases.fix.length} 个发现`);
console.log(`  VERIFY: ${report.phases.verify.length} 个发现`);
console.log();

// 9. 使用 WorkflowOrchestrator 创建调试工作流实例
console.log('=== 使用 WorkflowOrchestrator ===');

// 首先注册调试工作流到 WorkflowIntegration
workflowIntegration.registerWorkflow({
  id: 'debug-default',
  name: 'Debug Workflow',
  type: 'debug',
  phases: debugWorkflowTemplate.phases.map(p => ({
    id: p.id,
    name: p.name
  }))
});

// 从模板创建工作流实例
const debugInstance = await orchestrator.createFromTemplate('debug-workflow', {
  issue: '性能问题 - 页面加载缓慢',
  priority: 'high'
});

console.log('调试工作流实例已创建:');
console.log(`  实例 ID: ${debugInstance.id}`);
console.log(`  工作流 ID: ${debugInstance.workflowId}`);
console.log(`  当前阶段: ${debugInstance.currentPhase.id}`);
console.log();

// 转换到下一个阶段
await orchestrator.transitionToNext(debugInstance.id);
console.log(`✓ 已转换到阶段: ${debugInstance.currentPhase.id}`);

// 获取当前阶段信息
const currentPhaseInfo = debugWorkflowTemplate.phases.find(
  p => p.id === debugInstance.currentPhase.id
);

console.log();
console.log('当前阶段信息:');
console.log(`  名称: ${currentPhaseInfo.name}`);
console.log(`  描述: ${currentPhaseInfo.description}`);
console.log('  任务:');
currentPhaseInfo.tasks.forEach((task, index) => {
  console.log(`    ${index + 1}. ${task}`);
});
console.log('  退出标准:');
currentPhaseInfo.exitCriteria.forEach((criteria, index) => {
  console.log(`    ${index + 1}. ${criteria}`);
});

console.log('\n=== 示例完成 ===');
