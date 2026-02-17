import { CommandHandler } from '../../../src/cqrs/CommandHandler.js';
import { QueryHandler } from '../../../src/cqrs/QueryHandler.js';
import { ReadModel } from '../../../src/cqrs/ReadModel.js';
import { EventStore } from '../../../src/core/EventStore.js';
import { EventBus } from '../../../src/core/EventBus.js';

describe('CQRS 集成测试', () => {
  let commandHandler;
  let queryHandler;
  let readModel;

  beforeEach(() => {
    const store = new EventStore();
    const bus = new EventBus();
    readModel = new ReadModel();

    commandHandler = new CommandHandler(store, bus);
    queryHandler = new QueryHandler(readModel);

    // 订阅事件更新读模型
    bus.subscribe('START_WORKFLOW', (event) => {
      readModel.update(event.instanceId, {
        phase: 'started',
        data: event.data
      });
    });
  });

  test('命令执行后应该能查询到状态', async () => {
    await commandHandler.execute({
      type: 'START_WORKFLOW',
      instanceId: 'wf-1',
      data: { name: 'test' }
    });

    const state = queryHandler.getState('wf-1');

    expect(state.phase).toBe('started');
    expect(state.data.name).toBe('test');
  });
});
