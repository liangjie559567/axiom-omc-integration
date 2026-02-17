/**
 * workflow:start 命令 - 启动工作流
 */

export default {
  name: 'workflow:start',
  description: '启动一个工作流',
  aliases: ['wf:start', 'start-workflow'],
  group: 'workflow',
  options: {
    usage: 'workflow:start <workflow-id> [--context=<json>]',
    examples: [
      'workflow:start brainstorming',
      'workflow:start test-driven-development',
      'workflow:start custom-workflow --context=\'{"key":"value"}\''
    ]
  },

  async execute(parsed, context) {
    const { workflowIntegration } = context;

    if (!workflowIntegration) {
      return '错误：工作流系统不可用';
    }

    // 检查参数
    if (parsed.args.length === 0) {
      return '错误：请指定工作流 ID\n用法: workflow:start <workflow-id>';
    }

    const workflowId = parsed.args[0];

    // 解析上下文
    let workflowContext = {};
    if (parsed.flags.context) {
      try {
        workflowContext = JSON.parse(parsed.flags.context);
      } catch (error) {
        return `错误：无效的 JSON 上下文: ${error.message}`;
      }
    }

    try {
      // 启动工作流
      const instanceId = workflowIntegration.startWorkflow(workflowId, workflowContext);

      const instance = workflowIntegration.getWorkflowInstance(instanceId);
      const workflow = workflowIntegration.workflows.get(workflowId);

      let output = [];
      output.push('');
      output.push('✅ 工作流已启动');
      output.push('');
      output.push(`工作流: ${workflow?.name || workflowId}`);
      output.push(`实例 ID: ${instanceId}`);
      output.push(`当前阶段: ${instance.currentPhase}`);
      output.push(`启动时间: ${new Date(instance.startedAt).toLocaleString()}`);
      output.push('');

      return output.join('\n');
    } catch (error) {
      return `错误：${error.message}`;
    }
  }
};
