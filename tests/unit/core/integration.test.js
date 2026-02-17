import { EventStore } from '../../../src/core/EventStore.js';
import { EventBus } from '../../../src/core/EventBus.js';

describe('EventStore + EventBus 集成测试', () => {
  let store;
  let bus;

  beforeEach(() => {
    store = new EventStore();
    bus = new EventBus();
  });

  test('事件存储后应该能通过总线发布', async () => {
    let received = null;

    bus.subscribe('WORKFLOW_STARTED', (event) => {
      received = event;
    });

    const event = store.append({
      type: 'WORKFLOW_STARTED',
      instanceId: 'wf-1',
      data: { name: 'test' }
    });

    await bus.publish(event);

    expect(received).toBeDefined();
    expect(received.instanceId).toBe('wf-1');
  });
});
