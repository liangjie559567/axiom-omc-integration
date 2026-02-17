#!/usr/bin/env node
/**
 * Claude Code 插件完整功能测试
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('=== Claude Code 插件完整功能测试 ===\n');

// 测试 1: 加载插件
console.log('测试 1: 加载插件...');
try {
  const plugin = await import('../src/plugin.js');
  console.log('✅ 插件加载成功');
  console.log(`   版本: ${plugin.default.version}`);
  console.log(`   名称: ${plugin.default.name}\n`);
} catch (error) {
  console.error('❌ 插件加载失败:', error.message);
  process.exit(1);
}

// 测试 2: 初始化插件
console.log('测试 2: 初始化插件...');
try {
  const { AxiomOMCPlugin } = await import('../src/plugin.js');
  const pluginInstance = new AxiomOMCPlugin();
  await pluginInstance.initialize();
  console.log('✅ 插件初始化成功\n');

  // 测试 3: Agent 系统
  console.log('测试 3: Agent 系统...');
  const agents = pluginInstance.agentSystem.registry.getAllAgents();
  console.log(`✅ 发现 ${agents.length} 个 Agent`);
  console.log(`   前 5 个: ${agents.slice(0, 5).map(a => a.id).join(', ')}\n`);

  // 测试 4: 命令系统
  console.log('测试 4: 命令系统...');
  const commands = pluginInstance.commandRouter.getAllCommands();
  console.log(`✅ 发现 ${commands.length} 个命令\n`);

  // 测试 5: 记忆系统
  console.log('测试 5: 记忆系统...');
  await pluginInstance.memorySystem.addDecision({
    id: 'test-decision',
    description: '测试决策',
    rationale: '测试原因'
  });
  const stats = pluginInstance.memorySystem.getStats();
  console.log(`✅ 记忆系统正常: ${stats.totalDecisions} 个决策\n`);

  // 测试 6: 销毁插件
  console.log('测试 6: 销毁插件...');
  await pluginInstance.destroy();
  console.log('✅ 插件销毁成功');

  console.log('\n=== 所有测试通过 ✅ ===');
} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}
