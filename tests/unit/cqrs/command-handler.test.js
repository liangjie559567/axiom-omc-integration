import { CommandHandler } from '../../../src/cqrs/CommandHandler.js';
import { EventStore } from '../../../src/core/EventStore.js';
import { EventBus } from '../../../src/core/EventBus.js';

describe('CommandHandler', () => {
  let handler;
  let store;
  let bus;

  beforeEach(() => {
    store = new EventStore();
    bus = new EventBus();
    handler = new CommandHandler(store, bus);
  });

  test('应该能够执行命令并生成事件', async () => {
    const command = {
      type: 'START_WORKFLOW',
      instanceId: 'wf-1',
      data: { name: 'test' }
    };

    const event = await handler.execute(command);

    expect(event.type).toBe('START_WORKFLOW');
    expect(event.instanceId).toBe('wf-1');
  });
});
