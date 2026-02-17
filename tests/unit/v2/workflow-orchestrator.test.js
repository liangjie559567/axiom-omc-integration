import { WorkflowOrchestrator } from '../../../src/v2/WorkflowOrchestrator.js';
import { CommandHandler } from '../../../src/cqrs/CommandHandler.js';
import { QueryHandler } from '../../../src/cqrs/QueryHandler.js';
import { ReadModel } from '../../../src/cqrs/ReadModel.js';
import { EventStore } from '../../../src/core/EventStore.js';
import { EventBus } from '../../../src/core/EventBus.js';

describe('WorkflowOrchestrator v2', () => {
  let orchestrator;
  let readModel;

  beforeEach(() => {
    const store = new EventStore();
    const bus = new EventBus();
    readModel = new ReadModel();

    const commandHandler = new CommandHandler(store, bus);
    const queryHandler = new QueryHandler(readModel);

    orchestrator = new WorkflowOrchestrator(commandHandler, queryHandler);

    bus.subscribe('START_WORKFLOW', (event) => {
      readModel.update(event.instanceId, { started: true });
    });
  });

  test('应该能够启动工作流', async () => {
    const event = await orchestrator.startWorkflow('test', {});
    const state = orchestrator.getWorkflowState(event.instanceId);

    expect(state.started).toBe(true);
  });
});
