/**
 * HookSystem 集成测试
 * 简单的手动测试脚本
 */

import { HookSystem, HookContext, HookExecutor } from './src/core/HookSystem.js';

console.log('='.repeat(60));
console.log('HookSystem 集成测试');
console.log('='.repeat(60));
console.log();

// 测试 1: 创建 HookSystem
console.log('测试 1: 创建 HookSystem');
const hookSystem = new HookSystem();
console.log('✅ HookSystem 创建成功');
console.log();

// 测试 2: 注册函数钩子
console.log('测试 2: 注册函数钩子');
let testExecuted = false;
hookSystem.registerFunctionHook('TestEvent', (context) => {
  testExecuted = true;
  console.log(`  钩子执行: ${context.event}`);
  console.log(`  数据: ${JSON.stringify(context.data)}`);
}, { async: false });
console.log('✅ 函数钩子注册成功');
console.log();

// 测试 3: 执行钩子
console.log('测试 3: 执行钩子');
const result1 = await hookSystem.executeHooks('TestEvent', {
  test: 'value'
});
console.log(`  执行结果: ${JSON.stringify(result1, null, 2)}`);
console.log(`  钩子是否执行: ${testExecuted ? '✅ 是' : '❌ 否'}`);
console.log();

// 测试 4: 注册命令钩子
console.log('测试 4: 注册命令钩子');
hookSystem.registerHook('CommandTest', {
  hooks: [{
    type: 'command',
    command: 'echo "Hello from command hook"',
    async: false
  }]
});
console.log('✅ 命令钩子注册成功');
console.log();

// 测试 5: 执行命令钩子
console.log('测试 5: 执行命令钩子');
const result2 = await hookSystem.executeHooks('CommandTest');
console.log(`  执行结果: ${JSON.stringify(result2, null, 2)}`);
if (result2.results[0]?.stdout) {
  console.log(`  命令输出: ${result2.results[0].stdout}`);
}
console.log();

// 测试 6: 匹配器
console.log('测试 6: 匹配器测试');
let matcherExecuted = false;
hookSystem.registerHook('MatcherTest', {
  matcher: 'start|begin',
  hooks: [{
    type: 'function',
    function: () => { matcherExecuted = true; },
    async: false
  }]
});

// 应该匹配
await hookSystem.executeHooks('MatcherTest', { action: 'start' });
console.log(`  匹配 'start': ${matcherExecuted ? '✅ 是' : '❌ 否'}`);

// 重置
matcherExecuted = false;

// 不应该匹配
await hookSystem.executeHooks('MatcherTest', { action: 'end' });
console.log(`  匹配 'end': ${matcherExecuted ? '❌ 错误' : '✅ 正确（未匹配）'}`);
console.log();

// 测试 7: 变量展开
console.log('测试 7: 变量展开');
const context = new HookContext('test', { WORKFLOW_NAME: 'TestWorkflow' });
const expanded = HookExecutor.expandVariables('Workflow: ${WORKFLOW_NAME}', context);
console.log(`  原始: "Workflow: \${WORKFLOW_NAME}"`);
console.log(`  展开: "${expanded}"`);
console.log(`  结果: ${expanded === 'Workflow: TestWorkflow' ? '✅ 正确' : '❌ 错误'}`);
console.log();

// 测试 8: 错误处理
console.log('测试 8: 错误处理');
hookSystem.registerHook('ErrorTest', {
  hooks: [{
    type: 'function',
    function: () => { throw new Error('Test error'); },
    async: false
  }]
});

const result3 = await hookSystem.executeHooks('ErrorTest');
console.log(`  执行结果: ${JSON.stringify(result3, null, 2)}`);
console.log(`  错误被捕获: ${result3.results[0]?.success === false ? '✅ 是' : '❌ 否'}`);
console.log();

// 测试 9: 统计信息
console.log('测试 9: 统计信息');
const stats = hookSystem.getStats();
console.log(`  统计信息: ${JSON.stringify(stats, null, 2)}`);
console.log(`  已注册: ${stats.registered}`);
console.log(`  已执行: ${stats.executed}`);
console.log(`  失败: ${stats.failed}`);
console.log(`  事件数: ${stats.events}`);
console.log(`  钩子数: ${stats.hooks}`);
console.log();

// 测试 10: 加载配置文件
console.log('测试 10: 加载配置文件');
const configLoaded = await hookSystem.loadFromConfig('./hooks/hooks.json');
console.log(`  配置加载: ${configLoaded ? '✅ 成功' : '❌ 失败'}`);
const statsAfterLoad = hookSystem.getStats();
console.log(`  加载后钩子数: ${statsAfterLoad.hooks}`);
console.log();

// 测试 11: WorkflowStart 钩子
console.log('测试 11: WorkflowStart 钩子');
const result4 = await hookSystem.executeHooks('WorkflowStart', {
  workflowName: 'brainstorming',
  WORKFLOW_NAME: 'brainstorming'
});
console.log(`  执行结果: ${JSON.stringify(result4, null, 2)}`);
console.log();

// 测试 12: WorkflowEnd 钩子
console.log('测试 12: WorkflowEnd 钩子');
const result5 = await hookSystem.executeHooks('WorkflowEnd', {
  workflowName: 'brainstorming',
  WORKFLOW_NAME: 'brainstorming',
  duration: 5000
});
console.log(`  执行结果: ${JSON.stringify(result5, null, 2)}`);
console.log();

// 最终统计
console.log('='.repeat(60));
console.log('最终统计');
console.log('='.repeat(60));
const finalStats = hookSystem.getStats();
console.log(`已注册钩子: ${finalStats.registered}`);
console.log(`已执行钩子: ${finalStats.executed}`);
console.log(`失败次数: ${finalStats.failed}`);
console.log(`事件类型: ${finalStats.events}`);
console.log(`总钩子数: ${finalStats.hooks}`);
console.log();

console.log('='.repeat(60));
console.log('✅ 所有测试完成！');
console.log('='.repeat(60));
