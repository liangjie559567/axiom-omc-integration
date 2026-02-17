/**
 * workflow:list 命令 - 列出工作流
 */

export default {
  name: 'workflow:list',
  description: '列出所有可用的工作流',
  aliases: ['wf:list', 'workflows'],
  group: 'workflow',
  options: {
    usage: 'workflow:list [--active]',
    examples: [
      'workflow:list',
      'workflow:list --active'
    ]
  },

  async execute(parsed, context) {
    const { workflowIntegration } = context;

    if (!workflowIntegration) {
      return '错误：工作流系统不可用';
    }

    const showActive = parsed.flags.active || false;

    let output = [];
    output.push('');

    if (showActive) {
      // 显示活动工作流
      const activeWorkflows = Array.from(workflowIntegration.activeWorkflows.values());

      if (activeWorkflows.length === 0) {
        output.push('没有活动的工作流');
        output.push('');
        return output.join('\n');
      }

      output.push('活动工作流:');
      output.push('');

      for (const instance of activeWorkflows) {
        const workflow = workflowIntegration.workflows.get(instance.workflowId);
        const duration = Date.now() - instance.startedAt;
        const minutes = Math.floor(duration / 60000);

        output.push(`  ${workflow?.name || instance.workflowId}`);
        output.push(`    实例 ID: ${instance.id}`);
        output.push(`    当前阶段: ${instance.currentPhase}`);
        output.push(`    运行时间: ${minutes} 分钟`);
        output.push('');
      }

      output.push(`总计: ${activeWorkflows.length} 个活动工作流`);
    } else {
      // 显示所有可用工作流
      const workflows = Array.from(workflowIntegration.workflows.values());

      if (workflows.length === 0) {
        output.push('没有可用的工作流');
        output.push('');
        return output.join('\n');
      }

      output.push('可用工作流:');
      output.push('');

      for (const workflow of workflows) {
        output.push(`  ${workflow.name} (${workflow.id})`);
        output.push(`    类型: ${workflow.type}`);
        output.push(`    阶段: ${workflow.phases.join(' → ')}`);
        if (workflow.description) {
          output.push(`    描述: ${workflow.description}`);
        }
        output.push('');
      }

      output.push(`总计: ${workflows.length} 个工作流`);
    }

    output.push('');

    return output.join('\n');
  }
};
