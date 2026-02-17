/**
 * status 命令 - 显示系统状态
 */

export default {
  name: 'status',
  description: '显示系统状态和统计信息',
  aliases: ['stat', 'info'],
  group: 'core',
  options: {
    usage: 'status [--verbose]',
    examples: [
      'status',
      'status --verbose',
      'status -v'
    ]
  },

  async execute(parsed, context) {
    const { commandSystem, hookSystem, workflowIntegration } = context;

    const verbose = parsed.flags.verbose || parsed.flags.v || false;

    let output = [];
    output.push('');
    output.push('='.repeat(60));
    output.push('Axiom-OMC Integration - 系统状态');
    output.push('='.repeat(60));
    output.push('');

    // 命令系统状态
    if (commandSystem) {
      const cmdStats = commandSystem.getStats();
      output.push('【命令系统】');
      output.push(`  已注册命令: ${cmdStats.commands}`);
      output.push(`  命令别名: ${cmdStats.aliases}`);
      output.push(`  命令分组: ${cmdStats.groups}`);
      output.push(`  已执行: ${cmdStats.executed}`);
      output.push(`  失败: ${cmdStats.failed}`);
      output.push('');

      if (verbose) {
        const groups = commandSystem.getGroups();
        output.push('  分组详情:');
        for (const group of groups.sort()) {
          const cmds = commandSystem.getCommandsByGroup(group);
          output.push(`    ${group}: ${cmds.length} 个命令`);
        }
        output.push('');
      }
    }

    // 钩子系统状态
    if (hookSystem) {
      const hookStats = hookSystem.getStats();
      output.push('【钩子系统】');
      output.push(`  已注册钩子: ${hookStats.registered}`);
      output.push(`  事件类型: ${hookStats.events}`);
      output.push(`  总钩子数: ${hookStats.hooks}`);
      output.push(`  已执行: ${hookStats.executed}`);
      output.push(`  失败: ${hookStats.failed}`);
      output.push('');
    }

    // 工作流系统状态
    if (workflowIntegration) {
      const wfStats = workflowIntegration.stats;
      output.push('【工作流系统】');
      output.push(`  总工作流: ${wfStats.totalWorkflows}`);
      output.push(`  活动工作流: ${wfStats.activeWorkflows}`);
      output.push(`  已完成: ${wfStats.completedWorkflows}`);
      output.push(`  总转换: ${wfStats.totalTransitions}`);
      output.push('');

      if (verbose && wfStats.activeWorkflows > 0) {
        output.push('  活动工作流详情:');
        const activeWorkflows = Array.from(workflowIntegration.activeWorkflows.values());
        for (const wf of activeWorkflows) {
          const workflow = workflowIntegration.workflows.get(wf.workflowId);
          output.push(`    ${workflow?.name || wf.workflowId}: ${wf.currentPhase}`);
        }
        output.push('');
      }
    }

    // 系统信息
    output.push('【系统信息】');
    output.push(`  Node.js: ${process.version}`);
    output.push(`  平台: ${process.platform}`);
    output.push(`  架构: ${process.arch}`);
    output.push(`  内存使用: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    output.push(`  运行时间: ${Math.round(process.uptime())} 秒`);
    output.push('');

    output.push('='.repeat(60));
    output.push('');

    return output.join('\n');
  }
};
