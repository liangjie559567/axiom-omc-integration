#!/usr/bin/env node
/**
 * Claude Code 插件开发流程完整测试
 */

console.log('=== Claude Code 插件开发流程测试 ===\n');

try {
  const { AxiomOMCPlugin } = await import('../src/plugin.js');
  const plugin = new AxiomOMCPlugin();
  await plugin.initialize();

  console.log('✅ 阶段 1: 插件初始化成功\n');

  // Agent 系统
  const agents = plugin.agentSystem.registry.getAllAgents();
  console.log(`✅ 阶段 2: Agent 系统 - ${agents.length} 个 Agent\n`);

  // 工作流系统
  const axiomWf = await plugin.workflowIntegration.startWorkflow('axiom-default', {
    title: '测试开发'
  });
  console.log(`✅ 阶段 3: 工作流系统 - 启动成功\n`);

  // 命令系统
  const commands = plugin.commandRouter.getAllCommands();
  console.log(`✅ 阶段 4: 命令系统 - ${commands.length} 个命令\n`);

  // 记忆系统
  await plugin.memorySystem.addDecision({
    id: 'test-dev-001',
    description: '测试决策',
    rationale: '开发流程测试'
  });
  const stats = plugin.memorySystem.getStats();
  console.log(`✅ 阶段 5: 记忆系统 - ${stats.totalDecisions} 个决策\n`);

  // 清理
  await plugin.destroy();
  console.log('✅ 阶段 6: 插件销毁成功\n');

  console.log('=== 所有开发流程测试通过 ✅ ===');
} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  process.exit(1);
}
