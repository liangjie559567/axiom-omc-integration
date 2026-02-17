/**
 * v2 架构使用示例
 */
import { EventStore, EventBus } from '../core/EventStore.js';
import { CommandHandler, QueryHandler, ReadModel } from '../cqrs/CommandHandler.js';
import { WorkflowOrchestrator } from '../v2/WorkflowOrchestrator.js';

async function main() {
  // 初始化核心组件
  const store = new EventStore();
  const bus = new EventBus();
  const readModel = new ReadModel();

  // 创建处理器
  const cmd = new CommandHandler(store, bus);
  const query = new QueryHandler(readModel);

  // 订阅事件更新读模型
  bus.subscribe('START_WORKFLOW', (event) => {
    readModel.update(event.instanceId, {
      status: 'running',
      startTime: event.timestamp
    });
  });

  // 创建协调器
  const orchestrator = new WorkflowOrchestrator(cmd, query);

  // 启动工作流
  const result = await orchestrator.startWorkflow('demo', {
    name: 'test-workflow'
  });

  console.log('工作流已启动:', result.instanceId);

  // 查询状态
  const state = orchestrator.getWorkflowState(result.instanceId);
  console.log('当前状态:', state);
}

main().catch(console.error);
