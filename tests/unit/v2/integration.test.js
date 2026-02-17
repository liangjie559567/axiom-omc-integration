import { WorkflowOrchestrator } from '../../../src/v2/WorkflowOrchestrator.js';
import { PhaseMapper } from '../../../src/v2/PhaseMapper.js';
import { AutoSyncEngine } from '../../../src/v2/AutoSyncEngine.js';
import { CommandHandler } from '../../../src/cqrs/CommandHandler.js';
import { QueryHandler } from '../../../src/cqrs/QueryHandler.js';
import { ReadModel } from '../../../src/cqrs/ReadModel.js';
import { EventStore } from '../../../src/core/EventStore.js';
import { EventBus } from '../../../src/core/EventBus.js';

describe('v2 组件集成测试', () => {
  let orchestrator;
  let mapper;
  let syncEngine;

  beforeEach(() => {
    const store = new EventStore();
    const bus = new EventBus();
    const readModel = new ReadModel();

    const commandHandler = new CommandHandler(store, bus);
    const queryHandler = new QueryHandler(readModel);

    orchestrator = new WorkflowOrchestrator(commandHandler, queryHandler);
    mapper = new PhaseMapper(bus);
    syncEngine = new AutoSyncEngine(commandHandler);

    bus.subscribe('START_WORKFLOW', (event) => {
      readModel.update(event.instanceId, { phase: 'started' });
    });
  });

  test('完整工作流应该正常运行', async () => {
    const event = await orchestrator.startWorkflow('test', {});
    const state = orchestrator.getWorkflowState(event.instanceId);

    expect(state.phase).toBe('started');
  });
});
